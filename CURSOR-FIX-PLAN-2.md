# MERIDIAN FIX PLAN 2 — Cursor Composer Prompts (2 parts)
Run each PART as its own composer session. Paste the CONTEXT block first in both.

---

## CONTEXT (paste into both parts)

```
Project: lab/004-meridian/site (Astro, static). Dev: port 4324.
Tokens: ink #0A0D13, champagne #D5BE86, Italiana (display) + Manrope (body).
Engine: src/scripts/flipbook.js (FlipbookScrubber — do not modify), journey.js (hero scrub, Lenis),
amenities-wave.js, ui.js. Copy lives in src/content/skin.ts (TEMPLATE LAW — no copy in .astro).
Hero frames: public/frames/hero (277 frames). Sharpness data: src/content/sharp-frames.json
(produced by scripts/audit-frames.mjs — it stores per-frame indices; the script computes
Laplacian-variance scores). Known blur runs (transition/speed-boost stretches, 0-based):
39–54, 81–93, 104–115, 209–227.
Journey section: .journey { height: 1100vh } with sticky 100vh inner. Chapters fade by
data-chapter-peak progress. Reduced-motion must keep degrading gracefully.
```

---

## PART A — Hero: curated scroll stops + card-shuffle handoff

### A1 · Curated stops instead of the sharp-frame whitelist
The current snap-to-sharp settles to the nearest of 166 "sharp-ish" frames — too permissive; rests still look soft. Replace with ~12 hand-quality stops.

**Extend `scripts/audit-frames.mjs`:**
- After scoring, split the 277-frame timeline into `N = 12` equal segments.
- In each segment pick the single **highest-scoring** frame that is NOT inside a blur run (blur run = any contiguous stretch below the 60th percentile; the known runs above must all be excluded).
- Force-include frame 0 and the last non-blur frame as stops.
- Write `src/content/stops.json`: `{ count: 277, stops: [frameIndices ascending] }`.
- Console report: chosen stop indices + their scores.
- Keep `sharp-frames.json` output for reference but journey.js will stop using it.

**index.astro:** pass stops via `data-stops` on the `.journey` section (read JSON in frontmatter, same pattern as `data-sharp-frames`). Recompute each `data-chapter-peak` = progress of the nearest stop (`stopIndex / (count - 1)`), so chapter copy peaks exactly on stops.

### A2 · Snap the PAGE to stops (journey.js — surgical patch)
Replace the settle-display logic (the `settling` / `nearestSharp` block) with page snapping, so frame + copy + scroll position all land together:

- Parse `data-stops` → `stops[]` (frame indices) → `stopProgress[] = idx / (count - 1)`.
- Keep the existing velocity/idle detection (`VEL_ACTIVE`, `IDLE_MS`).
- While active: `scrubber.setProgress(p)` exactly as now.
- On idle ≥ 120 ms, if `p` is not within `±0.004` of a stop progress: call
  `lenis.scrollTo(sectionTop + nearestStopProgress * scrollRange, { duration: 0.5, easing: easeOutCubic, lock: false })`
  where `scrollRange = section.offsetHeight - innerHeight` and `sectionTop = section.offsetTop`.
  Guard with a `snapping` flag; ANY user scroll input (lenis `scroll` events with user origin, or wheel/touchstart listener) cancels via `lenis.stop()`-free approach — simply stop issuing scrollTo and let the new input win. Never snap while the section is out of view (`p <= 0 || p >= 1`).
- Delete the display-only settle code path (`settleFrom/settleTo/cancelSettle`, `nearestSharp`) — page snapping supersedes it.
- Result: it is impossible to come to rest between stops; every rest = a curated frame with its chapter copy aligned.

### A3 · Shorter journey
- `.journey` height: `1100vh → 700vh`. With 12 stops that's ~0.5 viewport of scroll per stop — roughly 10–12 wheel gestures total instead of ~20.
- Verify HUD (`FLOOR` counter) and chapter fade windows still feel right at the new density; the fade constant `(0.42 - d) * 3.6` may need widening to `(0.5 - d) * 3.2` — judge visually.

### A4 · Card-shuffle handoff into the manifesto
The section under the hero should slide up OVER the pinned last frame like a card (GSAP-style stacked-cards feel — implement with existing rAF/scroll math, no new dependency):

- `.manifesto { position: relative; z-index: 2; margin-top: -100vh; border-radius: 28px 28px 0 0; background: var(--ink); box-shadow: 0 -40px 80px rgba(0,0,0,.45); }`
  (journey keeps z-index 1; its sticky inner stays pinned through its last 100vh, so the manifesto slides over it.)
