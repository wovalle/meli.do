import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { inlineWordmark } from './logo.ts';

const read = (p: string) => readFileSync(new URL(p, import.meta.url), 'utf8');
const css = read('../styles/global.css');

/** [percent, degrees] pairs of one @keyframes block. */
function frames(name: string): [number, number][] {
  const block = css.match(new RegExp(`@keyframes ${name} \\{([\\s\\S]*?)\\n\\}`))?.[1];
  assert.ok(block, `@keyframes ${name} missing`);
  return [...block.matchAll(/([\d.]+)% \{ transform: rotate\((-?[\d.]+)deg\) \}/g)].map((m) => [+m[1], +m[2]]);
}

test('header wordmark is inline with the flower wrapped in .mark', () => {
  const svg = inlineWordmark(read('../../public/brand/mellen-wordmark.svg'));
  const mark = svg.match(/<g class="mark">([\s\S]*?)<\/g>/)?.[1] ?? '';
  assert.equal((mark.match(/<path/g) ?? []).length, 5);
  assert.ok(!mark.includes('#1A2B4A'), 'the letters stay still');
  assert.match(svg, /^<svg class="h-7 w-auto" role="img" aria-label="mellen"/);
});

test('El giro: a 1.2 s quarter turn on a spring, one ~11° overshoot, restarted every 9 s', () => {
  assert.match(css, /\.site-logo\.is-turning \.mark \{ animation: mark-spin 1\.2s linear 1; \}/);
  const f = frames('mark-spin');
  const peak = Math.max(...f.map(([, d]) => d));
  assert.ok(peak > 100 && peak < 102, `overshoot peak ${peak}`);
  assert.deepEqual(f[0], [0, 0]);
  assert.deepEqual(f.at(-1), [100, 90]); // 90° = 0° for the 4-fold mark: the snap back is invisible
  const logo = read('../components/SiteLogo.astro');
  assert.match(logo, /setInterval\(turn, 9000\)/);
  assert.match(logo, /prefers-reduced-motion: reduce/);
});

test('El toque: hover/focus flick is a damped sine (9°, 1.5 Hz, τ 0.42 s, 1.8 s)', () => {
  assert.match(css, /\.site-logo:is\(:hover, :focus-visible\) \.mark \{ animation: mark-flick 1\.8s linear 1; \}/);
  const f = frames('mark-flick');
  for (const [p, d] of f.slice(0, -1)) {
    const t = (p / 100) * 1.8;
    assert.ok(Math.abs(d - 9 * Math.sin(2 * Math.PI * 1.5 * t) * Math.exp(-t / 0.42)) < 0.01, `${p}%`);
  }
  assert.deepEqual(f.at(-1), [100, 0]);
});

test('reduced motion switches the logo off', () => {
  assert.match(css, /prefers-reduced-motion: reduce\) \{\s*\.site-logo \.mark \{ animation: none !important; \}/);
});
