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
  isDark = false 
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
      <div className={`${sizes[size]} relative flex items-center justify-center rounded-xl overflow-hidden shadow-lg border border-[rgba(255,255,255,0.1)] group`}>
        {/* Abstract "SX" using gradients and shapes */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#0052CC] via-[#0747A6] to-[#002d72]" />
        
        {/* The "S" curve accent */}
        <div className="absolute top-0 left-0 w-full h-full" style={{ opacity: 0.3 }}>
          <div className="absolute top-[20%] left-[20%] w-[60%] h-[20%] bg-white rounded-full blur-[2px] rotate-[15deg]"></div>
          <div className="absolute bottom-[20%] right-[20%] w-[60%] h-[20%] bg-[#FF8B00] rounded-full blur-[2px] rotate-[15deg]"></div>
        </div>
        
        {/* The "X" cross accent */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full rotate-45" style={{ opacity: 0.2 }}>
          <div className="absolute top-0 left-1/2 w-0.5 h-full bg-white blur-[1px]"></div>
          <div className="absolute left-0 top-1/2 h-0.5 w-full bg-white blur-[1px]"></div>
        </div>

        {/* Network dots */}
        <div className="absolute top-2 right-2 flex gap-1">
          <div className="w-1 h-1 bg-[#00B8D9] rounded-full animate-pulse"></div>
          <div className="w-1 h-1 bg-[#FF8B00] rounded-full animate-pulse delay-100"></div>
        </div>

        <span className="relative z-10 text-white font-black italic tracking-tighter leading-none select-none" style={{ fontSize: size === 'sm' ? '10px' : size === 'md' ? '18px' : size === 'lg' ? '28px' : '42px' }}>
          SX
        </span>
      </div>
      
      {showText && (
        <span className={`${textSizes[size]} font-black italic tracking-tighter ${isDark ? 'text-white' : 'text-[#18181b]'}`}>
          Supply<span className="text-[#00B8D9]">X</span>
        </span>
      )}
    </div>
  );
};

export default SupplyXLogo;
