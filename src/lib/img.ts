const DEFAULT_WIDTHS = [400, 800, 1600] as const;
const DEFAULT_QUALITY = 80;

function isGif(key: string): boolean {
  return key.toLowerCase().endsWith('.gif');
}

export function imgUrl(
  key: string,
  width: number,
  opts?: { quality?: number; fit?: 'scale-down' | 'cover' | 'contain' }
): string {
  if (isGif(key) || import.meta.env.DEV) return `/images/${key}`;
  const q = opts?.quality ?? DEFAULT_QUALITY;
  const fit = opts?.fit ?? 'scale-down';
  return `/cdn-cgi/image/format=auto,width=${width},quality=${q},fit=${fit}/images/${key}`;
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
