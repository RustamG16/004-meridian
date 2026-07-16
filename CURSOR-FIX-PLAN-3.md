# MERIDIAN FIX PLAN 3 — stepped hero, no new video. 2 composer prompts.

## CONTEXT (paste into both)
```
lab/004-meridian/site (Astro). Hero: .journey section, FlipbookScrubber (src/scripts/flipbook.js — don't modify),
journey.js drives it via Lenis. 277 frames in public/frames/hero. 11 curated stops in src/content/stops.json.
Copy/config lives in src/content/skin.ts. Tokens: ink #0A0D13, champagne #D5BE86.
Goal: one scroll gesture = one step to the next stop. Blur mid-step is intentional (reads as a speed push);
rest frames must be sharp. Some hops ALREADY have a fast push baked into the footage — code must not
double it. Keep diffs surgical; no new dependencies.
```

---

## PROMPT 0 — RUN FIRST: rebuild the frame sets (current ones are corrupt)

**Fact:** 92/277 frames in `public/frames/hero` and 120/277 in `public/frames/hero-mobile` are truncated or zero-byte (RIFF header declares more bytes than on disk — interrupted export). Undecodable frames are a major cause of the hero looking broken. Source clips are healthy: `lab/004-meridian/assets-in/VIDEOS/` — 6 mp4s, 58 s total, order: (1) Drone_POV_forward_descent (2) Drone_POV_through_restaurant (3) Drone_POV_through_dining_room (4) Camera_glide_through_resort (5) Camera_glides_through_suite_spa (6) Camera_moves_through_glass_sphere — VERIFY this order against the current chapter order in skin.ts before exporting.

Step by step:
1. **Script `scripts/export-frames.mjs`** (or .sh): for each clip in order, `ffmpeg -i clip -vf "fps=6,scale=1920:-2" -c:v libwebp -q:v 75 tmp/<clip>/f_%04d.webp`; then renumber sequentially into a temp dir as `frame_0001.webp…` (continuous numbering across clips, no dropped/duplicated frames at joins); record each clip's start index into `src/content/clips.json` (`[{clip, startIdx, endIdx}]`).
2. **Validate before installing:** every file decodes (loop with `sharp` or `ffprobe`), size > 0, RIFF-declared size == actual. Only then atomically replace `public/frames/hero/`. Same pipeline for mobile at `scale=720:-2`, fps=6.
3. **Poster:** regenerate `poster.webp` from the first healthy frame.
4. **Stop selection — 2 per clip, no repeats:** re-run the sharpness audit on the new set; within each clip pick the best-scoring frame from its first third and from its last third (12 stops total, every scene represented twice, interiors can no longer cluster). Update `journey.stops` in skin.ts and print a summary table (clip → chosen indices → scores).
5. **Contact sheet for approval:** montage the 12 chosen stops to `lab/004-meridian/stops-proposed.jpg` (label = index + clip name). STOP HERE for Russ's approval of the set before any further work.

**Acceptance:** zero undecodable frames in both sets; `clips.json` written; 12 distinct-scene stops proposed; contact sheet produced; site still builds and scrubs on the new set.

---

## PROMPT 1 — Step engine (journey.js)

Replace free scrubbing + idle-snap with **stepped playback** between the 11 stops:

1. **Hop config in skin.ts** (10 entries, index i = stop i → i+1):
```ts
journey.hops = [
  // pace: 'push' = footage is calm, code adds ease-in-out dash (dur ~800ms)
  // 'baked' = footage already has a speed boost, play LINEAR and longer (dur ~1100ms) so it isn't doubled
  { pace: 'push' }, { pace: 'baked' }, ... // I will fill real values
]
```
Defaults: push = 800 ms easeInOutCubic; baked = 1100 ms linear. Allow per-hop `durMs` override.

