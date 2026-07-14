import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, OAuthProvider } from 'firebase/auth';
import { getFirestore, doc, getDocFromServer, enableIndexedDbPersistence, setDoc } from 'firebase/firestore';
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

function compressWithCanvas(file: File, maxWidth = 600, maxHeight = 600, quality = 0.4): Promise<string> {
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
        maxSizeMB: 0.2,
        maxWidthOrHeight: 1024,
        useWebWorker: true,
        initialQuality: 0.6
      };
      
      if (path.includes('photo_') || path.includes('avatar')) {
        options.maxSizeMB = 0.1;
        options.maxWidthOrHeight = 400;
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
      console.log('[UPLOAD] Server proxy success (first 50 chars):', data.url ? data.url.substring(0, 50) + '...' : 'none');
      if (data.url && data.url.startsWith('data:') && data.url.length > 800000) {
        console.warn('[UPLOAD] Server proxy returned a huge Base64 URL (>800KB). Diverting to local IndexedDB fallback...');
        return await saveFileToIndexedDB(file);
      }
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
    
    // Calculate a dynamic timeout based on file size: minimum 30 seconds, or 10 seconds per MB
    const fileMB = fileToUpload.size / (1024 * 1024);
    const dynamicTimeoutMs = Math.max(30000, Math.ceil(fileMB * 10000)); // 10s per MB, min 30s
    console.log(`Setting dynamic direct upload timeout: ${dynamicTimeoutMs / 1000}s for file size: ${fileMB.toFixed(2)} MB`);
    
    // Create a promise that rejects after the dynamic timeout to force fallback
    const uploadWithTimeout = Promise.race([
      uploadBytes(fileRef, fileToUpload),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error(`Upload timeout (${Math.round(dynamicTimeoutMs / 1000)}s) - switching to local storage fallback`)), dynamicTimeoutMs)
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
        let base64Url = await compressWithCanvas(file, 600, 600, 0.4);
        console.log('Base64 Canvas compression fallback successful. Initial URL length:', base64Url.length);
        
        // Dynamic Downscaling to fit Firestore's 1MB limit safely (approx. 800k characters max)
        if (base64Url.length > 800000) {
          console.log('Base64 too big (> 800KB). Retrying compression with 400x400 and 0.25 quality...');
          base64Url = await compressWithCanvas(file, 400, 400, 0.25);
          console.log('Second attempt URL length:', base64Url.length);
        }
        
        if (base64Url.length > 800000) {
          console.log('Base64 still too big. Retrying with ultra compression (250x250, 0.15 quality)...');
          base64Url = await compressWithCanvas(file, 250, 250, 0.15);
          console.log('Ultra compressed URL length:', base64Url.length);
        }

        if (base64Url.length > 800000) {
          throw new Error('A imagem é grande demais após a compressão máxima para armazenamento direto.');
        }
        return base64Url;
      } catch (canvasErr: any) {
        console.error('Canvas compression fallback failed:', canvasErr);
        // Canvas compression/size constraint failed, fallback to local IndexedDB store
        console.log('Storing image in local IndexedDB due to high-resolution / compatibility fallback...');
        return await saveFileToIndexedDB(file);
      }
    } else {
      // If it's a non-image file, we can store it in IndexedDB fallback store instead of failing
      console.log('Storing non-image file in local IndexedDB due to compatibility fallback...');
      return await saveFileToIndexedDB(file);
    }
  }
}

// Save a file to IndexedDB and return a reference string "local-file://<uuid>"
export async function saveFileToIndexedDB(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('supplyx_local_files', 1);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains('files')) {
        db.createObjectStore('files');
      }
    };
    request.onsuccess = () => {
      const db = request.result;
      const tx = db.transaction('files', 'readwrite');
      const store = tx.objectStore('files');
      const uuid = crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 11);
      
      const fileData = {
        name: file.name,
        type: file.type,
        data: file
      };
      
      const putRequest = store.put(fileData, uuid);
      putRequest.onsuccess = () => {
        resolve(`local-file://${uuid}`);
      };
      putRequest.onerror = () => {
        reject(new Error('Failed to save file to local IndexedDB'));
      };
    };
    request.onerror = () => {
      reject(new Error('Failed to open local IndexedDB'));
    };
  });
}

