import React, { useState } from 'react';
import { useDownload } from '../../hooks/useDownload';
import { fileValidationService } from '../../services/fileValidationService';
import { ImageViewer } from './ImageViewer';
import { 
  FileText, 
  FileSpreadsheet, 
  Archive, 
  Image as ImageIcon, 
  Presentation, 
  HelpCircle, 
  Download, 
  X, 
  Loader2, 
  CheckCircle, 
  AlertCircle 
} from 'lucide-react';

interface DocumentCardProps {
  fileId: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  fileUrl: string;
  senderName: string;
  timeString: string;
  isMe: boolean;
  isDarkMode: boolean;
  language: 'PT' | 'EN';
}

export const DocumentCard: React.FC<DocumentCardProps> = ({
  fileId,
  fileName,
  fileSize,
  mimeType,
  fileUrl,
  senderName,
  timeString,
  isMe,
  isDarkMode,
  language
}) => {
  const { downloadFile, cancel, progress, status, error } = useDownload();
  const [showImageViewer, setShowImageViewer] = useState(false);

  const category = fileValidationService.getFileCategory(fileName);
  const formattedSize = fileValidationService.formatBytes(fileSize);

  // Map to beautiful emojis and custom labels as required
  const getIcon = () => {
    switch (category) {
      case 'pdf':
        return { emoji: '📄', label: 'PDF', icon: <FileText className="w-5 h-5 text-red-500 shrink-0" /> };
      case 'word':
        return { emoji: '📃', label: 'Word', icon: <FileText className="w-5 h-5 text-blue-500 shrink-0" /> };
      case 'excel':
        return { emoji: '📊', label: 'Excel', icon: <FileSpreadsheet className="w-5 h-5 text-emerald-500 shrink-0" /> };
      case 'powerpoint':
        return { emoji: '🎞️', label: 'PowerPoint', icon: <Presentation className="w-5 h-5 text-amber-500 shrink-0" /> };
      case 'zip':
        return { emoji: '📁', label: 'ZIP', icon: <Archive className="w-5 h-5 text-yellow-500 shrink-0" /> };
      case 'image':
        return { emoji: '🖼️', label: 'imagem', icon: <ImageIcon className="w-5 h-5 text-purple-400 shrink-0" /> };
      default:
        return { emoji: '📦', label: 'Outros', icon: <HelpCircle className="w-5 h-5 text-zinc-400 shrink-0" /> };
    }
  };

  const { emoji, label, icon } = getIcon();

  const handleDownload = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await downloadFile(fileId, fileName);
    } catch (err) {
      console.error('Failed to download file:', err);
    }
  };

  const handleCancelDownload = (e: React.MouseEvent) => {
    e.stopPropagation();
    cancel();
  };

  const handleOpenViewer = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (category === 'image' && fileUrl) {
      setShowImageViewer(true);
    }
  };

  const isImage = category === 'image';

  return (
    <div className={`flex flex-col max-w-[280px] sm:max-w-xs md:max-w-md w-full rounded-2xl overflow-hidden ${
      isMe 
        ? isDarkMode ? 'bg-teal-500/10 border border-teal-500/20' : 'bg-teal-50 border border-teal-100'
        : isDarkMode ? 'bg-zinc-800 border border-zinc-700/50' : 'bg-white border border-zinc-100 shadow-sm'
    }`}>
      {/* 1. Thumbnail for Images */}
      {isImage && fileUrl && (
        <div 
          onClick={handleOpenViewer}
          className="relative aspect-video w-full cursor-pointer overflow-hidden bg-black/10 hover:opacity-95 transition-opacity group"
        >
          <img 
            src={fileUrl} 
            alt={fileName} 
            className="w-full h-full object-cover select-none"
            referrerPolicy="no-referrer"
          />
          {/* Zoom hover indicator */}
          <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <span className="px-3 py-1 bg-black/60 backdrop-blur-sm text-white text-[10px] font-black uppercase tracking-wider rounded-full">
              {language === 'PT' ? '🔎 Toque para ampliar' : '🔎 Tap to zoom'}
            </span>
          </div>
        </div>
      )}

      {/* 2. Document Card Body */}
      <div className="p-3.5 flex flex-col gap-2">
        <div className="flex items-start gap-3">
          {/* Extension Icon block */}
          <div className="p-2.5 rounded-xl bg-zinc-900/10 dark:bg-zinc-900/40 border border-zinc-200/50 dark:border-zinc-800 shrink-0">
            {icon}
          </div>

          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold truncate text-zinc-800 dark:text-zinc-100" title={fileName}>
              {fileName}
            </p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="text-[9px] font-black uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                {emoji} {label}
              </span>
              <span className="text-[10px] text-zinc-400 dark:text-zinc-500 font-bold">•</span>
              <span className="text-[10px] text-zinc-400 dark:text-zinc-500 font-bold">
                {formattedSize}
              </span>
            </div>
          </div>

          {/* Action buttons */}
          <div className="shrink-0 ml-1">
            {status === 'idle' && (
              <button
                onClick={handleDownload}
                className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-900 text-teal-500 hover:text-teal-600 transition-colors"
                title={language === 'PT' ? 'Baixar arquivo' : 'Download file'}
              >
                <Download className="w-4 h-4" />
              </button>
            )}

            {status === 'baixando' && (
              <button
                onClick={handleCancelDownload}
                className="p-1.5 rounded-lg hover:bg-red-500/10 text-red-500 hover:text-red-600 transition-colors"
                title={language === 'PT' ? 'Cancelar download' : 'Cancel download'}
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* 3. Progress feedback section */}
        {status !== 'idle' && (
          <div className="flex flex-col gap-1 mt-1 p-2 rounded-lg bg-zinc-100/50 dark:bg-zinc-900/30 text-[10px]">
            <div className="flex items-center justify-between font-bold">
              <span className="flex items-center gap-1">
                {status === 'baixando' && (
                  <span className="flex items-center gap-1 text-teal-500">
                    <Loader2 className="w-3 h-3 animate-spin" /> {language === 'PT' ? 'Baixando...' : 'Downloading...'}
                  </span>
                )}
                {status === 'concluido' && (
                  <span className="flex items-center gap-1 text-emerald-500">
                    <CheckCircle className="w-3 h-3" /> {language === 'PT' ? 'Download concluído' : 'Download completed'}
                  </span>
                )}
                {status === 'erro' && (
                  <span className="flex items-center gap-1 text-red-500">
                    <AlertCircle className="w-3 h-3" /> {error || (language === 'PT' ? 'Erro' : 'Error')}
                  </span>
                )}
                {status === 'cancelado' && (
                  <span className="flex items-center gap-1 text-zinc-400">
                    <AlertCircle className="w-3 h-3" /> {language === 'PT' ? 'Cancelado' : 'Cancelled'}
                  </span>
                )}
                {status === 'offline' && (
                  <span className="flex items-center gap-1 text-amber-500 animate-pulse">
                    <AlertCircle className="w-3 h-3" /> Offline
                  </span>
                )}
              </span>
              <span className="text-zinc-500 font-bold">{progress}%</span>
            </div>

            {/* Horizontal mini progress bar */}
            <div className="w-full h-1 bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden">
              <div 
                className={`h-full rounded-full transition-all duration-300 ${
                  status === 'concluido' ? 'bg-emerald-500' :
                  status === 'erro' ? 'bg-red-500' :
                  status === 'offline' ? 'bg-amber-500' : 'bg-teal-500'
                }`}
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        {/* 4. Footer meta lines */}
        <div className="flex items-center justify-between text-[9px] text-zinc-400 mt-1 dark:text-zinc-500 font-bold">
          <span className="truncate max-w-[120px]">{isMe ? (language === 'PT' ? 'Você' : 'You') : senderName}</span>
          <span>{timeString}</span>
        </div>
      </div>

      {/* 5. Portal for image zooming */}
      {showImageViewer && (
        <ImageViewer
          imageUrl={fileUrl}
          fileName={fileName}
          onClose={() => setShowImageViewer(false)}
          onDownload={async () => {
            try {
              await downloadFile(fileId, fileName);
            } catch (err) {
              console.error(err);
            }
          }}
        />
      )}
    </div>
  );
};
