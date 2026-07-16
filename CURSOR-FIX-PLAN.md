# MERIDIAN FIX PLAN — Cursor Composer Prompts
Run each PART as its own composer session, in order. Paste the CONTEXT block at the top of every session.

---

## CONTEXT (paste into every part)

```
Project: lab/004-meridian/site (Astro, static). Dev server: port 4324.
Design tokens: ink #0A0D13 bg, champagne #D5BE86 accent, Italiana (display) + Manrope (body).
Existing engine scripts: src/scripts/{journey,flipbook,gallery,menu,ui}.js — do NOT fork or rewrite engine logic; property-level tweaks only.
TEMPLATE LAW: all copy/content lives in src/content/skin.ts. Sections read from skin. Never hardcode copy in .astro files.
ONE-CONTINUOUS-VIDEO LAW: the hero scrub is one unbroken glide; no cuts/dissolves logic added in code.
Fixed header exists (Base.astro). Reduced-motion must degrade gracefully everywhere.
Keep CSS in src/styles/global.css using the existing section-module conventions (.numbers, .rooms, etc. as reference).
```

---

## PART 1 — Homepage restructure

**Goal:** new section order on `src/pages/index.astro`; remove dead sections; fix titles clipped under the fixed header.

### New section order
1. **HERO** — existing `.journey` scrub section. Keep untouched (Part 4 handles scrub behavior).
2. **MANIFESTO** (new) — kicker `THE MERIDIAN · ZELL AM SEE` + a 3-line Italiana display statement + thin champagne rule below. No image. Vertical padding generous but total height ≤ 80vh.
3. **QUICK FACTS** (replaces the current 4-screen `.numbers` section) — ONE compact row, max 35vh: four inline count-up stats with hairline dividers: `42 suites & residences · 25 m infinity pool · 1,400 m² spa · 4 restaurants & bars`. Reuse the existing count-up mechanism (`data-count`, ui.js) — small numerals (clamp ~2.5–4rem), label under each numeral. Do NOT keep the oversized one-stat-per-viewport layout.
4. **SUITES** — existing `.rooms` pinned horizontal carousel. Keep as is.
5. **DINING** (new) — 60/40 editorial split. Right: full-height image (`/media/` restaurant-entrance still — golden open doors). Left: kicker `DINING`, title, 3-line body, signature line, link `Explore the restaurant →` to `/amenities/lakeside-restaurant`. Teaser only.
6. **AMENITIES** — placeholder `<section class="amenities-wave" id="amenities"></section>` with kicker + title only; Part 2 builds the wave carousel inside it. Remove the old `.am-index` list markup + its CSS.
7. **ABOUT / STORY** (new) — quiet two-column: left kicker `THE HOUSE` + title + two short paragraphs; right one portrait-format image. Standard `data-reveal`. No parallax.
8. **ENQUIRE + FOOTER** — existing `.inquiry` section with rate + agent card. Keep.

### Remove entirely (markup + section CSS + any script wiring)
- `.numbers` (old giant version — replaced by QUICK FACTS)
- `.sphere` section
- `.water` section
- `.gallery` section (and its `data-strip` init if now unused)
- `.setting` section
- Keep `data-hscroll` script only if `.rooms` still uses it (it does).

### Title-clip fix (site-wide)
Headings currently slide under the fixed header in pinned sections (e.g. spa title "kept dark." was cut). Fix:
- Every section gets `scroll-margin-top: var(--header-h)`.
- Pinned/sticky sections: first heading block must start INSIDE the sticky pin with `padding-top: calc(var(--header-h) + 2rem)`.
- Define `--header-h` once in global.css from the real header height.

### skin.ts additions (write real placeholder copy in the established Meridian voice — restrained, lake-and-light imagery)
```ts
manifesto: { kicker, lines: [3 strings] }
factsBar: { items: [{ value, format?, suffix?, decimals?, label }] } // 4 items
dining: { kicker, title, body, signature, img, imgAlt, linkLabel, linkHref }
about: { kicker, title, paragraphs: [2 strings], img, imgAlt }
```

