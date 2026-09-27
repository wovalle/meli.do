// Shakeable polaroid: drag it and it wobbles back on a spring; a tap or a good
// shake swaps to the next photo/caption.
import { POLAROID_CAPTIONS, nextPolaroidShot, type PolaroidShot } from '../../lib/play/toys';
import { WOBBLY, clamp, isSettled, stepSpring, type SpringState } from '../../lib/play/motion';
import { animate, draggable, reducedMotion } from './shared';

interface PhotoSource {
  src: string;
  srcset: string;
  alt: string;
}

function isPhotoSources(v: unknown): v is PhotoSource[] {
  return (
    Array.isArray(v) &&
    v.every(
      (p: unknown) =>
        typeof p === 'object' && p !== null && 'src' in p && 'srcset' in p && 'alt' in p &&
        typeof p.src === 'string' && typeof p.srcset === 'string' && typeof p.alt === 'string',
    )
  );
}

function parsePhotos(raw: string | undefined): PhotoSource[] {
  if (!raw) return [];
  try {
    const v: unknown = JSON.parse(raw);
    return isPhotoSources(v) ? v : [];
  } catch {
    return [];
  }
}

const SHAKE_SPEED = 500; // px/s before a direction change counts as a shake
const SHAKES_TO_SWAP = 3;

export function initPolaroid(root: HTMLElement): void {
  const img = root.querySelector<HTMLImageElement>('[data-polaroid-img]');
  const caption = root.querySelector<HTMLElement>('[data-polaroid-caption]');
  if (!caption) return;
  const photos = parsePhotos(root.dataset.photos);

  let shot: PolaroidShot = { photo: 0, caption: 0 };
  let x: SpringState = { value: 0, velocity: 0 };
  let y: SpringState = { value: 0, velocity: 0 };
  let r: SpringState = { value: 0, velocity: 0 };
  let held = false;
  let stop: (() => void) | null = null;
  let lastDir = 0;
  let shakes = 0;

  const render = (): void => {
    root.style.transform = `translate3d(${x.value.toFixed(2)}px, ${y.value.toFixed(2)}px, 0) rotate(${r.value.toFixed(2)}deg)`;
  };

  const settle = (): void => {
    if (stop || reducedMotion()) return;
    stop = animate((dt) => {
      if (held) {
        stop = null;
        return false;
      }
      x = stepSpring(x, 0, dt, WOBBLY);
      y = stepSpring(y, 0, dt, WOBBLY);
      r = stepSpring(r, 0, dt, WOBBLY);
      render();
      if (isSettled(x, 0, 0.1) && isSettled(y, 0, 0.1) && isSettled(r, 0, 0.05)) {
        x = { value: 0, velocity: 0 };
        y = { value: 0, velocity: 0 };
        r = { value: 0, velocity: 0 };
        root.style.transform = '';
        stop = null;
        return false;
      }
      return true;
    });
  };

  const swap = (): void => {
    shot = nextPolaroidShot(shot, photos.length, POLAROID_CAPTIONS.length);
    caption.textContent = POLAROID_CAPTIONS[shot.caption] ?? '';
    const photo = photos[shot.photo];
    if (img && photo && photos.length > 1) {
      img.srcset = photo.srcset;
      img.src = photo.src;
      img.alt = photo.alt;
    }
    if (!reducedMotion()) {
      caption.classList.remove('is-new');
      void caption.offsetWidth; // restart the pop animation
      caption.classList.add('is-new');
    }
  };

  const kick = (): void => {
    if (reducedMotion()) return;
    r.velocity += (Math.random() < 0.5 ? -1 : 1) * (140 + Math.random() * 80);
    y.velocity -= 90;
    settle();
  };

  draggable(root, {
    onStart: () => {
      held = true;
      lastDir = 0;
      shakes = 0;
      root.classList.add('is-held');
    },
    onMove: (m) => {
      if (reducedMotion()) return;
      // rubber-band: it follows, but reluctantly
      x = { value: m.dx * 0.45, velocity: 0 };
      y = { value: m.dy * 0.3, velocity: 0 };
      r = { value: clamp(m.dx * 0.06, -18, 18), velocity: 0 };
      render();
      const dir = Math.abs(m.vx) > SHAKE_SPEED ? Math.sign(m.vx) : 0;
      if (dir !== 0 && lastDir !== 0 && dir !== lastDir) shakes++;
      if (dir !== 0) lastDir = dir;
      if (shakes >= SHAKES_TO_SWAP) {
        shakes = 0;
        swap();
      }
    },
    onEnd: (m) => {
      held = false;
      root.classList.remove('is-held');
      if (m.tap) {
        swap();
        kick();
        return;
      }
      x.velocity = m.vx * 0.3;
      y.velocity = m.vy * 0.3;
      r.velocity = m.vx * 0.05;
      settle();
    },
  });

  root.addEventListener('keydown', (e) => {
    if (e.key !== 'Enter' && e.key !== ' ') return;
    e.preventDefault();
    swap();
    kick();
  });
}
