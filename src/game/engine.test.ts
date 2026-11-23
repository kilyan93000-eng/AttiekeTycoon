import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buyPrestigeUpgrade,
  createInitialState,
  deserializeState,
  getPendingPrestigeSeals,
  getSellPriceFcfa,
  harvestCrop,
  loadContract,
  performPrestige,
  serializeState,
  serveRetailCustomer,
  tickSimulation,
  unlockCrop,
  unlockResearch,
  upgradeCrop,
  upgradeFactory3B,
  upgradeKitchen3C,
  workStation3A,
} from './engine';
import { PRESTIGE_EARNED_THRESHOLD } from './constants';

test('manual manioc harvest increases maniocBrut stock', () => {
  const state = createInitialState();
  const initialManioc = state.resources.maniocBrut;
  const harvested = harvestCrop(state, 'manioc', true);
  assert.ok(harvested > 0);
  assert.equal(state.resources.maniocBrut, initialManioc + harvested);
});

test('step-by-step 3A pipeline transforms maniocBrut into attiekeSacs', () => {
  const state = createInitialState();
  state.resources.maniocBrut = 40;
  state.resources.attiekeSacs = 0;

  assert.equal(workStation3A(state, 'epluchage', 1.0), true);
  assert.ok(state.resources.maniocEpluche > 0);

  assert.equal(workStation3A(state, 'broyage', 1.0), true);
  assert.ok(state.resources.maniocBroye > 0);

  assert.equal(workStation3A(state, 'fermentation', 1.0), true);
  assert.ok(state.resources.pateFermentee > 0);

  assert.equal(workStation3A(state, 'pressage', 1.0), true);
  assert.ok(state.resources.semoulePressee > 0);

  assert.equal(workStation3A(state, 'cuisson', 1.0), true);
  assert.ok(state.resources.attiekeSacs >= 1);
});

test('pricing hierarchy preserves Manioc brut < Sac attieke < Attieke-Poisson < Alloco Royal', () => {
  const state = createInitialState();
  const raw = getSellPriceFcfa(state, 'maniocBrut');
  const sac = getSellPriceFcfa(state, 'attiekeSacs');
  const poisson = getSellPriceFcfa(state, 'platsAttiekePoisson');
  const alloco = getSellPriceFcfa(state, 'platsAllocoRoyal');
  assert.ok(raw < sac);
  assert.ok(sac < poisson);
  assert.ok(poisson < alloco);
});

test('retail queue customer purchase increments FCFA and writes salesLog', () => {
  const state = createInitialState();
  const startFcfa = state.fcfa;
  state.resources.attiekeSacs = 3;
  const served = serveRetailCustomer(state);
  assert.equal(served, true);
  assert.ok(state.fcfa > startFcfa);
  assert.equal(state.salesLog.length, 1);
  assert.equal(state.salesLog[0].channel, 'retail');
});

test('factory 3B and culinary 3C unlock via research and produce goods automatically', () => {
  const state = createInitialState();
  state.fcfa = 1000000;
  assert.equal(unlockResearch(state, 'presses_hydrauliques'), true);
  assert.equal(unlockResearch(state, 'usine_automatisee'), true);
  assert.equal(unlockResearch(state, 'atelier_culinaire'), true);
  assert.equal(unlockResearch(state, 'recettes_royales'), true);
  assert.equal(unlockResearch(state, 'sol_fertile'), true);
  assert.equal(unlockResearch(state, 'cultures_associees'), true);
  assert.equal(unlockResearch(state, 'palmeraie_moderne'), true);

  assert.equal(state.factory3B.unlocked, true);
  assert.equal(state.kitchen3C.unlocked, true);

  assert.equal(upgradeFactory3B(state, 'broyeuseIndLevel'), true);
  assert.equal(upgradeFactory3B(state, 'cuiseurAutoLevel'), true);
  assert.equal(upgradeKitchen3C(state, 'friteuseAllocoLevel'), true);

  assert.equal(unlockCrop(state, 'plantain'), true);
  assert.equal(unlockCrop(state, 'legumes'), true);
  assert.equal(unlockCrop(state, 'palmier'), true);

  state.resources.maniocBrut = 100;
  state.resources.semoulePressee = 20;
  state.resources.attiekeSacs = 5;
  state.resources.plantains = 20;
  state.resources.huilePalme = 10;
  state.resources.legumes = 10;
  state.resources.poisson = 10;

  for (let i = 0; i < 120; i++) {
    tickSimulation(state, 0.05);
  }

  assert.ok(state.resources.platsAttiekePoisson > 0 || state.resources.platsAllocoRoyal > 0);
});

test('B2B export contract fulfillment pays reward and logs b2b sale', () => {
  const state = createInitialState();
  const contract = state.contracts[0];
  assert.ok(contract);
  state.resources[contract.requiredProduct] = contract.requiredQty + 2;
  const fcfaBefore = state.fcfa;

  const loaded = loadContract(state, contract.id);
  assert.equal(loaded, true);
  assert.equal(state.fcfa, fcfaBefore + contract.rewardFcfa);
  assert.equal(state.salesLog[0].channel, 'b2b');
});

test('prestige rebirth resets local run and grants permanent seals and upgrades', () => {
  const state = createInitialState();
  state.totalEarnedThisRun = PRESTIGE_EARNED_THRESHOLD * 4;
  state.lifetimeTotalEarned = PRESTIGE_EARNED_THRESHOLD * 4;

  const seals = getPendingPrestigeSeals(state);
  assert.equal(seals, 2);

  const reborn = performPrestige(state);
  assert.ok(reborn !== null);
  assert.equal(reborn.prestigeCount, 1);
  assert.equal(reborn.prestigePoints, 2);
  assert.equal(reborn.totalEarnedThisRun, 0);

  assert.equal(buyPrestigeUpgrade(reborn, 'capital_depart'), true);
  assert.equal(reborn.prestigeUpgrades.capital_depart, 1);
});

test('save/load serialization round-trips state cleanly', () => {
  const state = createInitialState();
  state.fcfa = 42500;
  upgradeCrop(state, 'manioc', 'plots');
  const json = serializeState(state);
  const restored = deserializeState(json);
  assert.ok(restored !== null);
  assert.equal(restored.fcfa, state.fcfa);
  assert.equal(restored.crops.manioc.plots, 2);
});
