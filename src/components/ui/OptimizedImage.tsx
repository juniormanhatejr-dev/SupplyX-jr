import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ImageIcon } from 'lucide-react';

interface OptimizedImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  fallback?: React.ReactNode;
  containerClassName?: string;
  isPriority?: boolean;
}

export const OptimizedImage: React.FC<OptimizedImageProps> = ({ 
  src, 
  alt, 
  className, 
  containerClassName = '',
  fallback,
  isPriority = false,
  ...props 
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);

  React.useEffect(() => {
    setIsLoaded(false);
    setHasError(false);
  }, [src]);

  return (
    <div className={`relative overflow-hidden ${containerClassName}`}>
      <AnimatePresence mode="wait">
        {!isLoaded && !hasError && (
          <motion.div
            key="skeleton"
            initial={{ opacity: 0.5 }}
            animate={{ opacity: [0.5, 0.8, 0.5] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
            className="absolute inset-0 bg-zinc-200 dark:bg-zinc-800"
          />
        )}
        {hasError && (
          <motion.div
            key="error"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 flex items-center justify-center bg-zinc-100 dark:bg-zinc-900 text-zinc-400"
          >
            {fallback || <ImageIcon className="w-6 h-6 opacity-20" />}
          </motion.div>
        )}
      </AnimatePresence>

      <img
        src={src}
        alt={alt}
        className={`${className} transition-all duration-700 ${isLoaded ? 'opacity-100 blur-0 scale-100' : 'opacity-0 blur-xl scale-105'}`}
        onLoad={() => setIsLoaded(true)}
        onError={() => setHasError(true)}
        loading={isPriority ? "eager" : "lazy"}
        fetchPriority={isPriority ? "high" : "low"}
        referrerPolicy="no-referrer"
        {...props}
      />
    </div>
  );
};
