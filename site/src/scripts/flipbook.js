/* ---------- FlipbookScrubber (engine/flipbook-scrubber.js, ESM port) ----------
   Lean Meridian port:
   - coarse-first across the FULL tour (every 4th) so late chapters aren't blank stubs
   - scrub-priority window only when the frame index changes (not every rAF)
   - rounded DPR buffer (fractional DPR thrash = hero freeze)
   - img.decode() before first draw — never createImageBitmap-cache the whole tour
   - capped in-flight loads + preempting priority queue: a scrub burst is never
     stuck behind hundreds of queued background loads (past hero-freeze cause)
   - failed loads retry twice then go dead — a 404/network error can no longer
     wedge the queue or the preloader gate */
const MAX_INFLIGHT = 10;
const MAX_RETRIES = 2;

export class FlipbookScrubber {
  constructor(canvas, cfg) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d', { alpha: false });
    this.cfg = cfg;
    this.isMobile = innerWidth < 768 && !!cfg.mobilePath;
    this.count = this.isMobile ? (cfg.mobileCount || cfg.count) : cfg.count;
    this.images = new Array(this.count).fill(null);
    this.loaded = new Set();
    this.current = -1;
    this._priority = [];
    this._dead = new Set();
    this._retries = new Map();
    this._inflight = 0;
    this._order = [];
    this._cursor = 0;
    this._resolveReady = null;
    this.ready = new Promise((resolve) => { this._resolveReady = resolve; });
    this.resize();
    addEventListener('resize', () => { this.resize(); this.draw(this.current < 0 ? 0 : this.current); });
    this.preload();
  }
  src(i) {
    const n = String(i + 1).padStart(this.cfg.pad, '0');
    const base = this.isMobile ? this.cfg.mobilePath : this.cfg.path;
    return `${base}${n}${this.cfg.ext}`;
  }
  _wanted(i) {
    return i >= 0 && i < this.count && !this.images[i] && !this._dead.has(i);
  }
  _start(i) {
    const img = new Image();
    img.decoding = 'async';
    this.images[i] = img;
    this._inflight++;
    let settled = false;
    const done = (ok) => {
      if (settled) return;
      settled = true;
      this._inflight--;
      if (ok) {
        this.loaded.add(i);
        if (this.current === -1) {
          this.draw(0); // nearestLoaded fallback — gate opens on the FIRST decoded frame
          this._resolveReady?.();
          this._resolveReady = null;
        } else if (i === this.current) {
          this.draw(i);
        }
      } else {
        this.images[i] = null; // free the slot so a retry can claim it
        const tries = (this._retries.get(i) || 0) + 1;
        this._retries.set(i, tries);
        if (tries > MAX_RETRIES) this._dead.add(i);
        else setTimeout(() => { if (this._wanted(i)) { this._priority.push(i); this._pump(); } }, 400 * tries);
      }
      this._pump();
    };
    img.addEventListener('error', () => done(false), { once: true });
    img.src = this.src(i);
    const decoded = img.decode ? img.decode() : Promise.resolve();
    decoded.then(() => done(true)).catch(() => {
      if (img.complete && img.naturalWidth > 0) done(true);
      else img.addEventListener('load', () => done(true), { once: true });
    });
  }
  _pump() {
    while (this._inflight < MAX_INFLIGHT) {
      let next = -1;
      while (this._priority.length) {
        const c = this._priority.shift();
        if (this._wanted(c)) { next = c; break; }
      }
      if (next < 0) {
        while (this._cursor < this._order.length) {
          const c = this._order[this._cursor++];
          if (this._wanted(c)) { next = c; break; }
        }
      }
      if (next < 0) return;
      this._start(next);
    }
  }
  prioritize(center, radius = 12) {
    // Replace (don't append): stale far-away priorities from earlier scrub
    // positions must not starve the current window.
    this._priority = [];
    for (let d = 0; d <= radius; d++) {
      for (const i of d === 0 ? [center] : [center + d, center - d]) {
        if (this._wanted(i)) this._priority.push(i);
      }
    }
    this._pump();
  }
  preload() {
    // Background order: frame 0, coarse spine (every 4th), then the rest.
    // The pump self-drives off load completions — no idle-callback loop.
    this._order.push(0);
    for (let i = 0; i < this.count; i += 4) if (i !== 0) this._order.push(i);
    for (let i = 0; i < this.count; i++) if (i % 4 !== 0) this._order.push(i);
    this._pump();
  }
  nearestLoaded(i) {
    if (this.loaded.has(i)) return i;
    for (let d = 1; d < this.count; d++) {
      if (this.loaded.has(i - d)) return i - d;
      if (this.loaded.has(i + d)) return i + d;
    }
    return -1;
  }
  resize() {
    const dpr = Math.min(devicePixelRatio || 1, 2);
    this.canvas.width = Math.round(innerWidth * dpr);
    this.canvas.height = Math.round(innerHeight * dpr);
    this.ctx.imageSmoothingEnabled = true;
    this.ctx.imageSmoothingQuality = 'high';
  }
  draw(i) {
    const j = this.nearestLoaded(i);
    if (j < 0) return;
    this.current = i;
    const img = this.images[j];
    if (!img || !img.naturalWidth) return;
    const cw = this.canvas.width, ch = this.canvas.height;
    const s = Math.max(cw / img.naturalWidth, ch / img.naturalHeight);
    const w = img.naturalWidth * s, h = img.naturalHeight * s;
    this.ctx.fillStyle = '#091D1E';
    this.ctx.fillRect(0, 0, cw, ch);
    this.ctx.drawImage(img, (cw - w) / 2, (ch - h) / 2, w, h);
  }
  setProgress(p) {
    const i = Math.max(0, Math.min(this.count - 1, Math.round(p * (this.count - 1))));
    if (i === this.current) return;
    this.prioritize(i);
    this.draw(i);
  }
}

export const progressOf = (el) => {
  const r = el.getBoundingClientRect();
  const total = el.offsetHeight - innerHeight;
  return total <= 0 ? 1 : Math.max(0, Math.min(1, -r.top / total));
};
