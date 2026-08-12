import type { StatsRange } from '@/api/queries';

/** The dashboard's rolling presets. */
export const PRESETS = [
  { days: 7, label: '7d' },
  { days: 14, label: '14d' },
  { days: 30, label: '30d' },
] as const;

/**
 * Dates here are UTC calendar days throughout, matching how the API buckets
 * (`date_trunc(... at time zone 'UTC')`) and how it parses `from`/`to`. Using
 * the browser's local day would put a dispatcher in Dhaka six hours out of step
 * with the chart the server drew.
 */
export function todayUtc(): string {
  return new Date().toISOString().slice(0, 10);
}

export function shiftUtcDays(days: number): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

/** Inclusive day count for a range, or 0 when it is incomplete or malformed. */
export function spanDays(range: StatsRange): number {
  if (!range.from || !range.to) return 0;
  const from = Date.parse(`${range.from}T00:00:00Z`);
  const to = Date.parse(`${range.to}T00:00:00Z`);
  if (Number.isNaN(from) || Number.isNaN(to)) return 0;
  return Math.round((to - from) / 86_400_000) + 1;
}
