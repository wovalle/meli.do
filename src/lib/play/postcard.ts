// Pure helpers for the mailable postcard on the home page.
// No contact endpoint exists in the repo, so a "sent" postcard resolves to a
// prefilled mailto: link.

export const CONTACT_EMAIL = 'hola@mellen.do';

// The three things her portfolio actually shows (see /work): brand identities
// (Alkasa, Bien Picaíto, Paseo One Four, Probanding…), packaging (Liquid Beer,
// Estelar) and campaigns / art direction (Estelar's NY launch, Alkasa's 30th).
export const SERVICES = [
  { value: 'branding', label: 'branding & identity' },
  { value: 'packaging', label: 'packaging' },
  { value: 'campaigns', label: 'campaigns & art direction' },
] as const;

export type ServiceValue = (typeof SERVICES)[number]['value'];

export interface LoveLetter {
  name: string;
  project: string;
  services: readonly ServiceValue[];
}

export function isServiceValue(v: string): v is ServiceValue {
  return SERVICES.some((s) => s.value === v);
}

/** Labels in the picker's order, whatever order they were ticked in. */
export function servicesLabel(picked: readonly ServiceValue[]): string {
  const labels = SERVICES.filter((s) => picked.includes(s.value)).map((s) => s.label);
  return labels.length ? labels.join(', ') : 'not sure yet';
}

export function loveLetterSubject(letter: LoveLetter): string {
  const name = letter.name.trim();
  return name ? `A love letter from ${name} ✦` : 'A love letter ✦';
}

export function loveLetterBody(letter: LoveLetter): string {
  const name = letter.name.trim() || 'a future client';
  return [
    'Dear Melissa,',
    '',
    letter.project.trim(),
    '',
    `Services: ${servicesLabel(letter.services)}`,
    '',
    `xo, ${name}`,
    '(sent from the postcard on mellen.do)',
  ].join('\n');
}

/** mailto: URL with subject + body prefilled. Uses %20 (not +) so every mail client reads spaces right. */
export function buildLoveLetterMailto(letter: LoveLetter, to: string = CONTACT_EMAIL): string {
  const q = `subject=${encodeURIComponent(loveLetterSubject(letter))}&body=${encodeURIComponent(loveLetterBody(letter))}`;
  return `mailto:${to}?${q}`;
}

const MONTHS = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'] as const;

/** Postmark date as stamped in Santo Domingo (SDQ), e.g. "26 SEP 2026". */
export function postmarkDate(date: Date, timeZone = 'America/Santo_Domingo'): string {
  const parts = new Intl.DateTimeFormat('en-US', { timeZone, day: 'numeric', month: 'numeric', year: 'numeric' }).formatToParts(date);
  const get = (type: Intl.DateTimeFormatPartTypes): number => Number(parts.find((p) => p.type === type)?.value ?? NaN);
  const month = MONTHS[get('month') - 1] ?? '';
  return `${String(get('day')).padStart(2, '0')} ${month} ${get('year')}`;
}
