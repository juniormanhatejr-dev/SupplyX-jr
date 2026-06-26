import React, { useState } from 'react';
import { Upload } from 'lucide-react';

interface FileUploaderProps {
  onFileSelect: (file: File) => void;
  language: 'PT' | 'EN';
  children?: React.ReactNode;
}

export const FileUploader: React.FC<FileUploaderProps> = ({
  onFileSelect,
  language,
  children
}) => {
  const [isDragActive, setIsDragActive] = useState(false);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setIsDragActive(true);
    } else if (e.type === 'dragleave') {
      setIsDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      onFileSelect(file);
    }
  };

  return (
    <div
      onDragEnter={handleDrag}
      onDragOver={handleDrag}
      onDragLeave={handleDrag}
      onDrop={handleDrop}
      className="relative w-full h-full flex flex-col flex-1"
    >
      {/* 1. Drag and Drop Overlay */}
      {isDragActive && (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-teal-500/15 dark:bg-teal-500/10 backdrop-blur-sm border-2 border-dashed border-teal-500 rounded-3xl m-2 transition-all pointer-events-none">
          <div className="p-4 rounded-2xl bg-zinc-950/80 border border-zinc-800 text-white flex flex-col items-center gap-2 shadow-xl">
            <Upload className="w-8 h-8 text-teal-400 animate-bounce" />
            <p className="text-xs font-black uppercase tracking-wider">
              {language === 'PT' ? 'Solte para enviar arquivo' : 'Drop to upload file'}
            </p>
            <p className="text-[10px] text-zinc-400 font-bold">Máximo de 100MB por envio</p>
          </div>
        </div>
      )}

      {/* 2. Main content children rendering */}
      {children}
    </div>
  );
};
export default FileUploader;

