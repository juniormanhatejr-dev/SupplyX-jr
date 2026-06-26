/**
 * Custom React hook for tracking file downloads from simulated Azure Storage
 * with real-time progress, cancellation, and error handling.
 */

import { useState } from 'react';
import { downloadService } from '../services/downloadService';

export function useDownload() {
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState<'idle' | 'baixando' | 'concluido' | 'erro' | 'cancelado' | 'offline'>('idle');
  const [error, setError] = useState<string | null>(null);
  const [activeFileId, setActiveFileId] = useState<string | null>(null);

  const downloadFile = async (fileId: string, fileName: string) => {
    if (!fileId) return;

    setProgress(0);
    setStatus('baixando');
    setError(null);
    setActiveFileId(fileId);

    return new Promise<Blob>((resolve, reject) => {
      downloadService.startDownload(fileId, fileName, {
        onProgress: (p, statusText) => {
          setProgress(p);
          if (statusText === 'Offline') {
            setStatus('offline');
          } else if (statusText === 'Cancelado') {
            setStatus('cancelado');
          } else {
            setStatus('baixando');
          }
        },
        onComplete: (blob) => {
          setStatus('concluido');
          
          // Trigger browser native file download
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = fileName;
          document.body.appendChild(a);
          a.click();
          
          // Cleanup
          setTimeout(() => {
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
          }, 100);

          resolve(blob);
        },
        onError: (errText) => {
          setStatus('erro');
          setError(errText);
          reject(new Error(errText));
        }
      });
    });
  };

  const cancel = () => {
    if (activeFileId) {
      downloadService.cancelDownload(activeFileId);
      setStatus('cancelado');
      setProgress(0);
      setActiveFileId(null);
    }
  };

  const reset = () => {
    setProgress(0);
    setStatus('idle');
    setError(null);
    setActiveFileId(null);
  };

  return {
    downloadFile,
    cancel,
    reset,
    progress,
    status,
    error,
    isDownloading: status === 'baixando' || status === 'offline'
  };
}
