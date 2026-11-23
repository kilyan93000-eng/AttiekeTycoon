import React from 'react';
import { formatFcfa } from '../game/constants';

interface TitleScreenProps {
  hasSavedGame: boolean;
  savedFcfa?: number;
  onStart: (forceNew?: boolean) => void;
}

export const TitleScreen: React.FC<TitleScreenProps> = ({
  hasSavedGame,
  savedFcfa,
  onStart,
}) => {
  return (
    <div
      className="fixed inset-0 z-30 flex flex-col justify-between overflow-hidden bg-[#241610] text-[#FAF6EE]"
      data-testid="title-screen"
    >
      {/* Illustrated Key-Art Backdrop */}
      <img
        src="/src/assets/images/title_bg_1795448890935.jpg"
        alt="Plantation de manioc et atelier d'attiéké en Côte d'Ivoire"
        referrerPolicy="no-referrer"
        className="absolute inset-0 h-full w-full object-cover object-center select-none"
      />

      {/* Directional contrast scrim protecting the upper-left negative space */}
      <div
        aria-hidden="true"
        className="absolute inset-0"
        style={{
          background:
            'linear-gradient(105deg, rgba(24, 14, 9, 0.80) 0%, rgba(24, 14, 9, 0.48) 40%, rgba(24, 14, 9, 0.05) 75%, rgba(24, 14, 9, 0.20) 100%)',
        }}
      />

      {/* Main Title Composition positioned in upper-left calm negative space */}
      <div className="relative z-10 flex flex-1 flex-col justify-center px-8 py-12 md:px-16 lg:px-20 max-w-2xl">
        {/* Bespoke inline SVG Crest & Title Lockup */}
        <div className="mb-6">
          <svg
            viewBox="0 0 420 128"
            className="w-full max-w-[400px] h-auto drop-shadow-[0_4px_14px_rgba(0,0,0,0.45)]"
            role="img"
            aria-label="Attiéké Tycoon"
          >
            {/* Cassava Leaf & Bowl Crest */}
            <g transform="translate(8, 18)">
              <circle cx="38" cy="44" r="34" fill="#2E6F40" stroke="#F59E0B" strokeWidth="2.5" />
              {/* Stylized cassava leaves */}
              <path
                d="M38 18 C32 28, 32 40, 38 48 C44 40, 44 28, 38 18 Z"
                fill="#A7F3D0"
              />
              <path
                d="M38 48 C27 42, 18 34, 17 24 C27 25, 34 34, 38 48 Z"
                fill="#6EE7B7"
              />
              <path
                d="M38 48 C49 42, 58 34, 59 24 C49 25, 42 34, 38 48 Z"
                fill="#6EE7B7"
              />
              {/* Woven attiéké basket bowl */}
              <path
                d="M18 52 Q38 72 58 52 Z"
                fill="#D97706"
                stroke="#FDE68A"
                strokeWidth="1.5"
              />
              <path
                d="M23 51 Q38 43 53 51"
                fill="#FAF6EE"
              />
            </g>

            {/* Title Typography Lockup */}
            <text
              x="98"
              y="62"
              fill="#FAF6EE"
              fontFamily="Fraunces, Georgia, serif"
              fontWeight="800"
              fontSize="44"
              letterSpacing="-0.5"
            >
              Attiéké
            </text>
            <text
              x="100"
              y="102"
              fill="#FBBF24"
              fontFamily="Fraunces, Georgia, serif"
              fontWeight="700"
              fontSize="36"
              letterSpacing="1.5"
            >
              TYCOON
            </text>
          </svg>
        </div>

        <p className="text-base md:text-lg text-[#F5E6D3] max-w-md leading-relaxed mb-8">
          Cultivez le manioc, automatisez la transformation artisanale, cuisinez des plats royaux et exportez vers les ports du monde.
        </p>

        {/* Primary CTA Cluster (<= 3 actions) */}
        <div className="flex flex-wrap items-center gap-4">
          <button
            type="button"
            data-start="true"
            onClick={() => onStart(false)}
            className="px-7 py-3.5 rounded-lg bg-[#D97706] hover:bg-[#EA8A1A] active:scale-[0.98] text-[#1C120C] font-bold text-base tracking-tight shadow-lg transition-transform duration-150 cursor-pointer whitespace-nowrap focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#FDE68A]"
          >
            {hasSavedGame ? 'Continuer la partie' : 'Démarrer la partie'}
          </button>

          {hasSavedGame && (
            <button
              type="button"
              onClick={() => onStart(true)}
              className="px-5 py-3.5 rounded-lg bg-[#2D1B12]/90 hover:bg-[#3E271C] text-[#F5E6D3] border border-[#F5E6D3]/25 font-semibold text-sm transition-colors duration-150 cursor-pointer whitespace-nowrap focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#FDE68A]"
            >
              Nouvelle partie
            </button>
          )}
        </div>

        {hasSavedGame && typeof savedFcfa === 'number' && (
          <p className="mt-3 text-xs text-[#FDE68A] font-mono-num">
            Sauvegarde locale détectée · {formatFcfa(savedFcfa)}
          </p>
        )}
      </div>

      {/* Single flat control-hint line in bottom safe margin */}
      <div className="relative z-10 px-8 pb-6 md:px-16 lg:px-20">
        <p className="text-xs md:text-sm text-[#E7D8C9]/90 tracking-wide">
          Clic Parcelles &amp; Postes · Entrée Démarrer · M Son · P Pause
        </p>
      </div>
    </div>
  );
};
