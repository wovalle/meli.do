import { sqliteTable, text, integer, index, uniqueIndex } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

export const caseStudies = sqliteTable(
  'case_studies',
  {
    id: text('id').primaryKey(),
    slug: text('slug').notNull(),
    title: text('title').notNull(),
    summary: text('summary'),
    status: text('status', { enum: ['draft', 'published'] }).notNull().default('draft'),
    createdAt: integer('created_at', { mode: 'timestamp_ms' })
      .notNull()
      .default(sql`(unixepoch() * 1000)`),
    updatedAt: integer('updated_at', { mode: 'timestamp_ms' })
      .notNull()
      .default(sql`(unixepoch() * 1000)`),
    publishedAt: integer('published_at', { mode: 'timestamp_ms' }),
  },
  (t) => ({
    slugIdx: uniqueIndex('case_studies_slug_idx').on(t.slug),
    statusIdx: index('case_studies_status_idx').on(t.status),
  }),
);

export const blocks = sqliteTable(
  'blocks',
  {
    id: text('id').primaryKey(),
    caseStudyId: text('case_study_id')
      .notNull()
      .references(() => caseStudies.id, { onDelete: 'cascade' }),
    position: integer('position').notNull(),
    layout: text('layout', { enum: ['single', 'pair'] }).notNull(),
    imageLKey: text('image_l_key').notNull(),
    imageRKey: text('image_r_key'),
    altL: text('alt_l').notNull(),
    altR: text('alt_r'),
  },
  (t) => ({
    caseIdx: index('blocks_case_idx').on(t.caseStudyId, t.position),
  }),
);

export type CaseStudy = typeof caseStudies.$inferSelect;
export type NewCaseStudy = typeof caseStudies.$inferInsert;
export type Block = typeof blocks.$inferSelect;
export type NewBlock = typeof blocks.$inferInsert;
