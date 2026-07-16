/* JOURNEY/TOUR — engine FlipbookScrubber over the 4-clip chained tour (canvas frames, never video)
   + the archetype's mandatory HUD: one fixed element, two readouts — altitude climbing toward
   1.044 m and the name of the space you are passing (TAL · ANKUNFT · ZIMMER · WASSER · KÜCHE ·
   GIPFEL). Chapter copy pinned at clip segments, fade math with first/last clamping (lab/002).
   Lenis smooth scroll. */
import Lenis from 'lenis';
import { FlipbookScrubber, progressOf } from './flipbook.js';

const section = document.querySelector('[data-journey]');
const canvas = document.querySelector('[data-journey-canvas]');
if (!section || !canvas) throw new Error('journey markup missing');

const cfg = JSON.parse(section.dataset.frames);
const spaces = JSON.parse(section.dataset.hud); // [{at, label}] ascending
const altitudeMax = Number(section.dataset.altitude);
const chapters = [...document.querySelectorAll('[data-chapter]')];
const hud = document.querySelector('[data-hud-root]');
const hudFill = document.querySelector('[data-hud-fill]');
const hudAlt = document.querySelector('[data-hud-alt]');
const hudSpace = document.querySelector('[data-hud-space]');
const hint = document.querySelector('[data-scroll-hint]');
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

/* prefers-reduced-motion → poster only, normal scroll, chapters as static sections */
if (reduced) {
  section.classList.add('journey--static');
} else if (innerWidth === 0) {
  // viewport not laid out yet (embedded/emulated contexts) — retry until it is (lab/002 fix).
  // setTimeout, NOT rAF: rAF freezes in hidden/background tabs and deadlocks init (lab/003 finding).
  const wait = () => (innerWidth > 0 ? init() : setTimeout(wait, 120));
  setTimeout(wait, 120);
} else {
  init();
}

function init() {
  const scrubber = new FlipbookScrubber(canvas, cfg);
  window.__scrubber = scrubber; // public handle: preloader progress readout + QA
  // Gate the preloader on first decoded frame (not a blind timer) — empty canvas = "frozen" hero.
  scrubber.ready.then(() => {
    window.__meridianFirstFrame = true;
    dispatchEvent(new CustomEvent('meridian:first-frame'));
  });

  const lenis = new Lenis({ lerp: 0.09 });
  window.__lenis = lenis; // menu.js deep-links into the journey by progress fraction
  const n = chapters.length;
  const dpr = () => Math.min(devicePixelRatio || 1, 2);
  const bufferW = () => Math.round(innerWidth * dpr()); // identical expression to FlipbookScrubber.resize()
  // HUD readout is skin-driven: prefix/unit/locale come from data attrs (e.g. "FLOOR 42" or "1.044 m")
  const hudPrefix = section.dataset.hudPrefix ?? '';
  const hudUnit = section.dataset.hudUnit ?? '';
  const hudLocale = section.dataset.hudLocale || 'en-US';
  const hudNum = (v) => Math.round(v).toLocaleString(hudLocale);
  let lastAlt = -1;

  function frame(time) {
    lenis.raf(time);
    // some hosts resize the viewport without firing 'resize' — resync the canvas (lab/002 fix)
    if (canvas.width !== bufferW()) {
      scrubber.resize();
      scrubber.draw(scrubber.current < 0 ? 0 : scrubber.current);
    }
    const p = progressOf(section);
    scrubber.setProgress(p);

    /* HUD: altitude counter + space name; retires once the journey scrolls out */
    if (hudFill) hudFill.style.height = `${p * 100}%`;
    const alt = Math.round(p * altitudeMax);
    if (alt !== lastAlt && hudAlt) {
      lastAlt = alt;
      hudAlt.textContent = `${hudPrefix}${hudNum(alt)}${hudUnit}`;
      let label = spaces[0].label;
      for (const s of spaces) if (p >= s.at) label = s.label;
      if (hudSpace && hudSpace.textContent !== label) hudSpace.textContent = label;
    }
    if (hud) hud.classList.toggle('hud--off', section.getBoundingClientRect().bottom <= innerHeight + 1);
    if (hint) hint.style.opacity = p > 0.04 ? 0 : 1;

    /* chapter copy: fade in around each clip's segment, out at the seam.
       First chapter fully visible from load, last stays to the end (lab/002 clamping). */
    chapters.forEach((el, i) => {
      const x = p * n - (i + 0.5);                // signed distance from segment center
      const d = i === 0 ? Math.max(0, x) : i === n - 1 ? Math.max(0, -x) : Math.abs(x);
      const o = Math.max(0, Math.min(1, 1.6 - d * 2.2));
      el.style.opacity = o;
      el.style.transform = `translateY(${(1 - o) * 24}px)`;
      el.style.pointerEvents = o > 0.5 ? 'auto' : 'none';
      // masked line-reveal on chapter titles (CSS clip — no new deps)
      const title = el.querySelector('.journey__title, .journey__display');
      if (title) {
        const reveal = Math.max(0, Math.min(1, (o - 0.2) / 0.55));
        title.style.clipPath = `inset(0 0 ${(1 - reveal) * 100}% 0)`;
        title.style.transform = `translateY(${(1 - reveal) * 12}px)`;
      }
    });

    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);

  /* anchor scroll via lenis (header CTA → form); progress deep-links are menu.js's job */
  document.querySelectorAll('a[href^="#"]:not([data-journey-progress])').forEach((a) =>
    a.addEventListener('click', (e) => {
      const t = document.querySelector(a.getAttribute('href'));
      if (t) { e.preventDefault(); lenis.scrollTo(t); }
    })
  );
}
