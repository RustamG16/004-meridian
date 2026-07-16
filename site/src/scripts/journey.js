/* HERO — continuous smooth scroll-scrub (from-zero rebuild, Video 1).
   One pinned canvas. Scroll progress → frame index, sub-frame cross-blended.
   No stops / hops / HUD / chapters — those return once all clips are joined.
   Preserves the contracts the rest of the site depends on:
     window.__scrubber             — preloader % reader in index.astro
     'meridian:first-frame' event  — preloader curtain gate in ui.js
     window.__journey.goToProgress — menu deep-links in menu.js */
import Lenis from 'lenis';
import { FlipbookScrubber, progressOf } from './flipbook.js';

const section = document.querySelector('[data-journey]');
const canvas = document.querySelector('[data-journey-canvas]');
if (!section || !canvas) throw new Error('journey markup missing');

const cfg = JSON.parse(section.dataset.frames);
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

function signalFirstFrame(scrubber) {
  scrubber.ready.then(() => {
    window.__meridianFirstFrame = true;
    dispatchEvent(new CustomEvent('meridian:first-frame'));
  });
}

if (reduced) {
  const scrubber = new FlipbookScrubber(canvas, { ...cfg, roundFrames: false });
  window.__scrubber = scrubber;
  signalFirstFrame(scrubber);
  section.classList.add('journey--static');
} else if (innerWidth === 0) {
  const wait = () => (innerWidth > 0 ? init() : setTimeout(wait, 120));
  setTimeout(wait, 120);
} else {
  init();
}

function init() {
  const scrubber = new FlipbookScrubber(canvas, { ...cfg, roundFrames: false });
  window.__scrubber = scrubber;
  signalFirstFrame(scrubber);

  const lenis = new Lenis({ lerp: 0.09 });
  window.__lenis = lenis;

  // Minimal deep-link API so menu.js group links keep working.
  window.__journey = {
    goToProgress(p) {
      const clamped = Math.max(0, Math.min(1, p));
      const top = section.getBoundingClientRect().top + scrollY;
      const y = top + clamped * (section.offsetHeight - innerHeight);
      lenis.scrollTo(y, { duration: 1.0 });
    },
    onMenuClose() { lenis.start(); },
  };

  const dpr = () => Math.min(devicePixelRatio || 1, 2);
  const bufferW = () => Math.round(innerWidth * dpr());

  function frame(time) {
    lenis.raf(time);
    if (canvas.width !== bufferW()) {
      scrubber.resize();
      scrubber.draw(scrubber.current < 0 ? 0 : scrubber.current);
    }
    scrubber.setProgress(progressOf(section));
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}
