const dateTime = new Intl.DateTimeFormat('en-GB', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
});

const timeOnly = new Intl.DateTimeFormat('en-GB', {
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
});

/** Returns true when the Date object is valid (not NaN). */
function isValidDate(d: Date): boolean {
  return !Number.isNaN(d.getTime());
}

export function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (!isValidDate(d)) return '—';
  return dateTime.format(d);
}

export function formatTime(iso: string | null | undefined): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (!isValidDate(d)) return '—';
  return timeOnly.format(d);
}

export function formatWeight(kg: number): string {
  return `${kg.toFixed(2)} kg`;
}

/** "3 h ago", "just now" — for the table's created column. */
export function formatRelative(iso: string | null | undefined): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (!isValidDate(d)) return '—';

  const diffMs = Date.now() - d.getTime();
  const minutes = Math.round(diffMs / 60_000);

  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes} min ago`;

  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} h ago`;

  const days = Math.round(hours / 24);
  if (days < 30) return `${days} d ago`;

  return formatDateTime(iso);
}
