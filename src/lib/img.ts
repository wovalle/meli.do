const DEFAULT_WIDTHS = [400, 800, 1600] as const;
const DEFAULT_QUALITY = 80;

function isGif(key: string): boolean {
  return key.toLowerCase().endsWith('.gif');
}

export function imgUrl(
  key: string,
  width: number,
  opts?: { quality?: number; fit?: 'scale-down' | 'cover' | 'contain'; height?: number }
): string {
  if (isGif(key) || import.meta.env.DEV) return `/images/${key}`;
  const q = opts?.quality ?? DEFAULT_QUALITY;
  const fit = opts?.fit ?? 'scale-down';
  const height = opts?.height ? `,height=${opts.height}` : '';
  return `/cdn-cgi/image/format=auto,width=${width}${height},quality=${q},fit=${fit}/images/${key}`;
}

export function imgSrcset(
  key: string,
  widths: readonly number[] = DEFAULT_WIDTHS
): string {
  if (isGif(key)) return `/images/${key}`;
  if (import.meta.env.DEV) return '';
  return widths.map((w) => `${imgUrl(key, w)} ${w}w`).join(', ');
}

export function imgSrc(key: string, width = 1200): string {
  return imgUrl(key, width);
}

/**
 * Thumbnail cropped to a fixed aspect ratio (width / height) via Cloudflare
 * fit=cover. Use for fixed-aspect cards whose source image is a different
 * shape — e.g. a landscape source in a portrait 4:5 card. Cropping at the edge
 * (instead of letting CSS object-cover crop a scale-down image) keeps the
 * declared srcset widths in step with the pixels actually painted, so the
 * browser stops under-fetching and upscaling.
 */
export function thumbSrc(key: string, width: number, aspect: number): string {
  return imgUrl(key, width, { fit: 'cover', height: Math.round(width / aspect) });
}

export function thumbSrcset(
  key: string,
  aspect: number,
  widths: readonly number[] = DEFAULT_WIDTHS
): string {
  if (isGif(key)) return `/images/${key}`;
  if (import.meta.env.DEV) return '';
  return widths.map((w) => `${thumbSrc(key, w, aspect)} ${w}w`).join(', ');
}
