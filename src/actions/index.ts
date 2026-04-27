import { defineAction, ActionError } from 'astro:actions';
import { z } from 'astro:schema';
import { drizzle } from 'drizzle-orm/d1';
import { eq, and, desc, asc, sql } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import { env as workerEnv } from 'cloudflare:workers';
import { caseStudies, blocks } from '../db/schema';

const ALLOWED_MIME = ['image/jpeg', 'image/png', 'image/webp', 'image/avif'] as const;
const MAX_BYTES = 10 * 1024 * 1024;
const MIME_EXT: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/avif': 'avif',
};

const slugify = (s: string): string =>
  s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .substring(0, 60);

interface Env {
  db: D1Database;
  BUCKET: R2Bucket;
}

const getEnv = (): Env => workerEnv as unknown as Env;

const getDb = () => drizzle(getEnv().db);

async function uniqueSlug(db: ReturnType<typeof getDb>, base: string, excludeId?: string): Promise<string> {
  let slug = base || nanoid(8);
  let suffix = 0;
  while (true) {
    const existing = await db
      .select({ id: caseStudies.id })
      .from(caseStudies)
      .where(eq(caseStudies.slug, slug))
      .get();
    if (!existing || existing.id === excludeId) return slug;
    suffix++;
    slug = `${base}-${suffix}`;
  }
}

async function validateImageFile(file: File): Promise<{ ext: string; mime: string }> {
  if (!ALLOWED_MIME.includes(file.type as (typeof ALLOWED_MIME)[number])) {
    throw new ActionError({
      code: 'BAD_REQUEST',
      message: `Unsupported image type: ${file.type || 'unknown'}. Use JPEG, PNG, WebP, or AVIF.`,
    });
  }
  if (file.size > MAX_BYTES) {
    throw new ActionError({
      code: 'BAD_REQUEST',
      message: `Image too large: ${(file.size / 1024 / 1024).toFixed(1)}MB. Max 10MB.`,
    });
  }
  return { ext: MIME_EXT[file.type], mime: file.type };
}

async function uploadImage(env: Env, caseStudyId: string, file: File): Promise<string> {
  const { ext, mime } = await validateImageFile(file);
  const key = `${caseStudyId}/${nanoid()}.${ext}`;
  await env.BUCKET.put(key, file.stream(), { httpMetadata: { contentType: mime } });
  return key;
}

