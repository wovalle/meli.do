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

/** mulberry32 — small seeded PRNG so a scatter looks the same for the same seed. */
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

export interface ScatterPose {
  /** fraction of the tile width */
  x: number;
  /** fraction of the tile height */
  y: number;
  /** degrees */
  rotate: number;
}

/** Where tile `count` proofs land when dropped on the table: small offsets, big tilts. */
export function scatterPoses(count: number, seed: number): ScatterPose[] {
  const rnd = seededRandom(seed);
  const poses: ScatterPose[] = [];
  for (let i = 0; i < count; i++) {
    const sign = i % 2 === 0 ? -1 : 1;
    poses.push({
      x: (rnd() - 0.5) * 0.5,
      y: (rnd() - 0.5) * 0.4,
      rotate: sign * (4 + rnd() * 12),
    });
  }
  return poses;
}

export function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n));
}
