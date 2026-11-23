import {
  CropId,
  PrestigeUpgradeId,
  ResearchBranch,
  ResearchId,
  ResourceKey,
  SellableProductKey,
  Station3AId,
  VehicleType,
} from './types';

export interface CropDefinition {
  id: CropId;
  name: string;
  unlockCost: number;
  baseYieldKg: number;
  growSeconds: number;
  plotBaseCost: number;
  workerBaseCost: number;
  soilBaseCost: number;
  fertilizerBaseCost: number;
  mechBaseCost: number;
  resourceKey: ResourceKey;
  unitLabel: string;
  accentColor: string;
}

export const CROP_DEFS: Record<CropId, CropDefinition> = {
  manioc: {
    id: 'manioc',
    name: 'Manioc',
    unlockCost: 0,
    baseYieldKg: 14,
    growSeconds: 4.5,
    plotBaseCost: 3500,
    workerBaseCost: 4500,
    soilBaseCost: 6000,
    fertilizerBaseCost: 8500,
    mechBaseCost: 22000,
    resourceKey: 'maniocBrut',
    unitLabel: 'kg',
    accentColor: '#2E6F40',
  },
  plantain: {
    id: 'plantain',
    name: 'Bananes Plantains',
    unlockCost: 28000,
    baseYieldKg: 10,
    growSeconds: 6.0,
    plotBaseCost: 9000,
    workerBaseCost: 11000,
    soilBaseCost: 14000,
    fertilizerBaseCost: 18000,
    mechBaseCost: 40000,
    resourceKey: 'plantains',
    unitLabel: 'kg',
    accentColor: '#CA8A04',
  },
  legumes: {
    id: 'legumes',
    name: 'Piments, Oignons & Poivrons',
    unlockCost: 22000,
    baseYieldKg: 9,
    growSeconds: 5.0,
    plotBaseCost: 7500,
    workerBaseCost: 9500,
    soilBaseCost: 12000,
    fertilizerBaseCost: 15000,
    mechBaseCost: 35000,
    resourceKey: 'legumes',
    unitLabel: 'kg',
    accentColor: '#DC2626',
  },
  palmier: {
    id: 'palmier',
    name: 'Palmiers à Huile',
    unlockCost: 45000,
    baseYieldKg: 8,
    growSeconds: 7.5,
    plotBaseCost: 14000,
    workerBaseCost: 16000,
    soilBaseCost: 20000,
    fertilizerBaseCost: 25000,
    mechBaseCost: 55000,
    resourceKey: 'huilePalme',
    unitLabel: 'L',
    accentColor: '#EA580C',
  },
};

export interface Station3ADefinition {
  id: Station3AId;
  order: number;
  name: string;
  shortName: string;
  inputKey: ResourceKey;
  outputKey: ResourceKey;
  inputBatch: number;
  outputBatch: number;
  baseSeconds: number;
  upgradeBaseCost: number;
  workerBaseCost: number;
}

export const STATION_3A_ORDER: Station3AId[] = [
  'epluchage',
  'broyage',
  'fermentation',
  'pressage',
  'cuisson',
];

export const STATION_3A_DEFS: Record<Station3AId, Station3ADefinition> = {
  epluchage: {
    id: 'epluchage',
    order: 1,
    name: '1. Épluchage',
    shortName: 'Éplucher',
    inputKey: 'maniocBrut',
    outputKey: 'maniocEpluche',
    inputBatch: 10,
    outputBatch: 8,
    baseSeconds: 2.0,
    upgradeBaseCost: 3000,
    workerBaseCost: 5000,
  },
  broyage: {
    id: 'broyage',
    order: 2,
    name: '2. Broyage',
    shortName: 'Broyer',
    inputKey: 'maniocEpluche',
    outputKey: 'maniocBroye',
    inputBatch: 8,
    outputBatch: 8,
    baseSeconds: 2.2,
    upgradeBaseCost: 4200,
    workerBaseCost: 6500,
  },
  fermentation: {
    id: 'fermentation',
    order: 3,
    name: '3. Fermentation',
    shortName: 'Fermenter',
    inputKey: 'maniocBroye',
    outputKey: 'pateFermentee',
    inputBatch: 8,
    outputBatch: 7,
    baseSeconds: 2.8,
    upgradeBaseCost: 5500,
    workerBaseCost: 8000,
  },
  pressage: {
    id: 'pressage',
    order: 4,
    name: '4. Pressage',
    shortName: 'Presser',
    inputKey: 'pateFermentee',
    outputKey: 'semoulePressee',
    inputBatch: 7,
    outputBatch: 5,
    baseSeconds: 2.2,
    upgradeBaseCost: 6800,
    workerBaseCost: 9500,
  },
  cuisson: {
    id: 'cuisson',
    order: 5,
    name: '5. Cuisson Vapeur',
    shortName: 'Cuire',
    inputKey: 'semoulePressee',
    outputKey: 'attiekeSacs',
    inputBatch: 5,
    outputBatch: 1, // 1 sac d'attiéké (5 kg)
    baseSeconds: 2.5,
    upgradeBaseCost: 8500,
    workerBaseCost: 11500,
  },
};

