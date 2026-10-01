import { test } from 'node:test';
import assert from 'node:assert/strict';
import { projectAlt } from './alt.ts';

test('uses the image alt when present', () => {
  assert.equal(projectAlt('Bottle on a shelf', 'Alkasa'), 'Bottle on a shelf');
});

test('falls back to the project title for empty alts', () => {
  assert.equal(projectAlt('', 'Alkasa'), 'Alkasa');
  assert.equal(projectAlt('   ', 'Alkasa'), 'Alkasa');
  assert.equal(projectAlt(null, 'Alkasa'), 'Alkasa');
});
