import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { getFirestore, doc, getDocFromServer, enableIndexedDbPersistence } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { getDatabase } from 'firebase/database';
import { initializeAppCheck, ReCaptchaEnterpriseProvider } from 'firebase/app-check';
import imageCompression from 'browser-image-compression';
import firebaseConfig from '../../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);

// Initialize App Check (Pillar 5)
if (typeof window !== 'undefined' && (firebaseConfig as any).appCheckToken) {
  initializeAppCheck(app, {
    provider: new ReCaptchaEnterpriseProvider((firebaseConfig as any).appCheckToken),
    isTokenAutoRefreshEnabled: true
  });
}

export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

// Initialize Realtime Database for Professional Presence System
export const rtdb = getDatabase(app);

// Enable offline persistence with better error logging
if (typeof window !== 'undefined') {
  enableIndexedDbPersistence(db).then(() => {
    console.log('Firestore persistence enabled');
  }).catch((err) => {
    if (err.code === 'failed-precondition') {
      console.warn('Firestore persistence failed: Multiple tabs open');
    } else if (err.code === 'unimplemented') {
      console.warn('Firestore persistence failed: Browser not supported');
    } else {
      console.error('Firestore persistence error:', err);
    }
  });
}

export const auth = getAuth(app);
export const storage = getStorage(app);

// Professional connection test with timeout (Bypassed during startup to avoid permission noise)
/*
async function testConnection() {
  const timeoutPromise = new Promise((_, reject) => 
    setTimeout(() => reject(new Error('Connection timeout')), 5000)
  );

  try {
    await Promise.race([
      getDocFromServer(doc(db, 'test', 'connection')),
      timeoutPromise
    ]);
    console.log('Firebase connectivity verified');
  } catch (error) {
    console.warn('Initial connection test bypassed or failed:', error instanceof Error ? error.message : 'Unknown error');
  }
}
testConnection();
*/

console.log('%c[ENGINE] SupplyX Firebase Core Initialized', 'color: #3b82f6; font-weight: bold;');
console.log('[DEBUG] Project ID:', firebaseConfig.projectId);
console.log('[DEBUG] RTDB URL:', (rtdb as any).repo_?.repoInfo_?.host || 'Auto-resolving...');

// Global diagnostic state for extreme debugging
if (typeof window !== 'undefined') {
  (window as any).SUPPLYX_DEBUG = {
    auth,
    db,
    rtdb,
    storage,
    getSystemStatus: () => ({
      authenticated: !!auth.currentUser,
      uid: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      online: navigator.onLine,
      persistence: 'enabled',
      timestamp: new Date().toISOString()
    })
  };
}

export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

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
    authenticated: boolean;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  }
}

/**
 * Professional Firestore error handler as per system mandates
 */
export function handleFirestoreError(error: any, operationType: OperationType, path: string | null) {
  const errMessage = error?.message || String(error);
  
  const errInfo: FirestoreErrorInfo = {
    error: errMessage,
    operationType,
    path,
    authInfo: {
      userId: auth.currentUser?.uid || null,
      email: auth.currentUser?.email || null,
      emailVerified: auth.currentUser?.emailVerified || null,
      isAnonymous: auth.currentUser?.isAnonymous || false,
      authenticated: !!auth.currentUser,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    }
  };

  // AUDIT LOG: Detailed system status for debugging
  console.group(`%c[FIREBASE AUDIT] ${operationType.toUpperCase()} ALERT`, 'background: #fee2e2; color: #991b1b; font-weight: bold; padding: 4px; border-radius: 4px;');
  console.error('Path:', path);
  console.error('Operation:', operationType);
  console.error('Authenticated:', !!auth.currentUser);
  console.error('User UID:', auth.currentUser?.uid || 'Not Logged In');
  console.error('Original Error:', error);
  console.table(errInfo.authInfo);
  console.groupEnd();
  
  // Format specific user-friendly messages
  let userMessage = 'Erro de permissão no banco de dados.';
  
  // Detect Auth Errors related to Vercel/Domains (Common User Request)
  if (errMessage.includes('auth/unauthorized-domain')) {
    userMessage = 'Erro de Autenticação: O domínio atual não está autorizado no Console do Firebase. Adicione este domínio em Autenticação > Configurações > Domínios Autorizados no Console.';
  } else if (errMessage.includes('insufficient permissions') || errMessage.includes('PERMISSION_DENIED')) {
    userMessage = `Acesso Negado: Você não tem permissão para ${operationType} em ${path}. Verifique se seu e-mail está verificado e se você possui o cargo necessário.`;
  }

  // Log to diagnostic system
  if (typeof window !== 'undefined' && (window as any).SUPPLYX_DEBUG) {
    (window as any).SUPPLYX_DEBUG.lastError = errInfo;
  }

  throw new Error(JSON.stringify({ ...errInfo, userMessage }));
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
    
    // Create a promise that rejects after 20 seconds to force fallback
    const uploadWithTimeout = Promise.race([
      uploadBytes(fileRef, fileToUpload),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Upload timeout (20s) - switching to local storage fallback')), 20000)
      )
    ]) as Promise<any>;

    const result = await uploadWithTimeout;
    console.log('Upload successful, storage result:', result.metadata?.fullPath);
    const url = await getDownloadURL(fileRef);
    console.log(`Download URL obtained: ${url}`);
    return url;
  } catch (error: any) {
    const isTimeout = error.message?.includes('timeout') || error.code === 'storage/retry-limit-exceeded';
    console.warn(`Firebase Storage ${isTimeout ? 'Timed Out' : 'Failed'}:`, error.code || error.message);
    
    // If it's an image and small enough (or after compression), use Base64 as fallback
    // Firestore limit is 1MB, so we keep Base64 fallback under 800KB to be safe
    if (file.type.startsWith('image/') && fileToUpload.size < 800000) { 
      console.log('Using Base64 local fallback for file of size:', fileToUpload.size);
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64 = reader.result as string;
          // Pillar Check: Ensure base64 isn't astronomically long if somehow compression logic was bypassed
          if (base64.length > 1048576) {
            reject(new Error('Arquivo excessivamente grande para armazenamento local (Fallback Base64). Tente uma imagem menor.'));
          } else {
            resolve(base64);
          }
        };
        reader.onerror = () => reject(new Error('Falha ao processar arquivo para fallback local.'));
        reader.readAsDataURL(fileToUpload);
      });
    }

    console.error('Firebase Storage Critical Error:', {
      code: error.code,
      message: error.message,
      bucket: storage.app.options.storageBucket,
      path: path
    });
    
    if (error.code === 'storage/retry-limit-exceeded' || isTimeout) {
      throw new Error('Conexão instável ou timeout no servidor de arquivos. Tente uma imagem menor ou verifique sua internet.');
    } else if (error.code === 'storage/unauthorized') {
      throw new Error('Permissão negada para salvar arquivos. Certifique-se de estar logado e verificado.');
    } else {
      throw new Error(`Falha no carregamento: ${error.message || 'Erro desconhecido no Storage'}`);
    }
  }
}
