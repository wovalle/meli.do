// Tiny spring + deterministic randomness shared by the home page toys.

export interface SpringConfig {
  stiffness: number;
  damping: number;
}

export interface SpringState {
  value: number;
  velocity: number;
}

export const WOBBLY: SpringConfig = { stiffness: 170, damping: 9 };

/** One semi-implicit Euler step of a damped spring towards `target`. `dt` in seconds. */
export function stepSpring(s: SpringState, target: number, dt: number, cfg: SpringConfig = WOBBLY): SpringState {
  const force = -cfg.stiffness * (s.value - target) - cfg.damping * s.velocity;
  const velocity = s.velocity + force * dt;
  return { value: s.value + velocity * dt, velocity };
}

export function isSettled(s: SpringState, target: number, eps = 0.01): boolean {
  return Math.abs(s.value - target) < eps && Math.abs(s.velocity) < eps;
}

/** mulberry32, small seeded PRNG so a scatter looks the same for the same seed. */
export function seededRandom(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export interface ScatterArea {
  /** visible area to spread over, in viewport px */
  left: number;
  top: number;
  width: number;
  height: number;
  /** tile size in px */
  tileW: number;
  tileH: number;
}

export interface ScatterTarget {
  /** top-left of the tile in viewport px */
  x: number;
  y: number;
  /** degrees */
  rotate: number;
}

/** Extra px a w×h box sticks out on each side when rotated by `deg`. */
export function rotatedOverhang(w: number, h: number, deg: number): { x: number; y: number } {
  const r = (Math.abs(deg) * Math.PI) / 180;
  return {
    x: (w * Math.cos(r) + h * Math.sin(r) - w) / 2,
    y: (w * Math.sin(r) + h * Math.cos(r) - h) / 2,
  };
}

/**
 * Where `count` proofs land when thrown across the screen: one per cell of a
 * jittered grid over the visible area (so they spread out instead of piling
 * up), shuffled, tilted, and always fully on screen, rotated corners included.
 */
export function scatterTargets(count: number, seed: number, area: ScatterArea): ScatterTarget[] {
  const rnd = seededRandom(seed);
  const cols = Math.max(1, Math.round(Math.sqrt((count * area.width) / Math.max(1, area.height))));
  const rows = Math.max(1, Math.ceil(count / cols));
  const cells = Array.from({ length: cols * rows }, (_, i) => i);
  for (let i = cells.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [cells[i], cells[j]] = [cells[j] ?? 0, cells[i] ?? 0];
  }
  const out: ScatterTarget[] = [];
  for (let i = 0; i < count; i++) {
    const cell = cells[i] ?? i;
    const rotate = (i % 2 === 0 ? -1 : 1) * (5 + rnd() * 15);
    const o = rotatedOverhang(area.tileW, area.tileH, rotate);
    const minX = area.left + o.x;
    const maxX = Math.max(minX, area.left + area.width - area.tileW - o.x);
    const minY = area.top + o.y;
    const maxY = Math.max(minY, area.top + area.height - area.tileH - o.y);
    const cx = ((cell % cols) + 0.15 + rnd() * 0.7) / cols;
    const cy = (Math.floor(cell / cols) + 0.15 + rnd() * 0.7) / rows;
    out.push({ x: minX + cx * (maxX - minX), y: minY + cy * (maxY - minY), rotate });
  }
  return out;
}

/** A spring made for throwing things: overshoots a little, settles fast. */
export const TOSS: SpringConfig = { stiffness: 140, damping: 14 };

export function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n));
}
