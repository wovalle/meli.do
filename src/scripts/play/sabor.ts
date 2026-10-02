// The sabor dial. Drag it by hand, or just scroll: it follows the page from 0
// at the top to 100 once "who loves sabor." has left the screen. A drag takes
// over until the next real scroll. Reduced motion: hand-driven only.
//
// Nothing here runs per frame. Following the scroll is a CSS scroll-driven
// animation (play.css); this file only measures where the range ends (on load,
// resize and font swap). A hand on the dial puts paused Web Animations on top,
// with currentTime = the dial's value. Browsers without scroll-driven
// animations keep the old scroll-follow easing loop as a fallback.
import { SABOR_KEYFRAMES, saborFromDial, saborFromScroll, sparkOnKeyframes, type SaborKeyframes } from '../../lib/play/toys';
import { animate, onReducedMotionChange, reducedMotion } from './shared';

/** Scroll this far after a drag before the page takes the dial back. */
const RESUME_AFTER_PX = 24;
/** a held animation's currentTime per dial step (0..100 → 0..1000ms) */
const MS_PER_STEP = 10;
/** handing the dial back to the scroll glides there in this long instead of jumping */
const GLIDE_MS = 200;
/** while the page drives it, the dial's value (and the marquee speed) move in steps this big */
const SCROLL_STEP = 5;

const scrollDriven = typeof CSS !== 'undefined' && CSS.supports('animation-timeline: scroll()');

export function initSabor(dial: HTMLInputElement, onSpeed: (pxPerSecond: number) => void): void {
  const root = dial.closest<HTMLElement>('.sabor');
  if (!root) return;

  // every part that follows the level, with its keyframes (the same as play.css's scroll-driven ones)
  const parts: [Element, SaborKeyframes][] = [];
  const add = (sel: string, kf: SaborKeyframes): void => {
    const el = root.querySelector(sel);
    if (el) parts.push([el, kf]);
  };
  add('.sabor-word', SABOR_KEYFRAMES.word);
  add('.sabor-ink', SABOR_KEYFRAMES.ink);
  add('.sabor-ink-pink', SABOR_KEYFRAMES.pink);
  add('.sabor-sparks', SABOR_KEYFRAMES.sparks);
  add('.sabor-thumb-rail', SABOR_KEYFRAMES.thumb);
  root.querySelectorAll('.sabor-spark').forEach((el, i) => {
    parts.push([el, sparkOnKeyframes(i)]);
    parts.push([el, SABOR_KEYFRAMES.sparkGrow]);
  });

  // Held: paused Web Animations at the dial's value. The CSS scroll-driven
  // ones are switched off meanwhile (.is-held): stacked on top, the script
  // animation wins in getComputedStyle, but Chrome keeps compositing the
  // scroll-driven transform/opacity, so the thumb and the sparks never moved
  // on screen. Letting go = cancelling them and switching the scroll back on.
  let held: Animation[] | null = null;
  let glideTimer: ReturnType<typeof setTimeout> | undefined;
  const hold = (value: number): void => {
    clearTimeout(glideTimer);
    root.classList.add('is-held');
    held ??= parts.map(([el, kf]) => el.animate(kf, { duration: 100 * MS_PER_STEP, fill: 'both' }));
    for (const a of held) {
      a.pause();
      a.currentTime = value * MS_PER_STEP;
    }
  };
  const letGo = (): void => {
    clearTimeout(glideTimer);
    held?.forEach((a) => a.cancel());
    held = null;
    root.classList.remove('is-held');
  };
  // back to the scroll: run the held animations to where the page is, then hand over
  const glideTo = (value: number): void => {
    if (!held) return;
    const from = Number(held[0]?.currentTime ?? 0);
    const to = value * MS_PER_STEP;
    if (Math.abs(to - from) < MS_PER_STEP) {
      letGo();
      return;
    }
    for (const a of held) {
      a.updatePlaybackRate((to - from) / GLIDE_MS);
      a.play();
    }
    clearTimeout(glideTimer);
    glideTimer = setTimeout(letGo, GLIDE_MS);
  };

  let shown = -1; // the step last written to the dial and the marquee
  const show = (value: number): void => {
    if (value === shown) return;
    shown = value;
    root.classList.toggle('is-calm', value === 0);
    dial.value = String(value);
    onSpeed(saborFromDial(value).marqueeSpeed);
  };

  let end = 0; // scrollY at which the sabor line has left the top of the viewport
  let manual = false;
  let manualAt = 0;

  // Layout is read here only, on load, resize and font swap, never per scroll.
  const measure = (): void => {
    end = root.getBoundingClientRect().bottom + window.scrollY;
    root.style.setProperty('--sabor-end', `${Math.max(1, Math.round(end))}px`);
  };

  const fromScroll = (): number => saborFromScroll(window.scrollY, end);

  /* ----- fallback: no scroll-driven animations, the old easing loop moves the held animations ----- */
  let current = dial.valueAsNumber;
  let target = current;
  let stop: (() => void) | null = null;
  const run = (): void => {
    if (stop) return;
    stop = animate((dt) => {
      current += (target - current) * Math.min(1, dt * 8);
      if (Math.abs(target - current) < 0.3) current = target;
      hold(current);
      show(Math.round(current));
      if (current === target) {
        stop = null;
        return false;
      }
      return true;
    });
  };

  const follow = (): void => {
    if (reducedMotion()) return;
    const y = window.scrollY;
    if (manual) {
      if (Math.abs(y - manualAt) < RESUME_AFTER_PX) return;
      manual = false;
      if (scrollDriven) glideTo(fromScroll());
    }
    if (scrollDriven) {
      // the CSS animation follows on its own; the dial's value and the marquee speed step along
      show(Math.round(fromScroll() / SCROLL_STEP) * SCROLL_STEP);
      return;
    }
    target = fromScroll();
    if (target !== current) run();
  };

  dial.addEventListener('input', () => {
    // a person moved it: they're in charge until they scroll again
    manual = true;
    manualAt = window.scrollY;
    stop?.();
    stop = null;
    current = target = dial.valueAsNumber;
    hold(current);
    show(current);
  });

  // the page takes the dial (again): scroll-driven CSS, or the fallback loop
  const toScroll = (): void => {
    measure();
    if (scrollDriven) {
      letGo();
      show(fromScroll());
    } else {
      current = target = fromScroll();
      hold(current);
      show(current);
    }
  };

  dial.hidden = false;
  if (scrollDriven) root.classList.add('is-scroll-driven');
  if (reducedMotion()) {
    hold(current);
    show(current);
  } else {
    toScroll();
  }

  window.addEventListener('scroll', follow, { passive: true });
  const remeasure = (): void => {
    measure();
    follow();
  };
  window.addEventListener('resize', remeasure, { passive: true });
  // the h1 slides in (soft-up): measure again once it has landed (its own animation, not a child's)
  const h1 = root.closest('h1');
  const landed = (e: Event): void => {
    if (e.target !== h1) return;
    h1?.removeEventListener('animationend', landed);
    remeasure();
  };
  h1?.addEventListener('animationend', landed);
  void document.fonts?.ready.then(remeasure);
  onReducedMotionChange((reduced) => {
    if (reduced) {
      stop?.();
      stop = null;
      current = target = dial.valueAsNumber;
      hold(current);
    } else if (!manual) {
      toScroll();
    }
  });
}
