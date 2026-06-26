/**
 * Download Service
 * Coordinates file downloads from Azure Blob Storage (Simulated)
 * with support for progress tracking, permissions checks, and cancellation.
 */

import { blobStorageService } from './blobStorageService';
import { auth } from '../lib/firebase';

export interface DownloadSession {
  fileId: string;
  fileName: string;
  progress: number;
  status: 'baixando' | 'concluido' | 'erro' | 'cancelado' | 'offline';
  startTime: number;
  onProgress?: (progress: number, status: string) => void;
  onComplete?: (blob: Blob) => void;
  onError?: (error: string) => void;
}

// Map to track active download sessions
const activeDownloads = new Map<string, DownloadSession>();

export const downloadService = {
  /**
   * Start downloading a file with progress simulation and permissions validation
   */
  startDownload(
    fileId: string,
    fileName: string,
    callbacks: {
      onProgress?: (progress: number, status: string) => void;
      onComplete?: (blob: Blob) => void;
      onError?: (error: string) => void;
    }
  ): string {
    // 1. Check user authentication / permission
    if (!auth.currentUser) {
      const errMsg = 'Permissão negada: Usuário não autenticado.';
      if (callbacks.onError) callbacks.onError(errMsg);
      return '';
    }

    console.log(`[AzureBlobStorage] [LOG] Início do download do arquivo: ${fileName} (ID: ${fileId})`);

    const session: DownloadSession = {
      fileId,
      fileName,
      progress: 0,
      status: 'baixando',
      startTime: Date.now(),
      ...callbacks
    };

    activeDownloads.set(fileId, session);

    // Run the download process
    this.runDownloadProcess(fileId);

    return fileId;
  },

  /**
   * Simulated chunked download process from Simulated Azure Storage
   */
  async runDownloadProcess(fileId: string) {
    const session = activeDownloads.get(fileId);
    if (!session) return;

    try {
      // Check offline status
      if (!navigator.onLine) {
        session.status = 'offline';
        if (session.onProgress) session.onProgress(session.progress, 'Offline');
        console.warn(`[AzureBlobStorage] [LOG] Falha no download - sem conexão de internet.`);
        return;
      }

      // Fetch blob from IndexedDB (Simulated Azure Container)
      const blob = await blobStorageService.getBlob(fileId);
      
      // Simulate chunk-by-chunk download progress
      const steps = [0, 15, 40, 80, 100];
      let stepIndex = 0;

      const progressInterval = setInterval(() => {
        const currentSession = activeDownloads.get(fileId);
        
        // Handle cancellation or external changes
        if (!currentSession || currentSession.status !== 'baixando') {
          clearInterval(progressInterval);
          return;
        }

        // Check offline status during download
        if (!navigator.onLine) {
          clearInterval(progressInterval);
          currentSession.status = 'offline';
          if (currentSession.onProgress) {
            currentSession.onProgress(currentSession.progress, 'Offline');
          }
          return;
        }

        const currentProgress = steps[stepIndex];
        currentSession.progress = currentProgress;

        if (currentSession.onProgress) {
          currentSession.onProgress(currentProgress, 'Baixando...');
        }

        if (currentProgress === 100) {
          clearInterval(progressInterval);
          currentSession.status = 'concluido';
          
          const timeTaken = ((Date.now() - currentSession.startTime) / 1000).toFixed(2);
          console.log(`[AzureBlobStorage] [LOG] Fim do download do arquivo: ${session.fileName}. Tempo gasto: ${timeTaken}s`);

          if (currentSession.onComplete) {
            currentSession.onComplete(blob);
          }
          activeDownloads.delete(fileId);
        } else {
          stepIndex++;
        }
      }, 150); // Fast progressive progress updates
    } catch (err: any) {
      console.error(`[AzureBlobStorage] [LOG] Erro ao baixar arquivo ${session.fileName}:`, err);
      session.status = 'erro';
      if (session.onError) {
        session.onError(err?.message || 'Erro ao efetuar download.');
      }
      activeDownloads.delete(fileId);
    }
  },

  /**
   * Cancel download
   */
  cancelDownload(fileId: string) {
    const session = activeDownloads.get(fileId);
    if (session) {
      session.status = 'cancelado';
      console.log(`[AzureBlobStorage] [LOG] Download cancelado pelo usuário: ${session.fileName}`);
      if (session.onProgress) {
        session.onProgress(session.progress, 'Cancelado');
      }
      activeDownloads.delete(fileId);
    }
  }
};
