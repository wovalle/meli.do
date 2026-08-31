import { env } from 'cloudflare:workers';
import { ImageResponse } from 'workers-og';

const WIDTH = 1200;
const HEIGHT = 630;

const NAVY = '#1A2B4A';
const LAVENDER = '#D9D0F5';
const CREAM = '#FFF5EC';
const HOT_PINK = '#FF1493';
const CORAL = '#FF7F50';
const BUTTER = '#FFE484';

const CACHE_HEADERS = {
  'content-type': 'image/png',
  'cache-control': 'public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800',
};

// Per-isolate font cache — Google Fonts fetches are slow and fonts never change.
const fontCache = new Map<string, Promise<ArrayBuffer>>();

/** Fetch a TTF from Google Fonts. `spec` is a css2 family spec, e.g. "Poppins:wght@500". */
function loadFont(spec: string): Promise<ArrayBuffer> {
  let cached = fontCache.get(spec);
  if (!cached) {
    cached = (async () => {
      const css = await fetch(`https://fonts.googleapis.com/css2?family=${spec}&subset=latin`, {
        // Old UA so Google serves truetype instead of woff2 (satori can't read woff2).
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Macintosh; U; Intel Mac OS X 10_6_8; de-at) AppleWebKit/533.21.1 (KHTML, like Gecko) Version/5.0.5 Safari/533.21.1',
        },
      }).then((r) => r.text());
      const url = css.match(/src: url\((.+?)\) format\('(?:opentype|truetype)'\)/)?.[1];
      if (!url) throw new Error(`Could not find font URL for ${spec}`);
      return fetch(url).then((r) => r.arrayBuffer());
    })();
    fontCache.set(spec, cached);
  }
  return cached;
}

async function baseFonts() {
  const [serif, serifItalic, poppins, kalam] = await Promise.all([
    loadFont('Instrument+Serif'),
    loadFont('Instrument+Serif:ital@1'),
    loadFont('Poppins:wght@500'),
    loadFont('Kalam'),
  ]);
  return [
    { name: 'Instrument Serif', data: serif, weight: 400 as const, style: 'normal' as const },
    { name: 'Instrument Serif', data: serifItalic, weight: 400 as const, style: 'italic' as const },
    { name: 'Poppins', data: poppins, weight: 500 as const, style: 'normal' as const },
    { name: 'Kalam', data: kalam, weight: 400 as const, style: 'normal' as const },
  ];
}

const el = (type: string, style: Record<string, unknown>, children?: unknown) => ({
  type,
  props: children === undefined ? { style } : { style, children },
});

function svgUri(svg: string): string {
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

const STAR_4PT = (fill: string) =>
  svgUri(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48"><path d="M24 2 L28 20 L46 24 L28 28 L24 46 L20 28 L2 24 L20 20 Z" fill="${fill}"/></svg>`,
  );
const SPARKLE = (fill: string) =>
  svgUri(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96"><path d="M48 6 Q 60 30 84 40 Q 60 50 48 84 Q 36 50 12 40 Q 36 30 48 6 Z" fill="${fill}"/></svg>`,
  );
const DASHED_CIRCLE = svgUri(
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48"><circle cx="24" cy="24" r="20" fill="none" stroke="${CORAL}" stroke-width="3" stroke-dasharray="4 6"/></svg>`,
);

function sparkles() {
  const deco = (src: string, size: number, top: number, left: number) => ({
    type: 'img',
    props: {
      src,
      width: size,
      height: size,
      style: { position: 'absolute', top, left, width: size, height: size },
    },
  });
  return [
    deco(STAR_4PT(HOT_PINK), 64, 64, 1010),
    deco(SPARKLE(BUTTER), 120, 210, 1030),
    deco(DASHED_CIRCLE, 72, 430, 920),
    deco(STAR_4PT(CORAL), 36, 120, 880),
  ];
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

export async function renderSiteCard({ badges, lines, fontSize, subtitle }: SiteCard): Promise<Response> {
  const fonts = await baseFonts();

  const tree = el(
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
      ...sparkles(),
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
        el('div', { display: 'flex', fontFamily: 'Kalam', fontSize: 30, color: HOT_PINK, letterSpacing: 0 }, '— mellen.do'),
      ]),
    ],
  );

  return new ImageResponse(tree as unknown as React.ReactNode, {
    width: WIDTH,
    height: HEIGHT,
    fonts,
    headers: CACHE_HEADERS,
  });
}

async function backgroundDataUri(imageKey: string): Promise<string | null> {
  const obj = await (env as { BUCKET: R2Bucket }).BUCKET.get(imageKey);
  if (!obj) return null;
  const buf = await obj.arrayBuffer();
  const type = obj.httpMetadata?.contentType ?? 'image/jpeg';
  return `data:${type};base64,${Buffer.from(buf).toString('base64')}`;
}

export interface CaseStudyCard {
  /** R2 key of the background image */
  imageKey: string;
  title: string;
  subtitle: string;
}

export async function renderCaseStudyCard({ imageKey, title, subtitle }: CaseStudyCard): Promise<Response> {
  const [bg, fonts] = await Promise.all([backgroundDataUri(imageKey), baseFonts()]);

  const tree = el(
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
      ...(bg
        ? [
            {
              type: 'img',
              props: {
                src: bg,
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
        el('div', { display: 'flex', width: 88, height: 8, background: '#FF2E88', borderRadius: 999 }),
        el(
          'div',
          { display: 'flex', fontFamily: 'Instrument Serif', fontSize: 84, lineHeight: 1.02, color: '#FFF9F0' },
          title,
        ),
        el('div', { display: 'flex', fontSize: 28, letterSpacing: 1, color: 'rgba(255, 249, 240, 0.85)' }, subtitle),
      ]),
    ],
  );

  return new ImageResponse(tree as unknown as React.ReactNode, {
    width: WIDTH,
    height: HEIGHT,
    fonts,
    headers: CACHE_HEADERS,
  });
}

/**
 * Serve an OG image through the Cache API so satori/resvg only render once
 * per URL per colo. Falls back to rendering directly where `caches` is
 * unavailable (astro dev).
 */
export async function cachedOgImage(request: Request, render: () => Promise<Response>): Promise<Response> {
  if (typeof caches === 'undefined') return render();
  const cache = caches.default;
  const cached = await cache.match(request);
  if (cached) return cached;
  const response = await render();
  if (response.ok) await cache.put(request, response.clone());
  return response;
}
