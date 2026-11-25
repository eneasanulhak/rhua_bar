import React from 'react';

export type LogoVariant = 'horizontal' | 'block' | 'vertical' | 'symbol' | 'full-totem';
export type LogoColorMode = 'sand' | 'black' | 'white' | 'auto';

interface RhuaLogoProps {
  variant?: LogoVariant;
  colorMode?: LogoColorMode;
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'custom';
  width?: number | string;
  height?: number | string;
  subtitle?: boolean;
}

export const RhuaLogo: React.FC<RhuaLogoProps> = ({
  variant = 'horizontal',
  colorMode = 'auto',
  className = '',
  size = 'md',
  width,
  height,
  subtitle = true,
}) => {
  // Brand colors from manual:
  // Sand / Bege institucional: #EED9C6 (RGB 238, 217, 198)
  // Preto institucional: #000000
  const colorPrimary =
    colorMode === 'sand'
      ? '#EED9C6'
      : colorMode === 'black'
      ? '#000000'
      : colorMode === 'white'
      ? '#FFFFFF'
      : 'currentColor';

  const colorSecondary =
    colorMode === 'sand'
      ? '#DFC7B0'
      : colorMode === 'black'
      ? '#1a1a1a'
      : colorMode === 'white'
      ? '#E2E8F0'
      : 'currentColor';

  // Símbolo dos Sentidos RHUA BAR (Olho, Nariz, Boca, Orelha)
  const TotemSymbol = ({ strokeColor = colorPrimary, strokeWidth = 5, className: symClass = '' }) => (
    <svg
      viewBox="0 0 200 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={symClass}
      style={{ width: '100%', height: '100%' }}
    >
      {/* Olho dos Sentidos no topo */}
      <g id="rhua-eye">
        {/* Contorno amendoado do olho */}
        <path
          d="M 60 70 Q 100 42 140 70 Q 100 98 60 70 Z"
          stroke={strokeColor}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
        {/* Íris / Pupila */}
        <circle cx="100" cy="70" r="10" stroke={strokeColor} strokeWidth={strokeWidth} fill="none" />
        {/* Raios / Cílios expressivos superiores */}
        <path d="M 80 44 L 74 30" stroke={strokeColor} strokeWidth={strokeWidth} strokeLinecap="round" />
        <path d="M 100 40 L 100 24" stroke={strokeColor} strokeWidth={strokeWidth} strokeLinecap="round" />
        <path d="M 120 44 L 126 30" stroke={strokeColor} strokeWidth={strokeWidth} strokeLinecap="round" />
      </g>

      {/* Nariz Angular */}
      <g id="rhua-nose">
        <path
          d="M 65 75 L 50 115 L 75 120"
          stroke={strokeColor}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
      </g>

      {/* Boca / Lábios */}
      <g id="rhua-mouth">
        {/* Lábio superior */}
        <path
          d="M 35 155 Q 55 138 75 146 Q 95 138 115 155"
          stroke={strokeColor}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
        {/* Lábio inferior */}
        <path
          d="M 35 155 Q 75 180 115 155"
          stroke={strokeColor}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
        {/* Linha central da boca */}
        <path
          d="M 45 155 Q 75 160 105 155"
          stroke={strokeColor}
          strokeWidth={strokeWidth * 0.75}
          strokeLinecap="round"
          fill="none"
        />
      </g>

      {/* Orelha estilizada / Audição */}
      <g id="rhua-ear">
        <path
          d="M 140 105 C 165 110 170 140 155 160 C 145 175 135 178 128 170"
          stroke={strokeColor}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
        <path
          d="M 148 125 C 158 135 155 150 145 155"
          stroke={strokeColor}
          strokeWidth={strokeWidth * 0.75}
          strokeLinecap="round"
          fill="none"
        />
      </g>
    </svg>
  );

  // Renderizador das variantes
  if (variant === 'symbol') {
    const sizeMap = {
      sm: 'w-8 h-8',
      md: 'w-12 h-12',
      lg: 'w-16 h-16',
      xl: 'w-24 h-24',
      custom: '',
    };
    return (
      <div
        className={`inline-flex items-center justify-center shrink-0 ${sizeMap[size]} ${className}`}
        style={{ width, height }}
      >
        <TotemSymbol strokeColor={colorPrimary} strokeWidth={6} />
      </div>
    );
  }

  if (variant === 'vertical') {
    return (
      <div
        className={`inline-flex flex-col items-center tracking-widest font-serif select-none ${className}`}
        style={{ color: colorPrimary, width, height }}
      >
        <span className="text-xl font-black leading-none mb-1">R</span>
        <span className="text-xl font-black leading-none mb-1">H</span>
        <span className="text-xl font-black leading-none mb-1">U</span>
        <span className="text-xl font-black leading-none">A</span>
        {subtitle && (
          <span
            className="text-[9px] font-sans font-extrabold tracking-[0.3em] uppercase mt-2 pt-2 border-t border-current/30"
            style={{ color: colorSecondary }}
          >
            BAR
          </span>
        )}
      </div>
    );
  }

  if (variant === 'block') {
    return (
      <div
        className={`inline-flex flex-col items-center select-none font-serif ${className}`}
        style={{ color: colorPrimary, width, height }}
      >
        <div className="grid grid-cols-2 gap-x-1.5 text-2xl font-black leading-none tracking-tight">
          <span>R</span>
          <span>H</span>
          <span>U</span>
          <span>A</span>
        </div>
        {subtitle && (
          <div
            className="text-[10px] font-sans font-black tracking-[0.35em] uppercase mt-1.5"
            style={{ color: colorSecondary }}
          >
            B A R
          </div>
        )}
      </div>
    );
  }

  if (variant === 'full-totem') {
    return (
      <div
        className={`relative flex flex-col items-center justify-center p-6 text-center select-none ${className}`}
        style={{ width, height }}
      >
        {/* Marca d'água do totem atrás */}
        <div className="absolute inset-0 flex items-center justify-center opacity-25 pointer-events-none">
          <TotemSymbol strokeColor={colorSecondary} strokeWidth={4} />
        </div>
        {/* Logotipo em primeiro plano */}
        <div className="relative z-10 flex flex-col items-center">
          <span
            className="text-3xl sm:text-4xl font-black font-serif tracking-[0.2em] leading-none"
            style={{ color: colorPrimary }}
          >
            RHUA
          </span>
          {subtitle && (
            <span
              className="text-xs sm:text-sm font-sans font-black tracking-[0.5em] uppercase mt-2"
              style={{ color: colorSecondary }}
            >
              B A R
            </span>
          )}
        </div>
      </div>
    );
  }

  // Padrão: Variante Horizontal oficial do Manual (página 3, 5, 7)
  const sizeClasses = {
    sm: { title: 'text-lg tracking-[0.2em]', bar: 'text-[9px] tracking-[0.4em] mt-0.5' },
    md: { title: 'text-2xl tracking-[0.22em]', bar: 'text-[11px] tracking-[0.45em] mt-1' },
    lg: { title: 'text-3xl sm:text-4xl tracking-[0.25em]', bar: 'text-xs sm:text-sm tracking-[0.55em] mt-1.5' },
    xl: { title: 'text-5xl sm:text-6xl tracking-[0.28em]', bar: 'text-base sm:text-lg tracking-[0.6em] mt-2' },
    custom: { title: 'text-2xl tracking-[0.22em]', bar: 'text-[11px] tracking-[0.45em] mt-1' },
  };

  const currentSize = sizeClasses[size];

  return (
    <div
      className={`inline-flex flex-col items-center text-center select-none font-serif ${className}`}
      style={{ color: colorPrimary, width, height }}
    >
      <div className={`font-black uppercase leading-none ${currentSize.title} drop-shadow-xs`}>
        RHUA
      </div>
      {subtitle && (
        <div
          className={`font-sans font-black uppercase whitespace-nowrap opacity-90 ${currentSize.bar}`}
          style={{ color: colorSecondary }}
        >
          B A R
        </div>
      )}
    </div>
  );
};
