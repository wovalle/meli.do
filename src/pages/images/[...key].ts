import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';

export const prerender = false;

export const GET: APIRoute = async ({ params }) => {
  const key = params.key;
  if (!key) return new Response('Not found', { status: 404 });

  const obj = await (env as { BUCKET: R2Bucket }).BUCKET.get(key);
  if (!obj) {
    if (import.meta.env.DEV) {
      const upstream = await fetch(`https://mellen.do/images/${key}`);
      if (upstream.ok) {
        const headers = new Headers();
        headers.set('content-type', upstream.headers.get('content-type') ?? 'application/octet-stream');
        headers.set('cache-control', 'public, max-age=300');
        return new Response(upstream.body, { headers });
      }
    }
    return new Response('Not found', { status: 404 });
  }

  const headers = new Headers();
  headers.set('content-type', obj.httpMetadata?.contentType ?? 'application/octet-stream');
  headers.set('cache-control', 'public, max-age=31536000, immutable');
  headers.set('etag', obj.httpEtag);

  return new Response(obj.body, { headers });
};
