/* ENGINE-CANDIDATE: DragStrip — horizontal HOLD-AND-MOVE gallery (sondaven signature).
   Reusable, no deps: new DragStrip(container) where container holds [data-strip-track]
   and optionally [data-strip-hint]. Pointer drag + horizontal wheel/trackpad + touch,
   lerp inertia, clamped to content width; hint fades on first interaction.
   touch-action: pan-y on the container keeps vertical page scroll working on touch. */
export class DragStrip {
  constructor(el) {
    this.el = el;
    this.track = el.querySelector('[data-strip-track]');
    this.hint = el.querySelector('[data-strip-hint]');
    this.x = 0;         // rendered position
    this.tx = 0;        // target position
    this.dragging = false;
    this.startX = 0;
    this.startTx = 0;
    this.interacted = false;

    el.addEventListener('pointerdown', (e) => this.down(e));
    el.addEventListener('pointermove', (e) => this.move(e));
    el.addEventListener('pointerup', (e) => this.up(e));
    el.addEventListener('pointercancel', (e) => this.up(e));
    el.addEventListener('wheel', (e) => this.wheel(e), { passive: false });
    addEventListener('resize', () => this.clampTarget());

    const loop = () => {
      this.x += (this.tx - this.x) * 0.12;
      if (Math.abs(this.tx - this.x) < 0.1) this.x = this.tx;
      this.track.style.transform = `translate3d(${-this.x}px,0,0)`;
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  }
  max() { return Math.max(0, this.track.scrollWidth - this.el.clientWidth); }
  clampTarget() { this.tx = Math.max(0, Math.min(this.max(), this.tx)); }
  firstTouch() {
    if (this.interacted) return;
    this.interacted = true;
    if (this.hint) this.hint.classList.add('is-hidden');
  }
  down(e) {
    this.dragging = true;
    this.startX = e.clientX;
    this.startTx = this.tx;
    try { this.el.setPointerCapture(e.pointerId); } catch { /* synthetic/stale pointer ids */ }
    this.el.classList.add('is-dragging');
    this.firstTouch();
  }
  move(e) {
    if (!this.dragging) return;
    this.tx = this.startTx - (e.clientX - this.startX);
    this.clampTarget();
  }
  up(e) {
    this.dragging = false;
    this.el.classList.remove('is-dragging');
    try { if (this.el.hasPointerCapture(e.pointerId)) this.el.releasePointerCapture(e.pointerId); } catch { /* ditto */ }
  }
  wheel(e) {
    const d = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.shiftKey ? e.deltaY : 0;
    if (!d) return; // plain vertical wheel keeps scrolling the page
    e.preventDefault();
    this.tx += d;
    this.clampTarget();
    this.firstTouch();
  }
}
