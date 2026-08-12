import type { LucideIcon } from 'lucide-react';

import { cn } from '@/lib/cn';

/**
 * A single number stat card with the new sidebar-layout dashboard style.
 * Shows a colored dot indicator, label, large value, and optional hint.
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
    <div className="panel group relative overflow-hidden rounded-2xl border border-hairline p-4 transition-all duration-200 hover:border-fog-dim/30">
      {/* Subtle glow from top-right */}
      <span
        aria-hidden
        className="absolute -top-14 -right-10 size-32 rounded-full opacity-50 blur-2xl transition-opacity duration-300 group-hover:opacity-80"
        style={{ background: `color-mix(in oklab, ${accent} 26%, transparent)` }}
      />

      {/* Header row: dot + label */}
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

      {/* Large number */}
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
