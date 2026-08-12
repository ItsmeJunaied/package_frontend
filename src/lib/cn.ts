type ClassValue = string | number | false | null | undefined;

/** Minimal class joiner — not worth a dependency at this size. */
export function cn(...values: ClassValue[]): string {
  return values.filter(Boolean).join(' ');
}
