import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { linkedin, resume, resumePdf, shortcutTarget } from './links.ts';

test('/cv goes to the CV page, /linkedin to LinkedIn', () => {
  assert.equal(resume, '/resume');
  assert.equal(shortcutTarget('/cv'), resume);
  assert.equal(shortcutTarget('/linkedin'), linkedin);
});

test('/resume is the page itself, not a shortcut (a shortcut there would loop)', () => {
  for (const p of ['/resume', '/resume/', '/resume.pdf']) {
    assert.equal(shortcutTarget(p), null, p);
  }
});

test('case and trailing slash do not matter', () => {
  assert.equal(shortcutTarget('/CV/'), resume);
  assert.equal(shortcutTarget('/LinkedIn'), linkedin);
});

test('anything else is not a shortcut', () => {
  for (const p of ['/', '/work', '/cv/x', '/toString', '/constructor']) {
    assert.equal(shortcutTarget(p), null, p);
  }
});

test('the CV page and the PDF it offers both exist', () => {
  assert.ok(existsSync(new URL(`../pages${resume}.astro`, import.meta.url)));
  assert.ok(existsSync(new URL(`../../public${resumePdf}`, import.meta.url)));
});
