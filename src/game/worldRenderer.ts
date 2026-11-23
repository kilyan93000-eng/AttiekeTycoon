import { CROP_DEFS, PRODUCT_META, STATION_3A_DEFS, STATION_3A_ORDER } from './constants';
import { CropId, GameState, Station3AId, VisualEvent } from './types';

export type WorldAction =
  | { type: 'harvest'; cropId: CropId }
  | { type: 'station3A'; stationId: Station3AId }
  | { type: 'serveRetail'; customerId?: number }
  | { type: 'loadContract'; contractId: number }
  | { type: 'openTab'; tab: 'production' | 'recherche' | 'export' | 'prestige' };

interface HitRegion {
  x: number;
  y: number;
  w: number;
  h: number;
  action: WorldAction;
  label: string;
}

interface Particle {
  active: boolean;
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  color: string;
}

interface FloatingText {
  active: boolean;
  x: number;
  y: number;
  vy: number;
  life: number;
  maxLife: number;
  text: string;
  color: string;
}

const PARTICLE_POOL_SIZE = 96;
const TEXT_POOL_SIZE = 24;

export class WorldRenderer {
  private particles: Particle[] = Array.from({ length: PARTICLE_POOL_SIZE }, () => ({
    active: false,
    x: 0,
    y: 0,
    vx: 0,
    vy: 0,
    life: 0,
    maxLife: 1,
    size: 4,
    color: '#4ADE80',
  }));
  private particleCursor = 0;

  private floatingTexts: FloatingText[] = Array.from({ length: TEXT_POOL_SIZE }, () => ({
    active: false,
    x: 0,
    y: 0,
    vy: -28,
    life: 0,
    maxLife: 1.1,
    text: '',
    color: '#FAF6EE',
  }));
  private textCursor = 0;

  private hitRegions: HitRegion[] = [];
  private zoneCenters: Record<string, { x: number; y: number }> = {};
  private hoverRegionIdx = -1;
  private pulseMap: Record<string, number> = {};
  private animTime = 0;

  public spawnBurst(x: number, y: number, color: string, count = 8): void {
    for (let i = 0; i < count; i++) {
      const p = this.particles[this.particleCursor];
      this.particleCursor = (this.particleCursor + 1) % PARTICLE_POOL_SIZE;
      const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.5;
      const speed = 35 + Math.random() * 65;
      p.active = true;
      p.x = x;
      p.y = y;
      p.vx = Math.cos(angle) * speed;
      p.vy = Math.sin(angle) * speed - 22;
      p.life = 0;
      p.maxLife = 0.45 + Math.random() * 0.35;
      p.size = 3 + Math.random() * 3.5;
      p.color = color;
    }
  }

  public spawnFloatingText(x: number, y: number, text: string, color: string): void {
    const t = this.floatingTexts[this.textCursor];
    this.textCursor = (this.textCursor + 1) % TEXT_POOL_SIZE;
    t.active = true;
    t.x = x;
    t.y = y;
    t.vy = -34;
    t.life = 0;
    t.maxLife = 1.15;
    t.text = text;
    t.color = color;
  }

  public triggerPulse(zone: string): void {
    this.pulseMap[zone] = 1;
  }

  public consumeEvents(events: VisualEvent[]): void {
    while (events.length > 0) {
      const ev = events.shift();
      if (!ev) break;
      const center = this.zoneCenters[ev.zone];
      if (center) {
        this.spawnBurst(center.x, center.y, ev.color, ev.kind === 'export' ? 14 : 6);
        this.spawnFloatingText(center.x, center.y - 16, ev.text, ev.color);
        this.triggerPulse(ev.zone);
      }
    }
  }

  public updateEffects(dt: number): void {
    this.animTime += dt;
    for (const key of Object.keys(this.pulseMap)) {
      this.pulseMap[key] = Math.max(0, this.pulseMap[key] - dt * 4.5);
    }
    for (let i = 0; i < PARTICLE_POOL_SIZE; i++) {
      const p = this.particles[i];
      if (!p.active) continue;
      p.life += dt;
      if (p.life >= p.maxLife) {
        p.active = false;
        continue;
      }
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += 90 * dt;
    }
    for (let i = 0; i < TEXT_POOL_SIZE; i++) {
      const t = this.floatingTexts[i];
      if (!t.active) continue;
      t.life += dt;
      if (t.life >= t.maxLife) {
        t.active = false;
        continue;
      }
      t.y += t.vy * dt;
    }
  }

