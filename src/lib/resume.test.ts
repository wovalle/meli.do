import { test } from 'node:test';
import assert from 'node:assert/strict';
import { RESUME, telHref } from './resume.ts';

// Spot checks against public/resume.pdf, so an edit that drops or reorders a
// section shows up here.

test('experience is in the PDF order, newest role first at Liquid', () => {
  assert.deepEqual(
    RESUME.experience.map((j) => j.org),
    ['Liquid Digital Agency', 'Hey Marcas / El Snack Report', 'Castellanos Comunicaciones', 'Pagés BBDO', 'Ogilvy Dominicana', 'Serra SRL'],
  );
  assert.deepEqual(
    RESUME.experience[0].roles.map((r) => r.title),
    ['Head of Design', 'Art Director', 'Graphic Designer'],
  );
});

test('education is in the PDF order', () => {
  assert.deepEqual(
    RESUME.education.map((s) => s.school),
    ['Coursera', 'Miami AD School P.C.', 'Congo Films', 'Google Skillshop', 'La Pieza', 'Brother Santo Domingo', 'Universidad APEC'],
  );
});

test('skills and design programs', () => {
  assert.deepEqual(RESUME.skills, ['Art Direction', 'Graphic Design', 'Branding', 'Advertising']);
  assert.deepEqual(RESUME.programs, ['Adobe Photoshop', 'Adobe Illustrator', 'Adobe Indesign', 'Figma']);
});

test('every entry has text; only Serra SRL has no dates', () => {
  for (const job of RESUME.experience) {
    assert.ok(job.org && job.roles.length, job.org);
    for (const r of job.roles) assert.ok(r.title, job.org);
  }
  assert.deepEqual(
    RESUME.experience.filter((j) => j.roles.some((r) => !r.dates)).map((j) => j.org),
    ['Serra SRL'],
  );
  for (const s of RESUME.education) assert.ok(s.program && s.detail.length, s.school);
});

test('telHref keeps only the digits and the plus', () => {
  assert.equal(telHref(RESUME.contact.phone), 'tel:+18293572112');
});