// Retrieve a File or data URL from IndexedDB matching "local-file://<uuid>"
export async function getFileFromIndexedDB(refUrl: string): Promise<{ name: string; type: string; dataUrl: string; file: File } | null> {
  if (!refUrl.startsWith('local-file://')) return null;
  const uuid = refUrl.substring('local-file://'.length);
  
  return new Promise((resolve) => {
    const request = indexedDB.open('supplyx_local_files', 1);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains('files')) {
        db.createObjectStore('files');
      }
    };
    request.onsuccess = () => {
      const db = request.result;
      const tx = db.transaction('files', 'readonly');
      const store = tx.objectStore('files');
      const getRequest = store.get(uuid);
      getRequest.onsuccess = () => {
        const result = getRequest.result;
        if (!result) {
          resolve(null);
          return;
        }
        
        const reader = new FileReader();
        reader.onloadend = () => {
          resolve({
            name: result.name,
            type: result.type,
            dataUrl: reader.result as string,
            file: result.data
          });
        };
        reader.onerror = () => {
          resolve(null);
        };
        reader.readAsDataURL(result.data);
      };
      getRequest.onerror = () => {
        resolve(null);
      };
    };
    request.onerror = () => {
      resolve(null);
    };
  });
}

export async function clientDirectUpload(
  file: File, 
  extraData: {
    category?: string;
    message_id?: string | null;
    shipment_id?: string | null;
    product_id?: string | null;
    order_id?: string | null;
    transport_assignment_id?: string | null;
    company_id?: string | null;
  } = {}
) {
  if (!auth.currentUser) {
    throw new Error('User not authenticated');
  }

  const fileId = 'file_' + Math.random().toString(36).substring(2, 15);
  const originalName = file.name;
  const sanitizedOriginalName = originalName.replace(/[^a-zA-Z0-9.-]/g, '_');
  const fileName = `${Date.now()}_${sanitizedOriginalName}`;
  const storagePath = `uploads/${fileName}`;

  let blobUrl = '';
  let finalStoragePath = storagePath;

  try {
    // Attempt normal upload to Firebase Storage
    console.log('[CLIENT UPLOAD] Attempting direct storage upload for:', file.name);
    const fileRef = ref(storage, storagePath);
    await uploadBytes(fileRef, file);
    blobUrl = await getDownloadURL(fileRef);
    console.log('[CLIENT UPLOAD] Storage upload succeeded, URL obtained.');
  } catch (storageErr) {
    console.warn('[CLIENT UPLOAD] Firebase Storage failed/disabled, falling back to Base64/IndexedDB:', storageErr);
    
    // Fallback 1: Base64 direct embedding (for files <= 800 KB, perfect for Firestore)
    if (file.size <= 800 * 1024) {
      console.log('[CLIENT UPLOAD] Converting file to Base64 data URL...');
      blobUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = () => reject(new Error('Failed to read file as base64'));
        reader.readAsDataURL(file);
      });
      finalStoragePath = 'inline-base64';
    } else {
      // Fallback 2: IndexedDB for larger files (local machine only)
      console.log('[CLIENT UPLOAD] File too large for Firestore document (>800KB), using IndexedDB...');
      blobUrl = await saveFileToIndexedDB(file);
      finalStoragePath = 'local-indexeddb';
    }
  }

  // Get user profile/company details if available
  let companyId = extraData.company_id || 'default-company';
  try {
    const userDoc = await getDocFromServer(doc(db, 'users', auth.currentUser.uid));
    if (userDoc.exists()) {
      companyId = userDoc.data().companyId || companyId;
    }
  } catch (err) {
    console.warn('Could not fetch user company for upload metadata, using default:', err);
  }

  const fileMetadata = {
    id: fileId,
    file_name: fileName,
    original_name: originalName,
    file_type: file.type || 'application/octet-stream',
    file_size: file.size,
    storage_path: finalStoragePath,
    blob_url: blobUrl,
    uploaded_by: auth.currentUser.uid,
    company_id: companyId,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    message_id: extraData.message_id || null,
    shipment_id: extraData.shipment_id || null,
    product_id: extraData.product_id || null,
    order_id: extraData.order_id || null,
    transport_assignment_id: extraData.transport_assignment_id || null,
    category: extraData.category || 'others'
  };

  // Write to Firestore /files (will sync everywhere!)
  await setDoc(doc(db, 'files', fileId), fileMetadata);

  return { success: true, id: fileId, file: fileMetadata };
}

export const isVercel = typeof window !== 'undefined' && (
  window.location.hostname.includes('vercel.app') || 
  window.location.hostname.includes('localhost') === false && window.location.hostname.includes('run.app') === false
);



