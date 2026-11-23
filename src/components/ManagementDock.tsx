import React, { useState } from 'react';
import {
  CROP_DEFS,
  formatFcfa,
  formatNumber,
  PRESTIGE_EARNED_THRESHOLD,
  PRESTIGE_UPGRADE_DEFS,
  PRODUCT_META,
  RESEARCH_DEFS,
  scaleCost,
  STATION_3A_DEFS,
  STATION_3A_ORDER,
  VEHICLE_LABELS,
} from '../game/constants';
import { getPendingPrestigeSeals, getSellPriceFcfa } from '../game/engine';
import {
  CropId,
  GameState,
  PrestigeUpgradeId,
  ResearchId,
  Station3AId,
} from '../game/types';

export type DockTab = 'production' | 'recherche' | 'export' | 'prestige';
type ProductionSubTab = 'agriculture' | 'atelier3a' | 'usine3b3c' | 'retail';

interface ManagementDockProps {
  state: GameState;
  activeTab: DockTab;
  onChangeTab: (tab: DockTab) => void;
  onHarvestCrop: (cropId: CropId) => void;
  onUnlockCrop: (cropId: CropId) => void;
  onUpgradeCrop: (
    cropId: CropId,
    field: 'plots' | 'workers' | 'soilLevel' | 'fertilizerLevel' | 'mechanizationLevel'
  ) => void;
  onWorkStation3A: (stationId: Station3AId) => void;
  onUpgradeStation3A: (stationId: Station3AId, kind: 'level' | 'workers') => void;
  onUpgradeFactory3B: (
    kind: 'tapisRoulantLevel' | 'broyeuseIndLevel' | 'cuiseurAutoLevel'
  ) => void;
  onUpgradeKitchen3C: (kind: 'grillPoissonLevel' | 'friteuseAllocoLevel') => void;
  onBuyFish: () => void;
  onToggleAutoFish: () => void;
  onServeRetail: () => void;
  onUpgradeRetail: (kind: 'standLevel' | 'servers') => void;
  onUnlockResearch: (techId: ResearchId) => void;
  onLoadContract: (contractId: number) => void;
  onToggleAutoExport: () => void;
  onPerformPrestige: () => void;
  onBuyPrestigeUpgrade: (id: PrestigeUpgradeId) => void;
}

