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
  "i'm probably drinking coffee rn",
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

export const SPARKLE_PALETTE = ['#FF1392', '#FFE484', '#FF7F50', '#B8E6D0', '#B8D7FF', '#1A2B4A'] as const;

export function nextSparkleColor(current: string): string {
  const i = SPARKLE_PALETTE.findIndex((c) => c.toLowerCase() === current.trim().toLowerCase());
  return SPARKLE_PALETTE[(i + 1) % SPARKLE_PALETTE.length] ?? SPARKLE_PALETTE[0];
}

/* ---------- sabor dial ---------- */

export const SABOR_DEFAULT = 25;

export interface Sabor {
  /** 0..1, how far the word, its pink copy, the sparks and the thumb have gone (SABOR_KEYFRAMES) */
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

/**
 * Scroll-driven sabor: 0 with the page at the top, 100 once the sabor line has
 * scrolled out of view (`end` = the scrollY where that happens).
 */
export function saborFromScroll(scrollY: number, end: number): number {
  if (!(end > 0)) return 0;
  return Math.round(Math.min(1, Math.max(0, scrollY / end)) * 100);
}

/* ---------- sabor, compositor-only ---------- */
// The word, its pink copy, the ✦ pool and the dial's thumb all follow one 0..1
// progress: a CSS scroll-driven animation while the page scrolls (play.css),
// a paused Web Animation at the dial's value when a hand (or the fallback) sets it.
// Only transform and opacity ever animate. play.css repeats these keyframes for
// the scroll-driven case: keep the two in step.

export const SABOR_SKEW_DEG = 14;
export const SABOR_SPARK_COUNT = 12;
/** sparks start to show past this level; each spark of the pool switches on a step later */
export const SABOR_SPARK_FROM = 0.02;
export const SABOR_SPARK_STEP = 0.07;
/** how much of the range a spark takes to fade in once its turn comes */
export const SABOR_SPARK_FADE = 0.05;

export type SaborKeyframes = Keyframe[];

export const SABOR_KEYFRAMES = {
  /** the whole word leans further into italic */
  word: [{ transform: 'skewX(0deg)' }, { transform: `skewX(${-SABOR_SKEW_DEG}deg)` }],
  /** the pink copy fades in over the navy one… */
  pink: [{ opacity: 0 }, { opacity: 1 }],
  /** …and the navy one steps out at the very end so no navy fringe shows round the pink glyphs */
  ink: [{ opacity: 1 }, { opacity: 1, offset: 0.9 }, { opacity: 0 }],
  /** the pool of ✦ as a whole */
  sparks: [{ opacity: 0 }, { opacity: 0, offset: SABOR_SPARK_FROM }, { opacity: 1, offset: 0.25 }, { opacity: 1 }],
  /** every ✦ grows with the level */
  sparkGrow: [{ transform: 'scale(0.6)' }, { transform: 'scale(1.35)' }],
  /** the dial's drawn thumb slides along its rail */
  thumb: [{ transform: 'translateX(0%)' }, { transform: 'translateX(100%)' }],
} satisfies Record<string, SaborKeyframes>;

/** Level (0..1) at which spark `i` of the pool switches on: more sabor, more of them. */
export function sparkOnAt(i: number): number {
  return Math.min(1 - SABOR_SPARK_FADE, SABOR_SPARK_FROM + i * SABOR_SPARK_STEP);
}

/** Spark `i` fades in over [sparkOnAt(i), sparkOnAt(i) + SABOR_SPARK_FADE] of the level. */
export function sparkOnKeyframes(i: number): SaborKeyframes {
  const on = sparkOnAt(i);
  return [{ opacity: 0 }, { opacity: 0, offset: on }, { opacity: 1, offset: on + SABOR_SPARK_FADE }, { opacity: 1 }];
}

export interface SaborSpark {
  /** % of the word's box */
  left: number;
  top: number;
  /** px, before the level's scale */
  size: number;
  color: 'butter' | 'hot-pink';
  /** which twinkle path (play.css: sabor-twinkle-a/b/c) */
  path: 'a' | 'b' | 'c';
  durationMs: number;
  /** negative: every spark is already mid-twinkle on load, out of step with the others */
  delayMs: number;
  /** level at which this one switches on */
  on: number;
}

/** The fixed ✦ pool, rendered once in the markup. Seeded, so server and every load agree. */
export function saborSparkPool(random: () => number, count = SABOR_SPARK_COUNT): SaborSpark[] {
  const paths = ['a', 'b', 'c'] as const;
  return Array.from({ length: count }, (_, i) => {
    const durationMs = Math.round(900 + random() * 700);
    return {
      left: Math.round(-6 + random() * 108),
      top: Math.round(-12 + random() * 96),
      size: Math.round(10 + random() * 16),
      color: random() < 0.55 ? 'butter' : 'hot-pink',
      path: paths[i % paths.length] ?? 'a',
      durationMs,
      delayMs: -Math.round(random() * durationMs),
      on: sparkOnAt(i),
    };
  });
}
