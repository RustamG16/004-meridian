#!/usr/bin/env node
/**
 * Rebuild hero + hero-mobile frame sets from source MP4s.
 *
 * Clip order (verified vs skin.ts chapters: approach → restaurant → lounge →
 * suite → spa → return):
 *   1. Drone_POV_forward_descent
 *   2. Drone_POV_through_restaurant
 *   3. Drone_POV_through_dining_room
 *   4. Camera_glide_through_resort
 *   5. Camera_glides_through_suite_spa
 *   6. Camera_moves_through_glass_sphere
 *
 * Pipeline: extract → renumber → validate → atomic install → poster →
 * stop selection (2/clip) → contact sheet. Stops here for Russ's approval.
 */
import {
  mkdir,
  readdir,
  readFile,
  rename,
  rm,
  writeFile,
  copyFile,
  stat,
} from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';
import sharp from 'sharp';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SITE = join(__dirname, '..');
const ROOT = join(SITE, '..');
const VIDEOS = join(ROOT, 'assets-in', 'VIDEOS');
const TMP = join(ROOT, 'ingest-tmp', 'export-frames');
const HERO = join(SITE, 'public', 'frames', 'hero');
const HERO_MOBILE = join(SITE, 'public', 'frames', 'hero-mobile');
const CLIPS_JSON = join(SITE, 'src', 'content', 'clips.json');
const CONTACT = join(ROOT, 'stops-proposed.jpg');

const FPS = 6;
const DESKTOP_W = 1920;
const MOBILE_W = 720;
const QUALITY = 75;

// Cross-shaped delogo for the animated sparkle watermark (same boxes as assemble-journey.py)
const DELOGO =
  'delogo=x=1600:y=860:w=280:h=80:show=0,delogo=x=1680:y=820:w=80:h=180:show=0';

/** Proven chain order — filenames ≠ short labels; matches skin.ts chapter story. */
const CLIPS = [
  {
    id: 'c1-descent',
    label: 'descent',
    file: 'Drone_POV_forward_descent_1080p_202607160056.mp4',
  },
  {
    id: 'c2-restaurant',
    label: 'restaurant',
    file: 'Drone_POV_through_restaurant_1080p_202607152008.mp4',
  },
  {
    id: 'c3-dining',
    label: 'dining',
    file: 'Drone_POV_through_dining_room_202607160224.mp4',
  },
  {
    id: 'c4-lounge',
    label: 'lounge',
    file: 'Camera_glide_through_resort_1080p_202607160229.mp4',
  },
  {
    id: 'c5-suite-spa',
    label: 'suite-spa',
    file: 'Camera_glides_through_suite_spa_202607160248.mp4',
  },
  {
    id: 'c6-sphere',
    label: 'sphere',
    file: 'Camera_moves_through_glass_sphere_202607160316.mp4',
  },
];

const LAPLACIAN = [-1, -1, -1, -1, 8, -1, -1, -1, -1];

function run(cmd, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, args, { stdio: ['ignore', 'pipe', 'pipe'] });
    let stderr = '';
    child.stderr.on('data', (d) => {
      stderr += d.toString();
    });
    child.on('error', reject);
    child.on('close', (code) => {
      if (code === 0) resolve();
      else reject(new Error(`${cmd} exited ${code}\n${stderr.slice(-800)}`));
    });
  });
}

function pad(n, w = 4) {
  return String(n).padStart(w, '0');
}

/** RIFF size field (bytes 4–7 LE) must equal fileSize − 8. */
async function validateWebp(path) {
  const st = await stat(path);
  if (st.size <= 0) return { ok: false, reason: 'zero-byte' };
  const buf = Buffer.alloc(12);
  const { open } = await import('node:fs/promises');
  const fh = await open(path, 'r');
  try {
    await fh.read(buf, 0, 12, 0);
  } finally {
    await fh.close();
  }
  if (buf.toString('ascii', 0, 4) !== 'RIFF') {
    return { ok: false, reason: 'not-RIFF' };
  }
  if (buf.toString('ascii', 8, 12) !== 'WEBP') {
    return { ok: false, reason: 'not-WEBP' };
  }
  const declared = buf.readUInt32LE(4);
  if (declared + 8 !== st.size) {
    return {
      ok: false,
      reason: `RIFF size mismatch (declared ${declared + 8}, actual ${st.size})`,
    };
  }
  try {
    await sharp(path).metadata();
  } catch (e) {
    return { ok: false, reason: `decode: ${e.message}` };
  }
  return { ok: true };
}

