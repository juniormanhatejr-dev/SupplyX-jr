/**
 * Custom React hook for robust, pausing, and cancellable file uploads
 * built with offline-resilience support.
 */

import { useState, useEffect, useRef } from 'react';
import { uploadService, UploadProgressEvent } from '../services/uploadService';
import { useOnlineStatus } from './useOnlineStatus';

export function useUpload() {
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState<'idle' | 'enviando' | 'concluido' | 'falha' | 'cancelado' | 'pausado' | 'offline'>('idle');
  const [error, setError] = useState<string | null>(null);
  const [activeFileId, setActiveFileId] = useState<string | null>(null);
  const [fileName, setFileName] = useState('');
  
  const isOnline = useOnlineStatus();
  const lastStatusRef = useRef<typeof status>('idle');

  // Track status updates in ref
  useEffect(() => {
    lastStatusRef.current = status;
  }, [status]);

  // Offline resilience auto-pause and auto-resume handler
  useEffect(() => {
    if (!activeFileId) return;

    if (!isOnline && lastStatusRef.current === 'enviando') {
      console.log(`[useUpload] Conectividade perdida durante upload. Pausando...`);
      uploadService.pauseUpload(activeFileId);
      setStatus('offline');
    } else if (isOnline && lastStatusRef.current === 'offline') {
      console.log(`[useUpload] Conectividade restabelecida. Retomando upload...`);
      setStatus('enviando');
      uploadService.resumeUpload(activeFileId);
    }
  }, [isOnline, activeFileId]);

  const upload = async (file: File, roomId: string) => {
    try {
      setProgress(0);
      setStatus('enviando');
      setError(null);
      setFileName(file.name);

      const onProgress = (event: UploadProgressEvent) => {
        setProgress(event.progress);
        
        // If the hook is currently in "offline" state driven by hook logic, don't overwrite it
        if (event.status === 'offline') {
          setStatus('offline');
        } else if (lastStatusRef.current !== 'offline' || event.status === 'concluido' || event.status === 'falha') {
          setStatus(event.status);
        }

        if (event.message) {
          setError(event.message);
        }
      };

      const fileIdPromise = uploadService.uploadFile(file, roomId, onProgress);
      // Wait a tick for the service to generate and begin, so we can capture the fileId
      const simulatedFileId = 'file_' + Math.random().toString(36).substring(2, 15);
      setActiveFileId(simulatedFileId); // temporary key

      const actualFileId = await fileIdPromise;
      setActiveFileId(actualFileId);
      return actualFileId;
    } catch (err: any) {
      setStatus('falha');
      setError(err?.message || 'Falha no upload do arquivo.');
      throw err;
    }
  };

  const pause = () => {
    if (activeFileId && status === 'enviando') {
      uploadService.pauseUpload(activeFileId);
      setStatus('pausado');
    }
  };

  const resume = () => {
    if (activeFileId && status === 'pausado') {
      setStatus('enviando');
      uploadService.resumeUpload(activeFileId);
    }
  };

  const cancel = () => {
    if (activeFileId) {
      uploadService.cancelUpload(activeFileId);
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
    setFileName('');
  };

  return {
    upload,
    pause,
    resume,
    cancel,
    reset,
    progress,
    status,
    error,
    activeFileId,
    fileName,
    isUploading: status === 'enviando' || status === 'offline'
  };
}
