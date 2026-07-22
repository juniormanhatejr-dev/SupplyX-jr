import React from 'react';
import logoImg from '../assets/images/supplyx_icon_perfect_1779289258482.png';

interface SupplyXLogoProps {
  className?: string;
  showText?: boolean;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  isDark?: boolean; // If true: white background text. If false: dark background text.
}

const SupplyXLogo: React.FC<SupplyXLogoProps> = ({ 
  className = '', 
  showText = true, 
  size = 'md',
  isDark = true 
}) => {
  // Perfect responsive icon dimensions mapping
  const sizes = {
    xs: 'w-5 h-5 rounded-md',
    sm: 'w-7 h-7 rounded-lg',
    md: 'w-11 h-11 rounded-xl',
    lg: 'w-20 h-20 rounded-2xl',
    xl: 'w-28 h-28 rounded-3xl'
  };

  const pixelSizes = {
    xs: 20,
    sm: 28,
    md: 44,
    lg: 80,
    xl: 112
  };

  const textSizes = {
    xs: 'text-xs',
    sm: 'text-sm',
    md: 'text-2xl',
    lg: 'text-4xl',
    xl: 'text-5xl'
  };

  const widthHeightStyle = {
    width: `${pixelSizes[size]}px`,
    height: `${pixelSizes[size]}px`,
    minWidth: `${pixelSizes[size]}px`,
    minHeight: `${pixelSizes[size]}px`,
    flexShrink: 0,
    aspectRatio: '1 / 1'
  };

  return (
    <div className={`flex flex-col items-center justify-center text-center ${className}`}>
      <div className="flex items-center gap-3">
        {/* Glow-enhanced 3D app icon container */}
        <div 
          className={`${sizes[size]} relative flex items-center justify-center overflow-hidden shadow-xl transition-all duration-300 group-hover:scale-105`}
          style={{
            ...widthHeightStyle,
            backgroundColor: isDark ? '#020617' : '#ffffff',
            borderColor: isDark ? 'rgba(6, 182, 212, 0.2)' : '#e4e4e7',
            borderWidth: '1px',
            borderStyle: 'solid'
          }}
        >
          <img 
            src={logoImg} 
            alt="SupplyX Logo Icon" 
            style={{ width: '100%', height: '100%', objectFit: 'contain' }}
            id="supplyx-logo-img"
            referrerPolicy="no-referrer"
          />
        </div>
        
        {/* Crisp HTML-Rendered Brand Typography */}
        {showText && size !== 'lg' && size !== 'xl' && (
          <span className={`${textSizes[size]} font-black tracking-tight font-sans`}>
            <span className={isDark ? 'text-white' : 'text-slate-900'}>Supply</span>
            <span className="text-[#0f9fa8]">X</span>
          </span>
        )}
      </div>

      {/* Elegant Large Display Brand Layout with full text, tagline and divider */}
      {showText && (size === 'lg' || size === 'xl') && (
        <div className="flex flex-col items-center mt-3">
          {/* Main Logo Text under the icon box */}
          <h1 className={`${textSizes[size]} font-black tracking-tight font-sans leading-none`}>
            <span className={isDark ? 'text-white' : 'text-slate-900'}>Supply</span>
            <span className="text-[#0f9fa8]">X</span>
          </h1>

          {/* Subtitle/Tagline as exact replica */}
          <span className="text-[9px] sm:text-[10px] font-black tracking-[0.22em] text-[#00E5FF] uppercase mt-2 opacity-90 leading-normal font-sans">
            Powered by <span className="text-teal-400">Manhate Link África</span>
          </span>

          {/* Custom Dual-Tone Accent Line Divider */}
          <div className="w-24 h-[2px] bg-gradient-to-r from-cyan-400 via-orange-400 to-amber-500 rounded-full mt-2.5 shadow-md"></div>
        </div>
      )}

      {/* Small Inline Tagline for headers & sidebars (when text size is sm/md) */}
      {showText && size !== 'xs' && size !== 'sm' && size !== 'lg' && size !== 'xl' && (
        <span className="text-[7px] font-extrabold tracking-[0.18em] text-[#0f9fa8] uppercase mt-1 leading-none font-sans">
          Powered by Manhate Link África
        </span>
      )}
    </div>
  );
};

export default SupplyXLogo;
