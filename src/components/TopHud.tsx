import React from 'react';
import { Award, Pause, Save, Volume2, VolumeX } from 'lucide-react';
import { formatFcfa, formatNumber } from '../game/constants';
import { GameState } from '../game/types';

interface TopHudProps {
  state: GameState;
  muted: boolean;
  saveFeedback: string | null;
  onToggleMute: () => void;
  onPause: () => void;
  onSave: () => void;
  onOpenPrestige: () => void;
}

export const TopHud: React.FC<TopHudProps> = ({
  state,
  muted,
  saveFeedback,
  onToggleMute,
  onPause,
  onSave,
  onOpenPrestige,
}) => {
  const totalPlats =
    Math.floor(state.resources.platsAttiekePoisson) +
    Math.floor(state.resources.platsAllocoRoyal);
  const pateTotal =
    Math.floor(state.resources.maniocEpluche) +
    Math.floor(state.resources.maniocBroye) +
    Math.floor(state.resources.pateFermentee) +
    Math.floor(state.resources.semoulePressee);

  return (
    <header className="pointer-events-none fixed top-0 left-0 right-0 z-20 flex flex-wrap items-center justify-between gap-2 px-3 md:px-4 py-2">
      {/* Left Cluster: Balance FCFA & Revenue Rate */}
      <div className="pointer-events-auto flex items-center gap-3 md:gap-4 rounded-lg bg-[#241610]/95 border border-[#F59E0B]/35 px-3 md:px-4 py-1.5 md:py-2 shadow-md">
        <div>
          <div className="text-[10px] font-semibold uppercase tracking-wider text-[#FDE68A]/80">
            Trésorerie
          </div>
          <div
            className="text-base md:text-xl font-bold text-[#FBBF24] font-mono-num leading-tight whitespace-nowrap"
            data-testid="hud-fcfa"
          >
            {formatFcfa(state.fcfa)}
          </div>
        </div>

        <div className="h-7 w-px bg-[#F5E6D3]/15 hidden sm:block" />

        <div className="hidden sm:block">
          <div className="text-[10px] font-semibold uppercase tracking-wider text-[#E7D8C9]/70">
            Revenu / min
          </div>
          <div className="text-sm font-semibold text-[#6EE7B7] font-mono-num whitespace-nowrap">
            +{formatFcfa(state.revenuePerMin)}
          </div>
        </div>
      </div>

      {/* Center Cluster: Real-time Resource Stocks */}
      <div
        className="pointer-events-auto order-3 lg:order-2 w-full lg:w-auto flex items-center justify-center gap-3 md:gap-4 rounded-lg bg-[#241610]/95 border border-[#F5E6D3]/15 px-3 md:px-4 py-1.5 md:py-2 shadow-md text-[11px] md:text-xs text-[#FAF6EE] overflow-x-auto"
        data-testid="hud-stocks"
      >
        <div className="whitespace-nowrap">
          <span className="text-[#D6C5B3]">Manioc </span>
          <span className="font-mono-num font-bold text-[#86EFAC]" data-testid="stock-manioc">
            {formatNumber(state.resources.maniocBrut)} kg
          </span>
        </div>
        <span aria-hidden="true" className="text-[#F5E6D3]/25">
          ·
        </span>
        <div className="whitespace-nowrap">
          <span className="text-[#D6C5B3]">Pâte </span>
          <span className="font-mono-num font-bold text-[#FDE68A]">
            {formatNumber(pateTotal)} kg
          </span>
        </div>
        <span aria-hidden="true" className="text-[#F5E6D3]/25">
          ·
        </span>
        <div className="whitespace-nowrap">
          <span className="text-[#D6C5B3]">Sacs </span>
          <span className="font-mono-num font-bold text-[#FBBF24]" data-testid="stock-sacs">
            {formatNumber(state.resources.attiekeSacs)}
          </span>
        </div>
        <span aria-hidden="true" className="text-[#F5E6D3]/25">
          ·
        </span>
        <div className="whitespace-nowrap">
          <span className="text-[#D6C5B3]">Plats </span>
          <span className="font-mono-num font-bold text-[#FCA5A5]" data-testid="stock-plats">
            {formatNumber(totalPlats)}
          </span>
        </div>
        {(state.crops.plantain.unlocked ||
          state.crops.legumes.unlocked ||
          state.crops.palmier.unlocked ||
          state.kitchen3C.unlocked) && (
          <>
            <span aria-hidden="true" className="text-[#F5E6D3]/25 hidden md:inline">
              ·
            </span>
            <div className="text-[#D6C5B3] font-mono-num hidden md:block whitespace-nowrap">
              Pl:{Math.floor(state.resources.plantains)} · Lég:{Math.floor(state.resources.legumes)} · Huile:{Math.floor(state.resources.huilePalme)} · Poiss:{Math.floor(state.resources.poisson)}
            </div>
          </>
        )}
      </div>

      {/* Right Cluster: Prestige Seal & Utility Controls */}
      <div className="pointer-events-auto order-2 lg:order-3 flex items-center gap-1.5 md:gap-2">
        {saveFeedback && (
          <span className="text-xs font-semibold text-[#86EFAC] bg-[#241610]/95 px-2.5 py-1.5 rounded border border-[#2E6F40]">
            {saveFeedback}
          </span>
        )}

        <button
          type="button"
          onClick={(e) => {
            e.currentTarget.blur();
            onOpenPrestige();
          }}
          className="flex items-center gap-1.5 rounded-lg bg-[#241610]/95 hover:bg-[#362219] border border-[#F59E0B]/35 px-3 py-2 text-xs font-semibold text-[#FDE68A] cursor-pointer transition-colors"
          aria-label="Ouvrir le panneau Prestige"
          tabIndex={-1}
        >
          <Award className="w-4 h-4 text-[#FBBF24]" />
          <span className="font-mono-num">{state.prestigePoints} Sceaux</span>
        </button>

        <button
          type="button"
          onClick={(e) => {
            e.currentTarget.blur();
            onSave();
          }}
          className="flex items-center justify-center w-9 h-9 rounded-lg bg-[#241610]/95 hover:bg-[#362219] border border-[#F5E6D3]/20 text-[#FAF6EE] cursor-pointer transition-colors"
          aria-label="Sauvegarder la partie"
          title="Sauvegarder"
          tabIndex={-1}
        >
          <Save className="w-4 h-4" />
        </button>

        <button
          type="button"
          onClick={(e) => {
            e.currentTarget.blur();
            onToggleMute();
          }}
          className="flex items-center justify-center w-9 h-9 rounded-lg bg-[#241610]/95 hover:bg-[#362219] border border-[#F5E6D3]/20 text-[#FAF6EE] cursor-pointer transition-colors"
          aria-label={muted ? 'Activer le son (M)' : 'Couper le son (M)'}
          title="Son (M)"
          tabIndex={-1}
        >
          {muted ? <VolumeX className="w-4 h-4 text-[#FCA5A5]" /> : <Volume2 className="w-4 h-4" />}
        </button>

        <button
          type="button"
          onClick={(e) => {
            e.currentTarget.blur();
            onPause();
          }}
          className="flex items-center justify-center w-9 h-9 rounded-lg bg-[#241610]/95 hover:bg-[#362219] border border-[#F5E6D3]/20 text-[#FAF6EE] cursor-pointer transition-colors"
          aria-label="Mettre en pause (P)"
          title="Pause (P)"
          tabIndex={-1}
        >
          <Pause className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
