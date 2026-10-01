/**
 * Version stamp for the share-card URLs (`/og/*.png?v=…`).
 *
 * Cards are cached by URL: the Cache API in `cachedOgImage`, the CDN
 * (s-maxage 1 day, stale-while-revalidate 7 days) and every social platform
 * that has already scraped them. A redesigned card on an unchanged URL keeps
 * serving the old image, so bump this whenever the cards' look changes.
 */
export const OG_VERSION = '2026-10-01-logo';
