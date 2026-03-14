/**
 * Format an ISO date string for display. Uses a fixed locale and options so
 * server and client render the same string (avoids hydration mismatch).
 */
export function formatDateTime(isoOrDate) {
  if (isoOrDate == null || isoOrDate === '') return '';
  const d = new Date(isoOrDate);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}
