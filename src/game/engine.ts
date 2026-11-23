import {
  B2B_CLIENTS,
  CROP_DEFS,
  CUSTOMER_NAMES,
  CUSTOMER_SHIRT_COLORS,
  PRESTIGE_EARNED_THRESHOLD,
  PRESTIGE_UPGRADE_DEFS,
  PRODUCT_META,
  RESEARCH_DEFS,
  scaleCost,
  STATION_3A_DEFS,
  STATION_3A_ORDER,
} from './constants';
import {
  CropId,
  ExportContract,
  GameState,
  PrestigeUpgradeId,
  ResearchId,
  SellableProductKey,
  Station3AId,
  VehicleType,
} from './types';

export const SAVE_STORAGE_KEY = 'attieke_tycoon_save_v1';

export function createInitialState(
  preservedPrestige?: {
    prestigeCount: number;
    prestigePoints: number;
    prestigeUpgrades: Record<PrestigeUpgradeId, number>;
    lifetimeTotalEarned: number;
  }
): GameState {
  const prestigeUpgrades: Record<PrestigeUpgradeId, number> = preservedPrestige
    ? { ...preservedPrestige.prestigeUpgrades }
    : {
        semences_elite: 0,
        savoir_ancestral: 0,
        label_export_or: 0,
        capital_depart: 0,
      };

  const startFcfa = 5500 + prestigeUpgrades.capital_depart * 15000;

  const state: GameState = {
    fcfa: startFcfa,
    totalEarnedThisRun: 0,
    lifetimeTotalEarned: preservedPrestige?.lifetimeTotalEarned ?? 0,
    elapsedSeconds: 0,
    prestigeCount: preservedPrestige?.prestigeCount ?? 0,
    prestigePoints: preservedPrestige?.prestigePoints ?? 0,
    prestigeUpgrades,

    resources: {
      maniocBrut: 24,
      plantains: 0,
      legumes: 0,
      huilePalme: 0,
      poisson: 0,
      maniocEpluche: 0,
      maniocBroye: 0,
      pateFermentee: 0,
      semoulePressee: 0,
      attiekeSacs: 1,
      platsAttiekePoisson: 0,
      platsAllocoRoyal: 0,
    },

    crops: {
      manioc: {
        id: 'manioc',
        unlocked: true,
        plots: 1,
        growthProgress: 0.4,
        workers: 0,
        soilLevel: 0,
        fertilizerLevel: 0,
        mechanizationLevel: 0,
      },
      plantain: {
        id: 'plantain',
        unlocked: false,
        plots: 0,
        growthProgress: 0,
        workers: 0,
        soilLevel: 0,
        fertilizerLevel: 0,
        mechanizationLevel: 0,
      },
      legumes: {
        id: 'legumes',
        unlocked: false,
        plots: 0,
        growthProgress: 0,
        workers: 0,
        soilLevel: 0,
        fertilizerLevel: 0,
        mechanizationLevel: 0,
      },
      palmier: {
        id: 'palmier',
        unlocked: false,
        plots: 0,
        growthProgress: 0,
        workers: 0,
        soilLevel: 0,
        fertilizerLevel: 0,
        mechanizationLevel: 0,
      },
    },

    stations3A: {
      epluchage: { id: 'epluchage', level: 1, workers: 0, progress: 0, inFlightKg: 0 },
      broyage: { id: 'broyage', level: 1, workers: 0, progress: 0, inFlightKg: 0 },
      fermentation: { id: 'fermentation', level: 1, workers: 0, progress: 0, inFlightKg: 0 },
      pressage: { id: 'pressage', level: 1, workers: 0, progress: 0, inFlightKg: 0 },
      cuisson: { id: 'cuisson', level: 1, workers: 0, progress: 0, inFlightKg: 0 },
    },

    factory3B: {
      unlocked: false,
      tapisRoulantLevel: 0,
      broyeuseIndLevel: 0,
      cuiseurAutoLevel: 0,
      broyeuseProgress: 0,
      cuiseurProgress: 0,
    },

    kitchen3C: {
      unlocked: false,
      grillPoissonLevel: 0,
      friteuseAllocoLevel: 0,
      autoPoisson: false,
      grillProgress: 0,
      friteuseProgress: 0,
    },

    retail: {
      standLevel: 1,
      servers: 0,
      serveProgress: 0,
      spawnTimer: 1.5,
      queue: [
        {
          id: 1,
          name: 'Aya',
          wantedProduct: 'attiekeSacs',
          patience: 1,
          maxPatience: 45,
          shirtColor: CUSTOMER_SHIRT_COLORS[0],
          slotIndex: 0,
        },
      ],
      allowRawManiocSale: true,
    },

    research: {
      sol_fertile: false,
      outils_acier: false,
      cultures_associees: false,
      palmeraie_moderne: false,
      irrigation_goutte: false,
      presses_hydrauliques: false,
      usine_automatisee: false,
      cuisson_vapeur_ind: false,
      atelier_culinaire: false,
      recettes_royales: false,
      stand_maquis: false,
      flotte_camions: false,
      quai_maritime: false,
      logistique_auto: false,
    },

    contracts: [],
    contractSpawnTimer: 2,
    autoExportEnabled: false,
    salesLog: [],
    nextId: 10,
    recentFcfaWindow: [],
    revenuePerMin: 0,
    pendingEvents: [],
  };

  // Seed one initial Camionnette B2B contract immediately
  state.contracts.push(generateContract(state, 'camionnette'));
  return state;
}

