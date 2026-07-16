/* ENGINE-CANDIDATE: MenuDrawer — left drawer menu (omai pattern), skin-agnostic.
   Markup contract: [data-menu-root] (hidden dialog) holding [data-menu-overlay] and a panel
   with [data-menu-close] + [data-menu-link] items; opened by [data-menu-open].
   Focus trap + ESC + focus return; body scroll locked while open; links close on use.
   [data-journey-progress] links deep-scroll into the pinned journey by progress fraction
   (uses window.__lenis when journey.js exposed it, falls back to native smooth scroll). */

const root = document.querySelector('[data-menu-root]');
const opener = document.querySelector('[data-menu-open]');

if (root && opener) {
  const closeBtn = root.querySelector('[data-menu-close]');
  const overlay = root.querySelector('[data-menu-overlay]');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let lastFocus = null;

  const focusables = () => [...root.querySelectorAll('a[href], button:not([disabled])')];

  const open = () => {
    lastFocus = document.activeElement;
    root.hidden = false;
    document.body.classList.add('menu-open');
    // double rAF so the transition runs from the hidden state
    requestAnimationFrame(() => requestAnimationFrame(() => root.classList.add('is-open')));
    if (reduced) root.classList.add('is-open');
    window.__lenis?.stop();
    closeBtn?.focus();
  };

  const close = () => {
    root.classList.remove('is-open');
    document.body.classList.remove('menu-open');
    const done = () => { root.hidden = true; };
    reduced ? done() : setTimeout(done, 450);
    // Don't unlock the hero hard-step lock if journey is holding lenis stopped
    window.__journey?.onMenuClose?.() ?? window.__lenis?.start();
    lastFocus?.focus();
  };

  opener.addEventListener('click', open);
  closeBtn?.addEventListener('click', close);
  overlay?.addEventListener('click', close);

  document.addEventListener('keydown', (e) => {
    if (root.hidden) return;
    if (e.key === 'Escape') { e.preventDefault(); close(); }
    if (e.key === 'Tab') {
      const f = focusables();
      const first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  });

  root.querySelectorAll('[data-menu-link]').forEach((a) =>
    a.addEventListener('click', (e) => {
      const p = parseFloat(a.dataset.journeyProgress);
      if (!Number.isNaN(p)) {
        const journey = document.querySelector('[data-journey]');
        // No journey on this page (multi-page skin): let the href navigate normally.
        if (journey) {
          e.preventDefault();
          if (window.__journey?.goToProgress) {
            window.__journey.goToProgress(p);
          } else {
            const top = journey.getBoundingClientRect().top + scrollY;
            const target = top + p * (journey.offsetHeight - innerHeight);
            window.__lenis ? window.__lenis.scrollTo(target) : scrollTo({ top: target, behavior: 'smooth' });
          }
        }
      }
      close();
    })
  );
}
