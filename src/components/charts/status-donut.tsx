import { useState } from 'react';
import { Link } from 'react-router-dom';

import { DataTable } from './chart-primitives';
import type { OrderStats } from '@/api/queries';
import { ORDER_STATUSES, STATUS_META, type OrderStatus } from '@/lib/status';

/**
 * Status visualization redesigned as an overlapping bubble/circle chart,
 * inspired by the Manageryo "Employee Mood Insights" panel.
 *
 * The three largest status groups are shown as overlapping circles with
 * percentage labels. The remaining statuses appear in a compact legend below.
 */
export function StatusDonut({ byStatus }: { byStatus: OrderStats['byStatus'] }) {
  const [active, setActive] = useState<OrderStatus | null>(null);

  const counts = new Map(byStatus.map((s) => [s.status as OrderStatus, s.count]));
  const total = byStatus.reduce((sum, s) => sum + s.count, 0);

  if (total === 0) {
    return <p className="text-xs text-fog-dim">No orders yet — the chart fills in as they arrive.</p>;
  }

  const segments = ORDER_STATUSES.map((status) => ({
    status,
    count: counts.get(status) ?? 0,
    share: (counts.get(status) ?? 0) / total,
  }))
    .filter((s) => s.count > 0)
    .sort((a, b) => b.count - a.count);

  // Top 3 for the circles, rest for the legend
  const topThree = segments.slice(0, 3);
  const colors = ['#8b5cf6', '#2f6bff', '#2ed47a'];
  const sizes = [140, 110, 80];

  return (
    <div className="flex flex-col items-center gap-5">
      {/* Overlapping circles */}
      <div
        className="relative flex items-center justify-center"
        style={{ height: 170, width: '100%' }}
        onMouseLeave={() => setActive(null)}
      >
        {topThree.map((seg, i) => {
          const meta = STATUS_META[seg.status];
          const size = sizes[i] ?? 70;
          const color = colors[i] ?? meta.chart;
          const isActive = active === seg.status;
          // Offset positions: center, slightly right, slightly more right+down
          const offsets = [
            { left: '28%', top: '15%' },
            { left: '48%', top: '10%' },
            { left: '55%', top: '40%' },
          ];

          return (
            <div
              key={seg.status}
              className="absolute flex items-center justify-center rounded-full transition-all duration-300 cursor-pointer"
              style={{
                width: size,
                height: size,
                background: `radial-gradient(circle at 35% 35%, color-mix(in oklab, ${color} 70%, #fff) 0%, ${color} 55%, color-mix(in oklab, ${color} 60%, #000) 100%)`,
                boxShadow: isActive
                  ? `0 0 30px color-mix(in oklab, ${color} 50%, transparent), 0 8px 30px -10px color-mix(in oklab, ${color} 60%, transparent)`
                  : `0 4px 20px -8px color-mix(in oklab, ${color} 40%, transparent)`,
                opacity: active && !isActive ? 0.4 : 1,
                transform: isActive ? 'scale(1.08)' : 'scale(1)',
                zIndex: isActive ? 10 : 3 - i,
                ...offsets[i],
              }}
              onMouseEnter={() => setActive(seg.status)}
            >
              <span className="text-center">
                <span className="block text-lg font-bold text-white drop-shadow-[0_1px_3px_rgba(0,0,0,0.4)]">
                  {Math.round(seg.share * 100)}%
                </span>
              </span>
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div
        className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2"
        onMouseLeave={() => setActive(null)}
      >
        {topThree.map((seg, i) => {
          const meta = STATUS_META[seg.status];
          const color = colors[i] ?? meta.chart;
          return (
            <Link
              key={seg.status}
              to={`/orders?status=${seg.status}`}
              onMouseEnter={() => setActive(seg.status)}
              className="flex items-center gap-1.5 text-[11px] text-fog transition-colors hover:text-ink"
            >
              <span
                className="size-2 shrink-0 rounded-full"
                style={{ backgroundColor: color }}
                aria-hidden
              />
              <span>{meta.label} {Math.round(seg.share * 100)}%</span>
            </Link>
          );
        })}
      </div>

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
