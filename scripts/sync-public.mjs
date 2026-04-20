#!/usr/bin/env node
// Copy .context/designs/*.html + desktop screenshots into public/.
// Idempotent. Run before wrangler dev/deploy.

import { mkdir, copyFile, readdir, rm } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const srcHtml = join(root, ".context/designs");
const srcShots = join(root, ".context/designs/screenshots");
const outRoot = join(root, "public");
const outVariations = join(outRoot, "variations");
const outPreviews = join(outRoot, "previews");

async function ensureDir(p) {
  await mkdir(p, { recursive: true });
}

async function wipeDir(p) {
  if (existsSync(p)) await rm(p, { recursive: true, force: true });
  await ensureDir(p);
}

async function main() {
  await ensureDir(outRoot);
  await wipeDir(outVariations);
  await wipeDir(outPreviews);

  const htmlFiles = (await readdir(srcHtml)).filter((f) => f.endsWith(".html"));
  for (const f of htmlFiles) {
    await copyFile(join(srcHtml, f), join(outVariations, f));
  }

  const shots = (await readdir(srcShots)).filter((f) => f.endsWith("-full.png"));
  for (const f of shots) {
    await copyFile(join(srcShots, f), join(outPreviews, f));
  }

  console.log(
    `synced ${htmlFiles.length} html + ${shots.length} previews → public/`
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
