// "Scatter" the selected-work tiles like printed proofs dropped on a table.
// Scattered tiles can be dragged around; a tap still opens the case study;
// "tidy up" puts them back in the grid.
import { clamp, scatterPoses } from '../../lib/play/motion';
import { draggable, reducedMotion } from './shared';

const EDGE_SLACK = 4;

interface Pose {
  x: number;
  y: number;
  rotate: number;
}

export function initScatter(toggle: HTMLButtonElement, grid: HTMLElement): void {
  const tiles = Array.from(grid.querySelectorAll<HTMLElement>('[data-scatter-tile]'));
  if (tiles.length === 0) return;
  const label = toggle.querySelector<HTMLElement>('[data-scatter-label]') ?? toggle;

  let scattered = false;
  let poses: Pose[] = tiles.map(() => ({ x: 0, y: 0, rotate: 0 }));
  let z = 1;

  const place = (tile: HTMLElement, p: Pose): void => {
    tile.style.translate = `${p.x.toFixed(1)}px ${p.y.toFixed(1)}px`;
    tile.style.rotate = `${p.rotate.toFixed(2)}deg`;
  };

  const scatter = (): void => {
    scattered = true;
    const seed = Math.floor(Math.random() * 2 ** 31);
    const fresh = scatterPoses(tiles.length, seed);
    grid.classList.remove('is-tidying');
    grid.classList.add('is-scattered');
    tiles.forEach((tile, i) => {
      const f = fresh[i] ?? { x: 0, y: 0, rotate: 0 };
      // keep each proof on the table: edge tiles may only slide inwards, far
      // enough that their rotated corners stay inside the grid too
      // (offsetLeft ignores transforms; the grid is the offsetParent)
      const w = tile.offsetWidth;
      const h = tile.offsetHeight;
      const rad = (Math.abs(f.rotate) * Math.PI) / 180;
      const overhang = (w * Math.cos(rad) + h * Math.sin(rad) - w) / 2;
      const minX = -tile.offsetLeft + overhang - EDGE_SLACK;
      const maxX = grid.clientWidth - (tile.offsetLeft + w) - overhang + EDGE_SLACK;
      const p: Pose = { x: clamp(f.x * w, minX, maxX), y: f.y * h, rotate: f.rotate };
      poses[i] = p;
      place(tile, p);
      if (!reducedMotion()) {
        // drop in from above, spinning a bit more, and land with a bounce
        tile.animate(
          [
            { translate: `${p.x}px ${p.y - 90}px`, rotate: `${p.rotate * 2}deg`, scale: '1.08', opacity: 0.4 },
            { translate: `${p.x}px ${p.y}px`, rotate: `${p.rotate}deg`, scale: '1', opacity: 1 },
          ],
          { duration: 650, delay: i * 55, easing: 'cubic-bezier(0.34, 1.56, 0.64, 1)', fill: 'backwards' },
        );
      }
    });
    toggle.setAttribute('aria-pressed', 'true');
    label.textContent = 'tidy up';
  };

  const tidy = (): void => {
    scattered = false;
    grid.classList.add('is-tidying');
    grid.classList.remove('is-scattered');
    poses = tiles.map(() => ({ x: 0, y: 0, rotate: 0 }));
    for (const tile of tiles) {
      tile.style.translate = '';
      tile.style.rotate = '';
      tile.style.zIndex = '';
    }
    toggle.setAttribute('aria-pressed', 'false');
    label.textContent = 'scatter';
  };

  toggle.hidden = false;
  toggle.addEventListener('click', () => (scattered ? tidy() : scatter()));

  tiles.forEach((tile, i) => {
    let base: Pose = { x: 0, y: 0, rotate: 0 };
    let justDragged = false;

    tile.addEventListener('dragstart', (e) => {
      if (scattered) e.preventDefault();
    });
    // a drag ends with a click on the link — swallow that one so dragging doesn't navigate
    tile.addEventListener(
      'click',
      (e) => {
        if (!justDragged) return;
        justDragged = false;
        e.preventDefault();
      },
      true,
    );

    draggable(tile, {
      onStart: () => {
        if (!scattered) return false;
        base = poses[i] ?? base;
        tile.style.zIndex = String(++z);
        tile.classList.add('is-held');
        return true;
      },
      onMove: (m) => {
        const p: Pose = { x: base.x + m.dx, y: base.y + m.dy, rotate: base.rotate };
        poses[i] = p;
        place(tile, p);
      },
      onEnd: (m) => {
        tile.classList.remove('is-held');
        justDragged = !m.tap;
      },
    });
  });
}
