import { env } from 'cloudflare:workers';
import { ImageResponse } from 'workers-og';
// The logo files themselves, inlined at build time (never redrawn).
import mark from '../../public/brand/mellen-mark.svg?raw';
import markNavy from '../../public/brand/mellen-mark-navy.svg?raw';
import wordmarkSvg from '../../public/brand/mellen-wordmark.svg?raw';
import wordmarkOnNavy from '../../public/brand/mellen-wordmark-on-navy.svg?raw';
import { WIDTH, HEIGHT, siteCardTree, caseStudyCardTree, type BrandSvgs, type SiteCard } from './og-cards';

export type { Badge, Segment, SiteCard } from './og-cards';

const BRAND: BrandSvgs = { mark, markNavy, wordmark: wordmarkSvg, wordmarkOnNavy };

const CACHE_HEADERS = {
  'content-type': 'image/png',
  'cache-control': 'public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800',
};

// Per-isolate font cache, Google Fonts fetches are slow and fonts never change.
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
  const [serif, serifItalic, poppins] = await Promise.all([
    loadFont('Instrument+Serif'),
    loadFont('Instrument+Serif:ital@1'),
    loadFont('Poppins:wght@500'),
  ]);
  return [
    { name: 'Instrument Serif', data: serif, weight: 400 as const, style: 'normal' as const },
    { name: 'Instrument Serif', data: serifItalic, weight: 400 as const, style: 'italic' as const },
    { name: 'Poppins', data: poppins, weight: 500 as const, style: 'normal' as const },
  ];
}

function render(tree: unknown, fonts: Awaited<ReturnType<typeof baseFonts>>): Response {
  return new ImageResponse(tree as React.ReactNode, {
    width: WIDTH,
    height: HEIGHT,
    fonts,
    headers: CACHE_HEADERS,
  });
}

export async function renderSiteCard(card: SiteCard): Promise<Response> {
  return render(siteCardTree(card, BRAND), await baseFonts());
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
  const [background, fonts] = await Promise.all([backgroundDataUri(imageKey), baseFonts()]);
  return render(caseStudyCardTree({ background, title, subtitle }, BRAND), fonts);
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
