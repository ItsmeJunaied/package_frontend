import { Link } from 'react-router-dom';

import { DataTable, TooltipRow } from './chart-primitives';
import { useChartTooltip } from '@/hooks/use-chart-tooltip';
import type { OrderStats } from '@/api/queries';
import { PIPELINE, STATUS_META, type OrderStatus } from '@/lib/status';

/**
 * Where the work is sitting, one row per pipeline stage.
 *
 * Deliberately not a funnel in the marketing sense — these are five
 * *concurrent* states, not five steps of a conversion, so the bars are scaled
 * against the largest stage rather than against the stage above them. Reading
 * it as "the widest bar is the bottleneck" is exactly the intended reading.
 *
 * `cancelled` is excluded: it is a side-exit from the pipeline, not a stage in
 * it, and mixing it in would make the busiest state look like an outcome.
 */
export function PipelineFunnel({ byStatus }: { byStatus: OrderStats['byStatus'] }) {
  const { show, hide, tooltip } = useChartTooltip();

  const counts = new Map(byStatus.map((s) => [s.status, s.count]));
  const stages = PIPELINE.map((status) => ({ status, count: counts.get(status) ?? 0 }));
  const peak = Math.max(1, ...stages.map((s) => s.count));

  return (
    <div>
      <ul className="space-y-2.5">
        {stages.map(({ status, count }) => {
          const meta = STATUS_META[status as OrderStatus];
          const Icon = meta.icon;

          return (
            <li key={status}>
              <Link
                to={`/orders?status=${status}`}
                className="group grid grid-cols-[5.5rem_1fr_2.25rem] items-center gap-2.5 rounded focus-visible:outline-none sm:grid-cols-[7.5rem_1fr_2.5rem] sm:gap-3"
              >
                <span className="flex items-center gap-1.5 text-xs text-fog group-hover:text-[#e6eaf0]">
                  <Icon className={`size-3.5 shrink-0 ${meta.text}`} aria-hidden />
                  <span className="truncate">{meta.label}</span>
                </span>

                {/* The track is the empty remainder — it makes "3 of a possible
                    12" readable without a numeric axis. */}
                <span className="h-2.5 w-full overflow-hidden rounded-[4px] bg-graphite-deep">
                  <span
                    className="block h-full rounded-[4px] transition-[width,opacity] duration-300 group-hover:opacity-85"
                    style={{
                      width: `${Math.max(count === 0 ? 0 : 2, (count / peak) * 100)}%`,
                      backgroundColor: meta.chart,
                    }}
                    onMouseMove={(e) => show(e, <TooltipRow color={meta.chart} label={meta.label} value={count} />)}
                    onMouseLeave={hide}
                  />
                </span>

                <span className="text-right font-mono text-sm tabular-nums">{count}</span>
              </Link>
            </li>
          );
        })}
      </ul>

      <DataTable
        caption="Orders in each pipeline stage"
        columns={['Stage', 'Orders']}
        rows={stages.map(({ status, count }) => [STATUS_META[status as OrderStatus].label, count])}
      />

      {tooltip}
    </div>
  );
}
