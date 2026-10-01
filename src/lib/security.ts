/** Production hosts. Anything else (localhost, *.workers.dev previews, e2e) is left alone. */
const APEX = 'mellen.do';
const WWW = `www.${APEX}`;

/**
 * Where to send a request that is not on https://mellen.do, or null to serve it.
 * http → https (301) and www → apex, keeping path and query.
 */
export function canonicalRedirect(url: URL): string | null {
  if (url.hostname !== APEX && url.hostname !== WWW) return null;
  if (url.protocol === 'https:' && url.hostname === APEX) return null;
  return `https://${APEX}${url.pathname}${url.search}`;
}

/** Same set as willy.im. Static files get them from public/_headers. */
export const SECURITY_HEADERS: Record<string, string> = {
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
  'Content-Security-Policy': "frame-ancestors 'none'",
  'X-Frame-Options': 'DENY',
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), interest-cohort=()',
};

/** Adds the security headers, copying the response first if its headers are immutable (e.g. a proxied fetch). */
export function withSecurityHeaders(response: Response): Response {
  let res = response;
  try {
    res.headers.set('X-Content-Type-Options', 'nosniff');
  } catch {
    res = new Response(response.body, response);
  }
  for (const [name, value] of Object.entries(SECURITY_HEADERS)) {
    // Keep a route's own CSP if it ever sets one.
    if (name === 'Content-Security-Policy' && res.headers.has(name)) continue;
    res.headers.set(name, value);
  }
  return res;
}
