# MERIDIAN — Autonomous improvement session (auto mode, run until credit limit)

You are improving `lab/004-meridian/site` — an Astro 4 + Lenis scroll-scrub resort site
(THE MERIDIAN, fictional alpine lakeside resort). Canvas flipbook scrubber over a 6-clip
chained drone tour, skin-driven content (`src/content/skin.ts`). Work in priority order
below. Do NOT stop after phase 1 — keep iterating through the backlog until you run out
of budget. Commit per milestone, log every finding to `LOG.md` (one line, tagged).

## Hard laws — never violate
1. **One-continuous-video law.** No dissolves/crossfades anywhere in the scrubbed frame
   sequence. A blended frame becomes a stuck blurred frame when the user pauses on it.
   Joins between clips must be frame-locked (clip N last frame ≈ clip N+1 first frame)
   or motion-interpolated (optical flow), never opacity-blended. See `DRONE-SHOT-RECIPE.md`
   and `playbook/LEARNINGS.md` #014.
2. **Template law.** Engine scripts (`flipbook.js`, `journey.js`, `ui.js`, `menu.js`,
   `gallery.js`) are shared with lab/003. Property content lives ONLY in `skin.ts`,
   `index.astro` section composition, CSS modules, and `public/media|frames`. Engine
   changes are allowed only for real bugs — mark them `[ENGINE-GAP]` in LOG.md for backport.
3. **Never bend the story to available images.** If a section or the suites page needs an
   image that doesn't exist, use a styled placeholder (ink `#091D1E` panel + champagne
   `#D5BE86` label) and append a precise generation prompt to `generation-sheet.md` under
   a `## NEEDED — <date>` heading. Russ generates images cheaply on demand. Do not
   substitute a wrong-but-existing image, do not cut the section.
4. **You cannot generate images or video.** Only re-process existing sources in
   `assets-in/` (ffmpeg path is set inside `scripts/assemble-journey.py`).
5. **Verify in a real browser** (Playwright or dev server + screenshots) after every
   phase. `npx astro build` must pass before every commit. Never claim a fix you didn't
   watch working while scrubbing.

## Phase 0 — Ground truth (do first, ~15 min)
- `npm run dev` in `site/`, open it, scrub the full tour slowly and fast. Record what
  actually freezes and where (progress %, frame index).
- **Count files on disk**: `public/frames/hero/*.webp` and `hero-mobile/*.webp` MUST
  equal `journey.frames.count` (452) and `mobileCount` (200) in `skin.ts`. Check for
  numbering gaps. `dist/` currently holds a stale 426-frame build — ignore/rebuild it.
- Watch DevTools Network for 404s while scrubbing, and Performance for long tasks.

## Phase 1 — Hero freeze (highest priority)
Known suspects, in order:
1. **404s poison the loader.** In `flipbook.js` `load()`, a failed image never clears
   `inflight`, never enters `loaded`, and `nearestLoaded()` then sticks — scrub appears
   frozen. Add an error path (clear `inflight`, mark index dead, skip it in
   `nearestLoaded`). Fix any count mismatch at the source: generate a frame **manifest at
   build time from the actual files** (small Astro integration or prebuild script) instead
   of trusting a hand-typed `count`.
2. **Network waterfall.** 452 × ~140 KB with `eagerFraction: 1.0` fires everything at
   once; scrub-priority bursts (radius 12, burst 8) can still lose to hundreds of queued
   loads. Consider: cap total concurrency (~8–12), make the priority queue preempt (abort
   or deprioritize far-away inflight loads via `fetch` + `AbortController` +
   `createImageBitmap(blob)`), keep a coarse every-4th spine loaded first (already there).
3. **Main-thread decode/draw.** Already using `createImageBitmap`; verify it's actually
   taken (Chromium). Confirm the DPR-rounding resize guard still holds (past freeze cause).
4. Re-test scrubbing: fast fling to 100%, slow reverse, mid-tour jumps via menu deep-links
   (`menu.js` uses progress fractions). All must show frames within ~1 frame of target.

## Phase 2 — Joins ("transitions not perfect")
`scripts/assemble-journey.py` currently does a **6-frame crossfade** at each of the 5
joins — that violates law 1 and is visible as a smeared moment when scrubbing slowly.
- Replace crossfade joins with either: (a) hard frame-locked join (drop the blend, trust
  the keyframe-chain endpoint lock; trim 1–2 frames each side to the best PSNR/SSIM pair —
  script the pair search), or (b) ffmpeg `minterpolate` (optical flow) generating 3–5 REAL
  in-between frames — motion, not opacity. Try (a) first; use (b) only for joins where (a)
  visibly pops.
- Re-run the assembly, update the manifest, scrub every seam at low speed in the browser
  and screenshot each join region before/after. If a seam cannot be fixed in code (source
  clips genuinely disagree), log exactly which join + what new bridging clip is needed to
  `generation-sheet.md` — do not mask it with a dissolve.

