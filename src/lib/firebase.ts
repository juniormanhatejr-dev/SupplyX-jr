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

function compressWithCanvas(file: File, maxWidth = 2048, maxHeight = 2048, quality = 0.85): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Could not get 2D context for canvas compression'));
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL('image/jpeg', quality);
        resolve(dataUrl);
      };
      img.onerror = () => reject(new Error('Failed to load image element for canvas compression'));
      img.src = e.target?.result as string;
    };
    reader.onerror = () => reject(new Error('Failed to read file as data URL'));
    reader.readAsDataURL(file);
  });
}

export async function uploadFile(path: string, file: File): Promise<string> {
  console.log('uploadFile starting...', { path, size: file.size, type: file.type });
  let fileToUpload = file;
  
  // Only compress if it's an image
  if (file.type.startsWith('image/')) {
    try {
      console.log('Starting image compression...');
      const options = {
        maxSizeMB: 8.0, // High quality limit (up to 8MB)
        maxWidthOrHeight: 4096, // Retain extreme resolution
        useWebWorker: true,
        initialQuality: 0.95 // Keep compression quality premium
      };
      
      if (path.includes('photo_') || path.includes('avatar')) {
        options.maxSizeMB = 0.15;
        options.maxWidthOrHeight = 400;
        options.initialQuality = 0.7;
      }

      fileToUpload = await imageCompression(file, options);
      console.log('Compression finished.', { originalSize: file.size, compressedSize: fileToUpload.size });
    } catch (error) {
      console.warn('Compression failed, uploading original:', error);
    }
  }

  // Pillar 11: Priority Upload - Server Side Proxy to Bypass CORS
  try {
    console.log('[UPLOAD] Attempting Server-Side Proxy Upload (CORS-Bypass)...');
    const formData = new FormData();
    formData.append('file', fileToUpload);
    formData.append('path', path);

    const response = await fetch('/api/upload', {
      method: 'POST',
      body: formData,
    });

    if (response.ok) {
      const data = await response.json();
      console.log('[UPLOAD] Server proxy success:', data.url);
      return data.url;
    }
    console.warn('[UPLOAD] Server proxy failed, trying direct Storage:', await response.text());
  } catch (proxyError) {
    console.warn('[UPLOAD] Server proxy error (Expected in some environments), falling back:', proxyError);
  }

  // Direct Storage Upload (Secondary Fallback)
  const fileRef = ref(storage, path);
  try {
    console.log(`Starting direct uploadBytes to: ${path}`);
    
    // Create a promise that rejects after 20 seconds to force fallback
    const uploadWithTimeout = Promise.race([
      uploadBytes(fileRef, fileToUpload),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Upload timeout (20s) - switching to local storage fallback')), 20000)
      )
    ]) as Promise<any>;

    await uploadWithTimeout;
    const url = await getDownloadURL(fileRef);
    console.log(`Direct upload URL obtained: ${url}`);
    return url;
  } catch (error: any) {
    console.warn(`Firebase Storage Direct Upload Failed:`, error.code || error.message);
    
    // Pillar Check: CORS/Domain Error Detection
    const isCorsError = error.message?.includes('cross-origin') || error.code === 'storage/unauthorized' || error.message?.includes('CORS');
    
    // Final Fallback: Base64 in Firestore (Always enabled for images via HTML5 Canvas Compression)
    if (file.type.startsWith('image/')) {
      console.log('Resorting to robust Base64 local fallback with Canvas compression...');
      try {
        const base64Url = await compressWithCanvas(file);
        console.log('Base64 Canvas compression fallback successful. URL length:', base64Url.length);
        return base64Url;
      } catch (canvasErr) {
        console.error('Canvas compression fallback also failed, trying basic FileReader:', canvasErr);
      }

      // If Canvas itself fails, try reading as simple small Base64
      if (fileToUpload.size < 900000) {
        return new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => {
            const base64 = reader.result as string;
            if (base64.length > 1048576) {
              reject(new Error('Imagem excessivamente grande para o modo de compatibilidade (Vercel/Base64). Tente uma imagem abaixo de 800KB.'));
            } else {
              console.log('Simple Base64 reading fallback successful');
              resolve(base64);
            }
          };
          reader.onerror = () => reject(new Error('Falha ao processar arquivo para fallback local.'));
          reader.readAsDataURL(fileToUpload);
        });
      }
    } else {
      // Robust Base64 Local Fallback for non-image documents (PDFs, Word docs, spreadsheets, etc.)
      if (fileToUpload.size < 900000) {
        console.log('Resorting to Base64 FileReader fallback for non-image file:', file.name);
        return new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => {
            const base64 = reader.result as string;
            if (base64.length > 1048576) {
              reject(new Error('Documento excessivamente grande para o modo de compatibilidade sem Firebase Storage. Tente um arquivo abaixo de 750KB.'));
            } else {
              console.log('Document Base64 reading fallback successful');
              resolve(base64);
            }
          };
          reader.onerror = () => reject(new Error('Falha ao processar arquivo para fallback local.'));
          reader.readAsDataURL(fileToUpload);
        });
      }
    }

    if (isCorsError) {
      throw new Error('Configuração de Domínio: O carregamento falhou. Tente uma imagem de outro tamanho para usar o modo de compatibilidade automática.');
    } else {
      throw new Error(`Falha no carregamento: ${error.message || 'Erro desconhecido.'}`);
    }
  }
}

