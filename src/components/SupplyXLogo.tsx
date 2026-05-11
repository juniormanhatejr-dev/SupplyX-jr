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
      <div className={`${sizes[size]} relative flex items-center justify-center rounded-2xl overflow-hidden shadow-2xl border border-white/10 group`}>
        {/* Abstract "SX" using brand colors */}
        <div className="absolute inset-0 bg-supplyx-deep" />
        <div className="absolute inset-0 bg-gradient-to-br from-supplyx-blue/20 via-transparent to-transparent" />
        
        {/* The "S" curve accent */}
        <div className="absolute top-0 left-0 w-full h-full opacity-40">
          <div className="absolute top-[20%] left-[20%] w-[60%] h-[20%] bg-supplyx-blue rounded-full blur-[4px] rotate-[15deg]"></div>
          <div className="absolute bottom-[20%] right-[20%] w-[60%] h-[20%] bg-white rounded-full blur-[4px] rotate-[15deg]"></div>
        </div>
        
        {/* Dynamic Inner Glow */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(59,130,246,0.15),transparent_70%)]" />

        <span className="relative z-10 text-white font-black italic tracking-tighter leading-none select-none text-glow" style={{ fontSize: size === 'sm' ? '12px' : size === 'md' ? '20px' : size === 'lg' ? '32px' : '48px' }}>
          SX
        </span>
      </div>
      
      {showText && (
        <span className={`${textSizes[size]} font-black italic tracking-tighter ${isDark ? 'text-white' : 'text-supplyx-deep'}`}>
          Supply<span className="text-supplyx-blue">X</span>
        </span>
      )}
    </div>
  );
};

export default SupplyXLogo;