  public setPointer(x: number, y: number): HitRegion | null {
    this.hoverRegionIdx = -1;
    for (let i = this.hitRegions.length - 1; i >= 0; i--) {
      const r = this.hitRegions[i];
      if (x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h) {
        this.hoverRegionIdx = i;
        return r;
      }
    }
    return null;
  }

  public hitTest(x: number, y: number): WorldAction | null {
    for (let i = this.hitRegions.length - 1; i >= 0; i--) {
      const r = this.hitRegions[i];
      if (x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h) {
        return r.action;
      }
    }
    return null;
  }

  public render(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    state: GameState
  ): void {
    this.hitRegions = [];

    const topPad = width < 1024 ? 86 : 70;
    const bottomPad = 226;
    const playH = Math.max(220, height - topPad - bottomPad);
    const padX = Math.max(14, Math.min(28, width * 0.02));
    const usableW = Math.max(300, width - padX * 2);

    // Background laterite earth
    ctx.fillStyle = '#2A1810';
    ctx.fillRect(0, 0, width, height);

    ctx.fillStyle = '#6D2F1D';
    this.roundRect(ctx, padX - 4, topPad - 4, usableW + 8, playH + 8, 14);
    ctx.fill();
    ctx.strokeStyle = 'rgba(250, 246, 238, 0.14)';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Lagoon strip cleanly on far right
    const lagoonW = width < 768 ? 24 : Math.max(56, usableW * 0.065);
    const lagoonX = padX + usableW - lagoonW;
    ctx.fillStyle = '#0E7490';
    this.roundRect(ctx, lagoonX, topPad, lagoonW, playH, 10);
    ctx.fill();

    // Animated lagoon ripples + distant cargo silhouette when maritime unlocked
    ctx.strokeStyle = 'rgba(255,255,255,0.28)';
    ctx.lineWidth = 1.5;
    for (let w = 0; w < 6; w++) {
      const wy = topPad + 28 + (w * (playH - 56)) / 5;
      const waveX = lagoonX + 8 + Math.sin(this.animTime * 1.8 + w) * 4;
      ctx.beginPath();
      ctx.moveTo(waveX, wy);
      ctx.lineTo(waveX + lagoonW * 0.5, wy);
      ctx.stroke();
    }

    // Divide remaining width cleanly into 3 zones leaving lagoon separated
    const contentW = usableW - lagoonW - 10;
    const gap = Math.max(10, contentW * 0.014);
    const col1W = contentW * 0.27;
    const col2W = contentW * 0.43;
    const col3W = contentW - col1W - col2W - gap * 2;

    const x1 = padX + 2;
    const x2 = x1 + col1W + gap;
    const x3 = x2 + col2W + gap;

    // Animated supply-chain flow arrows
    this.drawFlowConnector(ctx, x1 + col1W, topPad + playH * 0.42, x2, topPad + playH * 0.28);
    this.drawFlowConnector(ctx, x2 + col2W, topPad + playH * 0.3, x3, topPad + playH * 0.28);
    this.drawFlowConnector(ctx, x2 + col2W, topPad + playH * 0.72, x3, topPad + playH * 0.72);

    // Wooden jetty connecting Quai Export to Lagoon
    ctx.fillStyle = '#78350F';
    ctx.fillRect(x3 + col3W - 2, topPad + playH * 0.72, lagoonX - (x3 + col3W) + 18, 16);

    // 3 Main Zones
    this.renderAgricultureZone(ctx, x1, topPad + 4, col1W, playH - 8, state);
    this.renderTransformationZone(ctx, x2, topPad + 4, col2W, playH - 8, state);
    this.renderLogisticsZone(ctx, x3, topPad + 4, col3W, playH - 8, state);

    // Hover highlight
    if (this.hoverRegionIdx >= 0 && this.hoverRegionIdx < this.hitRegions.length) {
      const hr = this.hitRegions[this.hoverRegionIdx];
      ctx.save();
      ctx.strokeStyle = '#FBBF24';
      ctx.lineWidth = 2.5;
      this.roundRect(ctx, hr.x - 2, hr.y - 2, hr.w + 4, hr.h + 4, 10);
      ctx.stroke();
      ctx.restore();
    }

    this.renderEffects(ctx);
  }