export const server = {
  caseStudies: {
    create: defineAction({
      accept: 'form',
      input: z.object({
        title: z.string().min(1, 'Title required').max(120),
      }),
      handler: async ({ title }) => {
        const db = getDb();
        const id = nanoid();
        const slug = await uniqueSlug(db, slugify(title));
        const maxRow = await db
          .select({ max: sql<number>`COALESCE(MAX(${caseStudies.sortOrder}), -1)` })
          .from(caseStudies)
          .get();
        const sortOrder = (maxRow?.max ?? -1) + 1;
        await db.insert(caseStudies).values({ id, slug, title, sortOrder }).run();
        return { id };
      },
    }),

    updateMeta: defineAction({
      accept: 'form',
      input: z.object({
        id: z.string().min(1),
        title: z.string().min(1, 'Title required').max(120),
        slug: z.string().min(1).max(80).regex(/^[a-z0-9-]+$/, 'Slug must be lowercase letters, numbers, dashes'),
        summary: z.string().max(500).optional().or(z.literal('')),
      }),
      handler: async ({ id, title, slug, summary }) => {
        const db = getDb();
        const finalSlug = await uniqueSlug(db, slug, id);
        await db
          .update(caseStudies)
          .set({ title, slug: finalSlug, summary: summary || null, updatedAt: new Date() })
          .where(eq(caseStudies.id, id))
          .run();
        return { id, slug: finalSlug };
      },
    }),

    delete: defineAction({
      accept: 'form',
      input: z.object({ id: z.string().min(1) }),
      handler: async ({ id }) => {
        const db = getDb();
        await db.delete(caseStudies).where(eq(caseStudies.id, id)).run();
        return { ok: true };
      },
    }),

    publish: defineAction({
      accept: 'form',
      input: z.object({ id: z.string().min(1) }),
      handler: async ({ id }) => {
        const db = getDb();
        await db
          .update(caseStudies)
          .set({ status: 'published', publishedAt: new Date(), updatedAt: new Date() })
          .where(eq(caseStudies.id, id))
          .run();
        return { id };
      },
    }),

    unpublish: defineAction({
      accept: 'form',
      input: z.object({ id: z.string().min(1) }),
      handler: async ({ id }) => {
        const db = getDb();
        await db
          .update(caseStudies)
          .set({ status: 'draft', updatedAt: new Date() })
          .where(eq(caseStudies.id, id))
          .run();
        return { id };
      },
    }),

    toggleFeatured: defineAction({
      accept: 'form',
      input: z.object({ id: z.string().min(1) }),
      handler: async ({ id }) => {
        const db = getDb();
        const current = await db
          .select({ featured: caseStudies.featured })
          .from(caseStudies)
          .where(eq(caseStudies.id, id))
          .get();
        if (!current) {
          throw new ActionError({ code: 'NOT_FOUND', message: 'Case study not found' });
        }
        const next = !current.featured;
        await db
          .update(caseStudies)
          .set({ featured: next, updatedAt: new Date() })
          .where(eq(caseStudies.id, id))
          .run();
        return { id, featured: next };
      },
    }),

    move: defineAction({
      accept: 'form',
      input: z.object({
        id: z.string().min(1),
        direction: z.enum(['up', 'down']),
      }),
      handler: async ({ id, direction }) => {
        const db = getDb();
        const current = await db.select().from(caseStudies).where(eq(caseStudies.id, id)).get();
        if (!current) {
          throw new ActionError({ code: 'NOT_FOUND', message: 'Case study not found' });
        }
        const neighbor = await (direction === 'up'
          ? db
              .select()
              .from(caseStudies)
              .where(
                and(
                  eq(caseStudies.featured, current.featured),
                  sql`${caseStudies.sortOrder} < ${current.sortOrder}`,
                ),
              )
              .orderBy(desc(caseStudies.sortOrder))
              .limit(1)
          : db
              .select()
              .from(caseStudies)
              .where(
                and(
                  eq(caseStudies.featured, current.featured),
                  sql`${caseStudies.sortOrder} > ${current.sortOrder}`,
                ),
              )
              .orderBy(asc(caseStudies.sortOrder))
              .limit(1)
        ).get();

        if (!neighbor) {
          return { id, swapped: false };
        }

        await db.batch([
          db.update(caseStudies).set({ sortOrder: neighbor.sortOrder }).where(eq(caseStudies.id, current.id)),
          db.update(caseStudies).set({ sortOrder: current.sortOrder }).where(eq(caseStudies.id, neighbor.id)),
        ]);

        return { id, swapped: true };
      },
    }),
  },

  blocks: {
    add: defineAction({
      accept: 'form',
      input: z
        .object({
          caseStudyId: z.string().min(1),
          layout: z.enum(['single', 'pair']),
          fileL: z.instanceof(File),
          altL: z.string().min(1, 'Alt text required'),
          fileR: z.instanceof(File).optional(),
          altR: z.string().optional(),
        })
        .superRefine((data, ctx) => {
          if (data.layout === 'pair') {
            if (!data.fileR || data.fileR.size === 0) {
              ctx.addIssue({ code: 'custom', path: ['fileR'], message: 'Right image required for pair layout' });
            }
            if (!data.altR) {
              ctx.addIssue({ code: 'custom', path: ['altR'], message: 'Right alt required for pair layout' });
            }
          }
        }),
      handler: async ({ caseStudyId, layout, fileL, altL, fileR, altR }) => {
        const env = getEnv();
        const db = getDb();

        const [maxRow, imageLKey, imageRKey] = await Promise.all([
          db
            .select({ max: sql<number>`COALESCE(MAX(${blocks.position}), -1)` })
            .from(blocks)
            .where(eq(blocks.caseStudyId, caseStudyId))
            .get(),
          uploadImage(env, caseStudyId, fileL),
          layout === 'pair' && fileR ? uploadImage(env, caseStudyId, fileR) : Promise.resolve(null),
        ]);
        const position = (maxRow?.max ?? -1) + 1;

        const id = nanoid();
        await db
          .insert(blocks)
          .values({
            id,
            caseStudyId,
            position,
            layout,
            imageLKey,
            imageRKey,
            altL,
            altR: layout === 'pair' ? altR ?? null : null,
          })
          .run();

        await db
          .update(caseStudies)
          .set({ updatedAt: new Date() })
          .where(eq(caseStudies.id, caseStudyId))
          .run();

        return { id, caseStudyId };
      },
    }),

    move: defineAction({
      accept: 'form',
      input: z.object({
        id: z.string().min(1),
        direction: z.enum(['up', 'down']),
      }),
      handler: async ({ id, direction }) => {
        const db = getDb();
        const current = await db.select().from(blocks).where(eq(blocks.id, id)).get();
        if (!current) {
          throw new ActionError({ code: 'NOT_FOUND', message: 'Block not found' });
        }
        const neighbor = await (direction === 'up'
          ? db
              .select()
              .from(blocks)
              .where(and(eq(blocks.caseStudyId, current.caseStudyId), sql`${blocks.position} < ${current.position}`))
              .orderBy(desc(blocks.position))
              .limit(1)
          : db
              .select()
              .from(blocks)
              .where(and(eq(blocks.caseStudyId, current.caseStudyId), sql`${blocks.position} > ${current.position}`))
              .orderBy(asc(blocks.position))
              .limit(1)
        ).get();

        if (!neighbor) {
          return { id, caseStudyId: current.caseStudyId, swapped: false };
        }

        await db.batch([
          db.update(blocks).set({ position: neighbor.position }).where(eq(blocks.id, current.id)),
          db.update(blocks).set({ position: current.position }).where(eq(blocks.id, neighbor.id)),
        ]);

        return { id, caseStudyId: current.caseStudyId, swapped: true };
      },
    }),

    delete: defineAction({
      accept: 'form',
      input: z.object({ id: z.string().min(1) }),
      handler: async ({ id }) => {
        const db = getDb();
        const block = await db.select({ caseStudyId: blocks.caseStudyId }).from(blocks).where(eq(blocks.id, id)).get();
        if (!block) {
          throw new ActionError({ code: 'NOT_FOUND', message: 'Block not found' });
        }
        await db.delete(blocks).where(eq(blocks.id, id)).run();
        return { caseStudyId: block.caseStudyId };
      },
    }),

    updateAlt: defineAction({
      accept: 'form',
      input: z.object({
        id: z.string().min(1),
        altL: z.string().min(1, 'Alt text required'),
        altR: z.string().optional(),
      }),
      handler: async ({ id, altL, altR }) => {
        const db = getDb();
        const block = await db.select().from(blocks).where(eq(blocks.id, id)).get();
        if (!block) {
          throw new ActionError({ code: 'NOT_FOUND', message: 'Block not found' });
        }
        await db
          .update(blocks)
          .set({ altL, altR: block.layout === 'pair' ? altR ?? null : null })
          .where(eq(blocks.id, id))
          .run();
        return { caseStudyId: block.caseStudyId };
      },
    }),
  },
};
