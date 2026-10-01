// Layout of the social share cards, as satori element trees. Pure (no
// Workers imports) so it can be tested; og.ts renders the trees to PNG.

export const WIDTH = 1200;
export const HEIGHT = 630;

export const NAVY = '#1A2B4A';
export const LAVENDER = '#D9CFF4';
export const CREAM = '#FFF5EC';
export const HOT_PINK = '#FF1392';
export const CORAL = '#FF7F50';

/** The logo files from public/brand, as SVG source. Drawn as-is, never redrawn. */
export interface BrandSvgs {
  /** mellen-mark.svg, pink flower */
  mark: string;
  /** mellen-mark-navy.svg */
  markNavy: string;
  /** mellen-wordmark.svg, pink mark + navy text, for lavender/light */
  wordmark: string;
  /** mellen-wordmark-on-navy.svg, pink mark + lavender text, for dark photos */
  wordmarkOnNavy: string;
}

// viewBox ratios of the logo files (width / height)
const WORDMARK_RATIO = 234.25 / 47.875;

export function svgDataUri(svg: string): string {
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

export interface El {
  type: string;
  props: { style?: Record<string, unknown>; children?: unknown; src?: string; width?: number; height?: number };
}

const el = (type: string, style: Record<string, unknown>, children?: unknown): El => ({
  type,
  props: children === undefined ? { style } : { style, children },
});

const img = (svg: string, width: number, height: number, style: Record<string, unknown> = {}): El => ({
  type: 'img',
  props: { src: svgDataUri(svg), width, height, style: { width, height, ...style } },
});

const at = (svg: string, size: number, top: number, left: number) =>
  img(svg, size, size, { position: 'absolute', top, left });

const DASHED_CIRCLE = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48"><circle cx="24" cy="24" r="20" fill="none" stroke="${CORAL}" stroke-width="3" stroke-dasharray="4 6"/></svg>`;

/** Melissa's flower where the generic sparkles used to be: a big pink one, a small navy one, and the coral ring. */
function decorations(brand: BrandSvgs): El[] {
  return [
    at(brand.markNavy, 56, 68, 1014),
    at(brand.mark, 128, 206, 1026),
    at(DASHED_CIRCLE, 72, 430, 920),
  ];
}

/** The wordmark at a given height, ratio from its viewBox. */
export function wordmark(svg: string, height: number): El {
  return img(svg, Math.round(height * WORDMARK_RATIO), height);
}

export interface Badge {
  text: string;
  variant: 'cream' | 'pink';
  dot?: boolean;
}

/** A run of headline text. */
export type Segment = string | { text: string; pink?: boolean; italic?: boolean };

export interface SiteCard {
  badges: Badge[];
  /** Headline, one entry per line, each line a list of styled runs. */
  lines: Segment[][];
  fontSize: number;
  subtitle: string;
}

function badgeEl({ text, variant, dot }: Badge) {
  return el(
    'div',
    {
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      background: variant === 'pink' ? HOT_PINK : CREAM,
      color: variant === 'pink' ? CREAM : NAVY,
      borderRadius: 999,
      padding: '10px 22px',
      fontSize: 20,
      fontFamily: 'Poppins',
    },
    [
      ...(dot ? [el('div', { display: 'flex', width: 12, height: 12, borderRadius: 999, background: CORAL })] : []),
      el('div', { display: 'flex' }, text),
    ],
  );
}

function lineEl(line: Segment[], fontSize: number) {
  return el(
    'div',
    { display: 'flex' },
    line.map((seg) => {
      const s = typeof seg === 'string' ? { text: seg } : seg;
      return el(
        'div',
        {
          display: 'flex',
          whiteSpace: 'pre',
          color: s.pink ? HOT_PINK : NAVY,
          fontStyle: s.italic ? 'italic' : 'normal',
          fontSize,
        },
        s.text,
      );
    }),
  );
}

export function siteCardTree({ badges, lines, fontSize, subtitle }: SiteCard, brand: BrandSvgs): El {
  return el(
    'div',
    {
      position: 'relative',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
      width: WIDTH,
      height: HEIGHT,
      background: LAVENDER,
      padding: '56px 72px',
      fontFamily: 'Instrument Serif',
      letterSpacing: '-0.02em',
    },
    [
      ...decorations(brand),
      el('div', { display: 'flex', gap: 14 }, badges.map(badgeEl)),
      el(
        'div',
        { display: 'flex', flexDirection: 'column', lineHeight: 0.98 },
        lines.map((line) => lineEl(line, fontSize)),
      ),
      el('div', { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }, [
        el(
          'div',
          { display: 'flex', fontFamily: 'Poppins', fontSize: 24, color: 'rgba(26, 43, 74, 0.75)', letterSpacing: 0 },
          subtitle,
        ),
        wordmark(brand.wordmark, 40),
      ]),
    ],
  );
}

export interface CaseStudyCardContent {
  /** data URI of the background photo, or null for a plain navy card */
  background: string | null;
  title: string;
  subtitle: string;
}

export function caseStudyCardTree({ background, title, subtitle }: CaseStudyCardContent, brand: BrandSvgs): El {
  return el(
    'div',
    {
      position: 'relative',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'flex-end',
      width: WIDTH,
      height: HEIGHT,
      background: NAVY,
      fontFamily: 'Poppins',
    },
    [
      ...(background
        ? [
            {
              type: 'img',
              props: {
                src: background,
                width: WIDTH,
                height: HEIGHT,
                style: { position: 'absolute', top: 0, left: 0, width: WIDTH, height: HEIGHT, objectFit: 'cover' },
              },
            },
          ]
        : []),
      el('div', {
        position: 'absolute',
        top: 0,
        left: 0,
        width: WIDTH,
        height: HEIGHT,
        background:
          'linear-gradient(to top, rgba(15, 20, 36, 0.92) 0%, rgba(15, 20, 36, 0.55) 38%, rgba(15, 20, 36, 0) 68%)',
      }),
      el('div', { display: 'flex', flexDirection: 'column', padding: '64px 72px', gap: 18 }, [
        el('div', { display: 'flex', width: 88, height: 8, background: HOT_PINK, borderRadius: 999 }),
        el(
          'div',
          { display: 'flex', fontFamily: 'Instrument Serif', fontSize: 84, lineHeight: 1.02, color: '#FFF9F0' },
          title,
        ),
        el('div', { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: 32 }, [
          el('div', { display: 'flex', fontSize: 28, letterSpacing: 1, color: 'rgba(255, 249, 240, 0.85)' }, subtitle),
          wordmark(brand.wordmarkOnNavy, 36),
        ]),
      ]),
    ],
  );
}
