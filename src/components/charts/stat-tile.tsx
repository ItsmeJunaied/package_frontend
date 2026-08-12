import type { LucideIcon } from 'lucide-react';
import { MoreHorizontal, TrendingUp, TrendingDown, Eye } from 'lucide-react';

import { cn } from '@/lib/cn';

/**
 * A single stat card matching the Manageryo dashboard design.
 * Shows a colored dot, label, large number, optional subtitle,
 * and an optional trend/action row at the bottom.
 */
export function StatTile({
  label,
  value,
  sub,
  hint,
  icon: Icon,
  accent = 'var(--color-fog-dim)',
  isLoading = false,
  trend,
  trendLabel,
  actionLabel,
  actionIcon: ActionIcon,
}: {
  label: string;
  value: string | number;
  /** Trailing context that belongs to the number, e.g. "of 310". */
  sub?: string;
  hint?: string;
  icon: LucideIcon;
  accent?: string;
  isLoading?: boolean;
  /** Percentage trend — positive = up, negative = down */
  trend?: number;
  trendLabel?: string;
  /** Link text at the bottom of the card */
  actionLabel?: string;
  /** Custom icon for the action row */
  actionIcon?: LucideIcon;
}) {
  const trendUp = trend != null && trend >= 0;
  const TrendIcon = trendUp ? TrendingUp : TrendingDown;

  return (
    <div className="panel group relative overflow-hidden rounded-2xl border border-hairline p-5 transition-all duration-200 hover:border-fog-dim/30">
      {/* Subtle glow from top-right */}
      <span
        aria-hidden
        className="absolute -top-16 -right-12 size-36 rounded-full opacity-40 blur-3xl transition-opacity duration-300 group-hover:opacity-70"
        style={{ background: `color-mix(in oklab, ${accent} 30%, transparent)` }}
      />

      {/* Header row: dot + label + more icon */}
      <div className="relative flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span
            className="size-2 shrink-0 rounded-full"
            style={{ backgroundColor: accent }}
            aria-hidden
          />
          <p className="text-xs font-medium text-fog">{label}</p>
        </div>
        {ActionIcon ? (
          <button type="button" className="grid size-6 place-items-center rounded-md text-fog-dim transition-colors hover:bg-slate-raised hover:text-fog">
            <ActionIcon className="size-4" />
          </button>
        ) : (
          <button type="button" className="grid size-6 place-items-center rounded-md text-fog-dim transition-colors hover:bg-slate-raised hover:text-fog">
            <MoreHorizontal className="size-4" />
          </button>
        )}
      </div>

      {/* Large number */}
      <p
        className={cn(
          'relative mt-3 flex items-baseline gap-2 text-[32px] leading-none font-bold tracking-tight tabular-nums',
          isLoading && 'skeleton w-24 rounded text-transparent',
        )}
      >
        {value}
        {sub && !isLoading && (
          <span className="text-sm font-normal text-fog-dim">{sub}</span>
        )}
      </p>

      {/* Bottom row: trend or hint */}
      <div className="relative mt-3 flex items-center justify-between">
        {trend != null && !isLoading ? (
          <span
            className={cn(
              'flex items-center gap-1 text-[11px] font-medium',
              trendUp ? 'text-delivered' : 'text-alert',
            )}
          >
            <TrendIcon className="size-3" />
            {Math.abs(trend)}% {trendLabel ?? ''}
          </span>
        ) : hint ? (
          <p className="truncate text-[11px] text-fog-dim">{hint}</p>
        ) : (
          <span />
        )}
        {actionLabel && !isLoading && (
          <span className="flex items-center gap-1 text-[11px] font-medium text-fog transition-colors group-hover:text-accent cursor-pointer">
            {actionLabel}
            <span className="text-fog-dim">›</span>
          </span>
        )}
      </div>
    </div>
  );
}
