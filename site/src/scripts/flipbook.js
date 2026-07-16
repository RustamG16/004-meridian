/* ---------- FlipbookScrubber (engine/flipbook-scrubber.js, ESM port) ----------
   Lean Meridian port:
   - coarse-first across the FULL tour (every 4th) so late chapters aren't blank stubs
   - scrub-priority window only when the frame index changes (not every rAF)
   - rounded DPR buffer (fractional DPR thrash = hero freeze)
   - img.decode() before first draw — never createImageBitmap-cache the whole tour */
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
  load(i) {
    if (i < 0 || i >= this.count || this.images[i]) return;
    const img = new Image();
    img.decoding = 'async';
    this.images[i] = img;
    img.src = this.src(i);
    const mark = () => {
      this.loaded.add(i);
      if (this.current === -1 && i === 0) {
        this.draw(0);
        this._resolveReady?.();
        this._resolveReady = null;
      } else if (i === this.current) {
        this.draw(i);
      }
    };
    const decoded = img.decode ? img.decode() : Promise.resolve();
    decoded.then(mark).catch(() => {
      if (img.complete && img.naturalWidth > 0) mark();
      else img.addEventListener('load', mark, { once: true });
    });
  }
  prioritize(center, radius = 10) {
    for (let d = 0; d <= radius; d++) {
      for (const i of d === 0 ? [center] : [center + d, center - d]) {
        if (i < 0 || i >= this.count || this.images[i]) continue;
        this._priority.push(i);
      }
    }
    let burst = 0;
    while (this._priority.length && burst < 6) {
      const i = this._priority.shift();
      if (!this.images[i]) { this.load(i); burst++; }
    }
  }
  preload() {
    this.load(0);
    for (let i = 0; i < this.count; i += 4) this.load(i);

    const idle = (fn) => (window.requestIdleCallback ? requestIdleCallback(fn, { timeout: 200 }) : setTimeout(fn, 40));
    let i = 0;
    const fill = () => {
      let done = 0;
      while (this._priority.length && done < 6) {
        const p = this._priority.shift();
        if (!this.images[p]) { this.load(p); done++; }
      }
      while (i < this.count && done < 6) {
        if (!this.images[i]) { this.load(i); done++; }
        i++;
      }
      if (i < this.count || this._priority.length) idle(fill);
    };
    idle(fill);
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