2. **Input → step:** inside the hero, a scroll gesture (wheel delta past threshold, touch swipe, arrow keys) triggers `goTo(stop ± 1)`. Implement as **soft-step**: drive the page with `lenis.scrollTo(stopPosition, { duration, easing })` so frames, HUD, and chapter fades all follow automatically from existing progress math. While a step animates, queue at most ONE further gesture in the same direction; opposite direction cancels and reverses immediately. Ignore micro-deltas (trackpad noise): accumulate wheel delta, fire at threshold, then dead-zone ~200 ms.

3. **Boundaries:** at stop 0 scrolling up, and stop 10 scrolling down, release normally into the page (no trap). Anchor links and menu deep-links jump to nearest stop.

4. **Chapters/HUD:** chapter peaks = stop positions (already true). HUD counts during steps as now. `data-scroll-hint` copy: "scroll — 11 floors" style hint from skin.

5. **Reduced-motion:** keep existing static poster path. Mobile/coarse pointer: steps still work off swipe; if janky, fall back to current free scrub + idle snap on touch only.

**Acceptance:** each gesture lands exactly one stop; baked hops don't feel double-fast; opposite-scroll reverses mid-step; build clean.

---

## PROMPT 2 — Quality mask: rest overlays + burst dressing

1. **Hi-res rest frames:** for each stop there will be an upscaled still at `public/frames/stops/stop_<frameIndex>.webp` (2K, provided manually — code must not fail if one is missing). At rest: absolutely-positioned `<img>` above the canvas, same cover-fit as canvas draw (replicate FlipbookScrubber's cover math: scale = max(cw/iw, ch/ih), centered), fade in 150 ms after landing. Fade out instantly when a step starts. Preload current + adjacent stops only.

2. **Speed-dash / wind-in-eyes effect** (game-map zoom feel; also masks 1080p roughness). During a step, drive an intensity value `k` = bell curve over step progress (0 at both ends, 1 mid-step; e.g. `k = sin(π·t)` with the hop's easing applied to `t`). Apply, all GPU-cheap:
   - **zoom punch:** canvas `transform: scale(1 + 0.08·k)` — dashing INTO the frame
   - **wind blur:** canvas `filter: blur(${k * 3}px)` — vision streaking at speed, sharp again on landing
   - **speed vignette:** overlay div, radial-gradient (clear center, dark edges) opacity `0 → .45·k` — tunnel vision
   - **grain lift:** grain overlay opacity ×(1 + 0.8·k)
   - direction cue: on reverse steps invert the zoom (scale 1+0.08k but from a 1.08 start — i.e. pull-back feel); keep it subtle
   Set these via CSS custom property `--burst: k` updated in the step rAF; CSS consumes it. Everything returns to identity exactly at landing (k=0) so the 2K rest overlay fades in over a clean frame. Reduced-motion: none of this.

3. **Landing tick:** on arrival, HUD floor number does a 1-frame champagne flash (CSS class, 300 ms) — signals "you've landed", makes rests feel intentional.

4. **Sweep:** delete now-dead idle-snap/settle code and sharp-frames.json wiring if unused; keep stops.json as the single source. `astro build` clean.

**Acceptance:** at every rest the visible image is the 2K still (sharp); during steps the dressing masks softness; no flash of missing overlay when a stop image is absent.

---

## MANUAL TASKS (Russ — do these in parallel, they unblock Prompt 2)
1. **Approve the 11 stops visually.** Make a contact sheet of the current stops.json frames; if any rest frame is weak, swap its index to a neighbor (±3) and note it. (Ask Claude/Cursor for a one-liner ffmpeg/montage command, or view frames directly in public/frames/hero.)
2. **Watch each hop once** (scrub the live site slowly) and fill the 10 `pace` values: does the footage between stop i and i+1 already speed-push? → `baked`, else `push`.
3. **Upscale the 11 stop frames to 2K** (Magnific/Topaz/Higgsfield image upscale — NOT video), export webp q80, name `stop_<frameIndex>.webp`, drop into `public/frames/stops/`. This alone fixes perceived image quality — users only ever rest on these 11 images.
