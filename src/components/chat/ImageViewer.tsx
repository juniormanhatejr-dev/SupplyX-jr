import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, ZoomIn, ZoomOut, RotateCcw, Download } from 'lucide-react';

interface ImageViewerProps {
  imageUrl: string;
  fileName: string;
  onClose: () => void;
  onDownload?: () => void;
}

export const ImageViewer: React.FC<ImageViewerProps> = ({
  imageUrl,
  fileName,
  onClose,
  onDownload
}) => {
  const [scale, setScale] = useState(1);
  const [rotation, setRotation] = useState(0);

  const handleZoomIn = () => setScale(prev => Math.min(prev + 0.25, 3));
  const handleZoomOut = () => setScale(prev => Math.max(prev - 0.25, 0.5));
  const handleReset = () => {
    setScale(1);
    setRotation(0);
  };

  const handleRotate = () => setRotation(prev => (prev + 90) % 360);

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/90 backdrop-blur-md select-none">
        {/* Header toolbar */}
        <div className="absolute top-0 inset-x-0 h-16 bg-gradient-to-b from-black/60 to-transparent flex items-center justify-between px-6 z-10 text-white">
          <div className="flex flex-col">
            <span className="text-sm font-bold truncate max-w-[200px] sm:max-w-md">{fileName}</span>
          </div>
          
          <div className="flex items-center gap-4">
            <button
              onClick={handleZoomIn}
              className="p-2 hover:bg-white/10 rounded-full transition-colors"
              title="Aumentar Zoom"
            >
              <ZoomIn className="w-5 h-5" />
            </button>
            <button
              onClick={handleZoomOut}
              className="p-2 hover:bg-white/10 rounded-full transition-colors"
              title="Diminuir Zoom"
            >
              <ZoomOut className="w-5 h-5" />
            </button>
            <button
              onClick={handleRotate}
              className="p-2 hover:bg-white/10 rounded-full transition-colors"
              title="Rotacionar"
            >
              <RotateCcw className="w-5 h-5" />
            </button>
            <button
              onClick={handleReset}
              className="px-3 py-1 text-xs hover:bg-white/10 rounded-md transition-colors"
            >
              Resetar
            </button>
            {onDownload && (
              <button
                onClick={onDownload}
                className="p-2 hover:bg-white/10 rounded-full transition-colors"
                title="Baixar Imagem"
              >
                <Download className="w-5 h-5" />
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 bg-white/10 hover:bg-red-500 rounded-full transition-all"
              title="Fechar"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Image Area */}
        <div className="relative w-full h-full flex items-center justify-center p-4 overflow-hidden">
          <motion.img
            src={imageUrl}
            alt={fileName}
            className="max-w-full max-h-[85vh] object-contain rounded shadow-2xl origin-center pointer-events-auto cursor-grab active:cursor-grabbing"
            style={{ 
              scale,
              rotate: `${rotation}deg`
            }}
            drag
            dragConstraints={{ left: -300, right: 300, top: -300, bottom: 300 }}
            dragElastic={0.1}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            referrerPolicy="no-referrer"
          />
        </div>

        {/* Bottom indicator */}
        <div className="absolute bottom-6 bg-black/40 px-4 py-2 rounded-full text-xs text-zinc-400">
          Dica: Você pode arrastar a imagem para reposicionar e usar os controles de zoom.
        </div>
      </div>
    </AnimatePresence>
  );
};
