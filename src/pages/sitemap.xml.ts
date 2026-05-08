import type { APIRoute } from 'astro';
import { drizzle } from 'drizzle-orm/d1';
import { eq, desc } from 'drizzle-orm';
import { env } from 'cloudflare:workers';
import { caseStudies } from '../db/schema';

export const prerender = false;

const SITE = 'https://mellen.do';

const STATIC_PATHS = ['/', '/work', '/links'];

export const GET: APIRoute = async () => {
  const db = drizzle((env as { db: D1Database }).db);

  const published = await db
    .select({ slug: caseStudies.slug, updatedAt: caseStudies.updatedAt, publishedAt: caseStudies.publishedAt })
    .from(caseStudies)
    .where(eq(caseStudies.status, 'published'))
    .orderBy(desc(caseStudies.publishedAt))
    .all();

  const urls: string[] = [];

  for (const path of STATIC_PATHS) {
    urls.push(`<url><loc>${SITE}${path}</loc></url>`);
  }

  for (const s of published) {
    const lastmod = s.updatedAt ?? s.publishedAt;
    const lastmodTag = lastmod ? `<lastmod>${lastmod.toISOString()}</lastmod>` : '';
    urls.push(`<url><loc>${SITE}/work/${s.slug}</loc>${lastmodTag}</url>`);
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join('\n')}
</urlset>`;

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  });
};
