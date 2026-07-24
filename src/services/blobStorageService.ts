/**
 * Azure Blob Storage Service (Simulation for Local/Dev Container sandbox)
 * Uses high-fidelity IndexedDB storage to simulate an Azure Blob Storage container.
 * This ensures files are persistent across page refreshes and can be downloaded,
 * while strictly keeping the binary data out of Firestore (only metadata is stored there).
 * Handles chunk/block upload, pause, resume, cancellation, and simulated latency.
 */

const DB_NAME = 'AzureBlobStorageSim';
const STORE_NAME = 'blobs';
const CHUNKS_STORE_NAME = 'upload_chunks';
const DB_VERSION = 2;

// Initialize Simulated Azure Storage DB
const initDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = (event) => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(CHUNKS_STORE_NAME)) {
        db.createObjectStore(CHUNKS_STORE_NAME, { keyPath: 'id' });
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
  status: 'enviando' | 'concluido' | 'falha' | 'cancelado' | 'pausado' | 'offline';
  uploadedBytes: number;
  totalBytes: number;
  totalChunks: number;
  currentChunkIndex: number;
  startTime: number;
  userId: string;
  roomId: string;
  timerId?: ReturnType<typeof setTimeout> | null;
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
    try {
      const db = await initDB();
      return new Promise((resolve, reject) => {
        const transaction = db.transaction(STORE_NAME, 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        
        const record = { id, blob, mimeType: blob.type || 'application/octet-stream' };
        const request = store.put(record);

        request.onsuccess = () => {
          try {
            // Generate a simulated, accessible blob URL
            const localBlobUrl = URL.createObjectURL(blob);
            resolve(localBlobUrl);
          } catch (urlErr: any) {
            reject(new Error('Falha ao gerar URL de visualização do arquivo: ' + (urlErr?.message || '')));
          }
        };
        request.onerror = () => reject(request.error || new Error('Falha na escrita no IndexedDB.'));
      });
    } catch (dbErr: any) {
      console.error('[AzureBlobStorage] Error initializing IndexedDB on saveBlob:', dbErr);
      throw new Error('Falha de armazenamento local (IndexedDB indisponível ou cheio).');
    }
  },

  /**
   * Fetch a blob directly (mocking Azure Container getBlob)
   */
  async getBlob(id: string): Promise<Blob> {
    try {
      const db = await initDB();
      return new Promise((resolve, reject) => {
        const transaction = db.transaction(STORE_NAME, 'readonly');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.get(id);

        request.onsuccess = () => {
          if (request.result && request.result.blob) {
            resolve(request.result.blob);
          } else {
            reject(new Error('Arquivo não encontrado no Azure Blob Storage (Simulado).'));
          }
        };
        request.onerror = () => reject(request.error || new Error('Erro ao ler do IndexedDB.'));
      });
    } catch (err: any) {
      throw new Error('Falha ao carregar do armazenamento local.');
    }
  },

  /**
   * Delete a blob (mocking Azure Container deleteBlob)
   */
  async deleteBlob(id: string): Promise<void> {
    try {
      const db = await initDB();
      return new Promise((resolve, reject) => {
        const transaction = db.transaction(STORE_NAME, 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.delete(id);

        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error || new Error('Erro ao excluir do IndexedDB.'));
      });
    } catch (err) {
      console.warn('[AzureBlobStorage] Warning: Delete blob failed:', err);
    }
  },

  /**
   * Save a single chunk to temporary IndexedDB store during upload
   */
  async saveChunkToDB(fileId: string, chunkIndex: number, chunkBlob: Blob): Promise<void> {
    const db = await initDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(CHUNKS_STORE_NAME, 'readwrite');
      const store = transaction.objectStore(CHUNKS_STORE_NAME);
      const id = `${fileId}_chunk_${chunkIndex}`;
      const record = { id, fileId, chunkIndex, blob: chunkBlob };
      const request = store.put(record);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error || new Error('Erro ao salvar bloco temporário no IndexedDB.'));
    });
  },

  /**
   * Reconstruct complete Blob from temporary IndexedDB chunks
   */
  async assembleChunksFromDB(fileId: string, totalChunks: number, mimeType: string): Promise<Blob> {
    const db = await initDB();
    const chunks: Blob[] = [];

    for (let i = 0; i < totalChunks; i++) {
      const id = `${fileId}_chunk_${i}`;
      const chunkBlob = await new Promise<Blob>((resolve, reject) => {
        const transaction = db.transaction(CHUNKS_STORE_NAME, 'readonly');
        const store = transaction.objectStore(CHUNKS_STORE_NAME);
        const request = store.get(id);
        request.onsuccess = () => {
          if (request.result && request.result.blob) {
            resolve(request.result.blob);
          } else {
            reject(new Error(`Bloco ${i} não encontrado no IndexedDB.`));
          }
        };
        request.onerror = () => reject(request.error || new Error(`Erro ao carregar bloco ${i} do IndexedDB.`));
      });
      chunks.push(chunkBlob);
    }

    return new Blob(chunks, { type: mimeType });
  },

  /**
   * Clean up temporary chunks from IndexedDB
   */
  async clearChunksFromDB(fileId: string, totalChunks: number): Promise<void> {
    try {
      const db = await initDB();
      const transaction = db.transaction(CHUNKS_STORE_NAME, 'readwrite');
      const store = transaction.objectStore(CHUNKS_STORE_NAME);
      for (let i = 0; i < totalChunks; i++) {
        const id = `${fileId}_chunk_${i}`;
        store.delete(id);
      }
    } catch (err) {
      console.warn('[AzureBlobStorage] Limpeza de blocos temporários falhou:', err);
    }
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
    const totalBytes = file ? file.size : 0;
    const totalChunks = Math.max(1, Math.ceil(totalBytes / CHUNK_SIZE));
    
    console.log(`[AzureBlobStorage] [LOG] Início do upload do arquivo: ${file?.name || 'arquivo'} (${totalBytes} bytes, ${totalChunks} blocos)`);
    
    // Clear any leftover session with the same fileId
    const existing = activeUploads.get(fileId);
    if (existing && existing.timerId) {
      clearTimeout(existing.timerId);
    }

    const session: UploadSession = {
      fileId,
      file,
      progress: 0,
      status: 'enviando',
      uploadedBytes: 0,
      totalBytes,
      totalChunks,
      currentChunkIndex: 0,
      startTime: Date.now(),
      userId,
      roomId,
      timerId: null,
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

    if (session.timerId) {
      clearTimeout(session.timerId);
      session.timerId = null;
    }

    if (session.status !== 'enviando') {
      return; // Upload is paused, canceled, or errored
    }

    // Check offline status
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      console.warn(`[AzureBlobStorage] [LOG] Internet interrompida. Pausando upload do arquivo: ${session.file?.name}`);
      session.status = 'pausado';
      if (session.onProgress) {
        session.onProgress(session.progress, 'Offline');
      }
      return;
    }

    const startByte = session.currentChunkIndex * CHUNK_SIZE;
    const endByte = Math.min(startByte + CHUNK_SIZE, session.totalBytes);

    // Slice block from file and save to temporary IndexedDB store
    const chunkBlob = session.file.slice(startByte, endByte);
    try {
      await this.saveChunkToDB(fileId, session.currentChunkIndex, chunkBlob);
    } catch (chunkErr: any) {
      console.error(`[AzureBlobStorage] [LOG] Erro ao salvar bloco ${session.currentChunkIndex}:`, chunkErr);
      session.status = 'falha';
      if (session.onError) {
        session.onError(chunkErr?.message || 'Falha ao salvar bloco no banco de dados local.');
      }
      activeUploads.delete(fileId);
      return;
    }

    // Simulate Network Latency for Azure Storage Block Blob upload
    const simulatedDelay = Math.max(150, Math.floor(Math.random() * 250));
    
    session.timerId = setTimeout(async () => {
      try {
        // Re-verify session has not been updated or deleted in the meantime
        const currentSession = activeUploads.get(fileId);
        if (!currentSession || currentSession.status !== 'enviando') return;

        currentSession.uploadedBytes = endByte;
        currentSession.currentChunkIndex++;

        // Progress Calculation
        const rawProgress = currentSession.totalBytes > 0 
          ? Math.min(100, Math.round((currentSession.uploadedBytes / currentSession.totalBytes) * 100))
          : 100;
        currentSession.progress = rawProgress;

        if (currentSession.onProgress) {
          currentSession.onProgress(rawProgress, 'Enviando...');
        }

        if (currentSession.currentChunkIndex < currentSession.totalChunks) {
          // Upload next block
          this.uploadNextChunk(fileId);
        } else {
          // Reconstruct final Blob from temporary IndexedDB chunks
          try {
            const mimeType = currentSession.file.type || 'application/octet-stream';
            const finalBlob = await this.assembleChunksFromDB(fileId, currentSession.totalChunks, mimeType);
            const blobUrl = await this.saveBlob(fileId, finalBlob);
            
            // Clean up temporary chunk records from IndexedDB
            await this.clearChunksFromDB(fileId, currentSession.totalChunks);

            const fileName = currentSession.file.name || 'arquivo';
            const extensionMatch = fileName.match(/\.([^.]+)$/);
            const extension = extensionMatch ? extensionMatch[1].toLowerCase() : '';
            
            const metadata: FileMetadata = {
              id: fileId,
              name: fileName,
              extension,
              size: currentSession.totalBytes,
              mimeType,
              blobUrl,
              createdAt: new Date().toISOString(),
              userId: currentSession.userId,
              roomId: currentSession.roomId
            };

            currentSession.status = 'concluido';
            
            const timeTaken = ((Date.now() - currentSession.startTime) / 1000).toFixed(2);
            console.log(`[AzureBlobStorage] [LOG] Fim do upload do arquivo: ${fileName}. Tempo gasto: ${timeTaken}s`);
            
            if (currentSession.onComplete) {
              currentSession.onComplete(metadata);
            }
            activeUploads.delete(fileId);
          } catch (err: any) {
            console.error(`[AzureBlobStorage] [LOG] Erro ao montar arquivo final dos blocos:`, err);
            await this.clearChunksFromDB(fileId, currentSession.totalChunks);
            currentSession.status = 'falha';
            if (currentSession.onError) {
              currentSession.onError(err?.message || 'Falha ao salvar no Storage.');
            }
            activeUploads.delete(fileId);
          }
        }
      } catch (timerErr: any) {
        console.error(`[AzureBlobStorage] [LOG] Exceção crítica durante processamento do bloco:`, timerErr);
        const currSession = activeUploads.get(fileId);
        if (currSession) {
          currSession.status = 'falha';
          if (currSession.onError) {
            currSession.onError(timerErr?.message || 'Erro inesperado no envio de blocos.');
          }
          await this.clearChunksFromDB(fileId, currSession.totalChunks);
          activeUploads.delete(fileId);
        }
      }
    }, simulatedDelay);
  },

  /**
   * Pause upload
   */
  pauseUpload(fileId: string) {
    const session = activeUploads.get(fileId);
    if (session) {
      if (session.timerId) {
        clearTimeout(session.timerId);
        session.timerId = null;
      }
      if (session.status === 'enviando') {
        session.status = 'pausado';
        console.log(`[AzureBlobStorage] [LOG] Upload pausado pelo usuário: ${session.file?.name}`);
        if (session.onProgress) {
          session.onProgress(session.progress, 'Pausado');
        }
      }
    }
  },

  /**
   * Resume upload
   */
  resumeUpload(fileId: string) {
    const session = activeUploads.get(fileId);
    if (session && (session.status === 'pausado' || session.status === 'offline')) {
      if (session.timerId) {
        clearTimeout(session.timerId);
        session.timerId = null;
      }
      session.status = 'enviando';
      console.log(`[AzureBlobStorage] [LOG] Upload retomado pelo usuário: ${session.file?.name}`);
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
      if (session.timerId) {
        clearTimeout(session.timerId);
        session.timerId = null;
      }
      session.status = 'cancelado';
      console.log(`[AzureBlobStorage] [LOG] Upload cancelado pelo usuário: ${session.file?.name}`);
      if (session.onProgress) {
        session.onProgress(session.progress, 'Cancelado');
      }
      this.clearChunksFromDB(fileId, session.totalChunks);
      activeUploads.delete(fileId);
    }
  }
};