export function getAgricultureYieldMultiplier(state: GameState, cropId: CropId): number {
  const crop = state.crops[cropId];
  let mult = 1;
  mult *= 1 + crop.soilLevel * 0.25;
  mult *= 1 + crop.fertilizerLevel * 0.35;
  mult *= 1 + crop.mechanizationLevel * 0.4;
  if (state.research.sol_fertile) mult *= 1.35;
  mult *= 1 + state.prestigeUpgrades.semences_elite * 0.5;
  return mult;
}

export function getAgricultureSpeedMultiplier(state: GameState, cropId: CropId): number {
  const crop = state.crops[cropId];
  let mult = 1;
  mult *= 1 + crop.mechanizationLevel * 0.35;
  if (state.research.outils_acier) mult *= 1.25;
  if (state.research.irrigation_goutte) mult *= 1.5;
  return mult;
}

export function getProcessingSpeedMultiplier(state: GameState): number {
  let mult = 1;
  if (state.research.presses_hydrauliques) mult *= 1.45;
  if (state.factory3B.unlocked && state.factory3B.tapisRoulantLevel > 0) {
    mult *= 1 + state.factory3B.tapisRoulantLevel * 0.3;
  }
  mult *= 1 + state.prestigeUpgrades.savoir_ancestral * 0.35;
  return mult;
}

export function getSellPriceFcfa(state: GameState, product: SellableProductKey): number {
  const base = PRODUCT_META[product].basePriceFcfa;
  let mult = 1;
  mult *= 1 + (state.retail.standLevel - 1) * 0.15;
  if (state.research.stand_maquis) mult *= 1.25;
  mult *= 1 + state.prestigeUpgrades.label_export_or * 0.3;
  return Math.round(base * mult);
}

export function getPendingPrestigeSeals(state: GameState): number {
  if (state.totalEarnedThisRun < PRESTIGE_EARNED_THRESHOLD) return 0;
  return Math.max(1, Math.floor(Math.sqrt(state.totalEarnedThisRun / PRESTIGE_EARNED_THRESHOLD)));
}

function pushEvent(
  state: GameState,
  kind: 'harvest' | 'process' | 'sale' | 'export' | 'upgrade',
  zone: string,
  text: string,
  color: string
) {
  state.pendingEvents.push({
    id: state.nextId++,
    kind,
    zone,
    text,
    color,
  });
  if (state.pendingEvents.length > 30) {
    state.pendingEvents.shift();
  }
}

function addIncome(
  state: GameState,
  amount: number,
  channel: 'retail' | 'b2b',
  itemLabel: string,
  qty: number
) {
  const rounded = Math.round(amount);
  state.fcfa += rounded;
  state.totalEarnedThisRun += rounded;
  state.lifetimeTotalEarned += rounded;
  state.salesLog.unshift({
    id: state.nextId++,
    channel,
    itemLabel,
    qty,
    amountFcfa: rounded,
    elapsedSeconds: state.elapsedSeconds,
  });
  if (state.salesLog.length > 30) {
    state.salesLog.length = 30;
  }
}