export interface ProductPriceMeta {
  key: SellableProductKey;
  name: string;
  unit: string;
  basePriceFcfa: number;
  tierLabel: string;
}

export const PRODUCT_META: Record<SellableProductKey, ProductPriceMeta> = {
  maniocBrut: {
    key: 'maniocBrut',
    name: 'Manioc Brut',
    unit: 'kg',
    basePriceFcfa: 150,
    tierLabel: 'Matière première',
  },
  attiekeSacs: {
    key: 'attiekeSacs',
    name: "Sac d'Attiéké",
    unit: 'sac',
    basePriceFcfa: 2200,
    tierLabel: 'Produit transformé',
  },
  platsAttiekePoisson: {
    key: 'platsAttiekePoisson',
    name: 'Attiéké-Poisson Grillé',
    unit: 'plat',
    basePriceFcfa: 4800,
    tierLabel: 'Plat cuisiné',
  },
  platsAllocoRoyal: {
    key: 'platsAllocoRoyal',
    name: 'Alloco-Attiéké Royal',
    unit: 'plat',
    basePriceFcfa: 8200,
    tierLabel: 'Gastronomie Royale',
  },
};

export interface ResearchDefinition {
  id: ResearchId;
  branch: ResearchBranch;
  name: string;
  description: string;
  costFcfa: number;
  requires: ResearchId[];
}

export const RESEARCH_DEFS: ResearchDefinition[] = [
  // Branche Agricole
  {
    id: 'sol_fertile',
    branch: 'agricole',
    name: 'Terre Latérite Enrichie',
    description: '+35 % de rendement sur toutes les récoltes.',
    costFcfa: 9000,
    requires: [],
  },
  {
    id: 'outils_acier',
    branch: 'agricole',
    name: 'Machettes & Houes Acier',
    description: 'Récolte manuelle x2 et ouvriers +25 % plus rapides.',
    costFcfa: 18000,
    requires: ['sol_fertile'],
  },
  {
    id: 'cultures_associees',
    branch: 'agricole',
    name: 'Cultures Maraîchères',
    description: 'Débloque l’accès aux parcelles Plantains & Piments/Légumes.',
    costFcfa: 24000,
    requires: ['sol_fertile'],
  },
  {
    id: 'palmeraie_moderne',
    branch: 'agricole',
    name: 'Palmeraie Sélectionnée',
    description: 'Débloque les Palmiers à Huile pour la cuisine Alloco.',
    costFcfa: 42000,
    requires: ['cultures_associees'],
  },
  {
    id: 'irrigation_goutte',
    branch: 'agricole',
    name: 'Irrigation Goutte-à-Goutte',
    description: 'Vitesse de croissance de tous les champs +50 %.',
    costFcfa: 75000,
    requires: ['outils_acier', 'palmeraie_moderne'],
  },

  // Branche Transformation & Cuisine
  {
    id: 'presses_hydrauliques',
    branch: 'transformation',
    name: 'Presses Hydrauliques',
    description: 'Vitesse des postes 3A +45 % et capacité de lot augmentée.',
    costFcfa: 15000,
    requires: [],
  },
  {
    id: 'usine_automatisee',
    branch: 'transformation',
    name: 'Usine & Tapis Roulants (3B)',
    description: 'Débloque les tapis roulants et broyeuses industrielles.',
    costFcfa: 45000,
    requires: ['presses_hydrauliques'],
  },
  {
    id: 'cuisson_vapeur_ind',
    branch: 'transformation',
    name: 'Cuiseurs Vapeur Continus',
    description: 'Rendement usine 3B +40 % en sacs d’attiéké.',
    costFcfa: 90000,
    requires: ['usine_automatisee'],
  },
  {
    id: 'atelier_culinaire',
    branch: 'transformation',
    name: 'Atelier Culinaire (3C)',
    description: 'Prépare des plats Attiéké-Poisson Grillé à forte marge.',
    costFcfa: 55000,
    requires: ['presses_hydrauliques'],
  },
  {
    id: 'recettes_royales',
    branch: 'transformation',
    name: 'Friteuses & Sauce Piment Royale',
    description: 'Débloque les plats Alloco-Attiéké Royal (8 200 FCFA/plat).',
    costFcfa: 115000,
    requires: ['atelier_culinaire'],
  },

  // Branche Logistique & Ventes
  {
    id: 'stand_maquis',
    branch: 'logistique',
    name: 'Maquis Moderne & Vitrine',
    description: 'Prix de vente au détail +25 % et file d’attente élargie.',
    costFcfa: 12000,
    requires: [],
  },
  {
    id: 'flotte_camions',
    branch: 'logistique',
    name: 'Flotte Régionale B2B',
    description: 'Débloque les contrats par Camion (gros volumes FCFA).',
    costFcfa: 38000,
    requires: ['stand_maquis'],
  },
  {
    id: 'quai_maritime',
    branch: 'logistique',
    name: 'Quai Conteneurs Port d’Abidjan',
    description: 'Débloque les conteneurs maritimes internationaux.',
    costFcfa: 110000,
    requires: ['flotte_camions'],
  },
  {
    id: 'logistique_auto',
    branch: 'logistique',
    name: 'Dispatch Logistique Automatique',
    description: 'Charge automatiquement les contrats B2B dès que le stock suffit.',
    costFcfa: 165000,
    requires: ['quai_maritime'],
  },
];