### Acceptance
- `astro build` clean; nav anchors (#suites, #amenities, #enquire) still resolve.
- No heading anywhere clips under the header at any scroll position.
- Homepage = exactly the 8 sections above, in order.

---

## PART 2 — Amenities wave carousel (homepage section)

**Goal:** inside `.amenities-wave`: cards float continuously right→left on a wave-like trajectory. Reference feel: sondaven.com floating collage, but as an ordered marquee.

### Data (skin.ts)
```ts
amenities: {
  kicker: 'AMENITIES',
  title: 'Everything the lake allows.',
  items: [ // exactly 7
    { slug: 'infinity-pool',        label: 'Heated rooftop infinity pool', line, facts: ['25 m', 'heated year-round'], img },
    { slug: 'panorama-spa',         label: 'Panorama spa',                 line, facts: ['1,400 m²', 'sauna · steam · cold plunge'], img },
    { slug: 'lakeside-restaurant',  label: 'Lakeside restaurant',          line, facts: ['4 venues', 'the doors are already open'], img },
    { slug: 'the-sphere',           label: 'The Sphere',                   line, facts: ['tea, under glass', 'above the water'], img },
    { slug: 'beach-boathouse',      label: 'Private beach & boathouse',    line, facts: ['own shore', 'boats on request'], img },
    { slug: 'water-gardens',        label: 'Water gardens',                line, facts: ['landscaped ponds', 'evening lights'], img },
    { slug: 'mountain-lake-guides', label: 'Mountain & lake guides',       line, facts: ['private guides', 'summer & winter'], img },
  ]
}
```
Images: use existing stills from `public/media/` (map best-fit per amenity; pool/spa/restaurant/sphere all have obvious matches).

### Layout & motion
- Section: full-bleed, min-height ~90vh, ink background, kicker + section title top-left, carousel band fills the rest.
- Cards: width ~340px desktop (4:5 image, then number `01`, name, one-line description, and a champagne **button** `Explore →`). Card bg: very slightly lifted ink (`#0E1219`), 1px hairline border rgba(champagne, .25).
- Motion: single `requestAnimationFrame` loop translates a duplicated track right→left at ~40px/s. Each card gets a **sinusoidal vertical offset**: `y = A * sin(x / λ + phase_i)` with A ≈ 24px, per-card phase offset (i * 0.9), so the row undulates like a wave as it drifts. Seamless loop (track duplicated once; wrap at half width).
- **Pause on hover** over the band (ease speed to 0 over ~300ms, resume on leave).
- Whole card links to `/amenities/[slug]`; the Explore button is the visible affordance (real `<a>`; card wrapper also clickable).
- Reduced motion / touch fallback: no drift — static horizontally scrollable row (native overflow-x, scroll-snap), same cards.
- Keyboard: cards focusable; focus pauses the drift.

### Acceptance
- 60fps drift (transform-only animation, no layout thrash), seamless wrap, hover pauses.
- Each card navigates to its detail page. Mobile: swipeable static row.

---

## PART 3 — Amenity detail pages (7 pages, one template)

**Goal:** dynamic route `src/pages/amenities/[slug].astro` using `getStaticPaths()` over skin data. One template, seven pages. Follow the existing `/suites.astro` page as the structural reference.

### Data (skin.ts)
```ts
amenityPages: [{
  slug, name, kicker,
  hero: { img, alt },            // full-bleed still
  statement,                     // one display sentence
  body,                          // 2 short paragraphs
  editorial: [{ img, alt }, ...],// 2–3 images, offset editorial layout
  facts: [{ label, value }],     // e.g. Size / Hours / Access
  services: [strings],           // bullet list of what's included
  pricing: [{ label, value }],   // e.g. 'Included for guests', 'Private session — €120'
  hours: string,                 // '06:00 – 22:00, daily'
  cta: { label, href: '/#enquire?amenity=<slug>' }
}]
```

### Page anatomy (top → bottom)
1. Full-bleed hero still, name + kicker overlaid bottom-left (same treatment as homepage journey chapters), header-safe padding.
2. Statement — Italiana display sentence, centered, generous whitespace.
3. Editorial block — 2–3 images, asymmetric offsets (reuse gallery/media styling conventions), body paragraphs beside/between.
4. Details band — three columns: FACTS / HOURS & PRICING / SERVICES (small-caps labels, hairline rules). This is the "all details" block: price, working times, services.
5. CTA — `Enquire →` back to homepage form; pass `?amenity=<name>#enquire` and extend the existing suite-prefill script to also accept `amenity` (chip shows "Regarding: <name>").
6. Prev/next amenity footer nav (champagne, small).

### Acceptance
- `astro build` emits 7 static pages; wave-carousel cards and dining teaser link correctly.
- Enquiry prefill works from amenity pages. Placeholder images fine where no still exists yet.

---

## PART 4 — Hero scrub: never rest on a blurry frame

**Goal:** motion-blur frames are fine WHILE scrolling (read as camera motion) but the scrubber must never SETTLE on one. Also raise frame quality.

### 4a — Frame sharpness audit (build tooling)
Create `scripts/audit-frames.mjs` (Node, use `sharp`):
- For every `public/frames/hero/frame_*.webp`: grayscale → laplacian convolve → variance = sharpness score.
- Output `src/content/sharp-frames.json`: `{ count, sharp: [frameIndices...] }` where sharp = score above the 40th percentile AND not inside a low-score run (transition/speed-boost stretches fail automatically).
- Also emit a console report: total frames, % sharp, the blur runs (start–end indices) so bad transition stretches are visible.
- Add npm script `"audit:frames": "node scripts/audit-frames.mjs"`.

### 4b — Snap-to-sharp in journey.js (small, surgical patch — do not restructure the file)
- Import/inline the sharp-frame whitelist (inject via `data-sharp-frames` attribute on the `.journey` section from index.astro frontmatter reading the JSON).
- Track scroll velocity. While |velocity| > threshold: current behavior (map progress → frame).
- When idle >120 ms AND the current frame is NOT whitelisted: animate the DISPLAYED frame index to the nearest whitelisted frame over ~250 ms (rAF ease-out). Display-only — do not scroll the page, do not fight user input; any new scroll input cancels the settle immediately.
- Chapter text opacity peaks should align with whitelisted frames: for each chapter's trigger progress, nudge (data attribute) to the nearest sharp frame's progress within ±2% scroll.
- Reduced-motion: skip the settle animation, jump to nearest sharp frame.

### 4c — Frame quality re-export (optional, after 4a proves which frames survive)
- Re-export hero frames at webp q70–75 (was q55), same 1920w; delete frames inside blur runs identified by the audit (scrub map simply has fewer, better frames — update counts, index.astro already counts files on disk).
- Keep desktop payload ≤ ~20 MB; mobile untouched (J1+J4 only, 720w).

### Acceptance
- Stop scrolling anywhere in the hero → within ~250 ms the canvas shows a sharp frame, every time.
- No fighting the scroll; no visible jumps while actively scrolling.
- `audit:frames` report checked into the console output of the PR/commit message.

---

## Suggested commit points
1. `part1: homepage restructure + title-clip fix`
2. `part2: amenities wave carousel`
3. `part3: amenity detail pages (7)`
4. `part4: sharp-frame audit + snap-to-sharp scrub`
