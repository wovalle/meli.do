#!/usr/bin/env node
/**
 * P4a — Import Behance portfolio into meli.do CMS
 *
 * Usage:
 *   node scripts/import-behance.mjs            # real run (remote D1 + real R2)
 *   node scripts/import-behance.mjs --dry-run  # print actions, no uploads/inserts
 *   node scripts/import-behance.mjs --local    # target local D1 (wrangler dev)
 *
 * Note: Run import-wix.mjs first. This script skips slugs already in D1.
 * Behance has 3 projects that overlap with Wix — only imports if not already present.
 */

import { mkdirSync, writeFileSync } from 'fs';
import path from 'path';
import { nanoid } from 'nanoid';
import {
  slugify,
  detectMime,
  detectExt,
  downloadImage,
  uploadToR2,
  checkSlugExists,
  executeSQL,
  sleep,
} from './lib/import-utils.mjs';

const PROJECTS = [
  'https://www.behance.net/gallery/231578247/Alkasa-Logo-y-linea-grafica-30-Anos',
  'https://www.behance.net/gallery/229654899/Estelar-Made-by-Tu-Sabe',
  'https://www.behance.net/gallery/231427501/Liquid-Beer-10-Years',
];

const TMP_DIR = path.join(process.cwd(), 'tmp', 'import', 'behance');
const SQL_FILE = path.join(process.cwd(), 'tmp', 'import-behance.sql');

const DRY_RUN = process.argv.includes('--dry-run');
const REMOTE = !process.argv.includes('--local');

// Behance CDN size segments to upgrade to full-size webp
const SIZE_PATTERN = /\/project_modules\/[^/]+\//;
const FULL_SIZE = '/project_modules/fs_webp/';

async function fetchHtml(url) {
  const resp = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
      Accept: 'text/html,application/xhtml+xml',
    },
  });
  if (!resp.ok) throw new Error(`HTTP ${resp.status} for ${url}`);
  return resp.text();
}

function parseTitle(html) {
  const og = html.match(/<meta[^>]+property="og:title"[^>]+content="([^"]+)"/i);
  if (og) return og[1].replace(/\s*-\s*[^-]+$/, '').replace(/\s*on Behance\s*$/i, '').trim();
  const title = html.match(/<title>([^<]+)/i);
  if (title) return title[1].replace(/\s*-\s*[^-]+$/, '').replace(/\s*on Behance\s*$/i, '').trim();
  return '';
}

function parseSummary(html) {
  const og = html.match(/<meta[^>]+property="og:description"[^>]+content="([^"]+)"/i);
  if (og) return og[1].trim().substring(0, 500);
  return '';
}

