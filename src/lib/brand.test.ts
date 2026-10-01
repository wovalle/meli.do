import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

// The logo (public/brand/*.svg) is the source of truth for pink and lavender;
// the site theme, the OG renderer and DESIGN.md must use the same values.
const read = (path: string) => readFileSync(new URL(`../../${path}`, import.meta.url), 'utf8');

const fills = (svg: string) => new Set([...svg.matchAll(/fill="(#[0-9A-Fa-f]{6})"/g)].map((m) => m[1].toUpperCase()));

const LOGO_PINK = '#FF1392';
const LOGO_LAVENDER = '#D9CFF4';
const NAVY = '#1A2B4A';

test('the logo SVGs use the brand pink, lavender and navy', () => {
  assert.deepEqual(fills(read('public/brand/mellen-wordmark.svg')), new Set([LOGO_PINK, NAVY]));
  assert.deepEqual(fills(read('public/brand/mellen-wordmark-on-navy.svg')), new Set([LOGO_PINK, LOGO_LAVENDER]));
});

test('the Tailwind theme matches the logo colors', () => {
  const css = read('src/styles/global.css');
  assert.match(css, new RegExp(`--color-hot-pink: ${LOGO_PINK};`));
  assert.match(css, new RegExp(`--color-lavender: ${LOGO_LAVENDER};`));
  assert.match(css, new RegExp(`--color-navy: ${NAVY};`));
});

test('the OG renderer and theme-color match the logo colors', () => {
  const og = read('src/lib/og.ts');
  assert.match(og, new RegExp(`HOT_PINK = '${LOGO_PINK}'`));
  assert.match(og, new RegExp(`LAVENDER = '${LOGO_LAVENDER}'`));
  assert.match(read('src/layouts/PublicLayout.astro'), new RegExp(`name="theme-color" content="${LOGO_LAVENDER}"`));
});

test('DESIGN.md tokens match the logo colors', () => {
  const md = read('DESIGN.md');
  assert.match(md, new RegExp(`\\n  primary: "${LOGO_PINK}"`));
  assert.match(md, new RegExp(`\\n  neutral: "${LOGO_LAVENDER}"`));
});

test('no pre-logo pink or lavender is left in the site code', () => {
  for (const path of [
    'src/styles/global.css',
    'src/styles/play.css',
    'src/lib/og.ts',
    'src/lib/play/toys.ts',
    'src/layouts/PublicLayout.astro',
    'src/pages/index.astro',
    'src/pages/work/index.astro',
    'src/pages/404.astro',
  ]) {
    assert.doesNotMatch(read(path), /FF1493|D9D0F5/i, path);
  }
});