export function harvestCrop(state: GameState, cropId: CropId, isManualClick = true): number {
  const crop = state.crops[cropId];
  if (!crop.unlocked || crop.plots <= 0) return 0;

  const def = CROP_DEFS[cropId];
  const yieldMult = getAgricultureYieldMultiplier(state, cropId);
  const manualFactor = isManualClick ? (state.research.outils_acier ? 0.9 : 0.55) : 1;
  const harvested = Math.max(
    1,
    Math.round(def.baseYieldKg * crop.plots * yieldMult * manualFactor)
  );

  state.resources[def.resourceKey] += harvested;
  if (!isManualClick) {
    crop.growthProgress = 0;
  } else {
    // Clicking also nudges growth forward nicely
    crop.growthProgress = Math.min(1, crop.growthProgress + 0.15);
  }

  pushEvent(
    state,
    'harvest',
    `crop_${cropId}`,
    `+${harvested} ${def.unitLabel} ${def.name}`,
    '#86EFAC'
  );
  return harvested;
}

export function workStation3A(state: GameState, stationId: Station3AId, progressBoost = 0.55): boolean {
  const station = state.stations3A[stationId];
  const def = STATION_3A_DEFS[stationId];
  const batchMult = station.level;
  const neededInput = def.inputBatch * batchMult;

  if (station.inFlightKg === 0) {
    if (state.resources[def.inputKey] < def.inputBatch) {
      return false;
    }
    const taken = Math.min(neededInput, Math.floor(state.resources[def.inputKey]));
    state.resources[def.inputKey] -= taken;
    station.inFlightKg = taken;
  }

  station.progress += progressBoost;
  if (station.progress >= 1) {
    completeStation3A(state, stationId);
  }
  return true;
}

function completeStation3A(state: GameState, stationId: Station3AId) {
  const station = state.stations3A[stationId];
  const def = STATION_3A_DEFS[stationId];
  const ratio = def.outputBatch / def.inputBatch;
  const outputQty = Math.max(1, Math.round(station.inFlightKg * ratio * 10) / 10);
  const cleanOutput = stationId === 'cuisson' ? Math.max(1, Math.floor(outputQty)) : Math.round(outputQty);
  state.resources[def.outputKey] += cleanOutput;
  station.inFlightKg = 0;
  station.progress = 0;

  const label = stationId === 'cuisson' ? `+${cleanOutput} sac Attiéké` : `+${cleanOutput} kg`;
  pushEvent(state, 'process', `station_${stationId}`, label, '#D97706');
}

function pickCustomerWantedProduct(state: GameState): SellableProductKey {
  if (state.resources.platsAllocoRoyal >= 1) return 'platsAllocoRoyal';
  if (state.resources.platsAttiekePoisson >= 1) return 'platsAttiekePoisson';
  if (state.resources.attiekeSacs >= 1) return 'attiekeSacs';
  if (state.kitchen3C.unlocked && state.kitchen3C.friteuseAllocoLevel > 0) return 'platsAllocoRoyal';
  if (state.kitchen3C.unlocked && state.kitchen3C.grillPoissonLevel > 0) return 'platsAttiekePoisson';
  if (state.retail.allowRawManiocSale && state.resources.maniocBrut >= 3 && state.resources.attiekeSacs < 1) {
    return 'maniocBrut';
  }
  return 'attiekeSacs';
}

export function serveRetailCustomer(state: GameState, customerId?: number): boolean {
  if (state.retail.queue.length === 0) return false;

  const idx =
    customerId !== undefined
      ? state.retail.queue.findIndex((c) => c.id === customerId)
      : 0;
  const targetIdx = idx >= 0 ? idx : 0;
  const customer = state.retail.queue[targetIdx];

  // Try wanted product first, then fallback to best available in stock
  let soldProduct: SellableProductKey | null = null;
  let qty = 1;

  if (customer.wantedProduct === 'maniocBrut') {
    if (state.resources.maniocBrut >= 3) {
      soldProduct = 'maniocBrut';
      qty = 3;
    }
  } else if (state.resources[customer.wantedProduct] >= 1) {
    soldProduct = customer.wantedProduct;
    qty = 1;
  }

  if (!soldProduct) {
    // Fallback priority: highest value available
    const order: SellableProductKey[] = [
      'platsAllocoRoyal',
      'platsAttiekePoisson',
      'attiekeSacs',
    ];
    for (const candidate of order) {
      if (state.resources[candidate] >= 1) {
        soldProduct = candidate;
        qty = 1;
        break;
      }
    }
    if (!soldProduct && state.retail.allowRawManiocSale && state.resources.maniocBrut >= 3) {
      soldProduct = 'maniocBrut';
      qty = 3;
    }
  }

  if (!soldProduct) return false;

  state.resources[soldProduct] -= qty;
  const unitPrice = getSellPriceFcfa(state, soldProduct);
  const totalFcfa = unitPrice * qty;
  addIncome(state, totalFcfa, 'retail', PRODUCT_META[soldProduct].name, qty);

  state.retail.queue.splice(targetIdx, 1);
  state.retail.queue.forEach((c, i) => {
    c.slotIndex = i;
  });

  pushEvent(
    state,
    'sale',
    'retail',
    `+${totalFcfa.toLocaleString('fr-FR')} F`,
    '#16A34A'
  );
  return true;
}

