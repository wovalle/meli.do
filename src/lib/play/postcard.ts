// Pure helpers for the mailable postcard on the home page.
// No contact endpoint exists in the repo, so a "sent" postcard resolves to a
// prefilled mailto: link.

export const CONTACT_EMAIL = 'hola@mellen.do';

export const BUDGETS = [
  { value: 'under-2k', label: 'under $2k' },
  { value: '2k-8k', label: '$2k – $8k' },
  { value: '8k-plus', label: '$8k +' },
  { value: 'not-sure', label: 'not sure yet' },
] as const;

export type BudgetValue = (typeof BUDGETS)[number]['value'];

export interface LoveLetter {
  name: string;
  project: string;
  budget: BudgetValue | '';
}

export function isBudgetValue(v: string): v is BudgetValue {
  return BUDGETS.some((b) => b.value === v);
}

export function budgetLabel(v: BudgetValue | ''): string {
  return BUDGETS.find((b) => b.value === v)?.label ?? 'not sure yet';
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
    `Budget-ish: ${budgetLabel(letter.budget)}`,
    '',
    `— ${name}`,
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
