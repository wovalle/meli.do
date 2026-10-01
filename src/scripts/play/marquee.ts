// Discipline marquee driven by rAF (so its speed can change smoothly with the
// sabor dial) that eases to a stop on hover, touch or keyboard focus.
import { MARQUEE_BASE_SPEED } from '../../lib/play/toys';
import { animate, onReducedMotionChange, reducedMotion } from './shared';

export interface MarqueeControl {
  setSpeed: (pxPerSecond: number) => void;
}

const TOUCH_RESUME_MS = 1500;

export function initMarquee(root: HTMLElement): MarqueeControl {
  const track = root.querySelector<HTMLElement>('[data-marquee-track]');
  const first = track?.firstElementChild;
  if (!track || !(first instanceof HTMLElement)) return { setSpeed: () => {} };

  let speed = MARQUEE_BASE_SPEED;
  let current = speed;
  let offset = 0;
  let loopWidth = 0;
  let hovered = false;
  let touched = false;
  let focused = false;
  let visible = true;
  let stop: (() => void) | null = null;
  let touchTimer: ReturnType<typeof setTimeout> | undefined;

  const measure = (): void => {
    const gap = parseFloat(getComputedStyle(track).columnGap) || 0;
    loopWidth = first.offsetWidth + gap;
  };

  const run = (): void => {
    if (stop || !visible || reducedMotion()) return;
    stop = animate((dt) => {
      if (!visible || reducedMotion()) {
        stop = null;
        return false;
      }
      const target = hovered || touched || focused ? 0 : speed;
      current += (target - current) * Math.min(1, dt * 5);
      if (loopWidth > 0) offset = (offset + current * dt) % loopWidth;
      track.style.transform = `translate3d(${(-offset).toFixed(2)}px, 0, 0)`;
      return true;
    });
  };

  track.classList.add('is-driven');
  root.dataset.marqueeReady = '';
  measure();
  new ResizeObserver(measure).observe(first);

  root.addEventListener('pointerenter', (e) => {
    if (e.pointerType === 'mouse') hovered = true;
  });
  root.addEventListener('pointerleave', (e) => {
    if (e.pointerType === 'mouse') hovered = false;
  });
  root.addEventListener('pointerdown', (e) => {
    if (e.pointerType === 'mouse') return;
    clearTimeout(touchTimer);
    touched = true;
  });
  const release = (e: PointerEvent): void => {
    if (e.pointerType === 'mouse') return;
    clearTimeout(touchTimer);
    touchTimer = setTimeout(() => (touched = false), TOUCH_RESUME_MS);
  };
  root.addEventListener('pointerup', release);
  root.addEventListener('pointercancel', release);
  root.addEventListener('focusin', (e) => {
    focused = true;
    // bring the focused link on screen (the track may have carried it off to the left)
    // keyboard focus only (a mouse/touch press focuses the link too: moving it then would eat the click),
    // only when it is actually off screen, and never in the reduced-motion scrollable strip
    const link = e.target instanceof HTMLElement ? e.target : null;
    if (!link || reducedMotion() || !link.matches(':focus-visible')) return;
    const r = link.getBoundingClientRect();
    const box = root.getBoundingClientRect();
    if (r.left >= box.left && r.right <= box.right) return;
    root.scrollLeft = 0;
    if (loopWidth > 0) {
      offset = Math.max(0, link.offsetLeft - 24) % loopWidth;
      track.style.transform = `translate3d(${(-offset).toFixed(2)}px, 0, 0)`;
    }
  });
  root.addEventListener('focusout', () => (focused = false));

  new IntersectionObserver(([entry]) => {
    visible = entry?.isIntersecting ?? true;
    run();
  }).observe(root);

  onReducedMotionChange((reduced) => {
    if (reduced) track.style.transform = '';
    else run();
  });
  run();

  return {
    setSpeed: (px) => {
      speed = px;
    },
  };
}
