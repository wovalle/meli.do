export const formatDateTime = (ms: number | Date | null): string => {
  if (!ms) return 'not yet';
  const d = ms instanceof Date ? ms : new Date(ms);
  return d.toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short' });
};
