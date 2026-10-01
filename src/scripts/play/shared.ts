// Shared bits for the home page toys: reduced-motion check + a pointer drag helper
// that works for mouse, pen and touch and tells taps apart from drags.

const reducedQuery = typeof window !== 'undefined' ? window.matchMedia('(prefers-reduced-motion: reduce)') : null;

/** Quiet settings always take priority: read live so a mid-session OS toggle is respected. */
export function reducedMotion(): boolean {
  return reducedQuery?.matches ?? false;
}

export function onReducedMotionChange(fn: (reduced: boolean) => void): void {
  reducedQuery?.addEventListener('change', (e) => fn(e.matches));
}

export interface DragMove {
  dx: number;
  dy: number;
  /** px per second, smoothed */
  vx: number;
  vy: number;
  event: PointerEvent;
}

export interface DragEnd extends DragMove {
  /** true when the pointer barely moved: treat as a tap/click */
  tap: boolean;
}

export interface DragHandlers {
  /** return false to ignore this pointer (e.g. toy disabled) */
  onStart?: (e: PointerEvent) => boolean | void;
  onMove?: (m: DragMove) => void;
  onEnd?: (m: DragEnd) => void;
}

const TAP_SLOP = 6;

/** Pointer drag with capture. Returns a cleanup function. */
export function draggable(el: HTMLElement | SVGElement, h: DragHandlers): () => void {
  let id: number | null = null;
  let sx = 0;
  let sy = 0;
  let lx = 0;
  let ly = 0;
  let lt = 0;
  let vx = 0;
  let vy = 0;
  let moved = false;

  const down = (e: PointerEvent): void => {
    if (id !== null || (e.pointerType === 'mouse' && e.button !== 0)) return;
    if (h.onStart?.(e) === false) return;
    id = e.pointerId;
    sx = lx = e.clientX;
    sy = ly = e.clientY;
    lt = e.timeStamp;
    vx = vy = 0;
    moved = false;
    try {
      el.setPointerCapture(e.pointerId);
    } catch {
      // the pointer was already released (fast tap / synthetic event): moves still arrive on `el`
    }
  };
  const move = (e: PointerEvent): void => {
    if (e.pointerId !== id) return;
    const dt = Math.max(1, e.timeStamp - lt) / 1000;
    vx = vx * 0.6 + ((e.clientX - lx) / dt) * 0.4;
    vy = vy * 0.6 + ((e.clientY - ly) / dt) * 0.4;
    lx = e.clientX;
    ly = e.clientY;
    lt = e.timeStamp;
    const dx = e.clientX - sx;
    const dy = e.clientY - sy;
    if (!moved && Math.hypot(dx, dy) > TAP_SLOP) moved = true;
    if (moved) h.onMove?.({ dx, dy, vx, vy, event: e });
  };
  const up = (e: PointerEvent): void => {
    if (e.pointerId !== id) return;
    id = null;
    if (el.hasPointerCapture(e.pointerId)) el.releasePointerCapture(e.pointerId);
    h.onEnd?.({ dx: e.clientX - sx, dy: e.clientY - sy, vx, vy, event: e, tap: !moved && e.type === 'pointerup' });
  };

  const opts: AddEventListenerOptions = { passive: true };
  el.addEventListener('pointerdown', down as EventListener, opts);
  el.addEventListener('pointermove', move as EventListener, opts);
  el.addEventListener('pointerup', up as EventListener, opts);
  el.addEventListener('pointercancel', up as EventListener, opts);
  return () => {
    el.removeEventListener('pointerdown', down as EventListener);
    el.removeEventListener('pointermove', move as EventListener);
    el.removeEventListener('pointerup', up as EventListener);
    el.removeEventListener('pointercancel', up as EventListener);
  };
}

/** Runs `tick(dt)` every frame until it returns false. */
export function animate(tick: (dt: number) => boolean): () => void {
  let last = performance.now();
  let raf = 0;
  const loop = (now: number): void => {
    const dt = Math.min(0.032, (now - last) / 1000);
    last = now;
    if (tick(dt)) raf = requestAnimationFrame(loop);
  };
  raf = requestAnimationFrame(loop);
  return () => cancelAnimationFrame(raf);
}

export function wait(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}