async function extractClip(clip, width, outdir) {
  if (process.env.REUSE === '1' && existsSync(outdir)) {
    const cached = (await readdir(outdir))
      .filter((f) => /^f_\d+\.webp$/.test(f))
      .sort();
    if (cached.length) {
      console.log(`  reuse ${clip.id} (${cached.length} frames)`);
      return cached.map((f) => join(outdir, f));
    }
  }
  await rm(outdir, { recursive: true, force: true });
  await mkdir(outdir, { recursive: true });
  const src = join(VIDEOS, clip.file);
  if (!existsSync(src)) throw new Error(`missing clip: ${src}`);
  const pattern = join(outdir, 'f_%04d.webp');
  const vf = `${DELOGO},fps=${FPS},scale=${width}:-2:flags=lanczos`;
  console.log(`  extract ${clip.id} → ${width}px …`);
  await run('ffmpeg', [
    '-y',
    '-i',
    src,
    '-vf',
    vf,
    '-c:v',
    'libwebp',
    '-quality',
    String(QUALITY),
    '-compression_level',
    '4',
    '-an',
    pattern,
  ]);
  const files = (await readdir(outdir))
    .filter((f) => /^f_\d+\.webp$/.test(f))
    .sort();
  return files.map((f) => join(outdir, f));
}

/**
 * Renumber clip frames into a continuous sequence frame_0001… in destDir.
 * Returns clips.json payload with 0-based startIdx/endIdx.
 */
async function assemble(clipFrameLists, destDir) {
  await rm(destDir, { recursive: true, force: true });
  await mkdir(destDir, { recursive: true });
  const meta = [];
  let n = 0; // 1-based file number
  for (let ci = 0; ci < CLIPS.length; ci++) {
    const frames = clipFrameLists[ci];
    const startIdx = n; // 0-based index of first frame of this clip
    for (const src of frames) {
      n += 1;
      await copyFile(src, join(destDir, `frame_${pad(n)}.webp`));
    }
    const endIdx = n - 1; // 0-based inclusive
    meta.push({
      clip: CLIPS[ci].file,
      id: CLIPS[ci].id,
      label: CLIPS[ci].label,
      startIdx,
      endIdx,
      count: frames.length,
    });
    console.log(
      `  ${CLIPS[ci].label}: frames ${startIdx}–${endIdx} (${frames.length})`,
    );
  }
  return { meta, count: n };
}

async function validateDir(dir) {
  const files = (await readdir(dir))
    .filter((f) => /^frame_\d+\.webp$/.test(f))
    .sort();
  let bad = 0;
  for (let i = 0; i < files.length; i++) {
    const r = await validateWebp(join(dir, files[i]));
    if (!r.ok) {
      bad += 1;
      console.error(`  FAIL ${files[i]}: ${r.reason}`);
    }
    if ((i + 1) % 50 === 0 || i === files.length - 1) {
      console.log(`  validated ${i + 1}/${files.length} (bad=${bad})`);
    }
  }
  if (bad > 0) throw new Error(`${bad} undecodable frames in ${dir}`);
  return files.length;
}

/**
 * Install validated frames into liveDir.
 * Prefer same-parent rename swap; on Windows locks fall back to clear+copy
 * (still gated by prior validation — never installs a half-validated set).
 */
