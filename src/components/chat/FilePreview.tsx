import React from 'react';
import { fileValidationService } from '../../services/fileValidationService';
import { FileText, FileSpreadsheet, Archive, Image, Presentation, HelpCircle } from 'lucide-react';

interface FilePreviewProps {
  fileName: string;
  fileSize: number;
  mimeType: string;
  blobUrl?: string;
  onClick?: () => void;
  className?: string;
}

export const FilePreview: React.FC<FilePreviewProps> = ({
  fileName,
  fileSize,
  mimeType,
  blobUrl,
  onClick,
  className = ''
}) => {
  const category = fileValidationService.getFileCategory(fileName);
  const formattedSize = fileValidationService.formatBytes(fileSize);

  // Render proper icon based on file category
  const renderIcon = () => {
    const iconClass = "w-6 h-6 text-zinc-400";
    switch (category) {
      case 'pdf':
        return <FileText className="w-6 h-6 text-red-500 shrink-0" />;
      case 'word':
        return <FileText className="w-6 h-6 text-blue-500 shrink-0" />;
      case 'excel':
        return <FileSpreadsheet className="w-6 h-6 text-emerald-500 shrink-0" />;
      case 'powerpoint':
        return <Presentation className="w-6 h-6 text-amber-500 shrink-0" />;
      case 'zip':
        return <Archive className="w-6 h-6 text-yellow-500 shrink-0" />;
      case 'image':
        return <Image className="w-6 h-6 text-purple-400 shrink-0" />;
      default:
        return <HelpCircle className={iconClass} />;
    }
  };

  const isImage = category === 'image';

  return (
    <div 
      onClick={onClick}
      className={`flex items-center gap-3 p-3 rounded-xl bg-zinc-800 border border-zinc-700/50 hover:border-zinc-600 transition-all cursor-pointer ${className}`}
    >
      {isImage && blobUrl ? (
        <div className="w-12 h-12 rounded-lg overflow-hidden bg-zinc-950 shrink-0 border border-zinc-700">
          <img 
            src={blobUrl} 
            alt={fileName} 
            className="w-full h-full object-cover" 
            referrerPolicy="no-referrer"
          />
        </div>
      ) : (
        <div className="w-12 h-12 rounded-lg bg-zinc-900/60 flex items-center justify-center shrink-0 border border-zinc-800">
          {renderIcon()}
        </div>
      )}

      <div className="min-w-0 flex-1">
        <p className="text-xs font-bold text-zinc-200 truncate">{fileName}</p>
        <p className="text-[10px] text-zinc-500 font-black tracking-wider uppercase mt-0.5">{formattedSize}</p>
      </div>
    </div>
  );
};
