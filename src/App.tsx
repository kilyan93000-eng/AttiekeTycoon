import { useCallback, useEffect, useRef, useState } from 'react';
import { DockTab, ManagementDock } from './components/ManagementDock';
import { PauseModal } from './components/PauseModal';
import { TitleScreen } from './components/TitleScreen';
import { TopHud } from './components/TopHud';
import { soundEngine } from './game/audio';
import {
  buyFishStock,
  buyPrestigeUpgrade,
  createInitialState,
  deserializeState,
  harvestCrop,
  loadContract,
  performPrestige,
  SAVE_STORAGE_KEY,
  serializeState,
  serveRetailCustomer,
  tickSimulation,
  toggleAutoPoisson,
  unlockCrop,
  unlockResearch,
  upgradeCrop,
  upgradeFactory3B,
  upgradeKitchen3C,
  upgradeRetail,
  upgradeStation3A,
  workStation3A,
} from './game/engine';
import {
  CropId,
  GameScreenState,
  GameState,
  PrestigeUpgradeId,
  ResearchId,
  Station3AId,
} from './game/types';
import { WorldRenderer } from './game/worldRenderer';

function readSavedGame(): GameState | null {
  try {
    const raw = window.localStorage.getItem(SAVE_STORAGE_KEY);
    return raw ? deserializeState(raw) : null;
  } catch {
    return null;
  }
}