  private renderAgricultureZone(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    h: number,
    state: GameState
  ): void {
    ctx.fillStyle = '#472519';
    this.roundRect(ctx, x, y, w, h, 12);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.12)';
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.fillStyle = '#FDE68A';
    ctx.font = '700 12px "Plus Jakarta Sans", sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('1. CHAMPS & MATIÈRES PREMIÈRES', x + 12, y + 22);

    const cropOrder: CropId[] = ['manioc', 'plantain', 'legumes', 'palmier'];
    const innerY = y + 32;
    const cardGap = 8;
    const cardH = Math.max(44, (h - 42 - cardGap * 3) / 4);

    cropOrder.forEach((cropId, idx) => {
      const crop = state.crops[cropId];
      const def = CROP_DEFS[cropId];
      const cy = innerY + idx * (cardH + cardGap);
      const cx = x + 10;
      const cw = w - 20;

      const pulse = this.pulseMap[`crop_${cropId}`] || 0;
      this.zoneCenters[`crop_${cropId}`] = { x: cx + cw * 0.5, y: cy + cardH * 0.5 };

      ctx.save();
      if (pulse > 0) {
        const s = 1 + pulse * 0.025;
        ctx.translate(cx + cw / 2, cy + cardH / 2);
        ctx.scale(s, s);
        ctx.translate(-(cx + cw / 2), -(cy + cardH / 2));
      }

      if (crop.unlocked) {
        ctx.fillStyle = '#5F2F1D';
        this.roundRect(ctx, cx, cy, cw, cardH, 9);
        ctx.fill();
        ctx.strokeStyle = crop.growthProgress >= 0.99 ? '#4ADE80' : 'rgba(255,255,255,0.16)';
        ctx.lineWidth = crop.growthProgress >= 0.99 ? 2 : 1;
        ctx.stroke();

        // Rich soil furrows across bottom half of card
        ctx.fillStyle = 'rgba(42, 20, 12, 0.45)';
        this.roundRect(ctx, cx + 8, cy + cardH * 0.45, cw - 82, cardH * 0.36, 5);
        ctx.fill();

        // Draw row of 4 crop plants inside the plot bed
        const plantsToDraw = Math.min(4, Math.max(2, crop.plots + 1));
        for (let p = 0; p < plantsToDraw; p++) {
          const px = cx + 26 + p * Math.min(34, (cw - 110) / plantsToDraw);
          const py = cy + cardH * 0.61;
          this.drawCropIllustration(ctx, cropId, px, py, crop.growthProgress, p);
        }

        // Animated worker silhouettes if hired
        for (let wk = 0; wk < Math.min(3, crop.workers); wk++) {
          const wx = cx + cw - 92 - wk * 18 + Math.sin(this.animTime * 2 + wk) * 3;
          const wy = cy + cardH * 0.62;
          ctx.fillStyle = '#F59E0B';
          ctx.beginPath();
          ctx.arc(wx, wy - 7, 4, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#1E3A8A';
          ctx.fillRect(wx - 3, wy - 3, 6, 8);
        }

        // Top header inside crop plot
        ctx.fillStyle = '#FAF6EE';
        ctx.font = '700 13px "Plus Jakarta Sans", sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText(def.name, cx + 12, cy + 20);

        ctx.fillStyle = '#E7D8C9';
        ctx.font = '500 11px "JetBrains Mono", monospace';
        const stockQty = Math.floor(state.resources[def.resourceKey]);
        ctx.fillText(
          `${crop.plots} parc. · ${crop.workers} ouvr. · Stock: ${stockQty} ${def.unitLabel}`,
          cx + 12,
          cy + 36
        );

        // Growth bar
        const barX = cx + 10;
        const barW = Math.max(40, cw - 84);
        const barY = cy + cardH - 10;
        ctx.fillStyle = 'rgba(0,0,0,0.4)';
        this.roundRect(ctx, barX, barY, barW, 5, 2.5);
        ctx.fill();
        ctx.fillStyle = '#4ADE80';
        this.roundRect(ctx, barX, barY, barW * Math.min(1, crop.growthProgress), 5, 2.5);
        ctx.fill();

        // Action pill-free button inside plot
        ctx.fillStyle = '#2E6F40';
        this.roundRect(ctx, cx + cw - 68, cy + cardH * 0.5 - 13, 58, 26, 6);
        ctx.fill();
        ctx.fillStyle = '#FFFFFF';
        ctx.font = '700 11px "Plus Jakarta Sans", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('Récolter', cx + cw - 39, cy + cardH * 0.5 + 4);

        this.hitRegions.push({
          x: cx,
          y: cy,
          w: cw,
          h: cardH,
          action: { type: 'harvest', cropId },
          label: `Récolter ${def.name}`,
        });
      } else {
        ctx.fillStyle = 'rgba(28, 17, 12, 0.55)';
        this.roundRect(ctx, cx, cy, cw, cardH, 9);
        ctx.fill();
        ctx.setLineDash([4, 4]);
        ctx.strokeStyle = 'rgba(255,255,255,0.22)';
        ctx.stroke();
        ctx.setLineDash([]);

        ctx.fillStyle = '#D6C5B3';
        ctx.font = '600 12px "Plus Jakarta Sans", sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText(`${def.name} (Verrouillé)`, cx + 12, cy + cardH * 0.5 - 2);
        ctx.fillStyle = '#A8A29E';
        ctx.font = '500 10px "Plus Jakarta Sans", sans-serif';
        ctx.fillText('Cliquer pour gérer dans le panneau', cx + 12, cy + cardH * 0.5 + 14);

        this.hitRegions.push({
          x: cx,
          y: cy,
          w: cw,
          h: cardH,
          action: { type: 'openTab', tab: 'production' },
          label: `Débloquer ${def.name}`,
        });
      }
      ctx.restore();
    });
  }

