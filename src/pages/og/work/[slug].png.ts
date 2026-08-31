import type { APIRoute } from 'astro';
import { drizzle } from 'drizzle-orm/d1';
import { eq, asc } from 'drizzle-orm';
import { env } from 'cloudflare:workers';
import { caseStudies, blocks } from '../../../db/schema';
import { cachedOgImage, renderCaseStudyCard } from '../../../lib/og';

export const prerender = false;

export const GET: APIRoute = ({ params, request }) =>
  cachedOgImage(request, async () => {
    const db = drizzle((env as { db: D1Database }).db);

    const study = await db
      .select()
      .from(caseStudies)
      .where(eq(caseStudies.slug, params.slug!))
      .get();

    if (!study || study.status !== 'published') {
      return new Response('Not found', { status: 404 });
    }

    const firstBlock = await db
      .select({ imageKey: blocks.imageLKey })
      .from(blocks)
      .where(eq(blocks.caseStudyId, study.id))
      .orderBy(asc(blocks.position))
      .get();

    return renderCaseStudyCard({
      imageKey: firstBlock?.imageKey ?? 'site/melissa-headshot.jpg',
      title: study.title,
      subtitle: 'Case study — Melissa Encarnación',
    });
  });