export const ManagementDock: React.FC<ManagementDockProps> = ({
  state,
  activeTab,
  onChangeTab,
  onHarvestCrop,
  onUnlockCrop,
  onUpgradeCrop,
  onWorkStation3A,
  onUpgradeStation3A,
  onUpgradeFactory3B,
  onUpgradeKitchen3C,
  onBuyFish,
  onToggleAutoFish,
  onServeRetail,
  onUpgradeRetail,
  onUnlockResearch,
  onLoadContract,
  onToggleAutoExport,
  onPerformPrestige,
  onBuyPrestigeUpgrade,
}) => {
  const [subTab, setSubTab] = useState<ProductionSubTab>('agriculture');

  const pendingSeals = getPendingPrestigeSeals(state);
  const prestigeProgress = Math.min(
    100,
    Math.round((state.totalEarnedThisRun / PRESTIGE_EARNED_THRESHOLD) * 100)
  );

  return (
    <section
      aria-label="Panneau de gestion"
      className="fixed bottom-0 left-0 right-0 z-20 flex flex-col bg-[#241610] border-t border-[#F59E0B]/30 text-[#FAF6EE] shadow-2xl h-[218px] md:h-[214px]"
    >
      {/* Top Tab Bar */}
      <div className="flex items-center justify-between gap-2 px-3 md:px-5 py-1.5 border-b border-[#F5E6D3]/10 bg-[#1B100B]">
        <div className="flex items-center gap-1.5 overflow-x-auto">
          {(
            [
              { id: 'production', label: 'Champs & Usine' },
              { id: 'recherche', label: 'Arbre de Recherche' },
              { id: 'export', label: `Export & Ventes (${state.contracts.length})` },
              { id: 'prestige', label: `Prestige (${state.prestigePoints})` },
            ] as const
          ).map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => onChangeTab(t.id)}
              className={`px-3 py-1.5 rounded text-xs font-semibold whitespace-nowrap shrink-0 cursor-pointer transition-colors ${
                activeTab === t.id
                  ? 'bg-[#D97706] text-[#1C120C]'
                  : 'text-[#E7D8C9] hover:bg-[#342017]'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Sub-navigation when inside Production */}
        {activeTab === 'production' && (
          <div className="flex items-center gap-1 overflow-x-auto">
            {(
              [
                { id: 'agriculture', label: '1. Agriculture' },
                { id: 'atelier3a', label: '2A. Atelier' },
                { id: 'usine3b3c', label: '2B/2C. Usine & Cuisine' },
                { id: 'retail', label: '3. Stand Retail' },
              ] as const
            ).map((st) => (
              <button
                key={st.id}
                type="button"
                onClick={() => setSubTab(st.id)}
                className={`px-2.5 py-1 rounded text-[11px] font-semibold whitespace-nowrap shrink-0 cursor-pointer transition-colors ${
                  subTab === st.id
                    ? 'bg-[#2E6F40] text-white'
                    : 'bg-[#2D1B12] text-[#D6C5B3] hover:text-white'
                }`}
              >
                {st.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Scrollable Body */}
      <div className="flex-1 overflow-y-auto tycoon-scroll px-3 md:px-5 py-2.5">
        {activeTab === 'production' && subTab === 'agriculture' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
            {(['manioc', 'plantain', 'legumes', 'palmier'] as CropId[]).map((cropId) => {
              const crop = state.crops[cropId];
              const def = CROP_DEFS[cropId];
              const reqResearchMet =
                cropId === 'manioc' ||
                ((cropId === 'plantain' || cropId === 'legumes') &&
                  state.research.cultures_associees) ||
                (cropId === 'palmier' && state.research.palmeraie_moderne);

              if (!crop.unlocked) {
                return (
                  <div
                    key={cropId}
                    className="rounded-lg bg-[#2D1B12] border border-[#F5E6D3]/10 p-2.5 flex flex-col justify-between"
                  >
                    <div>
                      <div className="text-xs font-bold text-[#FDE68A]">{def.name}</div>
                      <div className="text-[11px] text-[#A8A29E] mt-0.5">
                        {reqResearchMet
                          ? 'Prêt à planter sur vos terres.'
                          : cropId === 'palmier'
                          ? 'Requiert : Palmeraie Sélectionnée'
                          : 'Requiert : Cultures Maraîchères'}
                      </div>
                    </div>
                    <button
                      type="button"
                      disabled={!reqResearchMet || state.fcfa < def.unlockCost}
                      onClick={() => onUnlockCrop(cropId)}
                      className="mt-2 py-1.5 px-3 rounded bg-[#2E6F40] hover:bg-[#37854D] disabled:opacity-40 disabled:cursor-not-allowed text-xs font-semibold text-white cursor-pointer font-mono-num"
                    >
                      Débloquer · {formatFcfa(def.unlockCost)}
                    </button>
                  </div>
                );
              }

              const plotCost = scaleCost(def.plotBaseCost, crop.plots - 1, 1.48);
              const workerCost = scaleCost(def.workerBaseCost, crop.workers, 1.48);
              const soilCost = scaleCost(def.soilBaseCost, crop.soilLevel, 1.48);
              const fertCost = scaleCost(def.fertilizerBaseCost, crop.fertilizerLevel, 1.48);
              const mechCost = scaleCost(def.mechBaseCost, crop.mechanizationLevel, 1.48);

              return (
                <div
                  key={cropId}
                  className="rounded-lg bg-[#2F1D14] border border-[#F5E6D3]/15 p-2.5 flex flex-col gap-1.5"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold text-[#FAF6EE] truncate">{def.name}</span>
                    <button
                      type="button"
                      onClick={() => onHarvestCrop(cropId)}
                      className="px-2.5 py-1 rounded bg-[#2E6F40] hover:bg-[#37854D] text-[11px] font-bold text-white cursor-pointer whitespace-nowrap"
                    >
                      Récolter
                    </button>
                  </div>
                  <div className="text-[11px] text-[#D6C5B3] font-mono-num">
                    {crop.plots} parc. · {crop.workers} ouvr. · Sol {crop.soilLevel} · Engrais {crop.fertilizerLevel}
                  </div>
                  <div className="grid grid-cols-2 gap-1.5 mt-0.5">
                    <button
                      type="button"
                      disabled={state.fcfa < plotCost}
                      onClick={() => onUpgradeCrop(cropId, 'plots')}
                      className="py-1 px-2 rounded bg-[#3E271C] hover:bg-[#4F3224] disabled:opacity-40 text-[11px] text-[#FDE68A] font-medium cursor-pointer truncate font-mono-num"
                    >
                      +Parc. ({formatNumber(plotCost)} F)
                    </button>
                    <button
                      type="button"
                      disabled={state.fcfa < workerCost}
                      onClick={() => onUpgradeCrop(cropId, 'workers')}
                      className="py-1 px-2 rounded bg-[#3E271C] hover:bg-[#4F3224] disabled:opacity-40 text-[11px] text-[#86EFAC] font-medium cursor-pointer truncate font-mono-num"
                    >
                      +Ouvr. ({formatNumber(workerCost)} F)
                    </button>
                    <button
                      type="button"
                      disabled={state.fcfa < soilCost}
                      onClick={() => onUpgradeCrop(cropId, 'soilLevel')}
                      className="py-1 px-2 rounded bg-[#3E271C] hover:bg-[#4F3224] disabled:opacity-40 text-[11px] text-[#E7D8C9] font-medium cursor-pointer truncate font-mono-num"
                    >
                      Sol+ ({formatNumber(soilCost)} F)
                    </button>
                    <button
                      type="button"
                      disabled={state.fcfa < fertCost}
                      onClick={() => onUpgradeCrop(cropId, 'fertilizerLevel')}
                      className="py-1 px-2 rounded bg-[#3E271C] hover:bg-[#4F3224] disabled:opacity-40 text-[11px] text-[#E7D8C9] font-medium cursor-pointer truncate font-mono-num"
                    >
                      Engrais ({formatNumber(fertCost)} F)
                    </button>
                    <button
                      type="button"
                      disabled={state.fcfa < mechCost}
                      onClick={() => onUpgradeCrop(cropId, 'mechanizationLevel')}
                      className="col-span-2 py-1 px-2 rounded bg-[#3E271C] hover:bg-[#4F3224] disabled:opacity-40 text-[11px] text-[#FBBF24] font-medium cursor-pointer truncate font-mono-num"
                    >
                      Mécanisation Niv.{crop.mechanizationLevel} ({formatNumber(mechCost)} F)
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {activeTab === 'production' && subTab === 'atelier3a' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5">
            {STATION_3A_ORDER.map((stId) => {
              const st = state.stations3A[stId];
              const def = STATION_3A_DEFS[stId];
              const lvlCost = scaleCost(def.upgradeBaseCost, st.level - 1, 1.5);
              const wrkCost = scaleCost(def.workerBaseCost, st.workers, 1.5);
              const inputStock = Math.floor(state.resources[def.inputKey]);

              return (
                <div
                  key={stId}
                  className="rounded-lg bg-[#2F1D14] border border-[#F5E6D3]/15 p-2.5 flex flex-col justify-between gap-1.5"
                >
                  <div>
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-xs font-bold text-[#FDE68A] truncate">{def.name}</span>
                      <span className="text-[11px] font-mono-num text-[#D6C5B3]">
                        Niv.{st.level}
                      </span>
                    </div>
                    <div className="text-[11px] text-[#D6C5B3] font-mono-num mt-0.5">
                      Entrée dispo: {inputStock} kg · Ouvriers: {st.workers}
                    </div>
                  </div>

                  <div className="flex flex-col gap-1">
                    <button
                      type="button"
                      onClick={() => onWorkStation3A(stId)}
                      className="w-full py-1.5 px-2 rounded bg-[#D97706] hover:bg-[#EA8A1A] text-[#1C120C] text-xs font-bold cursor-pointer"
                    >
                      {def.shortName} (+Lot)
                    </button>
                    <div className="grid grid-cols-2 gap-1">
                      <button
                        type="button"
                        disabled={state.fcfa < lvlCost}
                        onClick={() => onUpgradeStation3A(stId, 'level')}
                        className="py-1 px-1.5 rounded bg-[#3E271C] hover:bg-[#4F3224] disabled:opacity-40 text-[10px] text-[#FDE68A] cursor-pointer truncate font-mono-num"
                      >
                        Niv+ ({formatNumber(lvlCost)})
                      </button>
                      <button
                        type="button"
                        disabled={state.fcfa < wrkCost}
                        onClick={() => onUpgradeStation3A(stId, 'workers')}
                        className="py-1 px-1.5 rounded bg-[#3E271C] hover:bg-[#4F3224] disabled:opacity-40 text-[10px] text-[#86EFAC] cursor-pointer truncate font-mono-num"
                      >
                        Ouvr+ ({formatNumber(wrkCost)})
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {activeTab === 'production' && subTab === 'usine3b3c' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {/* Phase 3B Usine */}
            <div className="rounded-lg bg-[#2F1D14] border border-[#F59E0B]/25 p-3">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xs font-bold text-[#FBBF24]">
                  Phase 3B · Usine &amp; Automatisation
                </h3>
                {!state.factory3B.unlocked && (
                  <button
                    type="button"
                    onClick={() => onChangeTab('recherche')}
                    className="text-[11px] text-[#FDE68A] underline cursor-pointer"
                  >
                    Débloquer dans Recherche
                  </button>
                )}
              </div>
              {state.factory3B.unlocked ? (
                <div className="grid grid-cols-3 gap-2">
                  {(
                    [
                      {
                        field: 'tapisRoulantLevel',
                        label: 'Tapis Roulant',
                        base: 18000,
                      },
                      {
                        field: 'broyeuseIndLevel',
                        label: 'Broyeuse Ind.',
                        base: 24000,
                      },
                      {
                        field: 'cuiseurAutoLevel',
                        label: 'Cuiseur Auto',
                        base: 30000,
                      },
                    ] as const
                  ).map((item) => {
                    const lvl = state.factory3B[item.field];
                    const cost = scaleCost(item.base, lvl, 1.55);
                    return (
                      <button
                        key={item.field}
                        type="button"
                        disabled={state.fcfa < cost}
                        onClick={() => onUpgradeFactory3B(item.field)}
                        className="p-2 rounded bg-[#3E271C] hover:bg-[#4F3224] disabled:opacity-40 text-left cursor-pointer border border-[#F5E6D3]/10"
                      >
                        <div className="text-[11px] font-bold text-[#FAF6EE]">
                          {item.label} (Niv.{lvl})
                        </div>
                        <div className="text-[10px] text-[#FBBF24] font-mono-num mt-0.5">
                          {formatFcfa(cost)}
                        </div>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <p className="text-xs text-[#A8A29E]">
                  Recherchez « Usine &amp; Tapis Roulants (3B) » pour automatiser la production en sacs d’attiéké.
                </p>
              )}
            </div>

            {/* Phase 3C Cuisine */}
            <div className="rounded-lg bg-[#2F1D14] border border-[#EF4444]/25 p-3">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xs font-bold text-[#FCA5A5]">
                  Phase 3C · Atelier Culinaire &amp; Plats Finis
                </h3>
                {!state.kitchen3C.unlocked && (
                  <button
                    type="button"
                    onClick={() => onChangeTab('recherche')}
                    className="text-[11px] text-[#FCA5A5] underline cursor-pointer"
                  >
                    Débloquer dans Recherche
                  </button>
                )}
              </div>
              {state.kitchen3C.unlocked ? (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <button
                    type="button"
                    disabled={
                      state.fcfa <
                      scaleCost(22000, state.kitchen3C.grillPoissonLevel, 1.55)
                    }
                    onClick={() => onUpgradeKitchen3C('grillPoissonLevel')}
                    className="p-2 rounded bg-[#3E271C] hover:bg-[#4F3224] disabled:opacity-40 text-left cursor-pointer border border-[#F5E6D3]/10"
                  >
                    <div className="text-[11px] font-bold text-[#FAF6EE]">
                      Grill Poisson (Niv.{state.kitchen3C.grillPoissonLevel})
                    </div>
                    <div className="text-[10px] text-[#FBBF24] font-mono-num">
                      {formatFcfa(scaleCost(22000, state.kitchen3C.grillPoissonLevel, 1.55))}
                    </div>
                  </button>

                  <button
                    type="button"
                    disabled={
                      !state.research.recettes_royales ||
                      state.fcfa <
                        scaleCost(38000, state.kitchen3C.friteuseAllocoLevel, 1.55)
                    }
                    onClick={() => onUpgradeKitchen3C('friteuseAllocoLevel')}
                    className="p-2 rounded bg-[#3E271C] hover:bg-[#4F3224] disabled:opacity-40 text-left cursor-pointer border border-[#F5E6D3]/10"
                  >
                    <div className="text-[11px] font-bold text-[#FAF6EE]">
                      Friteuse Alloco (Niv.{state.kitchen3C.friteuseAllocoLevel})
                    </div>
                    <div className="text-[10px] text-[#FBBF24] font-mono-num">
                      {state.research.recettes_royales
                        ? formatFcfa(
                            scaleCost(38000, state.kitchen3C.friteuseAllocoLevel, 1.55)
                          )
                        : 'Recherche requise'}
                    </div>
                  </button>

                  <button
                    type="button"
                    disabled={state.fcfa < 4500}
                    onClick={onBuyFish}
                    className="p-2 rounded bg-[#1E3A5F] hover:bg-[#264B7A] disabled:opacity-40 text-left cursor-pointer"
                  >
                    <div className="text-[11px] font-bold text-[#BAE6FD]">
                      +10 kg Poisson
                    </div>
                    <div className="text-[10px] text-[#E0F2FE] font-mono-num">4 500 FCFA</div>
                  </button>

                  <button
                    type="button"
                    disabled={state.kitchen3C.autoPoisson || state.fcfa < 14000}
                    onClick={onToggleAutoFish}
                    className="p-2 rounded bg-[#1E3A5F] hover:bg-[#264B7A] disabled:opacity-40 text-left cursor-pointer"
                  >
                    <div className="text-[11px] font-bold text-[#BAE6FD]">
                      {state.kitchen3C.autoPoisson ? 'Pêcheur Auto Actif' : 'Pêcheur Auto'}
                    </div>
                    <div className="text-[10px] text-[#E0F2FE] font-mono-num">
                      {state.kitchen3C.autoPoisson ? 'Actif' : '14 000 FCFA'}
                    </div>
                  </button>
                </div>
              ) : (
                <p className="text-xs text-[#A8A29E]">
                  Recherchez « Atelier Culinaire (3C) » pour préparer l’Attiéké-Poisson et l’Alloco Royal.
                </p>
              )}
            </div>
          </div>
        )}

        {activeTab === 'production' && subTab === 'retail' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="rounded-lg bg-[#2F1D14] border border-[#10B981]/30 p-3 flex flex-col justify-between">
              <div>
                <div className="text-xs font-bold text-[#6EE7B7]">
                  Stand / Maquis Retail (Niv.{state.retail.standLevel})
                </div>
                <div className="text-[11px] text-[#D6C5B3] mt-1 font-mono-num">
                  File d’attente : {state.retail.queue.length} clients · Serveurs : {state.retail.servers}
                </div>
              </div>
              <button
                type="button"
                onClick={onServeRetail}
                className="mt-2 py-2 px-3 rounded bg-[#15803D] hover:bg-[#16A34A] text-white text-xs font-bold cursor-pointer"
              >
                Servir le prochain client
              </button>
            </div>

            <div className="rounded-lg bg-[#2F1D14] border border-[#F5E6D3]/15 p-3 flex flex-col justify-between">
              <div className="text-xs font-semibold text-[#FAF6EE]">
                Améliorations du Maquis
              </div>
              <div className="grid grid-cols-2 gap-2 mt-2">
                <button
                  type="button"
                  disabled={state.fcfa < scaleCost(6500, state.retail.standLevel - 1, 1.52)}
                  onClick={() => onUpgradeRetail('standLevel')}
                  className="py-2 px-2 rounded bg-[#3E271C] hover:bg-[#4F3224] disabled:opacity-40 text-[11px] font-semibold text-[#FDE68A] cursor-pointer font-mono-num"
                >
                  +Stand ({formatNumber(scaleCost(6500, state.retail.standLevel - 1, 1.52))} F)
                </button>
                <button
                  type="button"
                  disabled={state.fcfa < scaleCost(7500, state.retail.servers, 1.52)}
                  onClick={() => onUpgradeRetail('servers')}
                  className="py-2 px-2 rounded bg-[#3E271C] hover:bg-[#4F3224] disabled:opacity-40 text-[11px] font-semibold text-[#86EFAC] cursor-pointer font-mono-num"
                >
                  +Serveur ({formatNumber(scaleCost(7500, state.retail.servers, 1.52))} F)
                </button>
              </div>
            </div>

            <div className="rounded-lg bg-[#2F1D14] border border-[#F5E6D3]/15 p-3 text-[11px]">
              <div className="font-bold text-[#FDE68A] mb-1">Grille Tarifaire Actuelle</div>
              <div className="space-y-0.5 text-[#E7D8C9] font-mono-num">
                <div>Manioc brut : {formatFcfa(getSellPriceFcfa(state, 'maniocBrut'))}/kg</div>
                <div>Sac d’Attiéké : {formatFcfa(getSellPriceFcfa(state, 'attiekeSacs'))}/sac</div>
                <div>Attiéké-Poisson : {formatFcfa(getSellPriceFcfa(state, 'platsAttiekePoisson'))}/plat</div>
                <div>Alloco Royal : {formatFcfa(getSellPriceFcfa(state, 'platsAllocoRoyal'))}/plat</div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'recherche' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {(
              [
                { branch: 'agricole', title: 'Branche Agricole' },
                { branch: 'transformation', title: 'Transformation & Cuisine' },
                { branch: 'logistique', title: 'Logistique & Export' },
              ] as const
            ).map((col) => (
              <div key={col.branch} className="space-y-1.5">
                <div className="text-xs font-bold text-[#FDE68A] mb-1">{col.title}</div>
                {RESEARCH_DEFS.filter((r) => r.branch === col.branch).map((tech) => {
                  const unlocked = state.research[tech.id];
                  const reqMet = tech.requires.every((req) => state.research[req]);
                  const canAfford = state.fcfa >= tech.costFcfa;

                  return (
                    <div
                      key={tech.id}
                      className={`rounded-md p-2 border flex items-center justify-between gap-2 ${
                        unlocked
                          ? 'bg-[#1D3B26] border-[#2E6F40]'
                          : 'bg-[#2F1D14] border-[#F5E6D3]/12'
                      }`}
                    >
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-[#FAF6EE] truncate">{tech.name}</div>
                        <div className="text-[11px] text-[#D6C5B3] leading-snug">
                          {tech.description}
                        </div>
                      </div>
                      {unlocked ? (
                        <span className="text-[11px] font-bold text-[#86EFAC] shrink-0">
                          Acquis
                        </span>
                      ) : (
                        <button
                          type="button"
                          disabled={!reqMet || !canAfford}
                          onClick={() => onUnlockResearch(tech.id)}
                          className="px-2.5 py-1.5 rounded bg-[#D97706] hover:bg-[#EA8A1A] disabled:opacity-40 text-[#1C120C] text-[11px] font-bold shrink-0 cursor-pointer font-mono-num"
                        >
                          {formatNumber(tech.costFcfa)} F
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        )}

        {activeTab === 'export' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            {/* B2B Contracts */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-[#BAE6FD]">
                  Contrats B2B &amp; Expéditions Internationales
                </h3>
                {state.research.logistique_auto && (
                  <button
                    type="button"
                    onClick={onToggleAutoExport}
                    className={`px-2.5 py-1 rounded text-[11px] font-semibold cursor-pointer ${
                      state.autoExportEnabled
                        ? 'bg-[#0284C7] text-white'
                        : 'bg-[#2F1D14] text-[#D6C5B3]'
                    }`}
                  >
                    Auto-Dispatch : {state.autoExportEnabled ? 'ON' : 'OFF'}
                  </button>
                )}
              </div>

              {state.contracts.length === 0 ? (
                <p className="text-xs text-[#A8A29E]">
                  Préparation des nouveaux ordres d’expédition...
                </p>
              ) : (
                <div className="space-y-1.5">
                  {state.contracts.map((c) => {
                    const prod = PRODUCT_META[c.requiredProduct];
                    const canLoad = Math.floor(state.resources[c.requiredProduct]) > 0;
                    return (
                      <div
                        key={c.id}
                        className="rounded-lg bg-[#233240] border border-[#38BDF8]/30 p-2.5 flex items-center justify-between gap-3"
                      >
                        <div className="min-w-0">
                          <div className="text-xs font-bold text-[#FAF6EE] truncate">
                            {VEHICLE_LABELS[c.vehicleType]} · {c.clientName} ({c.destination})
                          </div>
                          <div className="text-[11px] text-[#BAE6FD] font-mono-num">
                            {c.deliveredQty}/{c.requiredQty} {prod.name} · Prime{' '}
                            {formatFcfa(c.rewardFcfa)} · {Math.ceil(c.timeLeft)}s
                          </div>
                        </div>
                        <button
                          type="button"
                          disabled={!canLoad}
                          onClick={() => onLoadContract(c.id)}
                          className="px-3 py-1.5 rounded bg-[#0284C7] hover:bg-[#0EA5E9] disabled:opacity-40 text-white text-xs font-bold shrink-0 cursor-pointer"
                        >
                          Charger
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Real-Time Sales Log */}
            <div className="rounded-lg bg-[#1D120D] border border-[#F5E6D3]/12 p-2.5 flex flex-col">
              <h3 className="text-xs font-bold text-[#FDE68A] mb-1.5">
                Journal des Ventes en Temps Réel
              </h3>
              <div className="flex-1 space-y-1 max-h-[115px] overflow-y-auto tycoon-scroll" data-testid="sales-log">
                {state.salesLog.length === 0 ? (
                  <p className="text-[11px] text-[#A8A29E]">
                    Servez des clients au maquis ou chargez un contrat B2B pour démarrer le journal.
                  </p>
                ) : (
                  state.salesLog.map((entry) => (
                    <div
                      key={entry.id}
                      className="flex items-center justify-between text-[11px] py-0.5 border-b border-[#F5E6D3]/5"
                    >
                      <span className="text-[#E7D8C9] truncate">
                        {entry.channel === 'b2b' ? '[B2B]' : '[Retail]'} {entry.qty}x {entry.itemLabel}
                      </span>
                      <span className="font-mono-num font-bold text-[#86EFAC] shrink-0 ml-2">
                        +{formatFcfa(entry.amountFcfa)}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'prestige' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
            <div className="rounded-lg bg-[#2F1D14] border border-[#F59E0B]/35 p-3 flex flex-col justify-between">
              <div>
                <div className="text-xs font-bold text-[#FBBF24]">
                  Prestige &amp; Sceaux d’Export ({state.prestigeCount} rebirths)
                </div>
                <p className="text-[11px] text-[#D6C5B3] mt-1">
                  Réinitialisez la production locale dès {formatFcfa(PRESTIGE_EARNED_THRESHOLD)} gagnés pour obtenir des Sceaux d’Or permanents.
                </p>
                <div className="mt-2">
                  <div className="flex justify-between text-[11px] font-mono-num text-[#FDE68A]">
                    <span>Progression : {formatFcfa(state.totalEarnedThisRun)}</span>
                    <span>{prestigeProgress}%</span>
                  </div>
                  <div className="h-2 rounded bg-black/40 mt-1 overflow-hidden">
                    <div
                      className="h-full bg-[#F59E0B]"
                      style={{ width: `${prestigeProgress}%` }}
                    />
                  </div>
                </div>
              </div>
              <button
                type="button"
                disabled={pendingSeals <= 0}
                onClick={onPerformPrestige}
                className="mt-2 py-2 px-3 rounded bg-[#D97706] hover:bg-[#EA8A1A] disabled:opacity-40 text-[#1C120C] text-xs font-bold cursor-pointer"
              >
                {pendingSeals > 0
                  ? `Rebirth (+${pendingSeals} Sceau${pendingSeals > 1 ? 'x' : ''})`
                  : 'Seuil non atteint'}
              </button>
            </div>

            <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-2">
              {PRESTIGE_UPGRADE_DEFS.map((up) => {
                const lvl = state.prestigeUpgrades[up.id];
                const cost = up.baseSealCost + lvl;
                const maxed = lvl >= up.maxLevel;
                return (
                  <div
                    key={up.id}
                    className="rounded-lg bg-[#2F1D14] border border-[#F5E6D3]/15 p-2.5 flex items-center justify-between gap-2"
                  >
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-[#FAF6EE]">
                        {up.name} (Niv.{lvl}/{up.maxLevel})
                      </div>
                      <div className="text-[11px] text-[#D6C5B3]">{up.description}</div>
                    </div>
                    <button
                      type="button"
                      disabled={maxed || state.prestigePoints < cost}
                      onClick={() => onBuyPrestigeUpgrade(up.id)}
                      className="px-2.5 py-1.5 rounded bg-[#F59E0B] hover:bg-[#FBBF24] disabled:opacity-40 text-[#1C120C] text-[11px] font-bold shrink-0 cursor-pointer font-mono-num"
                    >
                      {maxed ? 'MAX' : `${cost} Sceau`}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </section>
  );
};
