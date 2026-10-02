// Discipline marquee: one CSS @keyframes loop (global.css `.marquee`), run by
// the compositor. Script never writes its transform; it only changes the
// loop's playbackRate (to follow the sabor dial, and to ease to a stop on
// hover, touch or keyboard focus), and only when one of those changes.
import { MARQUEE_BASE_SPEED } from '../../lib/play/toys';
import { onReducedMotionChange, reducedMotion } from './shared';

export interface MarqueeControl {
  setSpeed: (pxPerSecond: number) => void;
}

const TOUCH_RESUME_MS = 1500;
/** the ease to a stop (and back) on hover: a handful of rate steps, not a frame loop */
const EASE_STEP_MS = 60;

export function initMarquee(root: HTMLElement): MarqueeControl {
  const track = root.querySelector<HTMLElement>('[data-marquee-track]');
  const first = track?.firstElementChild;
  if (!track || !(first instanceof HTMLElement)) return { setSpeed: () => {} };

  let speed = MARQUEE_BASE_SPEED;
  let loopWidth = 0;
  let hovered = false;
  let touched = false;
  let focused = false;
  let touchTimer: ReturnType<typeof setTimeout> | undefined;
  let easeTimer: ReturnType<typeof setTimeout> | undefined;
  /** 1 = running at `speed`, 0 = stopped; stepped through EASE_STEPS on hover */
  let throttle = 1;

  // the CSS loop (none under reduced motion, where the strip stands still)
  const loop = (): Animation | undefined => track.getAnimations().find((a) => a instanceof CSSAnimation);
  const loopMs = (a: Animation): number => Number(a.effect?.getTiming().duration) || 0;

  const measure = (): void => {
    const gap = parseFloat(getComputedStyle(track).columnGap) || 0;
    loopWidth = first.offsetWidth + gap;
    applyRate();
  };

  // the CSS loop covers loopWidth px in its duration; scale it to `speed` px/s.
  // Stopped is pause(), never a playbackRate of 0: Safari snaps a composited
  // animation back by ~100px when its rate reaches 0.
  function applyRate(): void {
    const a = loop();
    if (!a || loopWidth <= 0) return;
    if (throttle === 0) {
      if (a.playState !== 'paused') a.pause();
      return;
    }
    if (a.playState === 'paused') a.play();
    const rate = ((speed * loopMs(a)) / 1000 / loopWidth) * throttle;
    if (Math.abs(a.playbackRate - rate) > 1e-3) a.updatePlaybackRate(rate);
  }

  const settle = (): void => {
    clearTimeout(easeTimer);
    const target = hovered || touched || focused ? 0 : 1;
    const step = (): void => {
      throttle += (target - throttle) * 0.5;
      if (Math.abs(target - throttle) < 0.05) throttle = target;
      applyRate();
      if (throttle !== target) easeTimer = setTimeout(step, EASE_STEP_MS);
    };
    step();
  };

  root.dataset.marqueeReady = '';
  measure();
  new ResizeObserver(measure).observe(first);

  root.addEventListener('pointerenter', (e) => {
    if (e.pointerType !== 'mouse') return;
    hovered = true;
    settle();
  });
  root.addEventListener('pointerleave', (e) => {
    if (e.pointerType !== 'mouse') return;
    hovered = false;
    settle();
  });
  root.addEventListener('pointerdown', (e) => {
    if (e.pointerType === 'mouse') return;
    clearTimeout(touchTimer);
    touched = true;
    settle();
  });
  const release = (e: PointerEvent): void => {
    if (e.pointerType === 'mouse') return;
    clearTimeout(touchTimer);
    touchTimer = setTimeout(() => {
      touched = false;
      settle();
    }, TOUCH_RESUME_MS);
  };
  root.addEventListener('pointerup', release);
  root.addEventListener('pointercancel', release);
  root.addEventListener('focusin', (e) => {
    focused = true;
    settle();
    // bring the focused link on screen (the track may have carried it off to the left)
    // keyboard focus only (a mouse/touch press focuses the link too: moving it then would eat the click),
    // only when it is actually off screen, and never in the reduced-motion scrollable strip
    const link = e.target instanceof HTMLElement ? e.target : null;
    if (!link || reducedMotion() || !link.matches(':focus-visible')) return;
    const r = link.getBoundingClientRect();
    const box = root.getBoundingClientRect();
    if (r.left >= box.left && r.right <= box.right) return;
    root.scrollLeft = 0;
    const a = loop();
    if (a && loopWidth > 0) a.currentTime = ((Math.max(0, link.offsetLeft - 24) % loopWidth) / loopWidth) * loopMs(a);
  });
  root.addEventListener('focusout', () => {
    focused = false;
    settle();
  });

  // reduced motion switched off: a fresh CSS loop starts at rate 1
  onReducedMotionChange(() => applyRate());

  return {
    setSpeed: (px) => {
      speed = px;
      applyRate();
    },
  };
}
