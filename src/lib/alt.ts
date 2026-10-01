/** Alt text for a project image: its own alt, or the project title when it has none (older imports). */
export function projectAlt(alt: string | null | undefined, title: string): string {
  return alt?.trim() || title;
}