export function generateContract(state: GameState, forcedVehicle?: VehicleType): ExportContract {
  const unlockedTypes: VehicleType[] = ['camionnette'];
  if (state.research.flotte_camions) unlockedTypes.push('camion');
  if (state.research.quai_maritime) unlockedTypes.push('conteneur');
  if (state.prestigeUpgrades.label_export_or > 0) unlockedTypes.push('cargo');

  const vehicleType =
    forcedVehicle ?? unlockedTypes[Math.floor(Math.random() * unlockedTypes.length)];

  // Pick product based on unlocked progression
  const eligibleProducts: SellableProductKey[] = ['attiekeSacs'];
  if (state.kitchen3C.unlocked && state.kitchen3C.grillPoissonLevel > 0) {
    eligibleProducts.push('platsAttiekePoisson');
  }
  if (state.research.recettes_royales && state.kitchen3C.friteuseAllocoLevel > 0) {
    eligibleProducts.push('platsAllocoRoyal');
  }

  const product = eligibleProducts[Math.floor(Math.random() * eligibleProducts.length)];

  let qty = 4;
  let timeLimit = 90;
  let bonusMult = 1.35;

  if (vehicleType === 'camion') {
    qty = 10;
    timeLimit = 120;
    bonusMult = 1.5;
  } else if (vehicleType === 'conteneur') {
    qty = 24;
    timeLimit = 150;
    bonusMult = 1.75;
  } else if (vehicleType === 'cargo') {
    qty = 36;
    timeLimit = 180;
    bonusMult = 2.15;
  }

  const client =
    vehicleType === 'conteneur' || vehicleType === 'cargo'
      ? B2B_CLIENTS[3 + Math.floor(Math.random() * (B2B_CLIENTS.length - 3))]
      : B2B_CLIENTS[Math.floor(Math.random() * 4)];

  const unitPrice = getSellPriceFcfa(state, product);
  const rewardFcfa = Math.round(unitPrice * qty * bonusMult);

  return {
    id: state.nextId++,
    vehicleType,
    clientName: client.clientName,
    destination: client.destination,
    requiredProduct: product,
    requiredQty: qty,
    deliveredQty: 0,
    rewardFcfa,
    timeLeft: timeLimit,
    totalTime: timeLimit,
    exclusivePrestige: vehicleType === 'cargo',
  };
}

export function loadContract(state: GameState, contractId: number): boolean {
  const idx = state.contracts.findIndex((c) => c.id === contractId);
  if (idx === -1) return false;
  const contract = state.contracts[idx];
  const needed = contract.requiredQty - contract.deliveredQty;
  const available = Math.floor(state.resources[contract.requiredProduct]);
  if (available <= 0) return false;

  const toLoad = Math.min(needed, available);
  state.resources[contract.requiredProduct] -= toLoad;
  contract.deliveredQty += toLoad;

  if (contract.deliveredQty >= contract.requiredQty) {
    addIncome(
      state,
      contract.rewardFcfa,
      'b2b',
      `Export ${contract.clientName} (${PRODUCT_META[contract.requiredProduct].name})`,
      contract.requiredQty
    );
    pushEvent(
      state,
      'export',
      'export',
      `Export +${contract.rewardFcfa.toLocaleString('fr-FR')} F!`,
      '#0284C7'
    );
    state.contracts.splice(idx, 1);
  }
  return true;
}

