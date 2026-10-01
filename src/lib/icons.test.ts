import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
// @ts-expect-error: plain .mjs build script, no types
import { readMark, iconSvg, ico } from '../../scripts/generate-icons.mjs';

const pub = (f: string) => new URL(`../../public/${f}`, import.meta.url);
const mark = readMark(readFileSync(pub('brand/mellen-mark.svg'), 'utf8'));

test('the icons come from the 2026 flower mark, not a font glyph', () => {
  assert.deepEqual(mark.viewBox, [100.5, 98.625, 47.875, 47.875]);
  assert.equal((mark.paths.match(/<path/g) ?? []).length, 5); // four petals + centre; unused glyph defs dropped
  assert.ok(!mark.paths.includes('glyph'));
  assert.match(mark.paths, /fill="#FF1392"/);
});

test('public/favicon.svg is the generator output (regenerate if the mark changes)', () => {
  assert.equal(readFileSync(pub('favicon.svg'), 'utf8'), iconSvg(mark));
});

test('the maskable art stays inside the 40% safe-zone circle', () => {
  const svg: string = iconSvg(mark, { size: 320, bg: '#D9CFF4' });
  const [, off, k] = svg.match(/translate\(([\d.]+) [\d.]+\) scale\(([\d.]+)\)/)!.map(Number);
  // farthest petal edge from the mark's centre, in mark units: corner petal centre + radius
  const [x, y, w] = mark.viewBox;
  const cx = x + w / 2, cy = y + w / 2;
  const reach = Math.hypot(112.515625 - cx, 110.589844 - cy) + 11.9375;
  assert.ok(reach * k <= 512 * 0.4, `reach ${reach * k}px`);
  assert.equal(off, (512 - 320) / 2);
});

test('favicon.ico holds 16 and 32 px PNGs', () => {
  const buf = readFileSync(pub('favicon.ico'));
  assert.equal(buf.readUInt16LE(2), 1);
  assert.equal(buf.readUInt16LE(4), 2);
  assert.deepEqual([buf[6], buf[6 + 16]], [16, 32]);
  const first = buf.readUInt32LE(6 + 12);
  assert.equal(buf.subarray(first + 1, first + 4).toString(), 'PNG');
  assert.equal(ico([]).length, 6);
});

test('manifest uses the logo palette and lists every icon', () => {
  const m = JSON.parse(readFileSync(pub('site.webmanifest'), 'utf8'));
  assert.equal(m.theme_color, '#D9CFF4');
  assert.equal(m.background_color, '#D9CFF4');
  assert.deepEqual(m.icons.map((i: { purpose: string }) => i.purpose), ['any', 'any', 'maskable']);
});