  private renderTransformationZone(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    h: number,
    state: GameState
  ): void {
    ctx.fillStyle = '#3D271D';
    this.roundRect(ctx, x, y, w, h, 12);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.12)';
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.fillStyle = '#FDE68A';
    ctx.font = '700 12px "Plus Jakarta Sans", sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('2. TRANSFORMATION & CUISINE (3A → 3B → 3C)', x + 12, y + 22);

    const row1H = Math.max(100, (h - 48) * 0.52);
    const row2H = Math.max(76, (h - 48) * 0.44);
    const row1Y = y + 32;
    const row2Y = row1Y + row1H + 10;

    const sGap = 6;
    const sW = (w - 20 - sGap * 4) / 5;

    STATION_3A_ORDER.forEach((stId, idx) => {
      const st = state.stations3A[stId];
      const def = STATION_3A_DEFS[stId];
      const sx = x + 10 + idx * (sW + sGap);
      const sy = row1Y;
      const pulse = this.pulseMap[`station_${stId}`] || 0;
      this.zoneCenters[`station_${stId}`] = { x: sx + sW / 2, y: sy + row1H / 2 };

      ctx.save();
      if (pulse > 0) {
        const s = 1 + pulse * 0.035;
        ctx.translate(sx + sW / 2, sy + row1H / 2);
        ctx.scale(s, s);
        ctx.translate(-(sx + sW / 2), -(sy + row1H / 2));
      }

      ctx.fillStyle = st.inFlightKg > 0 ? '#683E28' : '#513122';
      this.roundRect(ctx, sx, sy, sW, row1H, 8);
      ctx.fill();
      ctx.strokeStyle = st.inFlightKg > 0 ? '#F59E0B' : 'rgba(255,255,255,0.16)';
      ctx.lineWidth = 1.2;
      ctx.stroke();

      // Step badge number
      ctx.fillStyle = '#FDE68A';
      ctx.font = '700 11px "Plus Jakarta Sans", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(def.name, sx + sW / 2, sy + 18);

      // Centered wooden workstation bench + illustration
      ctx.fillStyle = '#3B2316';
      this.roundRect(ctx, sx + 8, sy + 28, sW - 16, row1H - 92, 6);
      ctx.fill();

      this.drawStationIcon(ctx, stId, sx + sW / 2, sy + 28 + (row1H - 92) * 0.5, st.progress);

      // Live input stock readout
      const inputReady = Math.floor(state.resources[def.inputKey]);
      ctx.fillStyle = inputReady >= def.inputBatch ? '#86EFAC' : '#D6C5B3';
      ctx.font = '600 10px "JetBrains Mono", monospace';
      ctx.fillText(`Dispo: ${inputReady}`, sx + sW / 2, sy + row1H - 46);

      ctx.fillStyle = '#FAF6EE';
      ctx.font = '600 11px "Plus Jakarta Sans", sans-serif';
      ctx.fillText(def.shortName, sx + sW / 2, sy + row1H - 31);

      ctx.fillStyle = '#E7D8C9';
      ctx.font = '500 10px "JetBrains Mono", monospace';
      ctx.fillText(`Niv.${st.level} · ${st.workers}o`, sx + sW / 2, sy + row1H - 18);

      // Progress bar
      ctx.fillStyle = 'rgba(0,0,0,0.4)';
      this.roundRect(ctx, sx + 6, sy + row1H - 10, sW - 12, 5, 2.5);
      ctx.fill();
      ctx.fillStyle = '#F59E0B';
      this.roundRect(ctx, sx + 6, sy + row1H - 10, (sW - 12) * Math.min(1, st.progress), 5, 2.5);
      ctx.fill();

      this.hitRegions.push({
        x: sx,
        y: sy,
        w: sW,
        h: row1H,
        action: { type: 'station3A', stationId: stId },
        label: `${def.name}`,
      });
      ctx.restore();
    });

