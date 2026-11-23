import React from 'react';
import { formatFcfa, formatNumber } from '../game/constants';
import { GameState } from '../game/types';

interface PauseModalProps {
  state: GameState;
  onResume: () => void;
  onSave: () => void;
  onReset: () => void;
  onTitle: () => void;
}

export const PauseModal: React.FC<PauseModalProps> = ({
  state,
  onResume,
  onSave,
  onReset,
  onTitle,
}) => {
  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center bg-black/65 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="pause-title"
      data-testid="pause-modal"
    >
      <div className="w-full max-w-md rounded-xl bg-[#241610] border border-[#F59E0B]/40 p-6 text-[#FAF6EE] shadow-2xl">
        <h2 id="pause-title" className="font-display text-2xl font-bold text-[#FBBF24] mb-1">
          Jeu en Pause
        </h2>
        <p className="text-xs text-[#D6C5B3] mb-5">
          Votre exploitation attend vos ordres.
        </p>

        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="rounded-lg bg-[#342017] p-3 border border-[#F5E6D3]/10">
            <div className="text-[11px] text-[#D6C5B3]">Solde actuel</div>
            <div className="text-sm font-bold text-[#FBBF24] font-mono-num">
              {formatFcfa(state.fcfa)}
            </div>
          </div>
          <div className="rounded-lg bg-[#342017] p-3 border border-[#F5E6D3]/10">
            <div className="text-[11px] text-[#D6C5B3]">Gains cumulés</div>
            <div className="text-sm font-bold text-[#86EFAC] font-mono-num">
              {formatFcfa(state.lifetimeTotalEarned)}
            </div>
          </div>
          <div className="rounded-lg bg-[#342017] p-3 border border-[#F5E6D3]/10">
            <div className="text-[11px] text-[#D6C5B3]">Sacs d’attiéké</div>
            <div className="text-sm font-bold text-[#FAF6EE] font-mono-num">
              {formatNumber(state.resources.attiekeSacs)}
            </div>
          </div>
          <div className="rounded-lg bg-[#342017] p-3 border border-[#F5E6D3]/10">
            <div className="text-[11px] text-[#D6C5B3]">Prestige</div>
            <div className="text-sm font-bold text-[#FDE68A] font-mono-num">
              {state.prestigeCount} rebirths · {state.prestigePoints} sceaux
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-2.5">
          <button
            type="button"
            onClick={onResume}
            className="w-full py-2.5 px-4 rounded-lg bg-[#D97706] hover:bg-[#EA8A1A] text-[#1C120C] font-bold text-sm cursor-pointer transition-colors"
          >
            Reprendre la partie
          </button>
          <button
            type="button"
            onClick={onSave}
            className="w-full py-2.5 px-4 rounded-lg bg-[#342017] hover:bg-[#462C20] border border-[#F5E6D3]/20 text-[#FAF6EE] font-semibold text-sm cursor-pointer transition-colors"
          >
            Sauvegarder maintenant
          </button>
          <div className="grid grid-cols-2 gap-2.5 pt-1">
            <button
              type="button"
              onClick={onTitle}
              className="py-2 px-3 rounded-lg bg-[#2D1B12] hover:bg-[#3E271C] border border-[#F5E6D3]/15 text-[#E7D8C9] font-medium text-xs cursor-pointer transition-colors"
            >
              Écran titre
            </button>
            <button
              type="button"
              onClick={onReset}
              className="py-2 px-3 rounded-lg bg-[#451A1A] hover:bg-[#5C2222] border border-[#EF4444]/30 text-[#FCA5A5] font-medium text-xs cursor-pointer transition-colors"
            >
              Réinitialiser
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