export function tickSimulation(state: GameState, rawDt: number): void {
  const dt = Math.min(Math.max(rawDt, 0), 0.05);
  if (dt <= 0) return;

  const prevSecond = Math.floor(state.elapsedSeconds);
  state.elapsedSeconds += dt;
  const currSecond = Math.floor(state.elapsedSeconds);

  // 1. Agriculture growth & worker auto-harvest
  for (const cropId of Object.keys(state.crops) as CropId[]) {
    const crop = state.crops[cropId];
    if (!crop.unlocked || crop.plots <= 0) continue;

    const def = CROP_DEFS[cropId];
    const speedMult = getAgricultureSpeedMultiplier(state, cropId);
    crop.growthProgress += (dt / def.growSeconds) * speedMult;

    if (crop.growthProgress >= 1) {
      if (crop.workers > 0) {
        harvestCrop(state, cropId, false);
      } else {
        crop.growthProgress = 1; // Ready for manual harvest
      }
    }
  }

  // 2. Phase 3A Artisanal Pipeline
  const procSpeed = getProcessingSpeedMultiplier(state);
  for (const stationId of STATION_3A_ORDER) {
    const station = state.stations3A[stationId];
    const def = STATION_3A_DEFS[stationId];
    const batchMult = station.level;

    // Auto-load if workers > 0 OR conveyor belt unlocked & station has idle input
    if (station.inFlightKg === 0 && (station.workers > 0 || state.factory3B.tapisRoulantLevel > 0)) {
      if (state.resources[def.inputKey] >= def.inputBatch) {
        const taken = Math.min(def.inputBatch * batchMult, Math.floor(state.resources[def.inputKey]));
        state.resources[def.inputKey] -= taken;
        station.inFlightKg = taken;
      }
    }

    if (station.inFlightKg > 0 && (station.workers > 0 || state.factory3B.tapisRoulantLevel > 0)) {
      const workerBonus = Math.max(1, station.workers * 0.75 + state.factory3B.tapisRoulantLevel * 0.6);
      station.progress += (dt / def.baseSeconds) * procSpeed * workerBonus;
      if (station.progress >= 1) {
        completeStation3A(state, stationId);
      }
    }
  }

  // 3. Phase 3B Factory Automation (direct conversion)
  if (state.factory3B.unlocked) {
    if (state.factory3B.broyeuseIndLevel > 0) {
      const batch = 10 * state.factory3B.broyeuseIndLevel;
      if (state.resources.maniocBrut >= 10) {
        state.factory3B.broyeuseProgress += (dt / 2.6) * procSpeed * (1 + state.factory3B.broyeuseIndLevel * 0.35);
        if (state.factory3B.broyeuseProgress >= 1) {
          const taken = Math.min(batch, Math.floor(state.resources.maniocBrut));
          state.resources.maniocBrut -= taken;
          const semoule = Math.max(1, Math.round(taken * 0.65));
          state.resources.semoulePressee += semoule;
          state.factory3B.broyeuseProgress = 0;
          pushEvent(state, 'process', 'factory3B', `+${semoule} kg semoule (Usine)`, '#B45309');
        }
      }
    }

    if (state.factory3B.cuiseurAutoLevel > 0) {
      const indBonus = state.research.cuisson_vapeur_ind ? 1.4 : 1;
      const neededSemoule = 5 * state.factory3B.cuiseurAutoLevel;
      if (state.resources.semoulePressee >= 5) {
        state.factory3B.cuiseurProgress += (dt / 2.2) * procSpeed * (1 + state.factory3B.cuiseurAutoLevel * 0.35);
        if (state.factory3B.cuiseurProgress >= 1) {
          const taken = Math.min(neededSemoule, Math.floor(state.resources.semoulePressee));
          state.resources.semoulePressee -= taken;
          const sacs = Math.max(1, Math.round((taken / 5) * indBonus));
          state.resources.attiekeSacs += sacs;
          state.factory3B.cuiseurProgress = 0;
          pushEvent(state, 'process', 'factory3B', `+${sacs} sac(s) Attiéké (Auto)`, '#D97706');
        }
      }
    }
  }

  // 4. Phase 3C Culinary Kitchen
  if (state.kitchen3C.unlocked) {
    // Auto fish supplier keeps fresh fish stocked at wholesale cost (450 FCFA/kg)
    if (state.kitchen3C.autoPoisson && state.resources.poisson < 8 && state.fcfa >= 2250) {
      state.fcfa -= 2250;
      state.resources.poisson += 5;
    }

    if (state.kitchen3C.grillPoissonLevel > 0) {
      const canCook =
        state.resources.attiekeSacs >= 1 &&
        state.resources.poisson >= 1 &&
        state.resources.legumes >= 1;
      if (canCook) {
        state.kitchen3C.grillProgress +=
          (dt / 3.2) * (1 + state.kitchen3C.grillPoissonLevel * 0.35) * (1 + state.prestigeUpgrades.savoir_ancestral * 0.35);
        if (state.kitchen3C.grillProgress >= 1) {
          const batches = Math.min(
            state.kitchen3C.grillPoissonLevel,
            Math.floor(state.resources.attiekeSacs),
            Math.floor(state.resources.poisson),
            Math.floor(state.resources.legumes)
          );
          if (batches >= 1) {
            state.resources.attiekeSacs -= batches;
            state.resources.poisson -= batches;
            state.resources.legumes -= batches;
            state.resources.platsAttiekePoisson += batches;
            pushEvent(state, 'process', 'kitchen3C', `+${batches} Attiéké-Poisson`, '#B91C1C');
          }
          state.kitchen3C.grillProgress = 0;
        }
      }
    }

    if (state.kitchen3C.friteuseAllocoLevel > 0 && state.research.recettes_royales) {
      const canCookRoyal =
        state.resources.attiekeSacs >= 1 &&
        state.resources.plantains >= 2 &&
        state.resources.huilePalme >= 1 &&
        state.resources.legumes >= 1 &&
        state.resources.poisson >= 1;
      if (canCookRoyal) {
        state.kitchen3C.friteuseProgress +=
          (dt / 3.8) * (1 + state.kitchen3C.friteuseAllocoLevel * 0.35) * (1 + state.prestigeUpgrades.savoir_ancestral * 0.35);
        if (state.kitchen3C.friteuseProgress >= 1) {
          const batches = Math.min(
            state.kitchen3C.friteuseAllocoLevel,
            Math.floor(state.resources.attiekeSacs),
            Math.floor(state.resources.plantains / 2),
            Math.floor(state.resources.huilePalme),
            Math.floor(state.resources.legumes),
            Math.floor(state.resources.poisson)
          );
          if (batches >= 1) {
            state.resources.attiekeSacs -= batches;
            state.resources.plantains -= batches * 2;
            state.resources.huilePalme -= batches;
            state.resources.legumes -= batches;
            state.resources.poisson -= batches;
            state.resources.platsAllocoRoyal += batches;
            pushEvent(state, 'process', 'kitchen3C', `+${batches} Alloco Royal`, '#D97706');
          }
          state.kitchen3C.friteuseProgress = 0;
        }
      }
    }
  }

  // 5. Retail Queue & Servers
  const maxQueue = state.research.stand_maquis ? 6 : 4;
  state.retail.spawnTimer -= dt;
  if (state.retail.spawnTimer <= 0) {
    state.retail.spawnTimer = state.research.stand_maquis ? 3.2 : 4.2;
    if (state.retail.queue.length < maxQueue) {
      const idx = state.retail.queue.length;
      state.retail.queue.push({
        id: state.nextId++,
        name: CUSTOMER_NAMES[Math.floor(Math.random() * CUSTOMER_NAMES.length)],
        wantedProduct: pickCustomerWantedProduct(state),
        patience: 1,
        maxPatience: 45,
        shirtColor: CUSTOMER_SHIRT_COLORS[Math.floor(Math.random() * CUSTOMER_SHIRT_COLORS.length)],
        slotIndex: idx,
      });
    }
  }

  // Update patience
  for (let i = state.retail.queue.length - 1; i >= 0; i--) {
    const cust = state.retail.queue[i];
    cust.patience -= dt / cust.maxPatience;
    if (cust.patience <= 0) {
      state.retail.queue.splice(i, 1);
    }
  }
  state.retail.queue.forEach((c, i) => {
    c.slotIndex = i;
  });

  // Auto-serve if servers hired
  if (state.retail.servers > 0 && state.retail.queue.length > 0) {
    state.retail.serveProgress += dt * (0.45 + state.retail.servers * 0.45);
    if (state.retail.serveProgress >= 1) {
      const served = serveRetailCustomer(state);
      state.retail.serveProgress = served ? 0 : 0.85;
    }
  }

  // 6. B2B Export Contracts
  for (let i = state.contracts.length - 1; i >= 0; i--) {
    const c = state.contracts[i];
    c.timeLeft -= dt;
    if (c.timeLeft <= 0) {
      state.contracts.splice(i, 1);
    } else if (state.autoExportEnabled && state.research.logistique_auto) {
      loadContract(state, c.id);
    }
  }

  const maxContracts = state.research.quai_maritime ? 3 : 2;
  state.contractSpawnTimer -= dt;
  if (state.contractSpawnTimer <= 0 && state.contracts.length < maxContracts) {
    state.contracts.push(generateContract(state));
    state.contractSpawnTimer = 8;
  }

  // 7. Rolling revenue/min calculation once per integer second
  if (currSecond > prevSecond) {
    const recent = state.salesLog
      .filter((entry) => state.elapsedSeconds - entry.elapsedSeconds <= 30)
      .reduce((sum, entry) => sum + entry.amountFcfa, 0);
    state.revenuePerMin = Math.round(recent * 2);
  }
}

