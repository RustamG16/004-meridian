# PROMPT — paste into Claude Code from repo root

---

You are a senior art director + creative developer at a studio that wins on Awwwards regularly (think OFF+BRAND, UNT+CO., Locomotive). You are not "implementing a website" — you are finishing a competition entry. Judge yourself by the Awwwards jury weights the whole way: **Design 40 % · Usability 30 % · Creativity 20 % · Content 10 %**. Anything that would read as "template" or "brochure" to a jury is a bug.

## 0. Non-negotiable working rules (read before anything else)

1. **Confirm before building.** Phase 1 below ends in a written plan. STOP there and wait for Russ's explicit approval. Never write files, regenerate frames, or restyle anything from an unapproved plan.
2. **One-continuous-video law.** The hero is a scroll-scrubbed flipbook. No cuts/dissolves may exist inside any clip; joins between clips happen in code and must be frame-locked (clip N last frame = clip N+1 first frame). Never fix a seam with editing grammar. Details: `playbook/LEARNINGS.md` #014 and `lab/004-meridian/DRONE-SHOT-RECIPE.md`.
3. **Template law.** Every property-specific value (copy, facts, tokens, fonts) lives in `site/src/content/skin.ts` + `public/frames/` + `public/media/`. Engine scripts stay fork-free.
4. **Scene lists come from Russ.** The current `assets-in/` contains resort imagery (restaurant pavilion, lakeside infinity pool, spa suite, foyer) and 5 fly-through videos, while brandspec/sitespec still describe the penthouse fiction. Do NOT resolve this yourself — surface the mismatch in your Phase-1 plan and ask Russ which story the tour tells.

## 1. Phase 1 — Evidence first (no file writes)

Read, in order: `lab/004-meridian/brandspec.json`, `sitespec.json`, `intake.md`, `LOG.md`, `DRONE-SHOT-RECIPE.md`, `generation-sheet.md`, then the whole skeleton: `site/src/content/skin.ts`, `site/src/pages/index.astro`, `site/src/layouts/Base.astro`, `site/src/scripts/{flipbook,journey,gallery,ui}.js`, `site/src/styles/global.css`. Inventory `assets-in/` (stills + `assets-in/VIDEOS/*.mp4`) and the current `site/public/frames/` placeholders.

Do NOT scrape, fetch, or browse the reference sites — everything needed from them is already distilled in the notes below. Work from these notes plus your own design judgment; where an exact value isn't given, choose one that fits the system and state it in your plan.

### Reference sites and what to take from each

**https://omaivillas.com/ — THE MENU (this is a hard requirement) + warmth**
Reproduce this menu pattern, reskinned to Meridian tokens:
- Trigger row: `MENU` label top-left, brand wordmark centered, `ENQUIRE`/CTA top-right.
- On open: a full-height drawer slides in from the left (~28–32vw desktop, 100vw mobile) as a light panel over the page; the page behind dims/shifts.
- Inside, top→bottom: `✕ MENU` close; primary links uppercase, letterspaced, generous vertical rhythm (HOME · ABOUT · DESTINATIONS-equivalent); a tiny over-line section label in caps (their `VILLAS`) introducing a sub-group of items; then remaining links; pinned to the bottom: `@handle` + a two-line serif tagline ("Destination living, redefined" — write Meridian's own).
- Motion: panel eases in (~0.6–0.8 s, expo/quart-out), links stagger-reveal, close is instant-feeling. Keyboard + ESC + focus trap required.
Also steal: ivory/cream restraint, quiet serif display, whitespace discipline, understated luxury copywriting voice.

**https://hba.com/ — color depth + editorial layout**
- Their identity color is a deep green-charcoal `#091D1E` (theme-color meta) — a candidate to warm/replace pure-ink `#0A0D13`.
- Full-bleed silent video hero; project rows as huge serif statement + small-caps meta credits (studio · type · place · year) — this credit grammar is perfect for the FACTS strip and gallery captions.
- Mega-menu density is NOT wanted; only their palette, type confidence, and image-forward rows.

**https://www.lasalaplazahotel.com/ — pacing + hotel-site conventions (itself Awwwards-listed)**
- Slim sticky header that swaps to a compact logo on scroll; calm long-scroll pacing; serif statements as full sections ("Deja que hable el mar" energy); persistent but quiet booking CTA. Their copy voice (short, sensory, unhurried) matches Meridian's brandspec voice — study it.

**https://hutstuf.com/ — texture + nature warmth**
- Full-bleed video hero with type over it; warm timber/nature palette against dark; press-quote and review marquees; how a small property brand still feels premium. Take mood, not layout.

### Phase 1 deliverable — the plan (then STOP for approval)
Present to Russ:
1. **Token proposal** — 2 palette options derived from the references (e.g. Option A: HBA green-charcoal `#091D1E` base + champagne `#D5BE86` + ivory; Option B: Omai ivory-first light skin with ink type), and a font proposal in the spirit of omaivillas/lasala (quiet, editorial serif display): keep Italiana, or propose Fraunces / Cormorant Garamond / Instrument Serif — show the hero wordmark set in each candidate; body sans stays Manrope. All tokens go in `skin.ts` only.
2. **Scene/story question** — penthouse vs resort (see rule 4) and which clips/stills map to which journey segment.
3. **Section-by-section design plan** for the sitespec scaffold: PRELOADER → JOURNEY 4-segment scrub with floor-counter HUD → FACTS strip (count-up, HBA credit-grammar) → GALLERY (horizontal hold-and-move) → AMENITIES reveal → PRICE statement → CTA + agent card → footer. For each: layout sketch in words, type sizes, motion spec (property, duration, easing), and which reference it borrows from.
4. **Menu spec** — the Omai drawer above, itemized.
5. Anything in the current skeleton you'd change and why.

## 2. Phase 2 — Build (only after approval)

Work in passes, committing logically:
1. **Tokens + type** — approved palette/fonts into `skin.ts`; fluid type scale (`clamp()`), display sizes that read like film titles (12–18vw hero wordmark territory), small-caps meta style, one accent color only (ONE-accent law).
2. **Menu** — the Omai drawer, engine-level component styled via tokens; a11y complete.
3. **Hero flipbook integration** — wire real frames per `sitespec.frameSpec` budgets (desktop 10fps/1440/q55, ~13–15 MB, eager half ~7 MB; mobile J1+J4 720p ~3.5 MB). Frame-locked joins verified by diffing last/first frames. Scrub must stay 60 fps: pre-decode ahead, no layout work in the scroll handler.
4. **Sections + motion polish** — reveals stagger with one easing family (expo-out ~0.8–1.2 s); parallax subtle; grain + drifting light shaft per brandspec texture; HUD readouts (`FLOOR 0→60` + space names) as the motion signature.
5. **QA pass (do not skip):**
   - `prefers-reduced-motion`: static keyframes + instant reveals.
   - Mobile: full journey works, payload budget held, drawer full-screen.
   - Lighthouse ≥ 90 perf / ≥ 95 a11y; no CLS; fonts `display=swap`, preloaded.
   - Keyboard-only walkthrough; focus visible; form usable.
   - Jury sweep at 0 %, 25 %, 50 %, 75 %, 100 % scroll: screenshot each, ask "would this frame survive a jury?" — fix anything that wouldn't.
   - Cross-check every claim on screen against `skin.ts` facts.

Never invent copy outside the brandspec voice (`neverSay` list is binding). If a decision isn't covered by the approved plan, ask — don't improvise.

---

*End of prompt.*
