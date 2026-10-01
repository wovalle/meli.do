import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { siteCardTree, caseStudyCardTree, svgDataUri, HOT_PINK, type BrandSvgs, type El } from './og-cards.ts';

const read = (path: string) => readFileSync(new URL(`../../${path}`, import.meta.url), 'utf8');

const brand: BrandSvgs = {
  mark: read('public/brand/mellen-mark.svg'),
  markNavy: read('public/brand/mellen-mark-navy.svg'),
  wordmark: read('public/brand/mellen-wordmark.svg'),
  wordmarkOnNavy: read('public/brand/mellen-wordmark-on-navy.svg'),
};

/** Every node in a satori tree. */
function nodes(tree: El): El[] {
  const kids = tree.props.children;
  const list = Array.isArray(kids) ? kids : kids && typeof kids === 'object' ? [kids] : [];
  return [tree, ...list.flatMap((k) => nodes(k as El))];
}
const images = (tree: El) => nodes(tree).filter((n) => n.type === 'img').map((n) => n.props);
const texts = (tree: El) => nodes(tree).flatMap((n) => (typeof n.props.children === 'string' ? [n.props.children] : []));

const site = siteCardTree(
  { badges: [{ text: 'Open for 2026 projects', variant: 'cream', dot: true }], lines: [['Say ', { text: 'hola', pink: true, italic: true }, '.']], fontSize: 160, subtitle: 'Links' },
  brand,
);
const caseCard = caseStudyCardTree({ background: null, title: 'Estelar', subtitle: 'Case study by Melissa Encarnación' }, brand);

test('site card decorations are the logo flower, drawn from the logo files', () => {
  const srcs = images(site).map((i) => i.src);
  assert.ok(srcs.includes(svgDataUri(brand.mark)), 'big pink flower');
  assert.ok(srcs.includes(svgDataUri(brand.markNavy)), 'small navy flower');
  const big = images(site).find((i) => i.src === svgDataUri(brand.mark))!;
  const small = images(site).find((i) => i.src === svgDataUri(brand.markNavy))!;
  assert.ok(big.width! > small.width!, 'the pink flower is the large one');
});

test('the generic sparkles are gone from the cards', () => {
  for (const tree of [site, caseCard]) {
    const all = images(tree).map((i) => decodeURIComponent(i.src!.replace(/^data:image\/svg\+xml,/, ''))).join('\n');
    assert.doesNotMatch(all, /M24 2 L28 20 L46 24/, '4-point star');
    assert.doesNotMatch(all, /M48 6 Q 60 30 84 40/, 'curvy sparkle');
  }
});

test('the site card signs with the wordmark SVG, not "mellen.do" in Kalam', () => {
  const wm = images(site).find((i) => i.src === svgDataUri(brand.wordmark));
  if (!wm) throw new Error('wordmark image missing');
  assert.ok(Math.abs(wm.width! / wm.height! - 234.25 / 47.875) < 0.02, 'keeps the viewBox ratio');
  assert.ok(wm.height! >= 20, 'at or above the 20px minimum');
  assert.ok(!texts(site).some((t) => /mellen/i.test(t)), 'no typeset "mellen"');
  assert.doesNotMatch(JSON.stringify(site), /Kalam/);
});

test('the case-study card uses the on-navy wordmark and the palette pink', () => {
  assert.ok(images(caseCard).some((i) => i.src === svgDataUri(brand.wordmarkOnNavy)));
  assert.ok(!texts(caseCard).some((t) => /mellen/i.test(t)));
  const json = JSON.stringify(caseCard);
  assert.doesNotMatch(json, /FF2E88/i);
  assert.ok(nodes(caseCard).some((n) => n.props.style?.background === HOT_PINK), 'pink accent bar');
});

test('og.ts loads the logo files from public/brand instead of redrawing them', () => {
  const og = read('src/lib/og.ts');
  for (const f of ['mellen-mark.svg', 'mellen-mark-navy.svg', 'mellen-wordmark.svg', 'mellen-wordmark-on-navy.svg']) {
    assert.match(og, new RegExp(`from '../../public/brand/${f.replace('.', '\\.')}\\?raw'`), f);
  }
});
