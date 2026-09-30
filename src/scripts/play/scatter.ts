// "Scatter" throws the selected-work tiles across the whole screen like printed
// proofs, on springs. Scattered tiles can be dragged around; a tap still opens
// the case study; "tidy up" springs them back into the grid.
// Reduced motion: the same positions, set instantly, no flight.
import { TOSS, isSettled, scatterTargets, stepSpring, type SpringState } from '../../lib/play/motion';
import { animate, draggable, reducedMotion } from './shared';

/** Room kept clear at the top for the sticky nav pill. */
const NAV_CLEARANCE = 96;
const MARGIN = 8;

interface Pose {
  x: number;
  y: number;
  rotate: number;
}

interface TileState {
  x: SpringState;
  y: SpringState;
  r: SpringState;
  target: Pose;
  held: boolean;
}

const still = (v: number): SpringState => ({ value: v, velocity: 0 });

export function initScatter(toggle: HTMLButtonElement, grid: HTMLElement): void {
  const tiles = Array.from(grid.querySelectorAll<HTMLElement>('[data-scatter-tile]'));
  if (tiles.length === 0) return;
  const label = toggle.querySelector<HTMLElement>('[data-scatter-label]') ?? toggle;

  let scattered = false;
  let z = 1;
  let stop: (() => void) | null = null;
  const states: TileState[] = tiles.map(() => ({ x: still(0), y: still(0), r: still(0), target: { x: 0, y: 0, rotate: 0 }, held: false }));

  const render = (tile: HTMLElement, s: TileState): void => {
    tile.style.translate = `${s.x.value.toFixed(1)}px ${s.y.value.toFixed(1)}px`;
    tile.style.rotate = `${s.r.value.toFixed(2)}deg`;
  };

  const snap = (): void => {
    tiles.forEach((tile, i) => {
      const s = states[i];
      if (!s) return;
      s.x = still(s.target.x);
      s.y = still(s.target.y);
      s.r = still(s.target.rotate);
      render(tile, s);
    });
  };

  /** One rAF loop drives every tile until they've all settled. */
  const run = (): void => {
    if (reducedMotion()) {
      snap();
      return;
    }
    if (stop) return;
    stop = animate((dt) => {
      let moving = false;
      tiles.forEach((tile, i) => {
        const s = states[i];
        if (!s || s.held) return;
        s.x = stepSpring(s.x, s.target.x, dt, TOSS);
        s.y = stepSpring(s.y, s.target.y, dt, TOSS);
        s.r = stepSpring(s.r, s.target.rotate, dt, TOSS);
        render(tile, s);
        if (!isSettled(s.x, s.target.x, 0.3) || !isSettled(s.y, s.target.y, 0.3) || !isSettled(s.r, s.target.rotate, 0.05)) moving = true;
      });
      if (!moving) {
        stop = null;
        snap();
        if (!scattered) finishTidy();
      }
      return moving;
    });
  };

  const finishTidy = (): void => {
    grid.classList.remove('is-scattered');
    for (const tile of tiles) {
      tile.style.translate = '';
      tile.style.rotate = '';
      tile.style.zIndex = '';
    }
  };

  const scatter = (): void => {
    scattered = true;
    const vw = document.documentElement.clientWidth;
    const vh = window.innerHeight;
    const gridBox = grid.getBoundingClientRect();
    grid.classList.add('is-scattered');
    const first = tiles[0];
    const k = first ? parseFloat(getComputedStyle(first).scale) || 1 : 1;
    const fullW = first?.offsetWidth ?? 0;
    const fullH = first?.offsetHeight ?? 0;
    const tileW = fullW * k;
    const tileH = fullH * k;
    const targets = scatterTargets(tiles.length, Math.floor(Math.random() * 2 ** 31), {
      left: MARGIN,
      top: NAV_CLEARANCE,
      width: vw - MARGIN * 2,
      height: vh - NAV_CLEARANCE - MARGIN,
      tileW,
      tileH,
    });
    tiles.forEach((tile, i) => {
      const s = states[i];
      const t = targets[i];
      if (!s || !t) return;
      // targets are viewport px; the tile's resting spot is its grid slot
      // (offsetLeft/Top ignore transforms; the grid is the offsetParent)
      // (a scaled tile shrinks around its centre, so its box starts (1-k)/2 in)
      const inset = { x: (fullW - tileW) / 2, y: (fullH - tileH) / 2 };
      s.target = { x: t.x - (gridBox.left + tile.offsetLeft + inset.x), y: t.y - (gridBox.top + tile.offsetTop + inset.y), rotate: t.rotate };
      // a little upward kick so they get thrown, not slid
      s.y.velocity -= 250 + Math.random() * 250;
      s.r.velocity += (i % 2 ? 1 : -1) * 120;
    });
    toggle.setAttribute('aria-pressed', 'true');
    label.textContent = 'tidy up';
    run();
  };

  const tidy = (): void => {
    scattered = false;
    for (const s of states) {
      s.target = { x: 0, y: 0, rotate: 0 };
      s.held = false;
    }
    for (const tile of tiles) tile.classList.remove('is-held');
    toggle.setAttribute('aria-pressed', 'false');
    label.textContent = 'scatter';
    if (reducedMotion()) {
      snap();
      finishTidy();
    } else {
      run();
    }
  };

  // re-aim at the new viewport after a resize / rotation, so nothing is stranded off-screen
  let resizeRaf = 0;
  window.addEventListener('resize', () => {
    if (!scattered) return;
    cancelAnimationFrame(resizeRaf);
    resizeRaf = requestAnimationFrame(() => scattered && scatter());
  }, { passive: true });

  toggle.hidden = false;
  toggle.addEventListener('click', () => (scattered ? tidy() : scatter()));

  tiles.forEach((tile, i) => {
    let base: Pose = { x: 0, y: 0, rotate: 0 };
    let justDragged = false;

    tile.addEventListener('dragstart', (e) => {
      if (scattered) e.preventDefault();
    });
    // a drag ends with a click on the link, swallow that one so dragging doesn't navigate
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
        const s = states[i];
        if (!scattered || !s) return false;
        s.held = true;
        base = { x: s.x.value, y: s.y.value, rotate: s.r.value };
        tile.style.zIndex = String(++z);
        tile.classList.add('is-held');
        return true;
      },
      onMove: (m) => {
        const s = states[i];
        if (!s || !scattered) return;
        s.x = still(base.x + m.dx);
        s.y = still(base.y + m.dy);
        s.target = { x: s.x.value, y: s.y.value, rotate: base.rotate };
        render(tile, s);
      },
      onEnd: (m) => {
        const s = states[i];
        tile.classList.remove('is-held');
        justDragged = !m.tap;
        // only the click that ends this drag is swallowed, not the next tap
        if (justDragged) setTimeout(() => (justDragged = false), 0);
        if (s) s.held = false;
        if (!scattered) run(); // tidied while held: spring home too
      },
    });
  });
}
