import { test } from 'node:test';
import assert from 'node:assert/strict';
import { imageTransformsEnabled, supportsImageTransforms, withImageTransforms } from './img-transforms.ts';

test('only workers.dev hosts lack image transformations', () => {
  assert.equal(supportsImageTransforms('mellen.do'), true);
  assert.equal(supportsImageTransforms('localhost'), true);
  assert.equal(supportsImageTransforms('pr-18-meli-do.wovalle.workers.dev'), false);
});

test('the flag is per request and survives awaits; default is on', async () => {
  assert.equal(imageTransformsEnabled(), true);
  const seen = await Promise.all([
    withImageTransforms(false, async () => {
      await new Promise((r) => setTimeout(r, 5));
      return imageTransformsEnabled();
    }),
    withImageTransforms(true, async () => {
      await new Promise((r) => setTimeout(r, 1));
      return imageTransformsEnabled();
    }),
  ]);
  assert.deepEqual(seen, [false, true]);
  assert.equal(imageTransformsEnabled(), true);
});