- As the manifesto covers the hero, scale the hero canvas from 1 → 0.94 and darken it with an overlay 0 → 0.5: drive both from the manifesto's `getBoundingClientRect().top / innerHeight` inside the existing journey rAF (no new loop, no ScrollTrigger).
- Journey chapter copy and HUD must be fully faded before the overlap begins (HUD already retires via `hud--off`; verify against the new -100vh overlap; adjust the retire condition to `bottom <= innerHeight * 2` if needed).
- Reduced-motion: no scale/darken, plain stacking.

### A5 · Topbar legibility
Wordmark + MENU/ENQUIRE drown on bright frames. Add a top scrim: fixed, height ~120px, `linear-gradient(rgba(10,13,19,.55), transparent)`, `pointer-events: none`, behind the topbar content (z between canvas and topbar). Keep it on all pages.

### Acceptance (Part A)
- Stop scrolling anywhere in the hero → page glides (≤0.5 s) to a curated stop; the frame shown is tack-sharp, chapter copy fully legible; ~10–12 wheel gestures traverse the hero.
- Scrolling during a snap cancels it instantly — no fighting.
- Manifesto slides over the hero like a card; hero scales/darkens beneath it.
- `astro build` clean.

---

## PART B — Amenities carousel: scroll-driven wave + layout polish

### B1 · Scroll-driven wave (replace the auto-marquee)
Rewrite `amenities-wave.js`: the track moves ONLY with scroll (like the `.rooms` hscroll pattern in index.astro's inline script), keeping the wave trajectory.

- Section becomes pinned: `.amenities-wave { height: 300vh }` with a sticky 100vh inner (`same pattern as .rooms__pin`). Kicker + title live inside the sticky top-left.
- Remove: track duplication, `SPEED/targetSpeed` drift loop, pointerenter pause logic. Keep a single set of 7 cards.
- On scroll (reuse the existing rAF or the shared hscroll handler): section progress `p` (0–1) → `translateX = -p * (track.scrollWidth - viewport + endPadding)`, so cards enter from the right and exit left as you scroll down.
- Wave stays: per card `ty = AMP * sin((baseLeft - offsetX) / LAMBDA + phase)` — same constants (AMP 24, LAMBDA 280, PHASE_STEP 0.9), now driven by the scroll offset. Transform-only, no layout thrash.
- Fallback (reduced-motion or coarse pointer): unpinned static section, native `overflow-x` scroll-snap row — keep the existing `is-static` path.
- Cards keep number / image / name / line / `EXPLORE →` button → `/amenities/[slug]`.

### B2 · Section layout fixes (visible bugs)
- **Title wrapping:** "Everything the lake allows." currently wraps one word per line. Give the heading a proper width (`max-width: 12ch` is wrong — use `max-width: none` inside a header block spanning ~40% viewport, `text-wrap: balance`).
- **Vertical fit:** cards + 24px wave amplitude + Explore buttons must never clip at the viewport bottom. Size cards so `card height + 2*AMP + section header ≤ 100vh` (shrink image ratio to 4:5 at ~300px wide desktop if needed); add safe padding under the band.
- **Stagger baseline:** cards may start at alternating base offsets (±20px) so the wave reads immediately, but all cards must remain fully inside the sticky viewport at every scroll position.

### B3 · Manifesto typography
Lines currently over-wrap into 3-word stacks. Fix: statement block `max-width: 26ch → ~44ch`, font-size clamp down one step so each skin.ts line renders as ONE visual line on desktop (`text-wrap: balance`; allow natural wrap ≤2 lines on mobile). Keep the champagne rule below.

### B4 · Sweep & verify
- Confirm no leftovers of removed sections (`.sphere`, `.water`, `.gallery`, `.setting`) in CSS/scripts/menu anchors.
- Check `/amenities/*` pages: header scrim from A5 present, enquiry prefill (`?amenity=`) still works.
- Mobile pass: hero (unchanged mobile frames), amenities static row swipes, manifesto readable.
- `astro build` clean; commit per part.

### Acceptance (Part B)
- Amenities cards travel right→left strictly with scroll, undulating on the wave; scrolling up reverses them. No self-movement when idle.
- Section title reads as one or two lines; nothing clips; buttons fully visible.
- Manifesto statement lines read as written in skin.ts, no broken word-stacks.
