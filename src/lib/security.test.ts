import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { canonicalRedirect, SECURITY_HEADERS, withSecurityHeaders } from './security.ts';

test('http and www go to https://mellen.do with path and query', () => {
  assert.equal(canonicalRedirect(new URL('http://mellen.do/')), 'https://mellen.do/');
  assert.equal(canonicalRedirect(new URL('http://mellen.do/work/x?y=1')), 'https://mellen.do/work/x?y=1');
  assert.equal(canonicalRedirect(new URL('https://www.mellen.do/terms')), 'https://mellen.do/terms');
  assert.equal(canonicalRedirect(new URL('http://www.mellen.do/')), 'https://mellen.do/');
});

test('https apex, previews and local hosts are served as is', () => {
  assert.equal(canonicalRedirect(new URL('https://mellen.do/admin')), null);
  assert.equal(canonicalRedirect(new URL('http://localhost:4321/')), null);
  assert.equal(canonicalRedirect(new URL('https://pr-1-meli-do.wovalle.workers.dev/')), null);
});

test('security headers are added, also to immutable responses', () => {
  const res = withSecurityHeaders(new Response('ok'));
  for (const [k, v] of Object.entries(SECURITY_HEADERS)) assert.equal(res.headers.get(k), v);

  const frozen = new Response('img', { headers: { 'content-type': 'image/png' } });
  Object.defineProperty(frozen, 'headers', { value: new Proxy(frozen.headers, {
    get: (t, p) => (p === 'set' ? () => { throw new TypeError('immutable'); } : Reflect.get(t, p).bind?.(t) ?? Reflect.get(t, p)),
  }) });
  const copied = withSecurityHeaders(frozen);
  assert.equal(copied.headers.get('x-frame-options'), 'DENY');
  assert.equal(copied.headers.get('content-type'), 'image/png');
});

test('public/_headers gives static files the same headers', () => {
  const file = readFileSync(new URL('../../public/_headers', import.meta.url), 'utf8');
  for (const [k, v] of Object.entries(SECURITY_HEADERS)) assert.ok(file.includes(`  ${k}: ${v}\n`), `${k} missing in _headers`);
});