export default function App() {
  const initialAutostart =
    typeof window !== 'undefined' &&
    new URLSearchParams(window.location.search).get('autostart') === '1';

  const savedPreview = typeof window !== 'undefined' ? readSavedGame() : null;

  const [screenState, setScreenState] = useState<GameScreenState>(
    initialAutostart ? 'playing' : 'title'
  );
  const [activeTab, setActiveTab] = useState<DockTab>('production');
  const [muted, setMuted] = useState(false);
  const [saveFeedback, setSaveFeedback] = useState<string | null>(null);

  // Mutable simulation ref keeps 60fps Canvas loop isolated from React reconciliation
  const simRef = useRef<GameState>(savedPreview ?? createInitialState());
  const rendererRef = useRef<WorldRenderer>(new WorldRenderer());
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const screenStateRef = useRef<GameScreenState>(screenState);

  // Throttled React HUD snapshot (~6 Hz + immediate sync on user actions)
  const [hudSnapshot, setHudSnapshot] = useState<GameState>(() => ({ ...simRef.current }));

  const syncHud = useCallback(() => {
    setHudSnapshot({
      ...simRef.current,
      resources: { ...simRef.current.resources },
      crops: { ...simRef.current.crops },
      stations3A: { ...simRef.current.stations3A },
      factory3B: { ...simRef.current.factory3B },
      kitchen3C: { ...simRef.current.kitchen3C },
      retail: {
        ...simRef.current.retail,
        queue: [...simRef.current.retail.queue],
      },
      research: { ...simRef.current.research },
      contracts: [...simRef.current.contracts],
      salesLog: [...simRef.current.salesLog],
      prestigeUpgrades: { ...simRef.current.prestigeUpgrades },
    });
  }, []);

  useEffect(() => {
    screenStateRef.current = screenState;
    document.body.dataset.state = screenState;
  }, [screenState]);

  const handleSave = useCallback(() => {
    try {
      window.localStorage.setItem(SAVE_STORAGE_KEY, serializeState(simRef.current));
      setSaveFeedback('Sauvegardé');
      window.setTimeout(() => setSaveFeedback(null), 1800);
    } catch {
      // Ignore storage errors in restricted environments
    }
  }, []);

  const handleStart = useCallback(
    (forceNew = false) => {
      if (forceNew) {
        simRef.current = createInitialState();
        try {
          window.localStorage.removeItem(SAVE_STORAGE_KEY);
        } catch {
          // ignore
        }
      } else {
        const loaded = readSavedGame();
        if (loaded) {
          simRef.current = loaded;
        }
      }
      if (document.activeElement instanceof HTMLElement) {
        document.activeElement.blur();
      }
      setScreenState('playing');
      syncHud();
      soundEngine.playUpgrade();
    },
    [syncHud]
  );

  // Auto-save every 15 seconds while playing
  useEffect(() => {
    if (screenState !== 'playing') return;
    const id = window.setInterval(() => {
      try {
        window.localStorage.setItem(SAVE_STORAGE_KEY, serializeState(simRef.current));
      } catch {
        // ignore
      }
    }, 15000);
    return () => window.clearInterval(id);
  }, [screenState]);

  // Keyboard shortcuts: Enter/Space on Title, P/Escape for Pause, M for Mute
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (screenStateRef.current === 'title') {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleStart(false);
        }
        return;
      }

      if (e.key === 'Escape' || e.key.toLowerCase() === 'p') {
        e.preventDefault();
        setScreenState((prev) => (prev === 'playing' ? 'paused' : 'playing'));
      } else if (e.key.toLowerCase() === 'm') {
        e.preventDefault();
        setMuted((prev) => {
          const next = !prev;
          soundEngine.muted = next;
          return next;
        });
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [handleStart]);

  // 60fps Canvas Loop + ResizeObserver
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = canvas.clientWidth || window.innerWidth;
    let height = canvas.clientHeight || window.innerHeight;
    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = canvas.clientWidth || window.innerWidth;
      height = canvas.clientHeight || window.innerHeight;
      canvas.width = Math.max(1, Math.floor(width * dpr));
      canvas.height = Math.max(1, Math.floor(height * dpr));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();

    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    let rafId = 0;
    let lastTime = performance.now();
    let hudTimer = 0;
    let renderAccum = 0;

    const frame = (now: number) => {
      const rawDt = (now - lastTime) / 1000;
      lastTime = now;
      const dt = Math.min(Math.max(rawDt, 0), 0.05);

      if (screenStateRef.current === 'playing') {
        tickSimulation(simRef.current, dt);
        rendererRef.current.consumeEvents(simRef.current.pendingEvents);
        rendererRef.current.updateEffects(dt);

        hudTimer += dt;
        if (hudTimer >= 0.25) {
          hudTimer = 0;
          syncHud();
        }
      }

      if (screenStateRef.current !== 'title') {
        renderAccum += rawDt;
        if (renderAccum >= 0.032) {
          renderAccum = 0;
          rendererRef.current.render(ctx, width, height, simRef.current);
        }
      }
      rafId = window.requestAnimationFrame(frame);
    };

    rafId = window.requestAnimationFrame(frame);
    return () => {
      window.cancelAnimationFrame(rafId);
      ro.disconnect();
    };
  }, [syncHud]);

  // Canvas pointer interaction
  const handleCanvasPointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const hovered = rendererRef.current.setPointer(x, y);
    e.currentTarget.style.cursor = hovered ? 'pointer' : 'default';
  };

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (screenStateRef.current !== 'playing') return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const action = rendererRef.current.hitTest(x, y);
    if (!action) return;

    if (action.type === 'harvest') {
      const qty = harvestCrop(simRef.current, action.cropId, true);
      if (qty > 0) soundEngine.playHarvest();
    } else if (action.type === 'station3A') {
      const ok = workStation3A(simRef.current, action.stationId, 0.55);
      if (ok) soundEngine.playProcess();
    } else if (action.type === 'serveRetail') {
      const ok = serveRetailCustomer(simRef.current);
      if (ok) soundEngine.playCoin();
    } else if (action.type === 'loadContract') {
      const ok = loadContract(simRef.current, action.contractId);
      if (ok) soundEngine.playExport();
    } else if (action.type === 'openTab') {
      setActiveTab(action.tab);
    }

    rendererRef.current.consumeEvents(simRef.current.pendingEvents);
    syncHud();
  };

  // Action Handlers for Management Dock
  const runAndSync = (fn: () => boolean | number, sound?: () => void) => {
    const res = fn();
    if (res) {
      sound?.();
      rendererRef.current.consumeEvents(simRef.current.pendingEvents);
      syncHud();
    }
  };

  return (
    <main className="relative h-screen w-screen overflow-hidden bg-[#1F1713] select-none">
      {/* Isolated 60fps World Canvas */}
      <canvas
        ref={canvasRef}
        data-testid="world-canvas"
        onPointerMove={handleCanvasPointerMove}
        onClick={handleCanvasClick}
        className="block h-full w-full"
      />

      {screenState === 'title' && (
        <TitleScreen
          hasSavedGame={savedPreview !== null}
          savedFcfa={savedPreview?.fcfa}
          onStart={handleStart}
        />
      )}

      {screenState !== 'title' && (
        <>
          <TopHud
            state={hudSnapshot}
            muted={muted}
            saveFeedback={saveFeedback}
            onToggleMute={() => {
              setMuted((prev) => {
                const next = !prev;
                soundEngine.muted = next;
                return next;
              });
            }}
            onPause={() =>
              setScreenState((prev) => (prev === 'playing' ? 'paused' : 'playing'))
            }
            onSave={handleSave}
            onOpenPrestige={() => setActiveTab('prestige')}
          />

          <ManagementDock
            state={hudSnapshot}
            activeTab={activeTab}
            onChangeTab={setActiveTab}
            onHarvestCrop={(cropId: CropId) =>
              runAndSync(() => harvestCrop(simRef.current, cropId, true), () =>
                soundEngine.playHarvest()
              )
            }
            onUnlockCrop={(cropId: CropId) =>
              runAndSync(() => unlockCrop(simRef.current, cropId), () =>
                soundEngine.playUpgrade()
              )
            }
            onUpgradeCrop={(cropId, field) =>
              runAndSync(() => upgradeCrop(simRef.current, cropId, field), () =>
                soundEngine.playUpgrade()
              )
            }
            onWorkStation3A={(stationId: Station3AId) =>
              runAndSync(() => workStation3A(simRef.current, stationId, 0.55), () =>
                soundEngine.playProcess()
              )
            }
            onUpgradeStation3A={(stationId, kind) =>
              runAndSync(() => upgradeStation3A(simRef.current, stationId, kind), () =>
                soundEngine.playUpgrade()
              )
            }
            onUpgradeFactory3B={(kind) =>
              runAndSync(() => upgradeFactory3B(simRef.current, kind), () =>
                soundEngine.playUpgrade()
              )
            }
            onUpgradeKitchen3C={(kind) =>
              runAndSync(() => upgradeKitchen3C(simRef.current, kind), () =>
                soundEngine.playUpgrade()
              )
            }
            onBuyFish={() =>
              runAndSync(() => buyFishStock(simRef.current, 10), () =>
                soundEngine.playUpgrade()
              )
            }
            onToggleAutoFish={() =>
              runAndSync(() => toggleAutoPoisson(simRef.current), () =>
                soundEngine.playUpgrade()
              )
            }
            onServeRetail={() =>
              runAndSync(() => serveRetailCustomer(simRef.current), () =>
                soundEngine.playCoin()
              )
            }
            onUpgradeRetail={(kind) =>
              runAndSync(() => upgradeRetail(simRef.current, kind), () =>
                soundEngine.playUpgrade()
              )
            }
            onUnlockResearch={(techId: ResearchId) =>
              runAndSync(() => unlockResearch(simRef.current, techId), () =>
                soundEngine.playUpgrade()
              )
            }
            onLoadContract={(contractId: number) =>
              runAndSync(() => loadContract(simRef.current, contractId), () =>
                soundEngine.playExport()
              )
            }
            onToggleAutoExport={() => {
              simRef.current.autoExportEnabled = !simRef.current.autoExportEnabled;
              syncHud();
            }}
            onPerformPrestige={() => {
              const reborn = performPrestige(simRef.current);
              if (reborn) {
                simRef.current = reborn;
                soundEngine.playExport();
                handleSave();
                syncHud();
              }
            }}
            onBuyPrestigeUpgrade={(id: PrestigeUpgradeId) =>
              runAndSync(() => buyPrestigeUpgrade(simRef.current, id), () =>
                soundEngine.playUpgrade()
              )
            }
          />
        </>
      )}

      {screenState === 'paused' && (
        <PauseModal
          state={hudSnapshot}
          onResume={() => setScreenState('playing')}
          onSave={handleSave}
          onReset={() => handleStart(true)}
          onTitle={() => {
            handleSave();
            setScreenState('title');
          }}
        />
      )}
    </main>
  );
}
