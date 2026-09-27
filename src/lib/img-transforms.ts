import { AsyncLocalStorage } from 'node:async_hooks';

// Cloudflare Image Transformations (/cdn-cgi/image/…) only exist on a zone
// (mellen.do). On *.workers.dev — the preview URLs of branch builds — every
// such URL 404s, so there we fall back to the raw /images/ route.
// The middleware records the answer per request; src/lib/img.ts reads it.

const store = new AsyncLocalStorage<boolean>();

export function supportsImageTransforms(hostname: string): boolean {
  return !hostname.endsWith('.workers.dev');
}

export function withImageTransforms<T>(enabled: boolean, fn: () => T): T {
  return store.run(enabled, fn);
}

/** false only inside a request that explicitly can't transform; defaults to true. */
export function imageTransformsEnabled(): boolean {
  return store.getStore() ?? true;
}
