import React from 'react';
import { useDownload } from '../../hooks/useDownload';
import { Download, Loader2, X, AlertCircle, CheckCircle } from 'lucide-react';

interface FileDownloaderProps {
  fileId: string;
  fileName: string;
  isDarkMode: boolean;
  language: 'PT' | 'EN';
  className?: string;
}

export const FileDownloader: React.FC<FileDownloaderProps> = ({
  fileId,
  fileName,
  isDarkMode,
  language,
  className = ''
}) => {
  const { downloadFile, cancel, progress, status, error } = useDownload();

  const handleDownload = async () => {
    try {
      await downloadFile(fileId, fileName);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className={`flex flex-col gap-1.5 p-3 rounded-2xl border ${
      isDarkMode 
        ? 'bg-zinc-900 border-zinc-800 text-white' 
        : 'bg-white border-zinc-100 text-zinc-800 shadow-sm'
    } ${className}`}>
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-bold truncate max-w-[180px]" title={fileName}>
          {fileName}
        </p>

        {status === 'idle' && (
          <button
            onClick={handleDownload}
            className="p-1.5 bg-teal-500 hover:bg-teal-600 text-slate-950 rounded-lg transition-colors flex items-center justify-center"
            title={language === 'PT' ? 'Baixar arquivo' : 'Download file'}
          >
            <Download className="w-3.5 h-3.5" />
          </button>
        )}

        {status === 'baixando' && (
          <button
            onClick={cancel}
            className="p-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg transition-colors flex items-center justify-center"
            title={language === 'PT' ? 'Cancelar download' : 'Cancel download'}
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {status !== 'idle' && (
        <div className="space-y-1">
          {/* Mini Progress bar */}
          <div className="w-full h-1 bg-zinc-800 rounded-full overflow-hidden">
            <div 
              className={`h-full rounded-full transition-all duration-300 ${
                status === 'concluido' ? 'bg-emerald-500' :
                status === 'erro' ? 'bg-red-500' :
                status === 'offline' ? 'bg-amber-500' : 'bg-teal-500'
              }`}
              style={{ width: `${progress}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-[10px] font-bold">
            <span className="flex items-center gap-1">
              {status === 'baixando' && (
                <span className="flex items-center gap-1 text-teal-400">
                  <Loader2 className="w-3 h-3 animate-spin" /> {language === 'PT' ? 'Baixando...' : 'Downloading...'}
                </span>
              )}
              {status === 'concluido' && (
                <span className="flex items-center gap-1 text-emerald-400">
                  <CheckCircle className="w-3 h-3" /> {language === 'PT' ? 'Pronto' : 'Ready'}
                </span>
              )}
              {status === 'erro' && (
                <span className="flex items-center gap-1 text-red-400">
                  <AlertCircle className="w-3 h-3" /> {error || 'Erro'}
                </span>
              )}
              {status === 'cancelado' && (
                <span className="text-zinc-400">Cancelado</span>
              )}
              {status === 'offline' && (
                <span className="text-amber-400 animate-pulse">Offline</span>
              )}
            </span>
            <span className="text-zinc-500 font-black">{progress}%</span>
          </div>
        </div>
      )}
    </div>
  );
};
export default FileDownloader;