// ---------- Upgrade & Purchase Actions ----------

export function unlockCrop(state: GameState, cropId: CropId): boolean {
  const crop = state.crops[cropId];
  const def = CROP_DEFS[cropId];
  if (crop.unlocked || state.fcfa < def.unlockCost) return false;
  if ((cropId === 'plantain' || cropId === 'legumes') && !state.research.cultures_associees) {
    return false;
  }
  if (cropId === 'palmier' && !state.research.palmeraie_moderne) {
    return false;
  }
  state.fcfa -= def.unlockCost;
  crop.unlocked = true;
  crop.plots = 1;
  crop.growthProgress = 0.25;
  pushEvent(state, 'upgrade', `crop_${cropId}`, `${def.name} débloqué !`, def.accentColor);
  return true;
}

export function upgradeCrop(
  state: GameState,
  cropId: CropId,
  field: 'plots' | 'workers' | 'soilLevel' | 'fertilizerLevel' | 'mechanizationLevel'
): boolean {
  const crop = state.crops[cropId];
  if (!crop.unlocked) return false;
  const def = CROP_DEFS[cropId];

  const baseMap = {
    plots: def.plotBaseCost,
    workers: def.workerBaseCost,
    soilLevel: def.soilBaseCost,
    fertilizerLevel: def.fertilizerBaseCost,
    mechanizationLevel: def.mechBaseCost,
  };
  const currentVal = field === 'plots' ? crop.plots - 1 : crop[field];
  const cost = scaleCost(baseMap[field], currentVal, 1.48);
  if (state.fcfa < cost) return false;

  state.fcfa -= cost;
  crop[field] += 1;
  pushEvent(state, 'upgrade', `crop_${cropId}`, `Amélioration ${def.name}`, def.accentColor);
  return true;
}

