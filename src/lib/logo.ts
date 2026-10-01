/**
 * Melissa's wordmark (public/brand/mellen-wordmark.svg) as inline markup for the
 * header, so CSS can animate the flower: its five pink paths are wrapped in
 * <g class="mark"> (global.css: mark-spin / mark-flick).
 */
export function inlineWordmark(svg: string, label = 'mellen'): string {
  const body = svg.replace(/<\?xml[^>]*>\s*/, '');
  const mark = body.match(/(?:<path\b[^>]*fill="#FF1392"[^>]*\/>\s*)+/);
  if (!mark) throw new Error('wordmark has no pink flower paths');
  return body
    .replace(mark[0], `<g class="mark">${mark[0].trim()}</g>\n`)
    .replace('<svg ', `<svg class="h-7 w-auto" role="img" aria-label="${label}" `);
}
