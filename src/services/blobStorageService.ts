/**
 * Azure Blob Storage Service (Simulation for Local/Dev Container sandbox)
 * Uses high-fidelity IndexedDB storage to simulate an Azure Blob Storage container.
 * This ensures files are persistent across page refreshes and can be downloaded,
 * while strictly keeping the binary data out of Firestore (only metadata is stored there).
 * Handles chunk/block upload, pause, resume, cancellation, and simulated latency.
 */

const DB_NAME = 'AzureBlobStorageSim';
const STORE_NAME = 'blobs';
const DB_VERSION = 1;

// Initialize Simulated Azure Storage DB
const initDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = (event) => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

export interface FileMetadata {
  id: string;
  name: string;
  extension: string;
  size: number;
  mimeType: string;
  blobUrl: string;
  createdAt: string;
  userId: string;
  roomId: string;
}

export interface UploadSession {
  fileId: string;
  file: File;
  progress: number;
  status: 'enviando' | 'concluido' | 'falha' | 'cancelado' | 'pausado';
  uploadedBytes: number;
  totalBytes: number;
  chunks: Blob[];
  totalChunks: number;
  currentChunkIndex: number;
  startTime: number;
  userId: string;
  roomId: string;
  onProgress?: (progress: number, status: string) => void;
  onComplete?: (metadata: FileMetadata) => void;
  onError?: (error: string) => void;
}

// Active upload sessions map for pause/resume/cancel tracking
const activeUploads = new Map<string, UploadSession>();

// Chunk size for performance (e.g., 2MB chunks)
const CHUNK_SIZE = 2 * 1024 * 1024;