export function upgradeStation3A(
  state: GameState,
  stationId: Station3AId,
  kind: 'level' | 'workers'
): boolean {
  const station = state.stations3A[stationId];
  const def = STATION_3A_DEFS[stationId];
  const levelVal = kind === 'level' ? station.level - 1 : station.workers;
  const base = kind === 'level' ? def.upgradeBaseCost : def.workerBaseCost;
  const cost = scaleCost(base, levelVal, 1.5);
  if (state.fcfa < cost) return false;

  state.fcfa -= cost;
  station[kind] += 1;
  pushEvent(state, 'upgrade', `station_${stationId}`, `${def.name} Niv.${station[kind]}`, '#D97706');
  return true;
}

export function upgradeFactory3B(
  state: GameState,
  kind: 'tapisRoulantLevel' | 'broyeuseIndLevel' | 'cuiseurAutoLevel'
): boolean {
  if (!state.factory3B.unlocked) return false;
  const baseMap = {
    tapisRoulantLevel: 18000,
    broyeuseIndLevel: 24000,
    cuiseurAutoLevel: 30000,
  };
  const cost = scaleCost(baseMap[kind], state.factory3B[kind], 1.55);
  if (state.fcfa < cost) return false;
  state.fcfa -= cost;
  state.factory3B[kind] += 1;
  pushEvent(state, 'upgrade', 'factory3B', 'Usine améliorée !', '#B45309');
  return true;
}

export function upgradeKitchen3C(
  state: GameState,
  kind: 'grillPoissonLevel' | 'friteuseAllocoLevel'
): boolean {
  if (!state.kitchen3C.unlocked) return false;
  if (kind === 'friteuseAllocoLevel' && !state.research.recettes_royales) return false;
  const base = kind === 'grillPoissonLevel' ? 22000 : 38000;
  const cost = scaleCost(base, state.kitchen3C[kind], 1.55);
  if (state.fcfa < cost) return false;
  state.fcfa -= cost;
  state.kitchen3C[kind] += 1;
  pushEvent(state, 'upgrade', 'kitchen3C', 'Cuisine améliorée !', '#DC2626');
  return true;
}

