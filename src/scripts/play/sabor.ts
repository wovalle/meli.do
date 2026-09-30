// The sabor dial. Drag it by hand, or just scroll: it follows the page from 0
// at the top to 100 once "who loves sabor." has left the screen. A drag takes
// over until the next real scroll. Reduced motion: hand-driven only.
import { saborFromDial, saborFromScroll } from '../../lib/play/toys';
import { animate, onReducedMotionChange, reducedMotion } from './shared';

/** Scroll this far after a drag before the page takes the dial back. */
const RESUME_AFTER_PX = 24;

export function initSabor(dial: HTMLInputElement, onSpeed: (pxPerSecond: number) => void): void {
  // --sabor lives on the word's wrapper, not :root, so a change restyles only the word
  const root = dial.closest<HTMLElement>('.sabor') ?? document.documentElement;

  // ✦ twinkle around the word while the dial moves: more, bigger and faster the higher it is.
  // Only transform/opacity animate; each star removes itself; never more than a dozen alive.
  let lastSpark = 0;
  let live = 0;
  const sparkle = (level: number): void => {
    if (reducedMotion() || level < 0.03) return;
    const now = performance.now();
    if (live >= 3 + level * 9 || now - lastSpark < 240 - level * 190) return;
    lastSpark = now;
    const star = document.createElement('span');
    star.className = 'sabor-spark';
    star.textContent = '✦';
    star.setAttribute('aria-hidden', 'true');
    star.style.left = `${-6 + Math.random() * 108}%`;
    star.style.top = `${-12 + Math.random() * 96}%`;
    star.style.fontSize = `${10 + Math.random() * (10 + level * 16)}px`;
    star.style.color = Math.random() < 0.55 ? 'var(--color-butter)' : 'var(--color-hot-pink)';
    live++;
    star.addEventListener('animationend', () => {
      star.remove();
      live--;
    }, { once: true });
    root.appendChild(star);
  };

  let shown = Number.NaN;
  const apply = (value: number): void => {
    const s = saborFromDial(value);
    root.style.setProperty('--sabor', s.level.toFixed(3));
    onSpeed(s.marqueeSpeed);
    if (!Number.isNaN(shown) && Math.abs(value - shown) > 0.2) sparkle(s.level);
    shown = value;
  };

  let end = 0; // scrollY at which the sabor line has left the top of the viewport
  let current = dial.valueAsNumber;
  let target = current;
  let manual = false;
  let manualAt = 0;
  let stop: (() => void) | null = null;

  // Layout is read here only, on load, resize and font swap, never per scroll.
  const measure = (): void => {
    end = root.getBoundingClientRect().bottom + window.scrollY;
  };

  const run = (): void => {
    if (stop) return;
    stop = animate((dt) => {
      current += (target - current) * Math.min(1, dt * 8);
      if (Math.abs(target - current) < 0.3) current = target;
      dial.value = String(Math.round(current));
      apply(current);
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
    }
    target = saborFromScroll(y, end);
    if (target !== current) run();
  };

  dial.addEventListener('input', () => {
    // a person moved it: they're in charge until they scroll again
    manual = true;
    manualAt = window.scrollY;
    stop?.();
    stop = null;
    current = target = dial.valueAsNumber;
    apply(current);
  });

  dial.hidden = false;
  document.querySelectorAll<HTMLElement>('[data-sabor-hint]').forEach((el) => (el.hidden = false));

  measure();
  if (!reducedMotion()) {
    current = target = saborFromScroll(window.scrollY, end);
    dial.value = String(current);
  }
  apply(current);

  window.addEventListener('scroll', follow, { passive: true });
  window.addEventListener('resize', () => {
    measure();
    follow();
  }, { passive: true });
  // the h1 slides in (soft-up): measure again once it has landed
  root.closest('h1')?.addEventListener('animationend', () => {
    measure();
    follow();
  }, { once: true });
  void document.fonts?.ready.then(() => {
    measure();
    follow();
  });
  onReducedMotionChange((reduced) => {
    if (reduced) {
      stop?.();
      stop = null;
    } else {
      follow();
    }
  });
}
