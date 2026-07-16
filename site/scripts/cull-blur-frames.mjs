#!/usr/bin/env node
/**
 * Cull blur-run frames identified by audit-frames.mjs, then renumber survivors
 * contiguously in both hero/ and hero-mobile/ so counts stay aligned.
 *
 * Blur runs are 0-based inclusive [start, end] from the latest audit report.
 */
import { readdir, unlink, rename, mkdir } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { existsSync } from 'node:fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const DIRS = [
  join(ROOT, 'public', 'frames', 'hero'),
  join(ROOT, 'public', 'frames', 'hero-mobile'),
];

/** 0-based inclusive ranges from audit report (2026-07-16) */
const BLUR_RUNS = [
  [0, 33],
  [60, 62],
  [89, 96],
  [153, 167],
  [185, 202],
  [248, 275],
  [321, 336],
  [343, 354],
  [368, 387],
  [431, 451],
];

function shouldDelete(i) {
  return BLUR_RUNS.some(([a, b]) => i >= a && i <= b);
}

function pad(n) {
  return String(n).padStart(4, '0');
}

async function listFrames(dir) {
  return (await readdir(dir))
    .filter((f) => /^frame_\d+\.webp$/.test(f))
    .sort();
}

async function cullDir(dir) {
  const files = await listFrames(dir);
  console.log(`\n${dir}`);
  console.log(`  before: ${files.length} frames`);

  const survivors = [];
  let deleted = 0;
  for (let i = 0; i < files.length; i++) {
    if (shouldDelete(i)) {
      await unlink(join(dir, files[i]));
      deleted++;
    } else {
      survivors.push(files[i]);
    }
  }

  // Two-pass rename via temp names to avoid collisions
  const tmp = [];
  for (let i = 0; i < survivors.length; i++) {
    const src = join(dir, survivors[i]);
    const mid = join(dir, `_tmp_${pad(i + 1)}.webp`);
    await rename(src, mid);
    tmp.push(mid);
  }
  for (let i = 0; i < tmp.length; i++) {
    await rename(tmp[i], join(dir, `frame_${pad(i + 1)}.webp`));
  }

  console.log(`  deleted: ${deleted}`);
  console.log(`  after:  ${survivors.length} frames`);
  return survivors.length;
}

async function main() {
  for (const dir of DIRS) {
    if (!existsSync(dir)) {
      console.error(`Missing ${dir}`);
      process.exit(1);
    }
    await cullDir(dir);
  }
  console.log('\nDone. Re-run: npm run audit:frames');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
