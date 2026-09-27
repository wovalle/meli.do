// Draggable ✦ sparkles; double-tap (or double-click) paints them the next palette colour.
import { nextSparkleColor } from '../../lib/play/toys';
import { draggable, reducedMotion } from './shared';

const DOUBLE_TAP_MS = 320;

export function initSparkles(sparkles: Iterable<SVGSVGElement>): void {
  for (const el of sparkles) {
    const paint = el.querySelector<SVGElement>('[data-sparkle-paint]');
    let x = 0;
    let y = 0;
    let baseX = 0;
    let baseY = 0;
    let lastTap = -Infinity;

    const recolor = (): void => {
      if (!paint) return;
      const attr = paint.getAttribute('fill') === 'none' ? 'stroke' : 'fill';
      paint.setAttribute(attr, nextSparkleColor(paint.getAttribute(attr) ?? ''));
      if (!reducedMotion()) {
        el.classList.remove('is-popped');
        void el.getBoundingClientRect(); // restart the pop animation
        el.classList.add('is-popped');
      }
    };

    draggable(el, {
      onStart: () => {
        baseX = x;
        baseY = y;
        el.classList.add('is-held');
      },
      onMove: (m) => {
        x = baseX + m.dx;
        y = baseY + m.dy;
        el.style.translate = `${x}px ${y}px`;
      },
      onEnd: (m) => {
        el.classList.remove('is-held');
        if (!m.tap) return;
        const now = m.event.timeStamp;
        if (now - lastTap < DOUBLE_TAP_MS) {
          lastTap = -Infinity;
          recolor();
        } else {
          lastTap = now;
        }
      },
    });
  }
}
