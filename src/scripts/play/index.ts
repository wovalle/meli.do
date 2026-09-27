// Home page toys. Everything here is progressive enhancement: without JS (or
// with prefers-reduced-motion) the page still reads and every link still works.
import { saborFromDial } from '../../lib/play/toys';
import { initMarquee } from './marquee';
import { initPolaroid } from './polaroid';
import { initPostcard } from './postcard';
import { initScatter } from './scatter';
import { initSparkles } from './sparkles';

export function initHomePlay(): void {
  const postcard = document.querySelector<HTMLElement>('[data-postcard]');
  if (postcard) initPostcard(postcard);

  const polaroid = document.querySelector<HTMLElement>('[data-polaroid]');
  if (polaroid) initPolaroid(polaroid);

  initSparkles(document.querySelectorAll<SVGSVGElement>('svg[data-sparkle]'));

  const marqueeRoot = document.querySelector<HTMLElement>('[data-marquee]');
  const marquee = marqueeRoot ? initMarquee(marqueeRoot) : null;

  const dial = document.querySelector<HTMLInputElement>('[data-sabor-dial]');
  if (dial) {
    const apply = (): void => {
      const s = saborFromDial(dial.valueAsNumber);
      document.documentElement.style.setProperty('--sabor', s.level.toFixed(3));
      marquee?.setSpeed(s.marqueeSpeed);
    };
    dial.addEventListener('input', apply);
    apply();
    dial.hidden = false;
    document.querySelectorAll<HTMLElement>('[data-sabor-hint]').forEach((el) => (el.hidden = false));
  }

  const toggle = document.querySelector<HTMLButtonElement>('[data-scatter-toggle]');
  const grid = document.querySelector<HTMLElement>('[data-scatter-grid]');
  if (toggle && grid) initScatter(toggle, grid);
}
