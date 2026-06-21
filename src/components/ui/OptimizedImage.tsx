import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ImageIcon } from 'lucide-react';

interface OptimizedImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  fallback?: React.ReactNode;
  containerClassName?: string;
  isPriority?: boolean;
}

export const OptimizedImage: React.FC<OptimizedImageProps> = ({ 
  src, 
  alt = '', 
  className = '', 
  containerClassName = '',
  fallback,
  isPriority = false,
  ...props 
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [currentSrc, setCurrentSrc] = useState(src);
  const imgRef = useRef<HTMLImageElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (src && src.startsWith('local-file://')) {
      setIsLoaded(false);
      import('../../lib/firebase').then(({ getFileFromIndexedDB }) => {
        getFileFromIndexedDB(src).then((fileData) => {
          if (fileData) {
            setCurrentSrc(fileData.dataUrl);
            setHasError(false);
            setIsLoaded(true);
          } else {
            setHasError(true);
          }
        });
      }).catch((err) => {
        console.error('Failed to import firebase inside OptimizedImage:', err);
        setHasError(true);
      });
      return;
    }

    setCurrentSrc(src);
    setHasError(false);

    // Speed optimization: Immediate check for browser cache
    if (imgRef.current) {
      if (imgRef.current.complete && imgRef.current.naturalWidth > 0) {
        setIsLoaded(true);
        return;
      }
    }

    setIsLoaded(false);

    // Setup active network load timeout (e.g., 4000ms)
    // If the image fails to load or hangs (e.g. Pollinations.ai or slow hosting),
    // we handle it proactively rather than staying in an eternal blank/blurry state.
    if (src) {
      timeoutRef.current = setTimeout(() => {
        if (!isLoaded && imgRef.current && (!imgRef.current.complete || imgRef.current.naturalWidth === 0)) {
          console.warn(`[OptimizedImage] Timeout triggered for: ${src}`);
          handleLoadFallback();
        }
      }, 4000);
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [src]);

  const handleLoadFallback = () => {
    // If it's a product image or general placeholder, let's load a fast reliable high-res alternative
    // If it's a profile/avatar image (determined by alt or container classes) we can use a smart avatar
    if (src && (src.includes('avatar') || src.includes('profile') || alt.toLowerCase().includes('perfil') || alt.toLowerCase().includes('avatar') || alt.toLowerCase().includes('usuario') || alt.toLowerCase().includes('user'))) {
      setCurrentSrc('https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&q=80'); // Fast reliable high-res default profile
    } else {
      setCurrentSrc('https://images.unsplash.com/photo-1581094288338-2314dddb7ec3?w=500&q=80'); // Fast reliable default industrial product
    }
  };

  // Safe onload trigger
  const handleOnLoad = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setIsLoaded(true);
  };

  // Safe onerror trigger
  const handleOnError = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    // Try reliable fallback before giving up
    if (currentSrc !== src) {
      setHasError(true);
    } else {
      handleLoadFallback();
    }
  };

  return (
    <div className={`relative overflow-hidden ${containerClassName}`}>
      <AnimatePresence mode="wait">
        {!isLoaded && !hasError && (
          <motion.div
            key="skeleton"
            initial={{ opacity: 0.5 }}
            animate={{ opacity: [0.5, 0.8, 0.5] }}
            transition={{ duration: 1.0, repeat: Infinity, ease: "easeInOut" }}
            className="absolute inset-0 bg-zinc-200 dark:bg-zinc-800"
          />
        )}
        {hasError && (
          <motion.div
            key="error"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 flex items-center justify-center bg-zinc-150 dark:bg-zinc-900 text-zinc-400"
          >
            {fallback || (
              <div className="flex flex-col items-center justify-center gap-1.5 p-4 text-center">
                <ImageIcon className="w-5 h-5 opacity-40 animate-pulse text-supplyx-blue" />
                <span className="text-[8px] font-black uppercase tracking-widest text-zinc-400">Imagem indisponível</span>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <img
        ref={imgRef}
        src={currentSrc}
        alt={alt}
        className={`${className} transition-all duration-400 ${isLoaded ? 'opacity-100 blur-0 scale-100' : 'opacity-0 blur-md scale-102'}`}
        onLoad={handleOnLoad}
        onError={handleOnError}
        loading={isPriority ? "eager" : "lazy"}
        fetchPriority={isPriority ? "high" : "low"}
        referrerPolicy="no-referrer"
        {...props}
      />
    </div>
  );
};