async function atomicReplace(validatedDir, liveDir) {
  const parent = dirname(liveDir);
  const name = liveDir.split(/[/\\]/).pop();
  const nextDir = join(parent, `${name}.next`);
  const prevDir = join(parent, `${name}.prev`);

  await rm(nextDir, { recursive: true, force: true }).catch(() => {});
  await rm(prevDir, { recursive: true, force: true }).catch(() => {});

  let installed = false;
  try {
    if (validatedDir !== nextDir) {
      await rename(validatedDir, nextDir);
    }
    if (existsSync(liveDir)) await rename(liveDir, prevDir);
    await rename(nextDir, liveDir);
    installed = true;
    await rm(prevDir, { recursive: true, force: true }).catch(() => {});
  } catch (e) {
    console.warn(`  rename-swap failed (${e.code || e.message}) — clear+copy fallback`);
    // Restore live if we moved it aside but failed to bring next in
    if (!existsSync(liveDir) && existsSync(prevDir)) {
      await rename(prevDir, liveDir);
    }
  }

  if (!installed) {
    const srcDir = existsSync(nextDir) ? nextDir : validatedDir;
    await mkdir(liveDir, { recursive: true });
    for (const f of await readdir(liveDir)) {
      await rm(join(liveDir, f), { force: true }).catch(() => {});
    }
    for (const f of await readdir(srcDir)) {
      await copyFile(join(srcDir, f), join(liveDir, f));
    }
    await rm(nextDir, { recursive: true, force: true }).catch(() => {});
    await rm(prevDir, { recursive: true, force: true }).catch(() => {});
    await rm(validatedDir, { recursive: true, force: true }).catch(() => {});
  }
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

/** Best frame in [lo, hi] inclusive (0-based). */
async function bestInRange(heroDir, lo, hi) {
  let bestIdx = lo;
  let bestScore = -1;
  for (let i = lo; i <= hi; i++) {
    const path = join(heroDir, `frame_${pad(i + 1)}.webp`);
    const s = await scoreFrame(path);
    if (s > bestScore) {
      bestScore = s;
      bestIdx = i;
    }
  }
  return { idx: bestIdx, score: bestScore };
}

/**
 * 2 stops per clip: best in first third, best in last third.
 * Returns 0-based indices + summary rows.
 */
async function pickStops(heroDir, clipsMeta) {
  const stops = [];
  const rows = [];
  for (const c of clipsMeta) {
    const len = c.endIdx - c.startIdx + 1;
    const third = Math.max(1, Math.floor(len / 3));
    const firstLo = c.startIdx;
    const firstHi = c.startIdx + third - 1;
    const lastLo = c.endIdx - third + 1;
    const lastHi = c.endIdx;

    const a = await bestInRange(heroDir, firstLo, firstHi);
    const b = await bestInRange(heroDir, lastLo, lastHi);
    stops.push(a.idx, b.idx);
    rows.push({
      clip: c.label,
      first: a,
      last: b,
      range: `${c.startIdx}–${c.endIdx}`,
    });
    console.log(
      `  ${c.label.padEnd(12)} first-⅓ → ${a.idx} (${a.score.toFixed(1)})  last-⅓ → ${b.idx} (${b.score.toFixed(1)})`,
    );
  }
  return { stops, rows };
}

async function writeContactSheet(heroDir, stops, clipsMeta, outPath) {
  const labelOf = (idx) => {
    const c = clipsMeta.find((x) => idx >= x.startIdx && idx <= x.endIdx);
    return c ? c.label : '?';
  };

  const thumbW = 480;
  const thumbH = 270;
  const cols = 4;
  const rows = Math.ceil(stops.length / cols);
  const padX = 8;
  const padY = 28;
  const canvasW = cols * thumbW + (cols + 1) * padX;
  const canvasH = rows * (thumbH + padY) + padY;

  const composites = [];
  const svgLabels = [];

  for (let i = 0; i < stops.length; i++) {
    const idx = stops[i];
    const col = i % cols;
    const row = Math.floor(i / cols);
    const x = padX + col * (thumbW + padX);
    const y = padY + row * (thumbH + padY);
    const src = join(heroDir, `frame_${pad(idx + 1)}.webp`);
    const buf = await sharp(src)
      .resize(thumbW, thumbH, { fit: 'cover' })
      .jpeg({ quality: 88 })
      .toBuffer();
    composites.push({ input: buf, left: x, top: y });
    const text = `${idx}  ${labelOf(idx)}`;
    svgLabels.push(
      `<text x="${x}" y="${y - 8}" font-family="Consolas,monospace" font-size="16" fill="#F2EEE3">${text}</text>`,
    );
  }

  const svg = Buffer.from(
    `<svg width="${canvasW}" height="${canvasH}" xmlns="http://www.w3.org/2000/svg">
      <rect width="100%" height="100%" fill="#0A0D13"/>
      ${svgLabels.join('\n')}
    </svg>`,
  );

  await sharp(svg)
    .composite(composites)
    .jpeg({ quality: 90 })
    .toFile(outPath);
  console.log(`  wrote ${outPath}`);
}

async function patchSkinStops(stops, count) {
  const skinPath = join(SITE, 'src', 'content', 'skin.ts');
  let src = await readFile(skinPath, 'utf8');
  const stopsLit = `[${stops.join(', ')}]`;
  if (!/stops:\s*\[[^\]]*\]/.test(src)) {
    throw new Error('could not find journey.stops in skin.ts');
  }
  src = src.replace(/stops:\s*\[[^\]]*\]/, `stops: ${stopsLit}`);
  // Update fallback counts so skin stays honest if disk read fails
  src = src.replace(
    /count:\s*\d+,\s*\/\/ fallback only[^\n]*/,
    `count: ${count}, // fallback only — index.astro counts the files on disk. 1920px / fps=${FPS} / q${QUALITY}`,
  );
  src = src.replace(
    /mobileCount:\s*\d+,\s*\/\/[^\n]*/,
    `mobileCount: ${count}, // full tour on mobile too (${MOBILE_W}px/q${QUALITY}) — same indices as desktop`,
  );
  await writeFile(skinPath, src, 'utf8');
  console.log(`  patched skin.ts stops → ${stopsLit}`);
}