## Phase 3 — Image quality
Current: desktop 1600 px / WebP q62 / 8 fps — soft on ≥1440p screens; canvas upscales.
- Re-extract desktop at **1920 px, q75–80** (keep lanczos + delogo chain), measure total
  payload; stay under ~90 MB for the full tour, ~25 MB for the coarse spine + first clip.
  If over, drop to q70 before dropping resolution.
- Consider 10–12 fps extraction for smoother scrub (more frames = smaller per-scroll
  jumps); only if payload budget allows after quality bump — quality wins over fps.
- Add a `<link rel="preload">` for frame 1 + a real poster; ensure the preloader gate
  (`meridian:first-frame`) still fires.
- Sharpen the still-image pipeline too: check `public/media/**` sizes vs render size,
  serve 2x where the layout demands it.

## Phase 4 — Rebuild the post-tour sections
Russ's verdict: current sections (facts strip, suites spread, gallery, sphere, water,
amenities grid, price, inquiry) are weak filler. Rebuild them into fewer, stronger modules.
- **Study the scraped references first**: `_token-raw/` contains Omai (Awwwards HM hotel
  site — `omai-main.js`, `omai-chunk.js`), `lasala`, `hba`, `hutstuf`. Extract their
  section patterns: full-bleed media statements, editorial type-led blocks, sticky
  image/text alternation, oversized numerals, horizontal panels. Also re-read
  `AWWWARDS-BUILD-PROMPT.md` for the original design intent.
- Target composition (adapt, don't pad): tour → **one** cinematic facts statement (huge
  Fraunces numerals, not four small counters) → suites editorial spread (feeds the suites
  page) → sphere full-bleed (keep, strengthen: text mask reveal or scroll-scale) →
  water/spa as sticky triptych or horizontal scroll panel → amenities as a typographic
  index (numbered list, hover media preview) not a bullet grid → rate + inquiry merged
  into one closing statement with the agent card.
- Every section must justify itself: a signature interaction or a strong typographic
  moment. Anything that's "three cards in a row" gets redesigned or cut.
- Respect the existing type system (Fraunces display / Manrope body), ink + champagne,
  ONE accent. Reduced-motion fallbacks for every new animation.

## Phase 5 — Suites showcase page (`/suites`)
New page, linked from nav + the suites section.
- Content = what the property sells, defined in `skin.ts` (new `suitesPage` block):
  suite categories along the story — e.g. **Lake Suite** (glass on three sides),
  **Circle Suite** (skylight master), **Presidential** (private terrace above the water) —
  each with name, one-line, facts (m², occupancy, view), rate-from, image slots
  (hero + 2 details), and an enquire link that prefills the inquiry form.
- Existing usable media: `media/suites/presidential.jpg`, `media/suites/circular.jpg`,
  `media/spaces/suite.jpg`, gallery suite shots. Everything else = placeholder + entry in
  `generation-sheet.md` (law 3). Do NOT invent suite categories from leftover images.
- Design it to the same standard: editorial, type-led, scroll-revealed; a suite "index"
  interaction (hover a name → image swap) would fit the references. Full meta/OG, and the
  journey page must keep working untouched.

## Phase 6 — Continuous improvement backlog (loop until credits run out)
Work top-down; for each item: implement → verify in browser → `astro build` → commit →
LOG.md line.
1. Mobile pass: scrub performance on 375 px viewport, chapter copy legibility over video,
   touch behavior of gallery drag, suites page on mobile.
2. Ultrawide + 4K pass: canvas cover-crop composition at 21:9, max-width rhythm of
   sections, frame sharpness at 2560 px (may motivate a 2304 px frame tier).
3. Accessibility: keyboard path through menu/form, focus states in champagne, contrast of
   `dim` text on ink, `prefers-reduced-motion` full-page audit, alt text everywhere.
4. Preloader polish: progress tied to actual coarse-spine load %, not a timer.
5. Micro-interactions: magnetic nav CTA, cursor-follow label on gallery, subtle grain
   overlay — only if 60 fps holds on mid-tier hardware.
6. SEO/meta: OG image from a hero frame, structured data (Hotel), canonical, sitemap.
7. Performance budget: Lighthouse ≥ 90 perf on the suites page (journey page is
   media-heavy by design — measure and log, don't chase the score by gutting it).
8. Backport list: collect every `[ENGINE-GAP]` into a single LOG.md entry for lab/003.

## Definition of done for any change
Scrubbed/clicked it in a running browser · no console errors · `astro build` clean ·
committed with a message naming the phase · LOG.md updated. If blocked on a taste call
with no clear winner, pick the option closest to the Omai/reference patterns and note the
alternative in LOG.md — do not stall.
