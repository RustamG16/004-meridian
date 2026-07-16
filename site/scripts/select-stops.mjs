#!/usr/bin/env node
/**
 * Re-pick journey stops under the updated rules (Prompt 0 revision):
 *   - first⅓ + middle⅓ only (never last⅓), except forced keeps 280/328
 *   - keep 16, 52, 280, 328 (approved)
 *   - distinctness: gap > 25 vs other-clip stops; aHash Hamming ≥ 12 always
 *   - short-clip exception: in-clip first↔middle (and restaurant↔KEEP 52)
 *     cannot always clear gap>25 on a 60f clip — maximize score under aHash,
 *     flag soft gaps in the report
 *   - exclude green EXIT ranges
 * Regenerates stops-proposed.jpg and patches skin.ts. Stops for Russ approval.
 */
import { readFile, writeFile, readdir } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SITE = join(__dirname, '..');
const ROOT = join(SITE, '..');
const HERO = join(SITE, 'public', 'frames', 'hero');
const CLIPS_JSON = join(SITE, 'src', 'content', 'clips.json');
const CONTACT = join(ROOT, 'stops-proposed.jpg');
const SKIN = join(SITE, 'src', 'content', 'skin.ts');

const KEEP = new Set([16, 52, 280, 328]);
const MIN_GAP = 25; // reject if |a-b| <= MIN_GAP (hard peers)
const MIN_AHASH = 12;
const LAPLACIAN = [-1, -1, -1, -1, 8, -1, -1, -1, -1];

/** Inclusive EXIT ranges — green-pixel scan + visual confirm. */
const EXIT_RANGES = [
  [261, 269], // suite-spa: ceiling EXIT over spa corridor
  [295, 306], // sphere: EXIT over doors to the dome
];

function pad(n, w = 4) {
  return String(n).padStart(w, '0');
}

function inExit(i) {
  return EXIT_RANGES.some(([a, b]) => i >= a && i <= b);
}

function thirds(c) {
  const len = c.endIdx - c.startIdx + 1;
  const t = Math.max(1, Math.floor(len / 3));
  return {
    first: [c.startIdx, c.startIdx + t - 1],
    middle: [c.startIdx + t, c.startIdx + 2 * t - 1],
  };
}

async function scoreFrame(path) {
  const { data, info } = await sharp(path)
    .resize({ width: 320, withoutEnlargement: true })
    .grayscale()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const { data: lap, info: lapInfo } = await sharp(data, {
    raw: { width: info.width, height: info.height, channels: 1 },
  })
    .convolve({ width: 3, height: 3, kernel: LAPLACIAN })
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

async function aHash(path) {
  const { data } = await sharp(path)
    .resize(8, 8, { fit: 'fill' })
    .grayscale()
    .raw()
    .toBuffer({ resolveWithObject: true });
  let sum = 0;
  for (let i = 0; i < 64; i++) sum += data[i];
  const avg = sum / 64;
  let bits = 0n;
  for (let i = 0; i < 64; i++) {
    if (data[i] >= avg) bits |= 1n << BigInt(i);
  }
  return bits;
}

function hamming(a, b) {
  let x = a ^ b;
  let n = 0;
  while (x) {
    n += Number(x & 1n);
    x >>= 1n;
  }
  return n;
}

async function writeContactSheet(heroDir, stops, clipsMeta, outPath) {
  const labelOf = (idx) => {
    const c = clipsMeta.find((x) => idx >= x.startIdx && idx <= x.endIdx);
    return c ? c.label : '?';
  };
  const thumbW = 480;
  const thumbH = 270;
  const cols = 4;
  const rowsN = Math.ceil(stops.length / cols);
  const padX = 8;
  const padY = 28;
  const canvasW = cols * thumbW + (cols + 1) * padX;
  const canvasH = rowsN * (thumbH + padY) + padY;
  const composites = [];
  const svgLabels = [];
  for (let i = 0; i < stops.length; i++) {
    const idx = stops[i];
    const col = i % cols;
    const row = Math.floor(i / cols);
    const x = padX + col * (thumbW + padX);
    const y = padY + row * (thumbH + padY);
    const buf = await sharp(join(heroDir, `frame_${pad(idx + 1)}.webp`))
      .resize(thumbW, thumbH, { fit: 'cover' })
      .jpeg({ quality: 88 })
      .toBuffer();
    composites.push({ input: buf, left: x, top: y });
    const tag = KEEP.has(idx) ? ' *' : '';
    svgLabels.push(
      `<text x="${x}" y="${y - 8}" font-family="Consolas,monospace" font-size="16" fill="#F2EEE3">${idx}  ${labelOf(idx)}${tag}</text>`,
    );
  }
  const svg = Buffer.from(
    `<svg width="${canvasW}" height="${canvasH}" xmlns="http://www.w3.org/2000/svg">
      <rect width="100%" height="100%" fill="#0A0D13"/>
      ${svgLabels.join('\n')}
    </svg>`,
  );
  await sharp(svg).composite(composites).jpeg({ quality: 90 }).toFile(outPath);
}

async function patchSkin(stops) {
  let src = await readFile(SKIN, 'utf8');
  const stopsLit = `[${stops.join(', ')}]`;
  src = src.replace(/stops:\s*\[[^\]]*\]/, `stops: ${stopsLit}`);

  const chapterMap = {
    approach: 16,
    restaurant: stops.find((s) => s >= 60 && s <= 119),
    lounge: stops.find((s) => s >= 168 && s <= 227),
    suite: stops.find((s) => s >= 228 && s < 261),
    spa: 280,
    return: 328,
  };
  for (const [id, frame] of Object.entries(chapterMap)) {
    if (frame == null) continue;
    const re = new RegExp(`(id: '${id}',\\s*stopFrame: )\\d+`);
    src = src.replace(re, `$1${frame}`);
  }

  src = src.replace(
    /\/\/ Curated scroll-rest stops[\s\S]*?stops:/,
    `// Curated scroll-rest stops — 0-based. Proposal v2 (first⅓+middle⅓, aHash≥12,
    // EXIT excluded 261–269 + 295–306). Keeps: 16/52/280/328. Awaiting Russ.
    stops:`,
  );

  await writeFile(SKIN, src, 'utf8');
  console.log(`patched skin.ts stops → ${stopsLit}`);
  console.log('chapter stopFrames:', chapterMap);
}

