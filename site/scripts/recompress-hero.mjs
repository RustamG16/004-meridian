#!/usr/bin/env node
/** Recompress desktop hero frames to hit ~20 MB payload. Mobile untouched. */
import { readdir, mkdir, rm, copyFile, unlink, rename, stat } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { existsSync } from 'node:fs';
import sharp from 'sharp';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const DIR = join(ROOT, 'public', 'frames', 'hero');
const STAGING = join(DIR, '_staging');
const QUALITY = 60;

async function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function replace(src, dest) {
  for (let attempt = 0; attempt < 8; attempt++) {
    try {
      if (existsSync(dest)) await unlink(dest);
      await rename(src, dest);
      return;
    } catch (err) {
      if (err.code !== 'EBUSY' && err.code !== 'EPERM') throw err;
      await sleep(80 * (attempt + 1));
    }
  }
  // last resort: copy + unlink
  await copyFile(src, dest);
  try { await unlink(src); } catch { /* leave staging junk */ }
}

async function main() {
  const files = (await readdir(DIR))
    .filter((f) => /^frame_\d+\.webp$/.test(f))
    .sort();

  if (existsSync(STAGING)) await rm(STAGING, { recursive: true, force: true });
  await mkdir(STAGING);

  console.log(`Recompressing ${files.length} → staging (q${QUALITY})…`);
  let total = 0;
  for (let i = 0; i < files.length; i++) {
    const out = join(STAGING, files[i]);
    await sharp(join(DIR, files[i]))
      .webp({ quality: QUALITY, effort: 4 })
      .toFile(out);
    total += (await stat(out)).size;
    if ((i + 1) % 50 === 0 || i === files.length - 1) {
      console.log(`  ${i + 1}/${files.length}`);
    }
  }
  console.log(`Staging total: ${(total / 1e6).toFixed(1)} MB`);

  console.log('Swapping into place…');
  for (const f of files) {
    await replace(join(STAGING, f), join(DIR, f));
  }
  await rm(STAGING, { recursive: true, force: true });

  let final = 0;
  for (const f of files) final += (await stat(join(DIR, f))).size;
  console.log(`Desktop total: ${(final / 1e6).toFixed(1)} MB`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
