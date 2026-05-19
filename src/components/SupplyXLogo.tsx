import React from 'react';

interface SupplyXLogoProps {
  className?: string;
  showText?: boolean;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  isDark?: boolean;
}

const SupplyXLogo: React.FC<SupplyXLogoProps> = ({ 
  className = '', 
  showText = true, 
  size = 'md',
  isDark = true 
}) => {
  const sizes = {
    sm: 'w-6 h-6',
    md: 'w-10 h-10',
    lg: 'w-16 h-16',
    xl: 'w-24 h-24'
  };

  const textSizes = {
    sm: 'text-sm',
    md: 'text-xl',
    lg: 'text-3xl',
    xl: 'text-5xl'
  };

  return (
    <div className={`flex flex-col items-center gap-1 ${className}`}>
      <div className="flex items-center gap-3">
        <div className={`${sizes[size]} relative flex items-center justify-center rounded-2xl overflow-hidden shadow-2xl group`}>
          <img 
            src="/src/assets/images/supplyx_logo_v2_1779179688631.png" 
            alt="SupplyX" 
            className="w-full h-full object-cover"
            id="supplyx-logo-img"
            referrerPolicy="no-referrer"
          />
        </div>
        
        {showText && size !== 'lg' && size !== 'xl' && (
          <span className={`${textSizes[size]} font-black italic tracking-tighter ${isDark ? 'text-white' : 'text-supplyx-deep'}`}>
            Supply<span className="text-supplyx-blue">X</span>
          </span>
        )}
      </div>
      
      {size !== 'sm' && (
        <span className={`${size === 'lg' || size === 'xl' ? 'text-[10px]' : 'text-[7px]'} font-black tracking-[0.2em] text-supplyx-blue/70 uppercase mt-1 text-center leading-none`}>
          Powered by Manhate Link África
        </span>
      )}
    </div>
  );
};

export default SupplyXLogo;
