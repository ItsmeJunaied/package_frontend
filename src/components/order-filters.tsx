import { useEffect, useState } from 'react';
import { CalendarDays, Search, X } from 'lucide-react';

import { Button } from './ui/button';
import { useDebouncedValue } from '@/hooks/use-debounced-value';

export interface OrderFilterValues {
  q: string;
  from: string;
  to: string;
}

const EMPTY: OrderFilterValues = { q: '', from: '', to: '' };

const FIELD =
  'h-9 rounded-lg border border-hairline bg-graphite-deep px-3 text-sm text-ink ' +
  'placeholder:text-fog-dim hover:border-fog-dim focus:border-accent focus:outline-none';

/**
 * Search and date-range controls for the orders table.
 *
 * The search term is debounced but the date inputs are not: typing is a stream
 * of half-finished words, whereas picking a date is a single deliberate act
 * that is already complete when it fires.
 *
 * Both ends of the range are optional and independent — "everything since the
 * 1st" and "everything up to the 5th" are useful filters, so neither input
 * requires the other. The API validates that `from` is not after `to`.
 */
export function OrderFilters({
  value,
  onChange,
}: {
  value: OrderFilterValues;
  onChange: (next: OrderFilterValues) => void;
}) {
  /* Local state drives the box so typing never stutters; the debounced copy is
     what the caller hears about. */
  const [term, setTerm] = useState(value.q);
  const debouncedTerm = useDebouncedValue(term, 300);

  /*
   * Keep in step when `q` changes from somewhere else — Clear, or the back
   * button. Adjusted during render rather than in an effect: React re-runs this
   * component immediately with the new state, before anything paints, so the
   * box never shows a stale term for a frame the way an effect would.
   */
  const [lastExternalQ, setLastExternalQ] = useState(value.q);
  if (value.q !== lastExternalQ) {
    setLastExternalQ(value.q);
    setTerm(value.q);
  }

  useEffect(() => {
    if (debouncedTerm !== value.q) onChange({ ...value, q: debouncedTerm });
    // `value`/`onChange` are new objects every render; the debounced term is
    // the only thing whose change should push an update upward.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedTerm]);

  const dirty = Boolean(value.q || value.from || value.to);

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="relative min-w-[13rem] flex-1">
        <Search
          className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-fog-dim"
          aria-hidden
        />
        <input
          type="search"
          value={term}
          onChange={(e) => setTerm(e.target.value)}
          placeholder="Search customer or tracking number"
          aria-label="Search orders"
          className={`${FIELD} w-full pl-9`}
        />
      </div>

      <div className="flex items-center gap-1.5 rounded-lg border border-hairline bg-graphite-deep px-2.5 py-1">
        <CalendarDays className="size-4 shrink-0 text-fog-dim" aria-hidden />
        <input
          type="date"
          value={value.from}
          max={value.to || undefined}
          onChange={(e) => onChange({ ...value, from: e.target.value })}
          aria-label="Created from"
          className="bg-transparent text-xs text-ink focus:outline-none"
        />
        <span className="text-fog-dim" aria-hidden>
          →
        </span>
        <input
          type="date"
          value={value.to}
          min={value.from || undefined}
          onChange={(e) => onChange({ ...value, to: e.target.value })}
          aria-label="Created to"
          className="bg-transparent text-xs text-ink focus:outline-none"
        />
      </div>

      {dirty && (
        <Button size="sm" variant="ghost" onClick={() => onChange(EMPTY)}>
          <X className="size-3.5" aria-hidden />
          Clear
        </Button>
      )}
    </div>
  );
}
