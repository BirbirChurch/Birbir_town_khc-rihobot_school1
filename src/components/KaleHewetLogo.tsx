import React from 'react';

interface KaleHewetLogoProps {
  className?: string;
  imgClassName?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showTitle?: boolean;
  logoUrl?: string;
}

export const KaleHewetLogo: React.FC<KaleHewetLogoProps> = ({
  className = '',
  imgClassName = '',
  size = 'md',
  showTitle = false,
  logoUrl,
}) => {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-11 h-11',
    lg: 'w-16 h-16',
    xl: 'w-24 h-24',
  }[size];

  const activeSrc = logoUrl || '/kale_heywet_logo.jpg';

  return (
    <div className={`inline-flex items-center gap-3 ${className}`}>
      <img
        src={activeSrc}
        alt="የኢትዮጵያ ቃለ ሕይወት ቤተክርስቲያን ርኆቦት ትምህርት ቤት አርማ"
        className={`${sizeClasses} rounded-full object-cover border-2 border-amber-400 shadow-sm bg-white shrink-0 ${imgClassName}`}
        onError={(e) => {
          (e.currentTarget as HTMLImageElement).src = '/src/assets/images/kale_heywet_logo_1791782506449.jpg';
        }}
      />
      {showTitle && (
        <div className="flex flex-col text-left">
          <span className="text-sm font-bold text-slate-900 tracking-tight leading-tight">
            የብርብር ከተማ ቃለ ሕይወት ርኆቦት
          </span>
          <span className="text-[11px] font-semibold text-indigo-700">
            መካከለኛና የመጀመሪያ ደረጃ ትምህርት ቤት
          </span>
        </div>
      )}
    </div>
  );
};