    // Bottom split inside Transformation: Left = Phase 3B Factory, Right = Phase 3C Kitchen
    const subW = (w - 28) / 2;
    const fx = x + 10;
    const kx = fx + subW + 8;

    // 3B Factory Box
    this.zoneCenters['factory3B'] = { x: fx + subW / 2, y: row2Y + row2H / 2 };
    ctx.fillStyle = state.factory3B.unlocked ? '#473123' : 'rgba(28,18,14,0.55)';
    this.roundRect(ctx, fx, row2Y, subW, row2H, 9);
    ctx.fill();
    ctx.strokeStyle = state.factory3B.unlocked ? '#D97706' : 'rgba(255,255,255,0.16)';
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.fillStyle = state.factory3B.unlocked ? '#FCD34D' : '#D6C5B3';
    ctx.font = '700 12px "Plus Jakarta Sans", sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('3B. Usine Automatisée', fx + 12, row2Y + 22);

    // Conveyor belt visual (blueprint if locked, animated if unlocked)
    const beltY = row2Y + row2H * 0.44;
    ctx.fillStyle = state.factory3B.unlocked ? '#292524' : 'rgba(41, 37, 36, 0.4)';
    this.roundRect(ctx, fx + 12, beltY, subW - 24, 18, 9);
    ctx.fill();
    if (state.factory3B.unlocked) {
      const offset = (this.animTime * 30) % 16;
      ctx.fillStyle = '#FAF6EE';
      for (let bx = fx + 18 + offset; bx < fx + subW - 24; bx += 16) {
        ctx.beginPath();
        ctx.arc(bx, beltY + 9, 3.5, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.fillStyle = '#E7D8C9';
      ctx.font = '500 11px "JetBrains Mono", monospace';
      ctx.fillText(
        `Tapis:${state.factory3B.tapisRoulantLevel} · Broyeuse:${state.factory3B.broyeuseIndLevel} · Cuiseur:${state.factory3B.cuiseurAutoLevel}`,
        fx + 12,
        row2Y + row2H - 14
      );
    } else {
      ctx.fillStyle = '#A8A29E';
      ctx.font = '500 11px "Plus Jakarta Sans", sans-serif';
      ctx.fillText('Plan usine · Débloquer via Recherche', fx + 12, row2Y + row2H - 14);
    }
    this.hitRegions.push({
      x: fx,
      y: row2Y,
      w: subW,
      h: row2H,
      action: { type: 'openTab', tab: state.factory3B.unlocked ? 'production' : 'recherche' },
      label: 'Gérer Usine 3B',
    });

    // 3C Kitchen Box
    this.zoneCenters['kitchen3C'] = { x: kx + subW / 2, y: row2Y + row2H / 2 };
    ctx.fillStyle = state.kitchen3C.unlocked ? '#552922' : 'rgba(28,18,14,0.55)';
    this.roundRect(ctx, kx, row2Y, subW, row2H, 9);
    ctx.fill();
    ctx.strokeStyle = state.kitchen3C.unlocked ? '#EF4444' : 'rgba(255,255,255,0.16)';
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.fillStyle = state.kitchen3C.unlocked ? '#FCA5A5' : '#D6C5B3';
    ctx.font = '700 12px "Plus Jakarta Sans", sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('3C. Atelier Culinaire', kx + 12, row2Y + 22);

    // Grill rack visual
    ctx.fillStyle = state.kitchen3C.unlocked ? '#7F1D1D' : 'rgba(60, 25, 22, 0.45)';
    this.roundRect(ctx, kx + 12, beltY, 44, 20, 4);
    ctx.fill();
    if (state.kitchen3C.unlocked) {
      const emberAlpha = 0.65 + 0.35 * Math.sin(this.animTime * 4);
      ctx.fillStyle = `rgba(249, 115, 22, ${emberAlpha})`;
      ctx.fillRect(kx + 16, beltY + 5, 36, 10);

      ctx.fillStyle = '#FAF6EE';
      ctx.font = '600 11px "JetBrains Mono", monospace';
      ctx.fillText(
        `Poisson: ${Math.floor(state.resources.platsAttiekePoisson)} · Alloco: ${Math.floor(state.resources.platsAllocoRoyal)}`,
        kx + 64,
        beltY + 14
      );
      ctx.fillStyle = '#E7D8C9';
      ctx.font = '500 11px "JetBrains Mono", monospace';
      ctx.fillText(
        `Grill Niv.${state.kitchen3C.grillPoissonLevel} · Friteuse Niv.${state.kitchen3C.friteuseAllocoLevel}`,
        kx + 12,
        row2Y + row2H - 14
      );
    } else {
      ctx.fillStyle = '#A8A29E';
      ctx.font = '500 11px "Plus Jakarta Sans", sans-serif';
      ctx.fillText('Attiéké-Poisson & Alloco · Recherche', kx + 12, row2Y + row2H - 14);
    }
    this.hitRegions.push({
      x: kx,
      y: row2Y,
      w: subW,
      h: row2H,
      action: { type: 'openTab', tab: state.kitchen3C.unlocked ? 'production' : 'recherche' },
      label: 'Gérer Cuisine 3C',
    });
  }

  private renderLogisticsZone(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    h: number,
    state: GameState
  ): void {
    ctx.fillStyle = '#3E2B22';
    this.roundRect(ctx, x, y, w, h, 12);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.12)';
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.fillStyle = '#FDE68A';
    ctx.font = '700 12px "Plus Jakarta Sans", sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('3. MAQUIS & EXPORT B2B', x + 12, y + 22);

    const topH = (h - 44) * 0.5;
    const botH = (h - 44) * 0.5;
    const ry = y + 32;
    const ey = ry + topH + 8;

    // Retail Maquis Card
    this.zoneCenters['retail'] = { x: x + w / 2, y: ry + topH / 2 };
    ctx.fillStyle = '#533524';
    this.roundRect(ctx, x + 10, ry, w - 20, topH, 9);
    ctx.fill();
    ctx.strokeStyle = '#10B981';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Striped awning
    const awningW = w - 28;
    const stripeW = awningW / 6;
    for (let s = 0; s < 6; s++) {
      ctx.fillStyle = s % 2 === 0 ? '#D97706' : '#FAF6EE';
      ctx.fillRect(x + 14 + s * stripeW, ry + 6, stripeW, 10);
    }

    ctx.fillStyle = '#FAF6EE';
    ctx.font = '700 12px "Plus Jakarta Sans", sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(
      `Stand Maquis (Niv.${state.retail.standLevel}) · ${state.retail.servers} serv.`,
      x + 16,
      ry + 33
    );

