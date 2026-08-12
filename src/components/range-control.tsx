import { CalendarDays } from 'lucide-react';

import { cn } from '@/lib/cn';
import { PRESETS, shiftUtcDays, spanDays, todayUtc } from '@/lib/date-range';
import type { StatsRange } from '@/api/queries';

/**
 * The dashboard's window: three rolling presets, or an explicit range.
 *
 * Presets and custom dates drive the same `from`/`to` on the server, so this is
 * one control with two entry points rather than two competing filters. Picking
 * "Custom" seeds the inputs from the last preset instead of opening empty —
 * an empty range would blank every chart until both dates were filled in.
 */
export function RangeControl({
  value,
  onChange,
  maxSpanDays = 90,
}: {
  value: StatsRange;
  onChange: (next: StatsRange) => void;
  maxSpanDays?: number;
}) {
  const isCustom = Boolean(value.from && value.to);

  const selectCustom = () => {
    const days = value.days ?? 7;
    onChange({ from: shiftUtcDays(-(days - 1)), to: todayUtc() });
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div
        role="group"
        aria-label="Time window"
        className="flex rounded-full border border-hairline bg-graphite-deep p-1"
      >
        {PRESETS.map(({ days, label }) => {
          const active = !isCustom && (value.days ?? 7) === days;
          return (
            <button
              key={days}
              type="button"
              onClick={() => onChange({ days })}
              aria-pressed={active}
              className={cn(
                'rounded-full px-3 py-1 font-mono text-[11px] transition-all',
                active ?
                  'bg-accent text-white shadow-[0_3px_10px_-3px_rgba(47,107,255,0.9)]'
                : 'text-fog-dim hover:text-fog',
              )}
            >
              {label}
            </button>
          );
        })}
        <button
          type="button"
          onClick={selectCustom}
          aria-pressed={isCustom}
          className={cn(
            'flex items-center gap-1.5 rounded-full px-3 py-1 font-mono text-[11px] transition-all',
            isCustom ?
              'bg-accent text-white shadow-[0_3px_10px_-3px_rgba(47,107,255,0.9)]'
            : 'text-fog-dim hover:text-fog',
          )}
        >
          <CalendarDays className="size-3" aria-hidden />
          Custom
        </button>
      </div>

      {isCustom && (
        <div className="flex items-center gap-1.5 rounded-full border border-hairline bg-graphite-deep px-3 py-1.5">
          <input
            type="date"
            value={value.from ?? ''}
            max={value.to}
            onChange={(e) => onChange({ from: e.target.value, to: value.to })}
            aria-label="Range start"
            className="bg-transparent font-mono text-[11px] text-ink focus:outline-none"
          />
          <span className="text-fog-dim" aria-hidden>
            →
          </span>
          <input
            type="date"
            value={value.to ?? ''}
            min={value.from}
            max={todayUtc()}
            onChange={(e) => onChange({ from: value.from, to: e.target.value })}
            aria-label="Range end"
            className="bg-transparent font-mono text-[11px] text-ink focus:outline-none"
          />
        </div>
      )}

      {isCustom && spanDays(value) > maxSpanDays && (
        <p className="text-[11px] text-alert">Pick {maxSpanDays} days or fewer.</p>
      )}
    </div>
  );
}
