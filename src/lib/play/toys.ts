// Config + pure logic for the small home page toys (polaroid, sparkles, sabor dial).

/* ---------- polaroid ---------- */

export interface PolaroidPhoto {
  /** R2 key served under /images/ */
  key: string;
  alt: string;
}

// TODO(melissa): add more R2 keys here (e.g. 'site/melissa-studio.jpg') and the
// polaroid will cycle through them. With one photo, only the caption changes.
export const POLAROID_PHOTOS: readonly PolaroidPhoto[] = [
  { key: 'site/melissa-headshot.jpg', alt: 'Melissa Encarnación smiling' },
];

export const POLAROID_CAPTIONS: readonly string[] = [
  "hi, it's me ✦",
  'yes, the pink is on purpose',
  'café con leche, extra sabor',
  'picking a typeface, probably',
  '10 years & still giddy',
  'hecho en Santo Domingo ♥',
];

export interface PolaroidShot {
  photo: number;
  caption: number;
}

/** Each shake/tap moves to the next caption; photos advance in step when there are several. */
export function nextPolaroidShot(current: PolaroidShot, photoCount: number, captionCount: number): PolaroidShot {
  return {
    photo: photoCount > 1 ? (current.photo + 1) % photoCount : 0,
    caption: captionCount > 0 ? (current.caption + 1) % captionCount : 0,
  };
}

/* ---------- sparkles ---------- */

export const SPARKLE_PALETTE = ['#FF1493', '#FFE484', '#FF7F50', '#B8E6D0', '#B8D7FF', '#1A2B4A'] as const;

export function nextSparkleColor(current: string): string {
  const i = SPARKLE_PALETTE.findIndex((c) => c.toLowerCase() === current.trim().toLowerCase());
  return SPARKLE_PALETTE[(i + 1) % SPARKLE_PALETTE.length] ?? SPARKLE_PALETTE[0];
}

/* ---------- sabor dial ---------- */

export const SABOR_DEFAULT = 25;

export interface Sabor {
  /** 0..1, drives the CSS var --sabor (skew + pink mix on the word) */
  level: number;
  /** marquee speed in px/s */
  marqueeSpeed: number;
}

export const MARQUEE_BASE_SPEED = 40;

/** Dial value 0..100 → effect strength. More sabor = more italic, hotter pink, faster marquee (up to 5x). */
export function saborFromDial(value: number): Sabor {
  const v = Number.isFinite(value) ? Math.min(100, Math.max(0, value)) : SABOR_DEFAULT;
  const level = v / 100;
  return { level, marqueeSpeed: MARQUEE_BASE_SPEED * (1 + level * 4) };
}