function parseImageUrls(html) {
  // Match all Behance CDN image URLs regardless of size variant
  const pattern = /https:\/\/mir-s3-cdn-cf\.behance\.net\/project_modules\/[^"'\s<>]+\.(?:jpg|jpeg|png|webp|gif)/gi;
  const seen = new Set();
  const urls = [];
  let m;
  while ((m = pattern.exec(html)) !== null) {
    // Upgrade to full-size variant
    const upgraded = m[0].replace(SIZE_PATTERN, FULL_SIZE);
    if (!seen.has(upgraded)) {
      seen.add(upgraded);
      urls.push({ original: m[0], full: upgraded });
    }
  }
  return urls;
}

async function tryUrl(full, original) {
  // Try full-size first, fall back to original if 404
  for (const url of [full, original]) {
    const resp = await fetch(url, {
      method: 'HEAD',
      headers: { 'User-Agent': 'Mozilla/5.0' },
    });
    if (resp.ok) return url;
  }
  return null;
}

function buildInsertSQL(study, blocks) {
  const now = Date.now();
  const lines = [];

  lines.push(`INSERT OR IGNORE INTO case_studies (id, slug, title, summary, status, featured, sort_order, created_at, updated_at) VALUES (
  '${study.id}',
  '${study.slug.replace(/'/g, "''")}',
  '${study.title.replace(/'/g, "''")}',
  ${study.summary ? `'${study.summary.replace(/'/g, "''")}'` : 'NULL'},
  'draft', 0, 0, ${now}, ${now}
);`);

  for (const b of blocks) {
    lines.push(`INSERT INTO blocks (id, case_study_id, position, layout, image_l_key, image_r_key, alt_l, alt_r) VALUES (
  '${b.id}', '${study.id}', ${b.position}, 'single', '${b.imageLKey}', NULL, '', NULL
);`);
  }

  return lines.join('\n');
}

async function processProject(projectUrl) {
  console.log(`\nFetching: ${projectUrl}`);

  let html;
  try {
    html = await fetchHtml(projectUrl);
  } catch (err) {
    console.warn(`  SKIP — fetch failed: ${err.message}`);
    return null;
  }

  const title = parseTitle(html);
  const summary = parseSummary(html);
  const imageEntries = parseImageUrls(html);

  if (!title) {
    console.warn('  SKIP — could not extract title');
    return null;
  }

  if (imageEntries.length === 0) {
    console.warn('  SKIP — no images found');
    return null;
  }

  const slug = slugify(title);
  console.log(`  title: "${title}"  slug: "${slug}"  images: ${imageEntries.length}`);

  const exists = checkSlugExists(slug, REMOTE);
  if (exists) {
    console.log('  SKIP — slug already in D1 (Wix import likely ran first)');
    return null;
  }

  const caseStudyId = nanoid();
  const projectTmp = path.join(TMP_DIR, slug);
  mkdirSync(projectTmp, { recursive: true });

  const blocks = [];
  for (let i = 0; i < imageEntries.length; i++) {
    const { full, original } = imageEntries[i];
    const blockId = nanoid();

    let resolvedUrl = full;
    if (!DRY_RUN) {
      resolvedUrl = await tryUrl(full, original) ?? original;
    }

    const ext = detectExt(resolvedUrl);
    const r2Key = `${caseStudyId}/${blockId}.${ext}`;
    const localPath = path.join(projectTmp, `${i}.${ext}`);

    console.log(`  [${i + 1}/${imageEntries.length}] ${resolvedUrl.split('/').pop()}`);

    if (!DRY_RUN) {
      try {
        await downloadImage(resolvedUrl, localPath);
      } catch (err) {
        console.warn(`    SKIP image — ${err.message}`);
        continue;
      }
    }

    uploadToR2(localPath, r2Key, detectMime(ext), DRY_RUN);
    blocks.push({ id: blockId, position: i, imageLKey: r2Key });

    await sleep(300);
  }

  return { id: caseStudyId, slug, title, summary, blocks };
}

async function main() {
  console.log(`=== import-behance ${DRY_RUN ? '[DRY RUN] ' : ''}===`);
  console.log(`Target: ${REMOTE ? 'remote' : 'local'} D1`);
  console.log(`Projects: ${PROJECTS.length}\n`);

  mkdirSync(TMP_DIR, { recursive: true });

  const studies = [];
  const sqlChunks = [];

  for (const url of PROJECTS) {
    const result = await processProject(url);
    if (result) {
      studies.push(result);
      sqlChunks.push(buildInsertSQL(result, result.blocks));
    }
    await sleep(1000);
  }

  if (studies.length === 0) {
    console.log('\nNothing to insert (all slugs already exist or no images found).');
    return;
  }

  const totalBlocks = studies.reduce((n, s) => n + s.blocks.length, 0);
  console.log(`\nPreparing SQL: ${studies.length} case studies, ${totalBlocks} blocks`);

  const sql = sqlChunks.join('\n\n');
  writeFileSync(SQL_FILE, sql);
  console.log(`SQL written → ${SQL_FILE}`);

  executeSQL(SQL_FILE, REMOTE, DRY_RUN);

  console.log('\n=== Done ===');
  console.log(`Imported: ${studies.length} case studies, ${totalBlocks} blocks`);
  for (const s of studies) {
    console.log(`  ${s.slug} (${s.blocks.length} images)`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