async function main() {
  const clipsMeta = JSON.parse(await readFile(CLIPS_JSON, 'utf8'));
  const byLabel = Object.fromEntries(clipsMeta.map((c) => [c.label, c]));

  console.log('EXIT exclusion ranges:', EXIT_RANGES.map(([a, b]) => `${a}–${b}`).join(', '));
  console.log('Forced keeps:', [...KEEP].join(', '));

  const hashCache = new Map();
  const scoreCache = new Map();
  async function getHash(i) {
    if (!hashCache.has(i)) {
      hashCache.set(i, await aHash(join(HERO, `frame_${pad(i + 1)}.webp`)));
    }
    return hashCache.get(i);
  }
  async function getScore(i) {
    if (!scoreCache.has(i)) {
      scoreCache.set(i, await scoreFrame(join(HERO, `frame_${pad(i + 1)}.webp`)));
    }
    return scoreCache.get(i);
  }

  const chosen = [];
  const chosenHashes = [];
  const softPairs = []; // [a,b] pairs allowed to violate MIN_GAP
  const log = [];

  async function accept(idx, meta) {
    chosen.push(idx);
    chosenHashes.push(await getHash(idx));
    log.push({ idx, score: await getScore(idx), ...meta });
  }

  function isSoft(a, b) {
    return softPairs.some(
      ([x, y]) => (x === a && y === b) || (x === b && y === a),
    );
  }

  /**
   * softGapWith: already-chosen indices against which gap>25 is waived
   * (still aHash-checked). Used for in-clip partners + restaurant↔KEEP 52.
   */
  async function pickInRange(lo, hi, role, { softGapWith = [] } = {}) {
    const ranked = [];
    for (let i = lo; i <= hi; i++) {
      if (inExit(i)) continue;
      if (chosen.includes(i)) continue;
      ranked.push({ i, score: await getScore(i) });
    }
    ranked.sort((a, b) => b.score - a.score);
    const rejected = [];
    const hardPeers = chosen.filter((c) => !softGapWith.includes(c));
    const valid = [];

    for (const { i, score } of ranked) {
      const hash = await getHash(i);
      let why = null;
      for (const p of hardPeers) {
        if (Math.abs(i - p) <= MIN_GAP) {
          why = `gap ${Math.abs(i - p)} vs ${p}`;
          break;
        }
      }
      if (why) {
        rejected.push(`${i}(${why})`);
        continue;
      }
      for (let k = 0; k < chosen.length; k++) {
        const d = hamming(hash, chosenHashes[k]);
        if (d < MIN_AHASH) {
          why = `aHash ${d} vs ${chosen[k]}`;
          break;
        }
      }
      if (why) {
        rejected.push(`${i}(${why})`);
        continue;
      }
      const softGaps = softGapWith.map((p) => Math.abs(i - p));
      const minSoft = softGaps.length ? Math.min(...softGaps) : Infinity;
      valid.push({ i, score, minSoft });
    }

    if (!valid.length) {
      throw new Error(
        `no valid candidate for ${role} in [${lo},${hi}]; rejected=${rejected.join('; ')}`,
      );
    }

    // Prefer clearing gap>25 when possible; else balance sharpness vs soft-gap
    // (pure max-gap picks blurry third-edges — dining 151 scored 412).
    valid.sort((a, b) => {
      const aClear = a.minSoft > MIN_GAP ? 1 : 0;
      const bClear = b.minSoft > MIN_GAP ? 1 : 0;
      if (aClear !== bClear) return bClear - aClear;
      const aW = a.score + a.minSoft * 40;
      const bW = b.score + b.minSoft * 40;
      return bW - aW;
    });
    const { i, score, minSoft } = valid[0];
    for (const p of softGapWith) softPairs.push([i, p]);
    await accept(i, { role, rejected: rejected.length, softGap: minSoft });
    const softNote =
      minSoft <= MIN_GAP
        ? `  ⚠ soft-gap ${minSoft} (short-clip / keep-52 exception)`
        : '';
    console.log(
      `  ✓ ${role.padEnd(28)} → ${String(i).padStart(3)}  score=${score.toFixed(1)}` +
        (rejected.length
          ? `  (skipped ${rejected.length}: ${rejected.slice(0, 3).join(', ')}${rejected.length > 3 ? '…' : ''})`
          : '') +
        softNote,
    );
    return i;
  }

  console.log('\n── Seed approved keeps ──');
  for (const idx of [16, 52, 280, 328]) {
    await accept(idx, { role: 'KEEP', rejected: 0 });
    console.log(`  ✓ KEEP ${idx}  score=${(await getScore(idx)).toFixed(1)}`);
  }

  console.log('\n── Re-pick eight slots (first⅓ + middle⅓) ──');

  const rest = thirds(byLabel.restaurant);
  // KEEP 52 sits 8f before restaurant — hard gap makes 2 restaurant stops impossible
  const r1 = await pickInRange(...rest.first, 'restaurant first⅓', {
    softGapWith: [52],
  });
  await pickInRange(...rest.middle, 'restaurant middle⅓', {
    softGapWith: [52, r1],
  });

  const din = thirds(byLabel.dining);
  const d1 = await pickInRange(...din.first, 'dining first⅓');
  await pickInRange(...din.middle, 'dining middle⅓', { softGapWith: [d1] });

  const lng = thirds(byLabel.lounge);
  const l1 = await pickInRange(...lng.first, 'lounge first⅓');
  await pickInRange(...lng.middle, 'lounge middle⅓', { softGapWith: [l1] });

  const suite = thirds(byLabel['suite-spa']);
  await pickInRange(...suite.first, 'suite-spa first⅓');

  const sph = thirds(byLabel.sphere);
  try {
    await pickInRange(...sph.first, 'sphere first⅓', { softGapWith: [328] });
  } catch (e) {
    console.log('  ↻ sphere first⅓ exhausted — falling back to middle⅓');
    console.log(`    (${e.message.slice(0, 120)}…)`);
    await pickInRange(...sph.middle, 'sphere middle⅓', { softGapWith: [328] });
  }

  const stops = [...chosen].sort((a, b) => a - b);
  if (stops.length !== 12) {
    throw new Error(`expected 12 stops, got ${stops.length}: ${stops}`);
  }

  console.log('\n── Summary ──');
  console.log('clip         | slot                | idx  | score   | note');
  console.log('-------------|---------------------|------|---------|-----');
  for (const row of [...log].sort((a, b) => a.idx - b.idx)) {
    const clip = clipsMeta.find((c) => row.idx >= c.startIdx && row.idx <= c.endIdx);
    const note = KEEP.has(row.idx)
      ? 'approved keep'
      : row.softGap <= MIN_GAP
        ? `new · soft-gap ${row.softGap}`
        : 'new';
    console.log(
      `${(clip?.label || '?').padEnd(12)} | ${row.role.padEnd(19)} | ${String(row.idx).padStart(4)} | ${row.score.toFixed(1).padStart(7)} | ${note}`,
    );
  }
  console.log(`\nProposed stops: [${stops.join(', ')}]`);

  let ok = true;
  for (let i = 0; i < stops.length; i++) {
    for (let j = i + 1; j < stops.length; j++) {
      const gap = stops[j] - stops[i];
      const d = hamming(await getHash(stops[i]), await getHash(stops[j]));
      if (d < MIN_AHASH) {
        console.error(`  FAIL aHash ${stops[i]}↔${stops[j]} d=${d}`);
        ok = false;
      }
      if (gap <= MIN_GAP && !isSoft(stops[i], stops[j])) {
        console.error(`  FAIL hard-gap ${stops[i]}↔${stops[j]} gap=${gap}`);
        ok = false;
      } else if (gap <= MIN_GAP) {
        console.log(`  soft-gap OK ${stops[i]}↔${stops[j]} gap=${gap}`);
      }
    }
  }
  if (!ok) throw new Error('distinctness guards failed');
  console.log('distinctness: OK (aHash≥12; hard gaps >25 except documented soft pairs)');

  await patchSkin(stops);
  await writeContactSheet(HERO, stops, clipsMeta, CONTACT);
  console.log(`\nwrote ${CONTACT}`);
  console.log('\nSTOP — awaiting Russ approval of stops-proposed.jpg');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