    // Wooden serving counter inside retail zone
    const counterY = ry + topH * 0.45;
    ctx.fillStyle = '#78350F';
    this.roundRect(ctx, x + 18, counterY, w - 36, 12, 4);
    ctx.fill();

    // Queuing NPCs
    const qStartX = x + 32;
    const qY = counterY + 34;
    state.retail.queue.slice(0, 6).forEach((cust, i) => {
      const cx = qStartX + i * Math.min(38, (w - 64) / 6);
      const bob = Math.sin(this.animTime * 4 + cust.id) * 2;
      ctx.fillStyle = cust.shirtColor;
      ctx.beginPath();
      ctx.arc(cx, qY + 10 + bob, 10, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#78350F';
      ctx.beginPath();
      ctx.arc(cx, qY - 3 + bob, 7, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = cust.patience > 0.4 ? '#22C55E' : '#EF4444';
      ctx.fillRect(cx - 9, qY - 15 + bob, 18 * Math.max(0.1, cust.patience), 3.5);
    });

    ctx.fillStyle = '#15803D';
    this.roundRect(ctx, x + w - 84, ry + topH - 30, 68, 24, 6);
    ctx.fill();
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '700 11px "Plus Jakarta Sans", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(
      state.retail.queue.length > 0 ? 'Servir !' : 'Attente',
      x + w - 50,
      ry + topH - 14
    );

    this.hitRegions.push({
      x: x + 10,
      y: ry,
      w: w - 20,
      h: topH,
      action: { type: 'serveRetail' },
      label: 'Servir client au stand',
    });

    // Export B2B Dock Card
    this.zoneCenters['export'] = { x: x + w / 2, y: ey + botH / 2 };
    ctx.fillStyle = '#243444';
    this.roundRect(ctx, x + 10, ey, w - 20, botH, 9);
    ctx.fill();
    ctx.strokeStyle = '#38BDF8';
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.fillStyle = '#BAE6FD';
    ctx.font = '700 12px "Plus Jakarta Sans", sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('Quai Export & Contrats B2B', x + 18, ey + 22);

    const activeContract = state.contracts[0];
    if (activeContract) {
      const prodName = PRODUCT_META[activeContract.requiredProduct].name;
      ctx.fillStyle = '#FAF6EE';
      ctx.font = '600 12px "Plus Jakarta Sans", sans-serif';
      ctx.fillText(
        `${activeContract.clientName} (${activeContract.destination})`,
        x + 18,
        ey + 40
      );
      ctx.fillStyle = '#E0F2FE';
      ctx.font = '500 11px "JetBrains Mono", monospace';
      ctx.fillText(
        `${activeContract.deliveredQty}/${activeContract.requiredQty} ${prodName} · ${Math.ceil(activeContract.timeLeft)}s`,
        x + 18,
        ey + 56
      );

      // Asphalt loading bay road
      ctx.fillStyle = '#1E293B';
      this.roundRect(ctx, x + 18, ey + botH - 42, w - 122, 24, 5);
      ctx.fill();

      this.drawTruckIcon(ctx, x + 28, ey + botH - 27, activeContract.vehicleType);

      ctx.fillStyle = '#0284C7';
      this.roundRect(ctx, x + w - 92, ey + botH - 34, 74, 26, 6);
      ctx.fill();
      ctx.fillStyle = '#FFFFFF';
      ctx.font = '700 11px "Plus Jakarta Sans", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Charger', x + w - 55, ey + botH - 17);

      this.hitRegions.push({
        x: x + 10,
        y: ey,
        w: w - 20,
        h: botH,
        action: { type: 'loadContract', contractId: activeContract.id },
        label: `Charger contrat ${activeContract.clientName}`,
      });
    } else {
      ctx.fillStyle = '#94A3B8';
      ctx.font = '500 11px "Plus Jakarta Sans", sans-serif';
      ctx.fillText('Nouveau contrat imminent...', x + 18, ey + 48);
      this.hitRegions.push({
        x: x + 10,
        y: ey,
        w: w - 20,
        h: botH,
        action: { type: 'openTab', tab: 'export' },
        label: 'Ouvrir Export B2B',
      });
    }
  }

  private drawCropIllustration(
    ctx: CanvasRenderingContext2D,
    cropId: CropId,
    cx: number,
    cy: number,
    growth: number,
    seed: number
  ): void {
    const scale = 0.68 + growth * 0.42;
    const sway = Math.sin(this.animTime * 2.2 + seed) * 2;
    ctx.save();
    ctx.translate(cx, cy);
    ctx.scale(scale, scale);

    if (cropId === 'manioc') {
      ctx.fillStyle = '#2E6F40';
      for (let i = -1; i <= 1; i++) {
        ctx.beginPath();
        ctx.ellipse(i * 6 + sway, -4, 5, 11, i * 0.4, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.fillStyle = '#4ADE80';
      ctx.beginPath();
      ctx.ellipse(sway * 0.5, -7, 3, 6, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#D97706';
      ctx.beginPath();
      ctx.ellipse(0, 7, 6, 3, 0, 0, Math.PI * 2);
      ctx.fill();
    } else if (cropId === 'plantain') {
      ctx.fillStyle = '#65A30D';
      ctx.beginPath();
      ctx.ellipse(-4 + sway, -5, 4, 12, -0.35, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#FACC15';
      ctx.beginPath();
      ctx.arc(4, 3, 5, 0.2, Math.PI * 1.1);
      ctx.fill();
    } else if (cropId === 'legumes') {
      ctx.fillStyle = '#16A34A';
      ctx.beginPath();
      ctx.arc(sway, -4, 7, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#EF4444';
      ctx.beginPath();
      ctx.arc(-4, 4, 4, 0, Math.PI * 2);
      ctx.arc(5, 4, 4, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.fillStyle = '#78350F';
      ctx.fillRect(-2, -2, 4, 14);
      ctx.fillStyle = '#15803D';
      for (let a = 0; a < 5; a++) {
        ctx.beginPath();
        ctx.ellipse(Math.cos(a * 1.25) * 6 + sway, -6, 7, 3, a * 0.6, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.restore();
  }

  private drawStationIcon(
    ctx: CanvasRenderingContext2D,
    stId: Station3AId,
    cx: number,
    cy: number,
    progress: number
  ): void {
    ctx.save();
    ctx.translate(cx, cy);
    ctx.scale(1.25, 1.25);
    if (stId === 'epluchage') {
      ctx.fillStyle = '#D6D3D1';
      ctx.beginPath();
      ctx.ellipse(0, 0, 12, 6, -0.3, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#A16207';
      ctx.fillRect(-10, 5, 20, 3);
    } else if (stId === 'broyage') {
      ctx.rotate(progress * Math.PI * 4);
      ctx.fillStyle = '#F59E0B';
      ctx.fillRect(-9, -9, 18, 18);
      ctx.fillStyle = '#78350F';
      ctx.beginPath();
      ctx.arc(0, 0, 4, 0, Math.PI * 2);
      ctx.fill();
    } else if (stId === 'fermentation') {
      ctx.fillStyle = '#A8A29E';
      this.roundRect(ctx, -11, -8, 22, 16, 4);
      ctx.fill();
      ctx.fillStyle = '#FDE68A';
      ctx.fillRect(-8, -4, 16, 6);
    } else if (stId === 'pressage') {
      ctx.fillStyle = '#94A3B8';
      ctx.fillRect(-11, -9, 22, 4);
      ctx.fillRect(-9, 5, 18, 5);
      ctx.fillStyle = '#FBBF24';
      ctx.fillRect(-4, -5, 8, 10);
    } else {
      ctx.fillStyle = '#B45309';
      ctx.beginPath();
      ctx.arc(0, 4, 11, 0, Math.PI);
      ctx.fill();
      ctx.fillStyle = '#FAF6EE';
      ctx.beginPath();
      ctx.ellipse(0, 4, 10, 4, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.75)';
      const steamY = -6 - ((this.animTime * 12) % 8);
      ctx.beginPath();
      ctx.arc(-4, steamY, 3, 0, Math.PI * 2);
      ctx.arc(4, steamY - 3, 3.5, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  private drawTruckIcon(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    type: string
  ): void {
    ctx.save();
    ctx.fillStyle = type === 'conteneur' || type === 'cargo' ? '#0EA5E9' : '#F59E0B';
    this.roundRect(ctx, x, y - 10, 34, 16, 3);
    ctx.fill();
    ctx.fillStyle = '#E2E8F0';
    ctx.fillRect(x + 34, y - 6, 11, 12);
    ctx.fillStyle = '#0F172A';
    ctx.beginPath();
    ctx.arc(x + 8, y + 7, 4.5, 0, Math.PI * 2);
    ctx.arc(x + 32, y + 7, 4.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  private drawFlowConnector(
    ctx: CanvasRenderingContext2D,
    x1: number,
    y1: number,
    x2: number,
    y2: number
  ): void {
    ctx.save();
    ctx.strokeStyle = 'rgba(251, 191, 36, 0.45)';
    ctx.lineWidth = 2;
    ctx.setLineDash([4, 4]);
    ctx.lineDashOffset = -this.animTime * 22;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
    ctx.restore();
  }

  private renderEffects(ctx: CanvasRenderingContext2D): void {
    for (let i = 0; i < PARTICLE_POOL_SIZE; i++) {
      const p = this.particles[i];
      if (!p.active) continue;
      const alpha = 1 - p.life / p.maxLife;
      ctx.globalAlpha = Math.max(0, alpha);
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    ctx.font = '700 13px "JetBrains Mono", monospace';
    ctx.textAlign = 'center';
    for (let i = 0; i < TEXT_POOL_SIZE; i++) {
      const t = this.floatingTexts[i];
      if (!t.active) continue;
      const alpha = 1 - t.life / t.maxLife;
      ctx.globalAlpha = Math.max(0, alpha);
      ctx.strokeStyle = 'rgba(20, 12, 8, 0.92)';
      ctx.lineWidth = 3.5;
      ctx.strokeText(t.text, t.x, t.y);
      ctx.fillStyle = t.color;
      ctx.fillText(t.text, t.x, t.y);
    }
    ctx.globalAlpha = 1;
  }

  private roundRect(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    h: number,
    r: number
  ): void {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  }
}
