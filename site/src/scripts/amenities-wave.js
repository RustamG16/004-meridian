/* Amenities wave marquee — transform-only R→L drift + per-card sine Y.
   Fallback: prefers-reduced-motion or coarse pointer → static overflow-x scroll-snap. */
(() => {
  const root = document.querySelector('[data-amenities-wave]');
  if (!root) return;

  const band = root.querySelector('[data-amenities-band]');
  const track = root.querySelector('[data-amenities-track]');
  if (!band || !track) return;

  const staticMq = matchMedia('(prefers-reduced-motion: reduce), (pointer: coarse)');
  const SPEED = 40; // px/s
  const AMP = 24; // px
  const LAMBDA = 280; // wave length in px
  const PHASE_STEP = 0.9;
  const EASE_MS = 300;

  let offset = 0;
  let halfWidth = 0;
  let speed = SPEED;
  let targetSpeed = SPEED;
  let last = performance.now();
  let raf = 0;
  let cards = [];
  let running = false;

  const measure = () => {
    halfWidth = track.scrollWidth / 2;
    const kids = [...track.children];
    const n = kids.length / 2;
    cards = kids.map((el, i) => ({
      el,
      phase: Number(el.dataset.amPhase) || (i % Math.max(1, n)) * PHASE_STEP,
      baseLeft: el.offsetLeft,
    }));
  };

  const applyWave = () => {
    for (const { el, phase, baseLeft } of cards) {
      const x = baseLeft - offset;
      const ty = AMP * Math.sin(x / LAMBDA + phase);
      el.style.transform = `translate3d(0, ${ty}px, 0)`;
    }
  };

  const frame = (now) => {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;

    const k = 1 - Math.exp(-dt / (EASE_MS / 1000));
    speed += (targetSpeed - speed) * k;

    if (halfWidth > 0 && Math.abs(speed) > 0.01) {
      offset = (offset + speed * dt) % halfWidth;
      if (offset < 0) offset += halfWidth;
    }

    track.style.transform = `translate3d(${-offset}px, 0, 0)`;
    applyWave();
    raf = requestAnimationFrame(frame);
  };

  const setPaused = (paused) => {
    targetSpeed = paused ? 0 : SPEED;
  };

  const onFocusOut = (e) => {
    if (!band.contains(e.relatedTarget)) setPaused(false);
  };

  band.addEventListener('pointerenter', () => { if (running) setPaused(true); });
  band.addEventListener('pointerleave', () => { if (running) setPaused(false); });
  band.addEventListener('focusin', () => { if (running) setPaused(true); });
  band.addEventListener('focusout', onFocusOut);

  const setCopyVisibility = (staticMode) => {
    const kids = [...track.children];
    const n = kids.length / 2;
    kids.forEach((el, i) => {
      if (staticMode) {
        const hide = i >= n;
        el.hidden = hide;
        el.tabIndex = hide ? -1 : 0;
      } else {
        el.hidden = false;
        el.tabIndex = i < n ? 0 : -1;
      }
    });
  };

  const start = () => {
    if (running) return;
    running = true;
    root.classList.remove('is-static');
    setCopyVisibility(false);
    measure();
    offset = 0;
    speed = SPEED;
    targetSpeed = SPEED;
    last = performance.now();
    raf = requestAnimationFrame(frame);
  };

  const stop = () => {
    if (raf) cancelAnimationFrame(raf);
    raf = 0;
    running = false;
    root.classList.add('is-static');
    track.style.transform = '';
    for (const { el } of cards) el.style.transform = '';
    setCopyVisibility(true);
  };

  const sync = () => {
    if (staticMq.matches) stop();
    else start();
  };

  const ro = new ResizeObserver(() => {
    if (running) {
      const prev = halfWidth;
      measure();
      if (prev > 0 && halfWidth > 0) offset = offset % halfWidth;
    }
  });
  ro.observe(track);

  if (typeof staticMq.addEventListener === 'function') {
    staticMq.addEventListener('change', sync);
  } else {
    staticMq.addListener(sync);
  }

  sync();
})();
