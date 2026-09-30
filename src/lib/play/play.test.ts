import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildLoveLetterMailto, isServiceValue, loveLetterBody, postmarkDate, servicesLabel } from './postcard.ts';
import { isSettled, rotatedOverhang, scatterTargets, seededRandom, stepSpring, type SpringState } from './motion.ts';
import { nextPolaroidShot, nextSparkleColor, saborFromDial, saborFromScroll, SPARKLE_PALETTE, MARQUEE_BASE_SPEED, POLAROID_CAPTIONS } from './toys.ts';

test('mailto goes to hola@mellen.do with subject and body prefilled', () => {
  const url = buildLoveLetterMailto({ name: 'Ana & Co', project: 'A rebrand for my café', services: ['packaging', 'branding'] });
  assert.ok(url.startsWith('mailto:hola@mellen.do?subject='));
  const params = new URLSearchParams(url.slice(url.indexOf('?') + 1));
  assert.equal(params.get('subject'), 'A love letter from Ana & Co ✦');
  const body = params.get('body') ?? '';
  assert.match(body, /^Dear Melissa,/);
  assert.match(body, /A rebrand for my café/);
  assert.match(body, /Services: branding & identity, packaging/);
  assert.match(body, /— Ana & Co/);
  // spaces must be %20, never "+", or some mail clients show pluses
  assert.ok(!url.includes('+'));
});

test('empty name falls back gracefully', () => {
  const body = loveLetterBody({ name: '  ', project: 'hi', services: [] });
  assert.match(body, /Services: not sure yet/);
  assert.match(body, /— a future client/);
});

test('services come from her real work and are validated', () => {
  assert.equal(isServiceValue('packaging'), true);
  assert.equal(isServiceValue('web'), false);
  assert.equal(servicesLabel(['campaigns', 'branding', 'packaging']), 'branding & identity, packaging, campaigns & art direction');
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

test('scatter spreads tiles over the whole visible area, fully on screen', () => {
  const area = { left: 0, top: 90, width: 1366, height: 810, tileW: 270, tileH: 270 };
  assert.deepEqual(scatterTargets(6, 42, area), scatterTargets(6, 42, area));
  for (const seed of [1, 2, 3, 42, 999]) {
    const t = scatterTargets(6, seed, area);
    for (const p of t) {
      const o = rotatedOverhang(area.tileW, area.tileH, p.rotate);
      assert.ok(p.x - o.x >= area.left - 0.01 && p.x + area.tileW + o.x <= area.left + area.width + 0.01, `x ${p.x}`);
      assert.ok(p.y - o.y >= area.top - 0.01 && p.y + area.tileH + o.y <= area.top + area.height + 0.01, `y ${p.y}`);
      assert.ok(Math.abs(p.rotate) >= 5 && Math.abs(p.rotate) <= 20);
    }
    // spread, not nudged: the tiles cover most of the screen's width and height
    const xs = t.map((p) => p.x), ys = t.map((p) => p.y);
    assert.ok(Math.max(...xs) - Math.min(...xs) > area.width * 0.4, 'wide spread');
    assert.ok(Math.max(...ys) - Math.min(...ys) > area.height * 0.2, 'tall spread');
  }
  // a phone: tiles still fit
  const phone = { left: 0, top: 90, width: 390, height: 750, tileW: 170, tileH: 170 };
  for (const p of scatterTargets(6, 7, phone)) assert.ok(p.x >= 0 && p.x + 170 <= 390 + 0.01);
  const r = seededRandom(1);
  for (let i = 0; i < 100; i++) {
    const v = r();
    assert.ok(v >= 0 && v < 1);
  }
});

test('scroll drives sabor from 0 at the top to 100 once the line has left', () => {
  assert.equal(saborFromScroll(0, 600), 0);
  assert.equal(saborFromScroll(300, 600), 50);
  assert.equal(saborFromScroll(900, 600), 100);
  assert.equal(saborFromScroll(-40, 600), 0);
  assert.equal(saborFromScroll(100, 0), 0);
});

test('the polaroid says what Willy asked for', () => {
  assert.ok(POLAROID_CAPTIONS.includes("i'm probably drinking coffee rn"));
  assert.ok(!POLAROID_CAPTIONS.some((c) => c.includes('café con leche')));
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
