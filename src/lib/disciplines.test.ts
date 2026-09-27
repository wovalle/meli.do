import { test } from 'node:test';
import assert from 'node:assert/strict';
import { DISCIPLINES, findDiscipline, matchesDiscipline, normalizeText, type Discipline } from './disciplines.ts';

const d = (slug: string): Discipline => {
  const found = findDiscipline(slug);
  assert.ok(found, slug);
  return found;
};

// Summaries as they are in production today.
const estelar = { title: 'Estelar', summary: 'As Art Director, I led the logo and campaign design for the launch of Salami Súper Especial Estelar in New York.' };
const temporada = { title: 'Restaurante Temporada - Temporada Chifa', summary: 'Rediseño de logo para Temporada Chifa y diseño de los diferentes menús (menú de platos - menú tragos y cocteles - carta de vinos).' };
const picaito = { title: 'Branding Bien Picaíto', summary: 'Desarrollo de logo y línea gráfica para el medio digital "Bien Picaíto" de Hey Marcas.' };

test('every discipline slug resolves; unknown slugs do not', () => {
  for (const x of DISCIPLINES) assert.equal(findDiscipline(x.slug), x);
  assert.equal(findDiscipline('nope'), undefined);
  assert.equal(findDiscipline(null), undefined);
});

test('normalizeText strips accents and punctuation', () => {
  assert.equal(normalizeText('Menú — Línea Gráfica!'), 'menu linea grafica');
});

test('keyword matching works across English and Spanish summaries', () => {
  assert.ok(matchesDiscipline(estelar, d('art-direction')));
  assert.ok(matchesDiscipline(estelar, d('campaigns')));
  assert.ok(matchesDiscipline(estelar, d('packaging')));
  assert.ok(matchesDiscipline(temporada, d('editorial')));
  assert.ok(matchesDiscipline(picaito, d('digital')));
  assert.ok(matchesDiscipline(picaito, d('brand-identity')));
  assert.ok(!matchesDiscipline(temporada, d('digital')));
  assert.ok(!matchesDiscipline({ title: 'Plain', summary: null }, d('editorial')));
});

test('matching is whole-word', () => {
  assert.ok(!matchesDiscipline({ title: 'Cobweb', summary: 'menudo' }, d('digital')));
  assert.ok(!matchesDiscipline({ title: 'Menudo', summary: null }, d('editorial')));
});