export const blobStorageService = {
  /**
   * Save a blob directly (mocking Azure Container putBlob)
   */
  async saveBlob(id: string, blob: Blob): Promise<string> {
    const db = await initDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      
      const record = { id, blob, mimeType: blob.type };
      const request = store.put(record);

      request.onsuccess = () => {
        // Generate a simulated, accessible blob URL
        const localBlobUrl = URL.createObjectURL(blob);
        resolve(localBlobUrl);
      };
      request.onerror = () => reject(request.error);
    });
  },

  /**
   * Fetch a blob directly (mocking Azure Container getBlob)
   */
  async getBlob(id: string): Promise<Blob> {
    const db = await initDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get(id);

      request.onsuccess = () => {
        if (request.result) {
          resolve(request.result.blob);
        } else {
          reject(new Error('Arquivo não encontrado no Azure Blob Storage (Simulado).'));
        }
      };
      request.onerror = () => reject(request.error);
    });
  },

  /**
   * Delete a blob (mocking Azure Container deleteBlob)
   */
  async deleteBlob(id: string): Promise<void> {
    const db = await initDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.delete(id);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  },

  /**
   * Prepares and starts a chunked upload session
   */
  startChunkUpload(
    fileId: string,
    file: File,
    userId: string,
    roomId: string,
    callbacks: {
      onProgress?: (progress: number, status: string) => void;
      onComplete?: (metadata: FileMetadata) => void;
      onError?: (error: string) => void;
    }
  ): string {
    const totalBytes = file.size;
    const totalChunks = Math.ceil(totalBytes / CHUNK_SIZE);
    
    console.log(`[AzureBlobStorage] [LOG] Início do upload do arquivo: ${file.name} (${totalBytes} bytes, ${totalChunks} blocos)`);
    
    const session: UploadSession = {
      fileId,
      file,
      progress: 0,
      status: 'enviando',
      uploadedBytes: 0,
      totalBytes,
      chunks: [],
      totalChunks,
      currentChunkIndex: 0,
      startTime: Date.now(),
      userId,
      roomId,
      ...callbacks
    };

    activeUploads.set(fileId, session);
    
    // Begin processing chunks asynchronously
    this.uploadNextChunk(fileId);

    return fileId;
  },

  /**
   * Process the next chunk of a file upload
   */
  async uploadNextChunk(fileId: string) {
    const session = activeUploads.get(fileId);
    if (!session) return;

    if (session.status !== 'enviando') {
      return; // Upload is paused, canceled, or errored
    }

    // Check offline status
    if (!navigator.onLine) {
      console.warn(`[AzureBlobStorage] [LOG] Internet interrompida. Pausando upload do arquivo: ${session.file.name}`);
      session.status = 'pausado';
      if (session.onProgress) {
        session.onProgress(session.progress, 'Offline');
      }
      return;
    }

    const startByte = session.currentChunkIndex * CHUNK_SIZE;
    const endByte = Math.min(startByte + CHUNK_SIZE, session.totalBytes);
    
    // Slice file to simulate chunk-based read/send
    const chunk = session.file.slice(startByte, endByte);
    session.chunks.push(chunk);

    // Simulate Network Latency for Azure Storage Block Blob upload (e.g., 200ms - 500ms based on size)
    const simulatedDelay = Math.max(150, Math.floor(Math.random() * 300));
    
    setTimeout(async () => {
      // Re-verify session has not been updated in the meantime
      const currentSession = activeUploads.get(fileId);
      if (!currentSession || currentSession.status !== 'enviando') return;

      currentSession.uploadedBytes = endByte;
      currentSession.currentChunkIndex++;

      // Progress Calculation
      const rawProgress = Math.min(100, Math.round((currentSession.uploadedBytes / currentSession.totalBytes) * 100));
      currentSession.progress = rawProgress;

      if (currentSession.onProgress) {
        currentSession.onProgress(rawProgress, 'Enviando...');
      }

      if (currentSession.currentChunkIndex < currentSession.totalChunks) {
        // Upload next block
        this.uploadNextChunk(fileId);
      } else {
        // Combine chunks and finalize upload
        try {
          const finalBlob = new Blob(currentSession.chunks, { type: currentSession.file.type });
          const blobUrl = await this.saveBlob(fileId, finalBlob);
          
          const extensionMatch = currentSession.file.name.match(/\.([^.]+)$/);
          const extension = extensionMatch ? extensionMatch[1].toLowerCase() : '';
          
          const metadata: FileMetadata = {
            id: fileId,
            name: currentSession.file.name,
            extension,
            size: currentSession.totalBytes,
            mimeType: currentSession.file.type || 'application/octet-stream',
            blobUrl,
            createdAt: new Date().toISOString(),
            userId: currentSession.userId,
            roomId: currentSession.roomId
          };

          currentSession.status = 'concluido';
          
          const timeTaken = ((Date.now() - currentSession.startTime) / 1000).toFixed(2);
          console.log(`[AzureBlobStorage] [LOG] Fim do upload do arquivo: ${currentSession.file.name}. Tempo gasto: ${timeTaken}s`);
          
          if (currentSession.onComplete) {
            currentSession.onComplete(metadata);
          }
          activeUploads.delete(fileId);
        } catch (err: any) {
          console.error(`[AzureBlobStorage] [LOG] Erro ao salvar arquivo combinado:`, err);
          currentSession.status = 'falha';
          if (currentSession.onError) {
            currentSession.onError(err?.message || 'Falha ao salvar no Storage.');
          }
        }
      }
    }, simulatedDelay);
  },

  /**
   * Pause upload
   */
  pauseUpload(fileId: string) {
    const session = activeUploads.get(fileId);
    if (session && session.status === 'enviando') {
      session.status = 'pausado';
      console.log(`[AzureBlobStorage] [LOG] Upload pausado pelo usuário: ${session.file.name}`);
      if (session.onProgress) {
        session.onProgress(session.progress, 'Pausado');
      }
    }
  },

  /**
   * Resume upload
   */
  resumeUpload(fileId: string) {
    const session = activeUploads.get(fileId);
    if (session && session.status === 'pausado') {
      session.status = 'enviando';
      console.log(`[AzureBlobStorage] [LOG] Upload retomado pelo usuário: ${session.file.name}`);
      if (session.onProgress) {
        session.onProgress(session.progress, 'Enviando...');
      }
      this.uploadNextChunk(fileId);
    }
  },

  /**
   * Cancel upload
   */
  cancelUpload(fileId: string) {
    const session = activeUploads.get(fileId);
    if (session) {
      session.status = 'cancelado';
      console.log(`[AzureBlobStorage] [LOG] Upload cancelado pelo usuário: ${session.file.name}`);
      if (session.onProgress) {
        session.onProgress(session.progress, 'Cancelado');
      }
      activeUploads.delete(fileId);
    }
  }
};
