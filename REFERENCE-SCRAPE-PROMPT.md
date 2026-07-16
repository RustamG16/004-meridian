# PROMPT — paste into Cursor. Output: `lab/004-meridian/REFERENCE-TOKENS.md`

---

You are a design-token forensics tool. Inspect the four live sites below and produce ONE file, `lab/004-meridian/REFERENCE-TOKENS.md`, containing **measured values only** — computed CSS, not impressions. Where you can't measure something, write `UNMEASURED`, never a guess. Use whatever you have available (fetch HTML + linked CSS files, headless browser / devtools, view-source). Fonts are often behind `@font-face` in theme CSS — read the actual `font-family` names and src files.

Sites:
1. https://omaivillas.com/  ← highest priority; ALSO capture its menu drawer in the OPEN state
2. https://hba.com/
3. https://www.lasalaplazahotel.com/
4. https://hutstuf.com/

## Extract per site

**Palette** — every recurring color as hex/rgba with where it's used (page bg, panel bg, primary text, headings, accent, borders, overlay/dim). Source: CSS custom properties first, then computed styles on body/h1/a/buttons.

**Typography** — for h1/display, h2/section, body, nav links, small-caps labels: exact `font-family` stack, weight, `font-size` (px and the clamp()/vw formula if present), `line-height`, `letter-spacing`, `text-transform`. Note the loaded webfont names from `@font-face`/Google Fonts links.

**Spacing rhythm** — section vertical padding, container max-width, side gutters, grid gaps (desktop values; mobile if easy).

**Nav pattern** — header height, position (fixed/sticky), what changes on scroll (logo swap? background?), CTA placement.

**Motion** — from CSS: `transition`/`animation` durations and easing functions on links, reveals, and the menu. From JS libs: note if GSAP/Lenis/Swiper etc. are loaded (check script tags / window globals).

## omaivillas.com menu drawer — dedicated section, open state

Open the menu and measure: drawer width (px and vw at 1920 and at 390 mobile), panel background color, slide-in duration + easing, overlay/dim treatment of the page behind, link font-size/weight/letter-spacing/transform, vertical gap between links, the small over-line section label style (`VILLAS`), sub-item style, close-button row style, and the pinned bottom block (@handle + serif tagline: its font-family/size/style). Note stagger timing on link reveal if present.

## Output format — `REFERENCE-TOKENS.md`

```md
# REFERENCE-TOKENS — measured <date>

## omaivillas.com
### Palette
| role | value | where measured |
### Typography
| element | family stack | webfont | weight | size | line-height | letter-spacing | transform |
### Spacing / Nav / Motion
(key: value lines)
### MENU DRAWER (open state)
(key: value lines per the checklist above)

## hba.com
(same structure, no drawer section)

## lasalaplazahotel.com
...

## hutstuf.com
...

## Cross-site summary
- Display serifs seen: ...
- Shared easing/duration patterns: ...
- Palette families: ...
```

Rules: values verbatim from computed CSS; one file; no advice or redesign suggestions — measurements only. This file is consumed by a separate build prompt that treats it as ground truth.

---

*End of prompt.*
