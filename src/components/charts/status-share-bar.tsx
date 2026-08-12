import { DataTable, Legend, TooltipRow } from './chart-primitives';
import { useChartTooltip } from '@/hooks/use-chart-tooltip';
import type { OrderStats } from '@/api/queries';
import { STATUS_META, type OrderStatus } from '@/lib/status';

/**
 * Part-to-whole across the six statuses, as one horizontal strip.
 *
 * A donut was the obvious reach here and the wrong one: six slices means six
 * angles to compare, and the two smallest would be unlabelable wedges. A single
 * 100% bar keeps every segment on one baseline, gives thin segments somewhere
 * to put a label, and collapses to full width on a phone.
 */
export function StatusShareBar({ byStatus }: { byStatus: OrderStats['byStatus'] }) {
  const { show, hide, tooltip } = useChartTooltip();

  const total = byStatus.reduce((sum, s) => sum + s.count, 0);
  const present = byStatus.filter((s) => s.count > 0);

  if (total === 0) {
    return <p className="text-xs text-fog-dim">No orders yet — the strip fills in as they arrive.</p>;
  }

  return (
    <div>
      {/* gap-[2px] is the surface showing through between segments: adjacent
          fills never touch, so a boundary is a boundary even between two blues. */}
      <div className="flex h-7 w-full gap-[2px] overflow-hidden rounded-[4px]" aria-hidden>
        {present.map(({ status, count }) => {
          const meta = STATUS_META[status as OrderStatus];
          const share = count / total;
          return (
            <div
              key={status}
              className="grid min-w-[3px] place-items-center transition-opacity hover:opacity-85"
              style={{ backgroundColor: meta.chart, flexGrow: count, flexBasis: 0 }}
              onMouseMove={(e) =>
                show(
                  e,
                  <TooltipRow
                    color={meta.chart}
                    label={meta.label}
                    value={`${count} · ${(share * 100).toFixed(0)}%`}
                  />,
                )
              }
              onMouseLeave={hide}
            >
              {/* Direct label, but only where it fits — a clipped "12" is worse
                  than no number, and the tooltip covers the narrow segments. */}
              {share > 0.09 && (
                <span className="px-1 font-mono text-[11px] font-semibold text-graphite">
                  {count}
                </span>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-3">
        <Legend
          items={present.map(({ status }) => ({
            label: STATUS_META[status as OrderStatus].label,
            color: STATUS_META[status as OrderStatus].chart,
            icon: STATUS_META[status as OrderStatus].icon,
          }))}
        />
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

      {tooltip}
    </div>
  );
}
