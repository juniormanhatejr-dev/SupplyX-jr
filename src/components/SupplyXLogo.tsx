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
    <div className={`flex items-center gap-3 ${className}`}>
      <div className={`${sizes[size]} relative flex items-center justify-center rounded-2xl overflow-hidden shadow-2xl group`}>
        <img 
          src="/src/assets/images/supplyx_logo_1779177786558.png" 
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
  );
};

export default SupplyXLogo;
