import type { LucideIcon } from 'lucide-react';

import { cn } from '@/lib/cn';

/**
 * A single number that needs no plot.
 *
 * "How many orders are in flight right now" is one value with no shape to it —
 * drawing it as a one-bar chart would add ink without adding information. The
 * accent is a hairline rule, not a coloured background, so a row of six tiles
 * still reads as one surface.
 */
export function StatTile({
  label,
  value,
  hint,
  icon: Icon,
  accent = '#8b94a3',
  isLoading = false,
}: {
  label: string;
  value: string | number;
  hint?: string;
  icon: LucideIcon;
  accent?: string;
  isLoading?: boolean;
}) {
  return (
    <div className="relative overflow-hidden rounded-lg border border-hairline bg-slate-surface p-4">
      <span
        aria-hidden
        className="absolute inset-x-0 top-0 h-0.5"
        style={{ backgroundColor: accent }}
      />

      <div className="flex items-center gap-2">
        <Icon className="size-3.5 shrink-0 text-fog-dim" aria-hidden />
        <p className="text-[11px] font-medium tracking-wide text-fog uppercase">{label}</p>
      </div>

      <p
        className={cn(
          'mt-2 font-mono text-2xl leading-none font-semibold tabular-nums',
          isLoading && 'skeleton w-20 rounded text-transparent',
        )}
      >
        {value}
      </p>

      {hint && <p className="mt-1.5 text-xs text-fog-dim">{hint}</p>}
    </div>
  );
}
