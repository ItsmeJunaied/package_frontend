import { Link } from 'react-router-dom';

import { DataTable, Legend, TooltipRow } from './chart-primitives';
import { useChartTooltip } from '@/hooks/use-chart-tooltip';
import type { OrderStats } from '@/api/queries';
import { STATUS_META } from '@/lib/status';

const SERIES = [
  { key: 'active', label: 'Active', color: STATUS_META.in_transit.chart, icon: STATUS_META.in_transit.icon },
  { key: 'delivered', label: 'Delivered', color: STATUS_META.delivered.chart, icon: STATUS_META.delivered.icon },
  { key: 'cancelled', label: 'Cancelled', color: STATUS_META.cancelled.chart, icon: STATUS_META.cancelled.icon },
] as const;

/**
 * Who is carrying what, as a stacked bar per courier.
 *
 * Stacked rather than grouped because the question is "how loaded is this
 * courier" first and "what is the split" second — the total length answers the
 * first at a glance, which three separate bars would not.
 *
 * Rows are sorted by total and share one scale, so bar length is comparable
 * between couriers rather than each row filling its own width.
 */
export function CourierLoadChart({ byCourier }: { byCourier: OrderStats['byCourier'] }) {
  const { show, hide, tooltip } = useChartTooltip();

  if (byCourier.length === 0) {
    return <p className="text-xs text-fog-dim">No orders assigned to a courier yet.</p>;
  }

  const peak = Math.max(1, ...byCourier.map((c) => c.total));
  const rows = byCourier.slice(0, 8);

  return (
    <div>
      <div className="mb-3">
        <Legend items={SERIES.map(({ label, color, icon }) => ({ label, color, icon }))} />
      </div>

      <ul className="space-y-2.5">
        {rows.map((courier) => (
          <li
            key={courier.courierName}
            className="grid grid-cols-[5rem_1fr_2rem] items-center gap-2.5 sm:grid-cols-[6.5rem_1fr_2rem] sm:gap-3"
          >
            <Link
              to={`/courier?name=${encodeURIComponent(courier.courierName)}`}
              className="truncate text-xs text-fog transition-colors hover:text-[#e6eaf0]"
              title={courier.courierName}
            >
              {courier.courierName}
            </Link>

            <span
              className="flex h-2.5 gap-[2px]"
              style={{ width: `${Math.max(4, (courier.total / peak) * 100)}%` }}
            >
              {SERIES.map(({ key, label, color }) => {
                const value = courier[key];
                if (value === 0) return null;
                return (
                  <span
                    key={key}
                    className="h-full rounded-[4px] transition-opacity hover:opacity-85"
                    style={{ flexGrow: value, flexBasis: 0, backgroundColor: color }}
                    onMouseMove={(e) =>
                      show(
                        e,
                        <>
                          <p className="mb-1.5 font-medium text-[#e6eaf0]">{courier.courierName}</p>
                          <TooltipRow color={color} label={label} value={value} />
                          <TooltipRow label="Total" value={courier.total} />
                        </>,
                      )
                    }
                    onMouseLeave={hide}
                  />
                );
              })}
            </span>

            <span className="text-right font-mono text-sm tabular-nums">{courier.total}</span>
          </li>
        ))}
      </ul>

      {byCourier.length > rows.length && (
        <p className="mt-3 text-[11px] text-fog-dim">
          Showing the {rows.length} busiest of {byCourier.length} couriers.
        </p>
      )}

      <DataTable
        caption="Orders per courier"
        columns={['Courier', 'Active', 'Delivered', 'Cancelled', 'Total']}
        rows={byCourier.map((c) => [c.courierName, c.active, c.delivered, c.cancelled, c.total])}
      />

      {tooltip}
    </div>
  );
}