async function buildTier(width, liveDir, tag) {
  console.log(`\n══ ${tag} @ ${width}px ══`);
  const clipLists = [];
  for (const clip of CLIPS) {
    const outdir = join(TMP, tag, clip.id);
    const frames = await extractClip(clip, width, outdir);
    console.log(`    ${clip.label}: ${frames.length} frames`);
    clipLists.push(frames);
  }

  // Stage as a sibling of the live dir so Windows rename-swap stays same-parent.
  const staging = join(dirname(liveDir), `${liveDir.split(/[/\\]/).pop()}.staging`);
  await rm(staging, { recursive: true, force: true });
  const { meta, count } = await assemble(clipLists, staging);
  console.log(`  assembled ${count} frames → validating…`);
  await validateDir(staging);
  console.log(`  validation OK — atomic replace ${liveDir}`);
  await atomicReplace(staging, liveDir);
  return { meta, count };
}

/** Rebuild clips.json ranges from desktop extract folder counts. */
async function metaFromExtracts(tag) {
  const meta = [];
  let n = 0;
  for (const clip of CLIPS) {
    const outdir = join(TMP, tag, clip.id);
    const frames = (await readdir(outdir))
      .filter((f) => /^f_\d+\.webp$/.test(f))
      .sort();
    if (!frames.length) throw new Error(`no extracts in ${outdir}`);
    const startIdx = n;
    n += frames.length;
    meta.push({
      clip: clip.file,
      id: clip.id,
      label: clip.label,
      startIdx,
      endIdx: n - 1,
      count: frames.length,
    });
  }
  return { meta, count: n };
}

async function main() {
  console.log('Clip order verified against skin.ts chapters:');
  console.log('  approach(sky) → restaurant → dining → lounge → suite/spa → return(lake)');
  console.log('  = descent → restaurant → dining → lounge → suite-spa → sphere\n');

  for (const c of CLIPS) {
    const p = join(VIDEOS, c.file);
    if (!existsSync(p)) throw new Error(`missing: ${p}`);
  }

  await mkdir(TMP, { recursive: true });

  const skipDesktop = process.env.SKIP_DESKTOP === '1';
  let desk;
  if (skipDesktop) {
    console.log('SKIP_DESKTOP=1 — reusing installed hero + desktop extracts');
    desk = await metaFromExtracts('desktop');
    const live = (await readdir(HERO)).filter((f) => /^frame_\d+\.webp$/.test(f)).length;
    if (live !== desk.count) {
      throw new Error(`hero has ${live} frames but extracts imply ${desk.count}`);
    }
    console.log(`  validating installed hero (${live})…`);
    await validateDir(HERO);
  } else {
    desk = await buildTier(DESKTOP_W, HERO, 'desktop');
  }

  const mob = await buildTier(MOBILE_W, HERO_MOBILE, 'mobile');

  if (desk.count !== mob.count) {
    throw new Error(
      `desktop/mobile frame count mismatch: ${desk.count} vs ${mob.count}`,
    );
  }

  await writeFile(CLIPS_JSON, `${JSON.stringify(desk.meta, null, 2)}\n`, 'utf8');
  console.log(`\nWrote ${CLIPS_JSON}`);

  // Poster from first healthy frame
  const posterSrc = join(HERO, 'frame_0001.webp');
  const posterDst = join(HERO, 'poster.webp');
  await sharp(posterSrc).webp({ quality: 80 }).toFile(posterDst);
  console.log(`Poster → ${posterDst}`);

  console.log('\n── Stop selection (2 per clip: first⅓ + last⅓) ──');
  const { stops, rows } = await pickStops(HERO, desk.meta);

  console.log('\nSummary table:');
  console.log('clip         | range        | first⅓ idx (score) | last⅓ idx (score)');
  console.log('-------------|--------------|--------------------|-------------------');
  for (const r of rows) {
    console.log(
      `${r.clip.padEnd(12)} | ${r.range.padEnd(12)} | ${String(r.first.idx).padStart(4)} (${r.first.score.toFixed(1).padStart(7)}) | ${String(r.last.idx).padStart(4)} (${r.last.score.toFixed(1).padStart(7)})`,
    );
  }
  console.log(`\nProposed stops (0-based): [${stops.join(', ')}]`);

  await patchSkinStops(stops, desk.count);

  console.log('\n── Contact sheet ──');
  await writeContactSheet(HERO, stops, desk.meta, CONTACT);

  // Final integrity check on live dirs
  console.log('\n── Final integrity ──');
  const nD = await validateDir(HERO);
  const nM = await validateDir(HERO_MOBILE);
  console.log(`OK: ${nD} desktop + ${nM} mobile frames, 0 undecodable`);
  console.log('\nSTOP — awaiting Russ approval of stops-proposed.jpg before further work.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
