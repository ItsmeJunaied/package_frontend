import { useState } from 'react';
import { Link } from 'react-router-dom';

import { DataTable } from './chart-primitives';
import type { OrderStats } from '@/api/queries';
import { dimmed } from '@/lib/chart-style';
import { ORDER_STATUSES, STATUS_META, type OrderStatus } from '@/lib/status';

/** Surface showing through between segments, in degrees. */
const GAP = 2.4;
/** Where the hole starts, as a fraction of the radius. */
const HOLE = 0.62;

/**
 * Part-to-whole across the six statuses, as a ring.
 *
 * Segments run in pipeline order, not by size. That keeps the ring readable as
 * a journey — and it is the order the palette's adjacent-pair separation was
 * measured in (see lib/status.ts).
 */
export function StatusDonut({ byStatus }: { byStatus: OrderStats['byStatus'] }) {
  const [active, setActive] = useState<OrderStatus | null>(null);

  const counts = new Map(byStatus.map((s) => [s.status as OrderStatus, s.count]));
  const total = byStatus.reduce((sum, s) => sum + s.count, 0);

  if (total === 0) {
    return <p className="text-xs text-fog-dim">No orders yet — the ring fills in as they arrive.</p>;
  }

  const segments = ORDER_STATUSES.map((status) => ({
    status,
    count: counts.get(status) ?? 0,
    share: (counts.get(status) ?? 0) / total,
  })).filter((s) => s.count > 0);

  /* One conic-gradient string for the whole ring. */
  let cursor = 0;
  const stops: string[] = [];
  for (const { status, share } of segments) {
    const sweep = share * 360;
    const gap = Math.min(GAP, sweep * 0.3);
    const base = STATUS_META[status].chart;
    const fill = active && active !== status ? dimmed(base) : base;
    stops.push(`${fill} ${cursor}deg ${cursor + sweep - gap}deg`);
    stops.push(`transparent ${cursor + sweep - gap}deg ${cursor + sweep}deg`);
    cursor += sweep;
  }

  const highlight = active ? STATUS_META[active].chart : STATUS_META.in_transit.chart;
  const shown = active ? (counts.get(active) ?? 0) : total;

  return (
    <div className="flex flex-col items-center gap-5 sm:flex-row sm:items-center sm:gap-6">
      <div className="relative shrink-0" onMouseLeave={() => setActive(null)}>
        <span
          aria-hidden
          className="absolute inset-3 rounded-full blur-2xl transition-colors duration-300"
          style={{ background: `color-mix(in oklab, ${highlight} 22%, transparent)` }}
        />
        <div
          aria-hidden
          className="relative size-[152px] rounded-full transition-[background] duration-200"
          style={{
            background: `conic-gradient(from -90deg, ${stops.join(', ')})`,
            WebkitMaskImage: `radial-gradient(circle at 50% 50%, transparent 0 ${HOLE * 100}%, #000 ${HOLE * 100 + 0.5}%)`,
            maskImage: `radial-gradient(circle at 50% 50%, transparent 0 ${HOLE * 100}%, #000 ${HOLE * 100 + 0.5}%)`,
          }}
        />
        <div className="pointer-events-none absolute inset-0 grid place-items-center text-center">
          <div>
            <p className="text-2xl leading-none font-semibold tracking-tight tabular-nums">
              {shown.toLocaleString()}
            </p>
            <p className="mt-1 text-[10px] tracking-wide text-fog-dim uppercase">
              {active ? STATUS_META[active].label : 'orders'}
            </p>
          </div>
        </div>
      </div>

      {/* Legend with real numbers */}
      <ul className="w-full min-w-0 flex-1 space-y-0.5" onMouseLeave={() => setActive(null)}>
        {segments.map(({ status, count, share }) => {
          const meta = STATUS_META[status];
          const Icon = meta.icon;
          const isActive = active === status;

          return (
            <li key={status}>
              <Link
                to={`/orders?status=${status}`}
                onMouseEnter={() => setActive(status)}
                onFocus={() => setActive(status)}
                className={
                  'flex items-center gap-2.5 rounded-md px-2 py-1.5 transition-colors ' +
                  (isActive ? 'bg-slate-raised' : 'hover:bg-slate-raised/60')
                }
              >
                <span
                  aria-hidden
                  className="size-2 shrink-0 rounded-full"
                  style={{
                    backgroundColor: meta.chart,
                    boxShadow: `0 0 0 3px color-mix(in oklab, ${meta.chart} 18%, transparent)`,
                  }}
                />
                <Icon className={`size-3 shrink-0 ${meta.text}`} aria-hidden />
                <span className="min-w-0 flex-1 truncate text-xs text-fog">{meta.label}</span>
                <span className="font-mono text-xs font-medium tabular-nums">{count}</span>
                <span className="w-9 text-right font-mono text-[11px] text-fog-dim tabular-nums">
                  {(share * 100).toFixed(0)}%
                </span>
              </Link>
            </li>
          );
        })}
      </ul>

      <DataTable
        caption="Orders by status"
        columns={['Status', 'Orders', 'Share']}
        rows={byStatus.map(({ status, count }) => [
          STATUS_META[status as OrderStatus].label,
          count,
          `${((count / total) * 100).toFixed(1)}%`,
        ])}
      />
    </div>
  );
}
