#!/usr/bin/env node
/**
 * Frame sharpness audit — Laplacian variance over public/frames/hero/frame_*.webp.
 * Writes src/content/sharp-frames.json and prints a console report.
 *
 * Indices in the JSON are 0-based (frame_0001.webp → 0), matching FlipbookScrubber.
 */
import { readdir, writeFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const HERO_DIR = join(ROOT, 'public', 'frames', 'hero');
const OUT = join(ROOT, 'src', 'content', 'sharp-frames.json');

/** 3×3 Laplacian kernel (4-neighbour) */
const LAPLACIAN = [-1, -1, -1, -1, 8, -1, -1, -1, -1];
const MIN_RUN = 3; // single-frame dips do not wipe neighbors

function percentile(sorted, p) {
  if (!sorted.length) return 0;
  const i = (sorted.length - 1) * p;
  const lo = Math.floor(i);
  const hi = Math.ceil(i);
  if (lo === hi) return sorted[lo];
  return sorted[lo] * (hi - i) + sorted[hi] * (i - lo);
}

function findBlurRuns(scores, threshold) {
  const runs = [];
  let start = -1;
  for (let i = 0; i <= scores.length; i++) {
    const low = i < scores.length && scores[i] < threshold;
    if (low && start < 0) start = i;
    if (!low && start >= 0) {
      if (i - start >= MIN_RUN) runs.push([start, i - 1]);
      start = -1;
    }
  }
  return runs;
}

function inRun(i, runs) {
  return runs.some(([a, b]) => i >= a && i <= b);
}

async function scoreFrame(path) {
  // Downscale for speed — sharpness ranking is stable at ~320px width
  const { data, info } = await sharp(path)
    .resize({ width: 320, withoutEnlargement: true })
    .grayscale()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const { data: lap, info: lapInfo } = await sharp(data, {
    raw: { width: info.width, height: info.height, channels: 1 },
  })
    .convolve({
      width: 3,
      height: 3,
      kernel: LAPLACIAN,
    })
    .raw()
    .toBuffer({ resolveWithObject: true });

  const n = lapInfo.width * lapInfo.height;
  let sum = 0;
  for (let i = 0; i < n; i++) sum += lap[i];
  const mean = sum / n;
  let varSum = 0;
  for (let i = 0; i < n; i++) {
    const d = lap[i] - mean;
    varSum += d * d;
  }
  return varSum / n;
}

async function main() {
  const files = (await readdir(HERO_DIR))
    .filter((f) => /^frame_\d+\.webp$/.test(f))
    .sort();

  if (!files.length) {
    console.error(`No frames found in ${HERO_DIR}`);
    process.exit(1);
  }

  console.log(`Auditing ${files.length} frames in ${HERO_DIR}…`);
  const scores = [];
  for (let i = 0; i < files.length; i++) {
    const s = await scoreFrame(join(HERO_DIR, files[i]));
    scores.push(s);
    if ((i + 1) % 50 === 0 || i === files.length - 1) {
      console.log(`  scored ${i + 1}/${files.length}`);
    }
  }

  const sorted = [...scores].sort((a, b) => a - b);
  const threshold = percentile(sorted, 0.4);
  const blurRuns = findBlurRuns(scores, threshold);

  const sharp = [];
  for (let i = 0; i < scores.length; i++) {
    if (scores[i] >= threshold && !inRun(i, blurRuns)) sharp.push(i);
  }

  const payload = { count: files.length, sharp };
  await writeFile(OUT, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');

  const pct = ((sharp.length / files.length) * 100).toFixed(1);
  console.log('');
  console.log('── Frame sharpness report ──');
  console.log(`Total frames:  ${files.length}`);
  console.log(`Threshold:     ${threshold.toFixed(2)} (40th percentile)`);
  console.log(`Sharp:         ${sharp.length} (${pct}%)`);
  console.log(`Blur runs:     ${blurRuns.length}`);
  for (const [a, b] of blurRuns) {
    const fa = String(a + 1).padStart(4, '0');
    const fb = String(b + 1).padStart(4, '0');
    console.log(`  frame_${fa} – frame_${fb}  (${b - a + 1} frames)`);
  }
  console.log(`Wrote ${OUT}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