export function buyFishStock(state: GameState, kg = 10): boolean {
  const cost = kg * 450;
  if (state.fcfa < cost) return false;
  state.fcfa -= cost;
  state.resources.poisson += kg;
  pushEvent(state, 'upgrade', 'kitchen3C', `+${kg} kg Poisson frais`, '#0284C7');
  return true;
}

export function toggleAutoPoisson(state: GameState): boolean {
  if (!state.kitchen3C.unlocked) return false;
  if (!state.kitchen3C.autoPoisson) {
    const cost = 14000;
    if (state.fcfa < cost) return false;
    state.fcfa -= cost;
    state.kitchen3C.autoPoisson = true;
    return true;
  }
  return false;
}

export function upgradeRetail(
  state: GameState,
  kind: 'standLevel' | 'servers'
): boolean {
  const current = kind === 'standLevel' ? state.retail.standLevel - 1 : state.retail.servers;
  const base = kind === 'standLevel' ? 6500 : 7500;
  const cost = scaleCost(base, current, 1.52);
  if (state.fcfa < cost) return false;
  state.fcfa -= cost;
  state.retail[kind] += 1;
  pushEvent(state, 'upgrade', 'retail', 'Stand Retail amélioré !', '#16A34A');
  return true;
}

export function unlockResearch(state: GameState, techId: ResearchId): boolean {
  if (state.research[techId]) return false;
  const def = RESEARCH_DEFS.find((r) => r.id === techId);
  if (!def) return false;
  if (!def.requires.every((req) => state.research[req])) return false;
  if (state.fcfa < def.costFcfa) return false;

  state.fcfa -= def.costFcfa;
  state.research[techId] = true;

  if (techId === 'usine_automatisee') {
    state.factory3B.unlocked = true;
    state.factory3B.tapisRoulantLevel = 1;
  } else if (techId === 'atelier_culinaire') {
    state.kitchen3C.unlocked = true;
    state.kitchen3C.grillPoissonLevel = 1;
  } else if (techId === 'recettes_royales') {
    state.kitchen3C.friteuseAllocoLevel = 1;
  } else if (techId === 'logistique_auto') {
    state.autoExportEnabled = true;
  }

  pushEvent(state, 'upgrade', 'research', `Recherche : ${def.name}`, '#7C3AED');
  return true;
}

export function performPrestige(state: GameState): GameState | null {
  const earnedSeals = getPendingPrestigeSeals(state);
  if (earnedSeals <= 0) return null;

  return createInitialState({
    prestigeCount: state.prestigeCount + 1,
    prestigePoints: state.prestigePoints + earnedSeals,
    prestigeUpgrades: { ...state.prestigeUpgrades },
    lifetimeTotalEarned: state.lifetimeTotalEarned,
  });
}

export function buyPrestigeUpgrade(state: GameState, upgradeId: PrestigeUpgradeId): boolean {
  const def = PRESTIGE_UPGRADE_DEFS.find((u) => u.id === upgradeId);
  if (!def) return false;
  const level = state.prestigeUpgrades[upgradeId];
  if (level >= def.maxLevel) return false;

  const sealCost = def.baseSealCost + level;
  if (state.prestigePoints < sealCost) return false;

  state.prestigePoints -= sealCost;
  state.prestigeUpgrades[upgradeId] += 1;
  return true;
}

export function serializeState(state: GameState): string {
  return JSON.stringify({ ...state, pendingEvents: [] });
}

export function deserializeState(raw: string): GameState | null {
  try {
    const parsed = JSON.parse(raw) as Partial<GameState>;
    if (typeof parsed.fcfa !== 'number' || !parsed.resources || !parsed.crops) {
      return null;
    }
    const base = createInitialState();
    return {
      ...base,
      ...parsed,
      resources: { ...base.resources, ...parsed.resources },
      crops: { ...base.crops, ...parsed.crops },
      stations3A: { ...base.stations3A, ...parsed.stations3A },
      factory3B: { ...base.factory3B, ...parsed.factory3B },
      kitchen3C: { ...base.kitchen3C, ...parsed.kitchen3C },
      retail: { ...base.retail, ...parsed.retail },
      research: { ...base.research, ...parsed.research },
      prestigeUpgrades: { ...base.prestigeUpgrades, ...parsed.prestigeUpgrades },
      contracts: Array.isArray(parsed.contracts) ? parsed.contracts : base.contracts,
      salesLog: Array.isArray(parsed.salesLog) ? parsed.salesLog : [],
      pendingEvents: [],
    };
  } catch {
    return null;
  }
}
