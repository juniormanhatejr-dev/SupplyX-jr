import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { getFirestore, doc, getDocFromServer, enableIndexedDbPersistence } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import imageCompression from 'browser-image-compression';
import firebaseConfig from '../../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

// Enable offline persistence
if (typeof window !== 'undefined') {
  enableIndexedDbPersistence(db).catch((err) => {
    if (err.code === 'failed-precondition') {
      // Multiple tabs open, persistence can only be enabled in one tab at a time.
      console.warn('Firestore persistence failed: Multiple tabs open');
    } else if (err.code === 'unimplemented') {
      // The current browser does not support all of the features required to enable persistence
      console.warn('Firestore persistence failed: Browser not supported');
    }
  });
}

export const auth = getAuth(app);
export const storage = getStorage(app);

async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    console.log('Firebase connection test: Success');
  } catch (error) {
    if(error instanceof Error && error.message.includes('the client is offline')) {
      console.error("Please check your Firebase configuration or internet connection.");
    }
  }
}
testConnection();

console.log('Firebase initialized with bucket:', firebaseConfig.storageBucket);

export const googleProvider = new GoogleAuthProvider();

export const signInWithGoogle = () => signInWithPopup(auth, googleProvider);

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  }
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export async function uploadFile(path: string, file: File): Promise<string> {
  console.log('uploadFile starting...', { path, size: file.size, type: file.type });
  let fileToUpload = file;
  
  // Only compress if it's an image
  if (file.type.startsWith('image/')) {
    try {
      console.log('Starting image compression...');
      const options = {
        maxSizeMB: 0.2, // Reduced from 0.5MB for faster loading
        maxWidthOrHeight: 1024, // Reduced from 1280
        useWebWorker: true,
        initialQuality: 0.6 // Reduced from 0.7
      };
      
      if (path.includes('photo_') || path.includes('avatar')) {
        options.maxSizeMB = 0.1; // 100KB for avatars
        options.maxWidthOrHeight = 400;
      }

      fileToUpload = await imageCompression(file, options);
      console.log('Compression finished.', { originalSize: file.size, compressedSize: fileToUpload.size });
    } catch (error) {
      console.warn('Compression failed, uploading original:', error);
    }
  }

  const fileRef = ref(storage, path);
  try {
    console.log(`Starting uploadBytes to: ${path}`);
    
    // Create a promise that rejects after 10 seconds to force fallback
    const uploadWithTimeout = Promise.race([
      uploadBytes(fileRef, fileToUpload),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Upload timeout - switching to fallback')), 10000)
      )
    ]) as Promise<any>;

    const result = await uploadWithTimeout;
    console.log('Upload successful, storage result:', result.metadata?.fullPath);
    const url = await getDownloadURL(fileRef);
    console.log(`Download URL obtained: ${url}`);
    return url;
  } catch (error: any) {
    console.warn('Firebase Storage failed or timed out, attempting Base64 fallback:', error.code || error.message);
    
    // If it's an image and small enough (or after compression), use Base64 as fallback
    if (file.type.startsWith('image/') && fileToUpload.size < 2000000) { // Under 2MB
      console.log('Using Base64 fallback for file of size:', fileToUpload.size);
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(fileToUpload);
      });
    }

    console.error('Firebase Storage Critical Error:', {
      code: error.code,
      message: error.message,
      bucket: storage.app.options.storageBucket,
      path: path,
      error: error
    });
    
    if (error.code === 'storage/retry-limit-exceeded' || error.message?.includes('retry limit')) {
      throw new Error('Falha de conexão com o Storage. Se o problema persistir, certifique-se de que o Storage está ativado nas configurações do seu projeto Firebase.');
    } else if (error.code === 'storage/unauthorized') {
      throw new Error('Acesso negado ao Storage. Verifique as regras de segurança.');
    } else {
      throw new Error(`Erro no upload: ${error.message}`);
    }
  }
}
