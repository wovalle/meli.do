#!/usr/bin/env node
/**
 * P4a — Import Wix portfolio into meli.do CMS
 *
 * Usage:
 *   node scripts/import-wix.mjs            # real run (remote D1 + real R2)
 *   node scripts/import-wix.mjs --dry-run  # print actions, no uploads/inserts
 *   node scripts/import-wix.mjs --local    # target local D1 (wrangler dev)
 */

import { mkdirSync, writeFileSync, existsSync } from 'fs';
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

const WIX_BASE = 'https://melissaencarnacion8.wixsite.com/mellen-portfolio';
const PORTFOLIO_URL = `${WIX_BASE}/portfolio`;
const TMP_DIR = path.join(process.cwd(), 'tmp', 'import', 'wix');
const SQL_FILE = path.join(process.cwd(), 'tmp', 'import-wix.sql');

const DRY_RUN = process.argv.includes('--dry-run');
const REMOTE = !process.argv.includes('--local');

// Melissa's Wix user media prefix — filters out UI/chrome images
const MEDIA_PREFIX = '31a255_';

async function fetchHtml(url, retries = 3) {
  const encodedUrl = new URL(url).href;
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const resp = await fetch(encodedUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
          Accept: 'text/html,application/xhtml+xml',
        },
      });
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      return resp.text();
    } catch (err) {
      if (attempt === retries) throw err;
      const wait = attempt * 2000;
      console.log(`    retry ${attempt}/${retries - 1} after ${wait}ms (${err.message})`);
      await sleep(wait);
    }
  }
}

function parseProjectUrls(html) {
  const pattern = /href="(https:\/\/melissaencarnacion8\.wixsite\.com\/mellen-portfolio\/portfolio-collections\/my-portfolio\/[^"]+)"/g;
  const seen = new Set();
  const urls = [];
  let m;
  while ((m = pattern.exec(html)) !== null) {
    if (!seen.has(m[1])) {
      seen.add(m[1]);
      urls.push(m[1]);
    }
  }
  return urls;
}

function decodeEntities(s) {
  return s
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'");
}

function parseTitle(html) {
  const og = html.match(/<meta[^>]+property="og:title"[^>]+content="([^"]+)"/i);
  if (og) return decodeEntities(og[1].replace(/\s*\|.*$/, '').trim());
  const title = html.match(/<title>([^<|]+)/i);
  if (title) return decodeEntities(title[1].trim());
  return '';
}

function parseSummary(html) {
  const og = html.match(/<meta[^>]+property="og:description"[^>]+content="([^"]+)"/i);
  if (og) return decodeEntities(og[1].trim()).substring(0, 500);
  return '';
}

function parseImageUrls(html) {
  const pattern = new RegExp(
    `https://static\\.wixstatic\\.com/media/(${MEDIA_PREFIX}[^~"'\\s<>?]+)~mv2\\.(jpg|jpeg|png|webp|gif)`,
    'gi'
  );
  // Dedupe by image hash; prefer gif > png > jpg > webp (preserve animations)
  const EXT_RANK = { gif: 0, png: 1, jpg: 2, jpeg: 2, webp: 3 };
  const byHash = new Map(); // hash → { url, ext }
  let m;
  while ((m = pattern.exec(html)) !== null) {
    const hash = m[1];
    const ext = m[2].toLowerCase();
    const url = `https://static.wixstatic.com/media/${hash}~mv2.${ext}`;
    const existing = byHash.get(hash);
    if (!existing || (EXT_RANK[ext] ?? 99) < (EXT_RANK[existing.ext] ?? 99)) {
      byHash.set(hash, { url, ext });
    }
  }
  return [...byHash.values()].map((v) => v.url);
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

async function processProject(url) {
  console.log(`\nFetching: ${url}`);

  let html;
  try {
    html = await fetchHtml(url);
  } catch (err) {
    console.warn(`  SKIP — fetch failed: ${err.message}`);
    return null;
  }

  const title = parseTitle(html);
  const summary = parseSummary(html);
  const imageUrls = parseImageUrls(html);

  if (!title) {
    console.warn('  SKIP — could not extract title');
    return null;
  }

  if (imageUrls.length === 0) {
    console.warn('  SKIP — no content images found');
    return null;
  }

  const slug = slugify(title);
  console.log(`  title: "${title}"  slug: "${slug}"  images: ${imageUrls.length}`);

  const exists = checkSlugExists(slug, REMOTE);
  if (exists) {
    console.log('  SKIP — slug already in D1');
    return null;
  }

  const caseStudyId = nanoid();
  const projectTmp = path.join(TMP_DIR, slug);
  mkdirSync(projectTmp, { recursive: true });

  const blocks = [];
  for (let i = 0; i < imageUrls.length; i++) {
    const imgUrl = imageUrls[i];
    const ext = detectExt(imgUrl);
    const blockId = nanoid();
    const r2Key = `${caseStudyId}/${blockId}.${ext}`;
    const localPath = path.join(projectTmp, `${i}.${ext}`);

    console.log(`  [${i + 1}/${imageUrls.length}] ${imgUrl.split('/').pop()}`);

    if (!DRY_RUN) {
      try {
        await downloadImage(imgUrl, localPath);
      } catch (err) {
        console.warn(`    SKIP image — ${err.message}`);
        continue;
      }
    }

    uploadToR2(localPath, r2Key, detectMime(ext), DRY_RUN);
    blocks.push({ id: blockId, position: i, imageLKey: r2Key });

    await sleep(200);
  }

  return { id: caseStudyId, slug, title, summary, blocks };
}

async function main() {
  console.log(`=== import-wix ${DRY_RUN ? '[DRY RUN] ' : ''}===`);
  console.log(`Target: ${REMOTE ? 'remote' : 'local'} D1\n`);

  mkdirSync(TMP_DIR, { recursive: true });

  console.log(`Fetching portfolio index: ${PORTFOLIO_URL}`);
  const indexHtml = await fetchHtml(PORTFOLIO_URL);
  const projectUrls = parseProjectUrls(indexHtml);
  console.log(`Found ${projectUrls.length} project links`);

  const studies = [];
  const sqlChunks = [];

  for (const projectUrl of projectUrls) {
    const result = await processProject(projectUrl);
    if (result) {
      studies.push(result);
      sqlChunks.push(buildInsertSQL(result, result.blocks));
    }
    await sleep(1200);
  }

  if (studies.length === 0) {
    console.log('\nNothing to insert.');
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
