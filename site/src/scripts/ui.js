/* Site UI wiring (skin-agnostic — all client values arrive via markup/data attributes):
   preloader beat, media fallbacks, facts count-up, seasonal toggle, reveals, demo form, gallery. */
import { DragStrip } from './gallery.js';

const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ---------- preloader: mood beat + wait for first journey frame (never drop onto empty canvas) ---------- */
const pre = document.querySelector('[data-preloader]');
if (pre) {
  const done = () => {
    pre.classList.add('is-done');
    pre.addEventListener('transitionend', () => pre.remove(), { once: true });
    setTimeout(() => pre.remove(), 1600); // safety
  };
  if (reduced) {
    done();
  } else {
    const minBeat = new Promise((r) => setTimeout(r, 700));
    const firstFrame = new Promise((resolve) => {
      if (window.__meridianFirstFrame) return resolve();
      // pages without a journey (e.g. /suites) have no first frame to wait for
      if (!document.querySelector('[data-journey]')) return resolve();
      const onReady = () => resolve();
      addEventListener('meridian:first-frame', onReady, { once: true });
      setTimeout(resolve, 5000); // network safety — never hang the curtain forever
    });
    Promise.all([minBeat, firstFrame]).then(done);
  }
}

/* ---------- media fallback: real photos may not exist yet (element events, never fetch) ---------- */
document.querySelectorAll('img[data-media]').forEach((img) => {
  const slot = img.closest('.media');
  if (!slot) return;
  img.addEventListener('error', () => slot.classList.add('is-missing'), { once: true });
  if (img.complete && img.naturalWidth === 0 && img.src) slot.classList.add('is-missing');
});

/* ---------- facts strip: counters animate up on scroll ---------- */
const countUp = (el) => {
  const target = Number(el.dataset.count);
  const fmt = el.dataset.format; // 'de' | 'en' | undefined (plain)
  const suffix = el.dataset.suffix || '';
  const decimals = Number(el.dataset.decimals || 0);
  const locale = fmt === 'de' ? 'de-DE' : 'en-US';
  const render = (v) => {
    if (fmt) {
      el.textContent = Number(v.toFixed(decimals)).toLocaleString(locale, { minimumFractionDigits: decimals }) + suffix;
    } else {
      el.textContent = (decimals ? v.toFixed(decimals) : String(Math.round(v))) + suffix;
    }
  };
  if (reduced) return render(target);
  const t0 = performance.now(), dur = 1400;
  const ease = (t) => 1 - Math.pow(1 - t, 3);
  const step = (now) => {
    const t = Math.min(1, (now - t0) / dur);
    render(target * ease(t));
    if (t < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
};
const factIO = new IntersectionObserver((entries) => {
  entries.forEach((en) => {
    if (en.isIntersecting) { countUp(en.target); factIO.unobserve(en.target); }
  });
}, { threshold: 0.6 });
document.querySelectorAll('[data-count]').forEach((el) => factIO.observe(el));

/* ---------- seasonal toggle: accent pair + imagery + one copy line ---------- */
const seasonBtns = [...document.querySelectorAll('[data-season-btn]')];
const setSeason = (s) => {
  document.body.classList.toggle('winter', s === 'winter');
  seasonBtns.forEach((b) => b.classList.toggle('is-active', b.dataset.seasonBtn === s));
  document.querySelectorAll('[data-season-panel]').forEach((p) =>
    p.classList.toggle('is-active', p.dataset.seasonPanel === s));
};
seasonBtns.forEach((b) => b.addEventListener('click', () => setSeason(b.dataset.seasonBtn)));

/* ---------- section reveals ---------- */
const revealIO = new IntersectionObserver((entries) => {
  entries.forEach((en) => {
    if (en.isIntersecting) { en.target.classList.add('is-visible'); revealIO.unobserve(en.target); }
  });
}, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });
document.querySelectorAll('[data-reveal]').forEach((el, i) => {
  el.style.transitionDelay = `${(i % 5) * 0.07}s`;
  revealIO.observe(el);
});

/* ---------- gallery: HOLD AND MOVE ---------- */
document.querySelectorAll('[data-strip]').forEach((el) => new DragStrip(el));

/* ---------- slow scroll parallax (suites + sphere) ---------- */
const parallaxEls = [...document.querySelectorAll('[data-parallax]')];
if (parallaxEls.length && !reduced) {
  let ticking = false;
  const updateParallax = () => {
    ticking = false;
    const vh = innerHeight;
    parallaxEls.forEach((img) => {
      const speed = Number(img.dataset.parallax) || 0.1;
      const box = img.parentElement?.getBoundingClientRect() || img.getBoundingClientRect();
      const mid = box.top + box.height / 2;
      const t = (mid - vh / 2) / vh; // -1..1-ish through viewport
      const y = t * speed * -100;
      if (img.hasAttribute('data-parallax-scale')) {
        const scale = 1.08 + Math.abs(t) * speed * 0.15;
        img.style.transform = `translate3d(0, ${y}%, 0) scale(${scale})`;
      } else {
        img.style.transform = `translate3d(0, ${y - 8}%, 0)`;
      }
    });
  };
  const onScroll = () => {
    if (!ticking) { ticking = true; requestAnimationFrame(updateParallax); }
  };
  addEventListener('scroll', onScroll, { passive: true });
  updateParallax();
}

/* ---------- demo inquiry form (no backend — pitch demo) ---------- */
const form = document.querySelector('[data-inquiry]');
if (form) {
  const toast = form.querySelector('[data-toast]');
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    if (!form.checkValidity()) return form.reportValidity();
    if (toast) toast.hidden = false;
    form.reset();
    setTimeout(() => { if (toast) toast.hidden = true; }, 5000);
  });
}
