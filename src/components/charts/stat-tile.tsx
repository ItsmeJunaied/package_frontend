import type { LucideIcon } from 'lucide-react';

import { cn } from '@/lib/cn';

/**
 * A single number that needs no plot.
 *
 * "How many orders are in flight right now" is one value with no shape to it —
 * drawing it as a one-bar chart would add ink without adding information.
 *
 * The accent appears twice and quietly: as a tint behind the icon and as a
 * bloom bleeding in from the top-right corner. A solid coloured tile per stat
 * would turn a row of six into a paint chart, where the loudest colour wins
 * attention instead of the largest number.
 */
export function StatTile({
  label,
  value,
  sub,
  hint,
  icon: Icon,
  accent = 'var(--color-fog-dim)',
  isLoading = false,
}: {
  label: string;
  value: string | number;
  /** Trailing context that belongs to the number, e.g. "of 310". */
  sub?: string;
  hint?: string;
  icon: LucideIcon;
  accent?: string;
  isLoading?: boolean;
}) {
  return (
    <div className="panel group relative overflow-hidden rounded-xl border border-hairline p-4">
      <span
        aria-hidden
        className="absolute -top-14 -right-10 size-32 rounded-full opacity-60 blur-2xl transition-opacity duration-300 group-hover:opacity-100"
        style={{ background: `color-mix(in oklab, ${accent} 26%, transparent)` }}
      />

      <div className="relative flex items-center gap-2">
        <span
          className="grid size-6 shrink-0 place-items-center rounded-md"
          style={{
            backgroundColor: `color-mix(in oklab, ${accent} 16%, transparent)`,
            color: accent,
          }}
        >
          <Icon className="size-3.5" aria-hidden />
        </span>
        <p className="truncate text-[11px] font-medium tracking-wide text-fog uppercase">{label}</p>
      </div>

      {/* Sans rather than the console's usual mono: these are the six numbers
          the page is *for*, and the wider glyphs carry the size better. Every
          other number in the app stays mono. */}
      <p
        className={cn(
          'relative mt-3 flex items-baseline gap-1.5 text-[26px] leading-none font-semibold tracking-tight tabular-nums',
          isLoading && 'skeleton w-20 rounded text-transparent',
        )}
      >
        {value}
        {sub && !isLoading && <span className="text-xs font-normal text-fog-dim">{sub}</span>}
      </p>

      {hint && <p className="relative mt-2 truncate text-[11px] text-fog-dim">{hint}</p>}
    </div>
  );
}
