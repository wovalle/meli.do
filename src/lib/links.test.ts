import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { linkedin, resume, shortcutTarget } from './links.ts';

test('/resume and /cv go to the CV, /linkedin to LinkedIn', () => {
  assert.equal(shortcutTarget('/resume'), resume);
  assert.equal(shortcutTarget('/cv'), resume);
  assert.equal(shortcutTarget('/linkedin'), linkedin);
});

test('case and trailing slash do not matter', () => {
  assert.equal(shortcutTarget('/CV/'), resume);
  assert.equal(shortcutTarget('/LinkedIn'), linkedin);
});

test('anything else is not a shortcut', () => {
  for (const p of ['/', '/work', '/cv/x', '/resume.pdf', '/toString', '/constructor']) {
    assert.equal(shortcutTarget(p), null, p);
  }
});

test('the CV the shortcuts point at is in public/', () => {
  assert.ok(existsSync(new URL(`../../public${resume}`, import.meta.url)));
});
