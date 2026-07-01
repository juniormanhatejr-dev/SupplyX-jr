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

      // Fetch blob from IndexedDB (Simulated Azure Container) with high-fidelity fallback
      let blob: Blob;
      try {
        blob = await blobStorageService.getBlob(fileId);
      } catch (dbErr) {
        console.warn(`[AzureBlobStorage] [LOG] File ${fileId} not in local IndexedDB. Trying network/simulated fallback...`);
        let fetched = false;
        
        // 1. Try to fetch from server static or file endpoints if possible
        try {
          const checkPaths = [
            `/api/uploads/${fileId}`,
            `/api/uploads/${session.fileName}`,
            `/api/files/download-raw/${fileId}`
          ];
          for (const path of checkPaths) {
            const response = await fetch(path);
            if (response.ok) {
              const resBlob = await response.blob();
              blob = resBlob;
              fetched = true;
              console.log(`[AzureBlobStorage] [LOG] Successfully fetched ${fileId} from backend path: ${path}`);
              try {
                await blobStorageService.saveBlob(fileId, blob);
              } catch (saveErr) {
                console.warn('[AzureBlobStorage] [LOG] Failed to cache fetched blob in IndexedDB:', saveErr);
              }
              break;
            }
          }
        } catch (fetchErr) {
          console.warn(`[AzureBlobStorage] [LOG] Network fetch fallback failed for ${fileId}:`, fetchErr);
        }

        // 2. Generate custom high-fidelity simulated PDF/Excel/Image/Text fallback if still not found
        if (!fetched) {
          console.log(`[AzureBlobStorage] [LOG] Generating automatic high-fidelity simulated fallback blob for ${session.fileName}`);
          const ext = session.fileName.split('.').pop()?.toLowerCase() || '';
          
          if (ext === 'pdf') {
            const pdfHeader = `%PDF-1.4\n1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n3 0 obj\n<< /Type /Page /Parent 2 0 R /Resources << >> /Contents 4 0 R >>\nendobj\n4 0 obj\n<< /Length 120 >>\nstream\nBT /F1 12 Tf 72 712 Td (SupplyX Simulated Document: ${session.fileName}) Tj ET\nendstream\nendobj\nxref\n0 5\n0000000000 65535 f\n0000000009 00000 n\n0000000056 00000 n\n0000000111 00000 n\n0000000212 00000 n\ntrailer\n<< /Size 5 /Root 1 0 R >>\nstartxref\n360\n%%EOF`;
            blob = new Blob([pdfHeader], { type: 'application/pdf' });
          } else if (['png', 'jpg', 'jpeg', 'webp', 'gif'].includes(ext)) {
            const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600" viewBox="0 0 800 600">
  <defs>
    <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0f172a" />
      <stop offset="100%" stop-color="#111827" />
    </linearGradient>
  </defs>
  <rect width="100%" height="100%" fill="url(#g)" />
  <circle cx="400" cy="240" r="90" fill="#0d9488" opacity="0.1" />
  <path d="M 370 240 L 430 240 M 400 210 L 400 270" stroke="#0d9488" stroke-width="4" stroke-linecap="round" />
  <text x="50%" y="380" font-family="system-ui, sans-serif" font-weight="bold" font-size="24" fill="#ffffff" text-anchor="middle">SupplyX Document Viewer</text>
  <text x="50%" y="420" font-family="system-ui, sans-serif" font-size="14" fill="#94a3b8" text-anchor="middle">${session.fileName}</text>
  <text x="50%" y="450" font-family="system-ui, sans-serif" font-size="11" fill="#4b5563" text-anchor="middle">Simulated cloud asset recovery active</text>
</svg>`;
            blob = new Blob([svgContent], { type: 'image/svg+xml' });
          } else if (['xls', 'xlsx', 'csv'].includes(ext)) {
            const csvContent = `ID,Documento,Status,Mensagem\n1,${session.fileName},Simulado com Sucesso,Este e um arquivo simulado pela plataforma SupplyX para garantir a continuidade do fluxo de homologacao.`;
            blob = new Blob([csvContent], { type: 'text/csv' });
          } else {
            const textContent = `SupplyX Platform - Arquivo Simulado\n\nEste ficheiro (${session.fileName}) foi gerado automaticamente pela plataforma para simular o download do armazenamento na nuvem (Azure Blob Storage).\nID do Ficheiro: ${fileId}\nData de Emissão: ${new Date().toLocaleString()}\n`;
            blob = new Blob([textContent], { type: 'text/plain' });
          }
          
          try {
            await blobStorageService.saveBlob(fileId, blob);
          } catch (saveErr) {
            console.warn('[AzureBlobStorage] [LOG] Failed to cache generated blob in IndexedDB:', saveErr);
          }
        }
      }
      
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
