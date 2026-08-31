import type { APIRoute } from 'astro';
import { cachedOgImage, renderSiteCard, type SiteCard } from '../../lib/og';

export const prerender = false;

const CARDS: Record<string, SiteCard> = {
  home: {
    badges: [
      { text: 'Open for 2026 projects', variant: 'cream', dot: true },
      { text: '10 years designing', variant: 'pink' },
    ],
    lines: [
      ["¡Hola! I'm ", { text: 'Melissa', pink: true, italic: true }, ','],
      ['an art director'],
      ['who loves ', { text: 'sabor', italic: true }, '.'],
    ],
    fontSize: 104,
    subtitle: 'Dominican Art Director & Head of Design — Santo Domingo',
  },
  work: {
    badges: [
      { text: 'The archive', variant: 'cream', dot: true },
      { text: 'Case studies', variant: 'pink' },
    ],
    lines: [
      ['A decade of ', { text: 'brand work', pink: true, italic: true }, ','],
      ['grounded in'],
      ['Caribbean ', { text: 'warmth', italic: true }, '.'],
    ],
    fontSize: 96,
    subtitle: 'Brand, editorial & digital design — Melissa Encarnación',
  },
  links: {
    badges: [{ text: 'Open for 2026 projects', variant: 'cream', dot: true }],
    lines: [['Say ', { text: 'hola', pink: true, italic: true }, '.']],
    fontSize: 160,
    subtitle: 'Links, socials & contact — Melissa Encarnación',
  },
  terms: {
    badges: [{ text: 'Melissa Encarnación', variant: 'pink' }],
    lines: [['Términos del'], [{ text: 'servicio', pink: true, italic: true }, '.']],
    fontSize: 120,
    subtitle: 'Condiciones del proyecto',
  },
};

export const GET: APIRoute = ({ params, request }) =>
  cachedOgImage(request, async () => {
    const card = CARDS[params.page!];
    if (!card) return new Response('Not found', { status: 404 });
    return renderSiteCard(card);
  });
