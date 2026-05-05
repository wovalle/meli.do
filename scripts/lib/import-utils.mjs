import { execSync } from 'child_process';
import { mkdirSync, writeFileSync } from 'fs';
import path from 'path';

export function slugify(s) {
  return s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .substring(0, 60);
}

export function detectMime(ext) {
  const map = { jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', webp: 'image/webp', avif: 'image/avif', gif: 'image/gif' };
  return map[ext.toLowerCase()] ?? 'image/jpeg';
}

export function detectExt(url) {
  const clean = url.split('?')[0];
  const m = clean.match(/\.([a-zA-Z]+)$/);
  return m ? m[1].toLowerCase() : 'jpg';
}

export async function downloadImage(url, destPath) {
  mkdirSync(path.dirname(destPath), { recursive: true });
  const resp = await fetch(url, {
    headers: { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36' },
  });
  if (!resp.ok) throw new Error(`HTTP ${resp.status} downloading ${url}`);
  const buf = await resp.arrayBuffer();
  writeFileSync(destPath, Buffer.from(buf));
}

export function uploadToR2(localPath, key, mime, dryRun = false) {
  const cmd = `npx wrangler r2 object put "meli-do-images/${key}" --file "${localPath}" --content-type "${mime}"`;
  if (dryRun) {
    console.log(`    [dry] r2 put → ${key}`);
    return;
  }
  execSync(cmd, { stdio: 'pipe' });
}

export function checkSlugExists(slug, remote = true) {
  const flag = remote ? '--remote' : '--local';
  try {
    const out = execSync(
      `npx wrangler d1 execute meli-db ${flag} --json --command "SELECT id FROM case_studies WHERE slug='${slug}' LIMIT 1"`,
      { stdio: 'pipe' }
    ).toString();
    const json = out.match(/\[[\s\S]*\]/)?.[0];
    if (!json) return false;
    return JSON.parse(json)[0]?.results?.length > 0;
  } catch {
    return false;
  }
}

export function executeSQL(sqlFile, remote = true, dryRun = false) {
  const flag = remote ? '--remote' : '--local';
  const cmd = `npx wrangler d1 execute meli-db ${flag} --file "${sqlFile}"`;
  if (dryRun) {
    console.log(`  [dry] d1 execute → ${sqlFile}`);
    return;
  }
  execSync(cmd, { stdio: 'inherit' });
}

export function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}