export interface PrestigeUpgradeDefinition {
  id: PrestigeUpgradeId;
  name: string;
  description: string;
  baseSealCost: number;
  maxLevel: number;
}

export const PRESTIGE_UPGRADE_DEFS: PrestigeUpgradeDefinition[] = [
  {
    id: 'semences_elite',
    name: 'Semences Élite d’Abidjan',
    description: '+50 % de rendement agricole permanent par niveau.',
    baseSealCost: 1,
    maxLevel: 10,
  },
  {
    id: 'savoir_ancestral',
    name: 'Savoir-Faire Ébrié',
    description: '+35 % de vitesse de transformation & cuisine par niveau.',
    baseSealCost: 1,
    maxLevel: 10,
  },
  {
    id: 'label_export_or',
    name: 'Label Export International',
    description: '+30 % sur tous les prix de vente & débloque les Cargos Exclusifs.',
    baseSealCost: 2,
    maxLevel: 8,
  },
  {
    id: 'capital_depart',
    name: 'Fonds d’Amorçage',
    description: 'Démarre chaque nouvelle partie avec +15 000 FCFA par niveau.',
    baseSealCost: 1,
    maxLevel: 8,
  },
];

export const PRESTIGE_EARNED_THRESHOLD = 150000;

export const VEHICLE_LABELS: Record<VehicleType, string> = {
  camionnette: 'Camionnette',
  camion: 'Camion Gros Porteur',
  conteneur: 'Conteneur Maritime',
  cargo: 'Cargo Export Prestige',
};

export const CUSTOMER_NAMES = [
  'Aya',
  'Kouadio',
  'Aminata',
  'Yao',
  'Fatoumata',
  'Konan',
  'Mariam',
  'Sékou',
  'Affoué',
  'Bamba',
];

export const CUSTOMER_SHIRT_COLORS = [
  '#D97706',
  '#2563EB',
  '#059669',
  '#DC2626',
  '#7C3AED',
  '#0D9488',
];

export const B2B_CLIENTS = [
  { clientName: 'Marché d’Adjamé', destination: 'Abidjan' },
  { clientName: 'Supermarché Plateau', destination: 'Abidjan' },
  { clientName: 'Grossiste Bouaké', destination: 'Bouaké' },
  { clientName: 'Distrib. Dakar Port', destination: 'Sénégal' },
  { clientName: 'Épicerie Château Rouge', destination: 'Paris' },
  { clientName: 'AfroMarket Bruxelles', destination: 'Belgique' },
  { clientName: 'Diaspora Foods London', destination: 'Royaume-Uni' },
];

export function formatFcfa(value: number): string {
  const rounded = Math.round(value);
  return `${rounded.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ')} FCFA`;
}

export function formatNumber(value: number): string {
  const rounded = Math.round(value);
  return rounded.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
}

export function scaleCost(base: number, level: number, factor = 1.45): number {
  return Math.round(base * Math.pow(factor, level));
}
