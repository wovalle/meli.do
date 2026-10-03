/**
 * Melissa's links in one place, and the short paths that point at them
 * (same idea as willy.im's `app/static.ts` + its `/calendar` redirect).
 *
 * To add a shortcut: one line in `SHORTCUTS`. The middleware answers it
 * before any page, so it needs no file under `src/pages/`.
 */
export const linkedin = 'https://www.linkedin.com/in/melissa-encarnación-108ab497/';
export const instagram = 'https://instagram.com/mell.en';
export const behance = 'https://www.behance.net/melissaencaa0c';

/** The CV, a static file in `public/`. Replace the file to update it; the shortcuts keep working. */
export const resume = '/resume.pdf';

export const SHORTCUTS: Readonly<Record<string, string>> = {
  '/resume': resume,
  '/cv': resume,
  '/linkedin': linkedin,
};

/**
 * Where a shortcut path goes, or null when the path is not one.
 * Case and a trailing slash don't matter (`/CV/` works).
 */
export function shortcutTarget(pathname: string): string | null {
  const key = pathname.toLowerCase().replace(/\/+$/, '');
  return Object.hasOwn(SHORTCUTS, key) ? SHORTCUTS[key] : null;
}
