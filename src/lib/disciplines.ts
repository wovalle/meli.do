// Disciplines shown in the home marquee and used to filter the archive (/work?d=<slug>).
// Case studies have no tags column yet, so matching is a keyword search over the
// title + summary (EN + ES). Add a keyword here if a project lands in the wrong bucket.

export interface Discipline {
  slug: string;
  label: string;
  keywords: readonly string[];
}

export const DISCIPLINES: readonly Discipline[] = [
  { slug: 'brand-identity', label: 'brand identity', keywords: ['brand', 'branding', 'identity', 'identidad', 'logo', 'marca', 'linea grafica'] },
  { slug: 'art-direction', label: 'art direction', keywords: ['art director', 'art direction', 'direccion de arte', 'director de arte', 'photography', 'fotografia'] },
  { slug: 'packaging', label: 'packaging', keywords: ['packaging', 'empaque', 'label', 'etiqueta', 'beer', 'cerveza', 'salami', 'bottle', 'botella'] },
  { slug: 'editorial', label: 'editorial', keywords: ['editorial', 'menu', 'menus', 'magazine', 'revista', 'book', 'libro'] },
  { slug: 'campaigns', label: 'campaigns', keywords: ['campaign', 'campaigns', 'campana', 'campanas', 'launch', 'lanzamiento'] },
  { slug: 'digital', label: 'digital', keywords: ['digital', 'social', 'web', 'podcast', 'instagram', 'platform', 'plataforma'] },
];

export function findDiscipline(slug: string | null | undefined): Discipline | undefined {
  if (!slug) return undefined;
  return DISCIPLINES.find((d) => d.slug === slug);
}

/** lowercase, accents stripped, punctuation → spaces */
export function normalizeText(s: string): string {
  return s
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

export function matchesDiscipline(study: { title: string; summary: string | null }, d: Discipline): boolean {
  const text = ` ${normalizeText(`${study.title} ${study.summary ?? ''}`)} `;
  // whole-word match so "web" doesn't hit "cobweb" and "menu" doesn't hit "menudo"
  return d.keywords.some((k) => text.includes(` ${normalizeText(k)} `));
}
