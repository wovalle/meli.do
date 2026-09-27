import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildLoveLetterMailto, isBudgetValue, loveLetterBody, postmarkDate } from './postcard.ts';
import { isSettled, scatterPoses, seededRandom, stepSpring, type SpringState } from './motion.ts';
import { nextPolaroidShot, nextSparkleColor, saborFromDial, SPARKLE_PALETTE, MARQUEE_BASE_SPEED } from './toys.ts';

test('mailto goes to hola@mellen.do with subject and body prefilled', () => {
  const url = buildLoveLetterMailto({ name: 'Ana & Co', project: 'A rebrand for my café', budget: '2k-8k' });
  assert.ok(url.startsWith('mailto:hola@mellen.do?subject='));
  const params = new URLSearchParams(url.slice(url.indexOf('?') + 1));
  assert.equal(params.get('subject'), 'A love letter from Ana & Co ✦');
  const body = params.get('body') ?? '';
  assert.match(body, /^Dear Melissa,/);
  assert.match(body, /A rebrand for my café/);
  assert.match(body, /Budget-ish: \$2k – \$8k/);
  assert.match(body, /— Ana & Co/);
  // spaces must be %20, never "+", or some mail clients show pluses
  assert.ok(!url.includes('+'));
});

test('empty name falls back gracefully', () => {
  const body = loveLetterBody({ name: '  ', project: 'hi', budget: '' });
  assert.match(body, /Budget-ish: not sure yet/);
  assert.match(body, /— a future client/);
});

test('budget values are validated', () => {
  assert.equal(isBudgetValue('8k-plus'), true);
  assert.equal(isBudgetValue('a million'), false);
});

test('postmark uses the SDQ calendar day', () => {
  // 02:00 UTC on Sep 27 is still Sep 26 in Santo Domingo (UTC-4)
  assert.equal(postmarkDate(new Date('2026-09-27T02:00:00Z')), '26 SEP 2026');
  assert.equal(postmarkDate(new Date('2026-01-05T15:00:00Z')), '05 JAN 2026');
});

test('spring overshoots (wobbles) and then settles on the target', () => {
  let s: SpringState = { value: 10, velocity: 0 };
  let crossed = false;
  for (let i = 0; i < 600; i++) {
    s = stepSpring(s, 0, 1 / 60);
    if (s.value < 0) crossed = true;
  }
  assert.ok(crossed, 'should overshoot at least once');
  assert.ok(isSettled(s, 0), `should settle, got ${JSON.stringify(s)}`);
});

test('scatter is deterministic per seed and stays within bounds', () => {
  assert.deepEqual(scatterPoses(6, 42), scatterPoses(6, 42));
  assert.notDeepEqual(scatterPoses(6, 42), scatterPoses(6, 43));
  for (const p of scatterPoses(50, 7)) {
    assert.ok(Math.abs(p.x) <= 0.25 && Math.abs(p.y) <= 0.2);
    assert.ok(Math.abs(p.rotate) >= 4 && Math.abs(p.rotate) <= 16);
  }
  const r = seededRandom(1);
  for (let i = 0; i < 100; i++) {
    const v = r();
    assert.ok(v >= 0 && v < 1);
  }
});

test('polaroid cycles captions; with one photo the photo stays put', () => {
  let shot = { photo: 0, caption: 0 };
  shot = nextPolaroidShot(shot, 1, 3);
  assert.deepEqual(shot, { photo: 0, caption: 1 });
  shot = nextPolaroidShot(nextPolaroidShot(shot, 1, 3), 1, 3);
  assert.deepEqual(shot, { photo: 0, caption: 0 });
  assert.deepEqual(nextPolaroidShot({ photo: 1, caption: 0 }, 2, 3), { photo: 0, caption: 1 });
});

test('double-tapped sparkles walk the palette and wrap', () => {
  assert.equal(nextSparkleColor('#ff1493'), SPARKLE_PALETTE[1]);
  assert.equal(nextSparkleColor(SPARKLE_PALETTE[SPARKLE_PALETTE.length - 1]), SPARKLE_PALETTE[0]);
  assert.equal(nextSparkleColor('rebeccapurple'), SPARKLE_PALETTE[0]);
});

test('more sabor = more level and a faster marquee; input is clamped', () => {
  assert.deepEqual(saborFromDial(0), { level: 0, marqueeSpeed: MARQUEE_BASE_SPEED });
  assert.deepEqual(saborFromDial(100), { level: 1, marqueeSpeed: MARQUEE_BASE_SPEED * 5 });
  assert.equal(saborFromDial(250).level, 1);
  assert.equal(saborFromDial(-5).level, 0);
  assert.ok(saborFromDial(80).marqueeSpeed > saborFromDial(20).marqueeSpeed);
});
