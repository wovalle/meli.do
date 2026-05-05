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

// Behance size variants mapped to our responsive widths.
// Confirmed working (2026-05): fs_webp (full webp), 1400 (orig format ~1400px), disp (orig format smaller).
// max_*_webp variants 302→CDN→404. Stored keys all use .webp ext; browsers render by content sniff.
const BEHANCE_SIZES = [
  { width: 1600, size: 'fs_webp' },
  { width: 800,  size: '1400'    },
  { width: 400,  size: 'disp'    },
];
const SIZE_PATTERN = /\/project_modules\/[^/]+\//;

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
  // Match any size variant — we extract the hash+ext and build all sizes ourselves
  const pattern = /https:\/\/mir-s3-cdn-cf\.behance\.net\/project_modules\/[^/]+\/([^"'\s<>]+\.(?:jpg|jpeg|png|webp|gif))/gi;
  const seen = new Set();
  const images = [];
  let m;
  while ((m = pattern.exec(html)) !== null) {
    const filename = m[1]; // e.g. "6f22aa231578247.68d6abb0e599d.png"
    if (!seen.has(filename)) {
      seen.add(filename);
      images.push(filename);
    }
  }
  return images;
}

function behanceUrl(filename, size) {
  return `https://mir-s3-cdn-cf.behance.net/project_modules/${size}/${filename}`;
}

async function resolveUrl(filename, size, fallbackSize) {
  const url = behanceUrl(filename, size);
  const resp = await fetch(url, { method: 'HEAD', headers: { 'User-Agent': 'Mozilla/5.0' } });
  if (resp.ok) return url;
  const fallbackUrl = behanceUrl(filename, fallbackSize);
  const resp2 = await fetch(fallbackUrl, { method: 'HEAD', headers: { 'User-Agent': 'Mozilla/5.0' } });
  if (resp2.ok) return fallbackUrl;
  return behanceUrl(filename, 'fs_webp');
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
  const imageFilenames = parseImageUrls(html);

  if (!title) {
    console.warn('  SKIP — could not extract title');
    return null;
  }

  if (imageFilenames.length === 0) {
    console.warn('  SKIP — no images found');
    return null;
  }

  const slug = slugify(title);
  console.log(`  title: "${title}"  slug: "${slug}"  images: ${imageFilenames.length}`);

  const exists = checkSlugExists(slug, REMOTE);
  if (exists) {
    console.log('  SKIP — slug already in D1 (Wix import likely ran first)');
    return null;
  }

  const caseStudyId = nanoid();
  const projectTmp = path.join(TMP_DIR, slug);
  mkdirSync(projectTmp, { recursive: true });

  const blocks = [];
  for (let i = 0; i < imageFilenames.length; i++) {
    const filename = imageFilenames[i];
    const origExt = detectExt(filename);
    const isGif = origExt === 'gif';
    const blockId = nanoid();
    // Behance webp variants are already webp; non-webp keep original ext
    const storeExt = isGif ? 'gif' : 'webp';
    const r2Key = `${caseStudyId}/${blockId}.${storeExt}`;

    console.log(`  [${i + 1}/${imageFilenames.length}] ${filename}${isGif ? ' (gif)' : ''}`);

    if (!DRY_RUN) {
      const sizesToFetch = isGif
        ? [{ width: 0, size: 'fs' }]
        : BEHANCE_SIZES;

      let mainUploaded = false;
      for (const { width, size } of sizesToFetch) {
        const suffix = isGif || width === BEHANCE_SIZES[0].width ? '' : `@${width}`;
        const variantKey = r2Key.replace(`.${storeExt}`, `${suffix}.${storeExt}`);
        const localPath = path.join(projectTmp, `${i}${suffix}.${storeExt}`);
        const srcUrl = isGif
          ? behanceUrl(filename, 'fs')
          : await resolveUrl(filename, size, 'max_1400_webp');
        try {
          await downloadImage(srcUrl, localPath);
          uploadToR2(localPath, variantKey, detectMime(storeExt), DRY_RUN);
          if (!mainUploaded) mainUploaded = true;
        } catch (err) {
          console.warn(`    SKIP ${width}w — ${err.message}`);
        }
        await sleep(200);
      }
      if (!mainUploaded) continue;
    } else {
      const variants = isGif ? ['(gif)'] : BEHANCE_SIZES.map((s, j) => `${s.width}w${j === 0 ? ' [main]' : ''}`);
      console.log(`    [dry] r2 put ${variants.join(', ')} → ${r2Key}`);
    }

    blocks.push({ id: blockId, position: i, imageLKey: r2Key });
    await sleep(100);
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
