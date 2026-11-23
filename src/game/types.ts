export type GameScreenState = 'title' | 'playing' | 'paused';

export type CropId = 'manioc' | 'plantain' | 'legumes' | 'palmier';

export type Station3AId =
  | 'epluchage'
  | 'broyage'
  | 'fermentation'
  | 'pressage'
  | 'cuisson';

export type ResourceKey =
  | 'maniocBrut'
  | 'plantains'
  | 'legumes'
  | 'huilePalme'
  | 'poisson'
  | 'maniocEpluche'
  | 'maniocBroye'
  | 'pateFermentee'
  | 'semoulePressee'
  | 'attiekeSacs'
  | 'platsAttiekePoisson'
  | 'platsAllocoRoyal';

export type SellableProductKey =
  | 'maniocBrut'
  | 'attiekeSacs'
  | 'platsAttiekePoisson'
  | 'platsAllocoRoyal';

export type ResearchBranch = 'agricole' | 'transformation' | 'logistique';

export type ResearchId =
  | 'sol_fertile'
  | 'outils_acier'
  | 'cultures_associees'
  | 'palmeraie_moderne'
  | 'irrigation_goutte'
  | 'presses_hydrauliques'
  | 'usine_automatisee'
  | 'cuisson_vapeur_ind'
  | 'atelier_culinaire'
  | 'recettes_royales'
  | 'stand_maquis'
  | 'flotte_camions'
  | 'quai_maritime'
  | 'logistique_auto';

export type PrestigeUpgradeId =
  | 'semences_elite'
  | 'savoir_ancestral'
  | 'label_export_or'
  | 'capital_depart';

export type VehicleType = 'camionnette' | 'camion' | 'conteneur' | 'cargo';

export interface CropState {
  id: CropId;
  unlocked: boolean;
  plots: number;
  growthProgress: number; // 0 to 1
  workers: number;
  soilLevel: number;
  fertilizerLevel: number;
  mechanizationLevel: number;
}

export interface Station3AState {
  id: Station3AId;
  level: number;
  workers: number;
  progress: number; // 0 to 1
  inFlightKg: number;
}

export interface Factory3BState {
  unlocked: boolean;
  tapisRoulantLevel: number;
  broyeuseIndLevel: number;
  cuiseurAutoLevel: number;
  broyeuseProgress: number;
  cuiseurProgress: number;
}

export interface Kitchen3CState {
  unlocked: boolean;
  grillPoissonLevel: number;
  friteuseAllocoLevel: number;
  autoPoisson: boolean;
  grillProgress: number;
  friteuseProgress: number;
}

export interface RetailCustomer {
  id: number;
  name: string;
  wantedProduct: SellableProductKey;
  patience: number; // 0 to 1
  maxPatience: number;
  shirtColor: string;
  slotIndex: number;
}

export interface RetailState {
  standLevel: number;
  servers: number;
  serveProgress: number;
  spawnTimer: number;
  queue: RetailCustomer[];
  allowRawManiocSale: boolean;
}

export interface ExportContract {
  id: number;
  vehicleType: VehicleType;
  clientName: string;
  destination: string;
  requiredProduct: SellableProductKey;
  requiredQty: number;
  deliveredQty: number;
  rewardFcfa: number;
  timeLeft: number;
  totalTime: number;
  exclusivePrestige: boolean;
}

export interface SalesLogEntry {
  id: number;
  channel: 'retail' | 'b2b';
  itemLabel: string;
  qty: number;
  amountFcfa: number;
  elapsedSeconds: number;
}

export interface VisualEvent {
  id: number;
  kind: 'harvest' | 'process' | 'sale' | 'export' | 'upgrade';
  zone: string;
  text: string;
  color: string;
}

export interface GameState {
  fcfa: number;
  totalEarnedThisRun: number;
  lifetimeTotalEarned: number;
  elapsedSeconds: number;
  prestigeCount: number;
  prestigePoints: number;
  prestigeUpgrades: Record<PrestigeUpgradeId, number>;

  resources: Record<ResourceKey, number>;
  crops: Record<CropId, CropState>;
  stations3A: Record<Station3AId, Station3AState>;
  factory3B: Factory3BState;
  kitchen3C: Kitchen3CState;
  retail: RetailState;

  research: Record<ResearchId, boolean>;
  contracts: ExportContract[];
  contractSpawnTimer: number;
  autoExportEnabled: boolean;

  salesLog: SalesLogEntry[];
  nextId: number;
  recentFcfaWindow: number[]; // track last ~10s income ticks
  revenuePerMin: number;
  pendingEvents: VisualEvent[];
}
