import React, { useRef } from 'react';
import { Paperclip, Loader2 } from 'lucide-react';

interface AttachmentButtonProps {
  onFileSelect: (file: File) => void;
  isUploading: boolean;
  language: 'PT' | 'EN';
  isDarkMode: boolean;
}

export const AttachmentButton: React.FC<AttachmentButtonProps> = ({
  onFileSelect,
  isUploading,
  language,
  isDarkMode
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleButtonClick = () => {
    if (!isUploading) {
      fileInputRef.current?.click();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onFileSelect(file);
      // Reset input value to allow selecting the same file again if needed
      e.target.value = '';
    }
  };

  return (
    <div className="flex items-center">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
        accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.zip,.rar,.7z"
      />
      <button
        type="button"
        onClick={handleButtonClick}
        disabled={isUploading}
        title={language === 'PT' ? 'Anexar arquivo (máx 100MB)' : 'Attach file (max 100MB)'}
        className={`p-3 rounded-xl transition-all flex items-center justify-center ${
          isDarkMode 
            ? 'hover:bg-zinc-800 text-zinc-400 hover:text-white disabled:opacity-40' 
            : 'hover:bg-zinc-100 text-zinc-500 hover:text-zinc-900 disabled:opacity-40'
        }`}
      >
        {isUploading ? (
          <Loader2 className="w-5 h-5 animate-spin text-teal-400" />
        ) : (
          <Paperclip className="w-5 h-5" />
        )}
      </button>
    </div>
  );
};
