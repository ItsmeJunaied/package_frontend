import { useState } from 'react';

import { DataTable, Legend, TooltipRow } from './chart-primitives';
import { useChartTooltip } from '@/hooks/use-chart-tooltip';
import type { OrderStats } from '@/api/queries';
import { TRACK, markFillY, markGlow } from '@/lib/chart-style';
import { STATUS_META } from '@/lib/status';

const CREATED = STATUS_META.pending.chart;
const DELIVERED = STATUS_META.delivered.chart;

const PLOT_H = 220;

const dayLabel = new Intl.DateTimeFormat('en-GB', { weekday: 'short', timeZone: 'UTC' });

/**
 * Orders created against orders delivered, one pair of bars per day.
 * Restyled to match the Manageryo "Track Daily Task Progress" chart.
 */
export function DailyVolumeChart({ daily }: { daily: OrderStats['daily'] }) {
  const { show, hide, tooltip } = useChartTooltip();
  const [hovered, setHovered] = useState<string | null>(null);

  const peak = Math.max(1, ...daily.flatMap((d) => [d.created, d.delivered]));
  const step = peak <= 4 ? 1 : peak <= 10 ? 2 : Math.ceil(peak / 5);
  const ceiling = Math.ceil(peak / step) * step;

  // Y-axis labels
  const yLabels: number[] = [];
  for (let i = 0; i <= 4; i++) {
    yLabels.push(Math.round((ceiling / 4) * (4 - i)));
  }

  return (
    <div>
      <div className="mb-4">
        <Legend
          items={[
            { label: 'Created', color: CREATED },
            { label: 'Delivered', color: DELIVERED, icon: STATUS_META.delivered.icon },
          ]}
        />
      </div>

      <div className="-mx-1 overflow-x-auto px-1 pb-1">
        <div className="flex min-w-[480px] gap-3">
          {/* Y axis */}
          <div
            className="flex shrink-0 flex-col justify-between text-right font-mono text-[10px] text-fog-dim tabular-nums"
            style={{ height: PLOT_H }}
            aria-hidden
          >
            {yLabels.map((v, i) => (
              <span key={i}>{v}</span>
            ))}
          </div>

          {/* Plot area */}
          <div className="relative flex-1">
            {/* Gridlines */}
            <div aria-hidden className="absolute inset-x-0 top-0" style={{ height: PLOT_H }}>
              {[0, 0.25, 0.5, 0.75, 1].map((t) => (
                <span
                  key={t}
                  className="absolute inset-x-0 border-t border-white/[0.05]"
                  style={{ top: `${t * 100}%` }}
                />
              ))}
            </div>

            {/* Bars */}
            <ul className="relative flex items-end gap-[4px]" style={{ height: PLOT_H }}>
              {daily.map((day, index) => {
                const date = new Date(`${day.date}T00:00:00Z`);
                const label = dayLabel.format(date);
                const isHovered = hovered === day.date;
                const tip = (
                  <>
                    <p className="mb-1.5 font-medium text-ink">{label}</p>
                    <TooltipRow color={CREATED} label="Created" value={day.created} />
                    <TooltipRow color={DELIVERED} label="Delivered" value={day.delivered} />
                  </>
                );

                return (
                  <li
                    key={day.date}
                    className="relative flex h-full flex-1 items-end justify-center gap-[3px]"
                    onMouseMove={(e) => {
                      setHovered(day.date);
                      show(e, tip);
                    }}
                    onMouseLeave={() => {
                      setHovered(null);
                      hide();
                    }}
                  >
                    {/* Hover column highlight */}
                    <span
                      aria-hidden
                      className={
                        'pointer-events-none absolute inset-x-[-2px] top-0 bottom-0 rounded-md bg-white/[0.03] transition-opacity ' +
                        (isHovered ? 'opacity-100' : 'opacity-0')
                      }
                    />

                    {([
                      [day.created, CREATED],
                      [day.delivered, DELIVERED],
                    ] as const).map(([value, color], i) => (
                      <span
                        key={i}
                        className="animate-rise-y relative w-full max-w-[14px] rounded-t-[5px] transition-[box-shadow,filter] duration-200"
                        style={{
                          height: value === 0 ? 2 : `${Math.max(4, (value / ceiling) * 100)}%`,
                          background: value === 0 ? TRACK : markFillY(color),
                          boxShadow: value === 0 || !isHovered ? undefined : markGlow(color),
                          filter: isHovered && value > 0 ? 'brightness(1.15)' : undefined,
                          animationDelay: `${Math.min(index * 20, 360)}ms`,
                        }}
                      />
                    ))}
                  </li>
                );
              })}
            </ul>

            {/* X axis labels */}
            <ul className="mt-3 flex gap-[4px]" aria-hidden>
              {daily.map((day, i) => {
                const date = new Date(`${day.date}T00:00:00Z`);
                const showTick = i % 2 === 0 || i === daily.length - 1;
                return (
                  <li
                    key={day.date}
                    className={
                      'flex-1 text-center font-mono text-[10px] whitespace-nowrap transition-colors ' +
                      (hovered === day.date ? 'text-fog' : 'text-fog-dim')
                    }
                  >
                    {showTick ? dayLabel.format(date) : ''}
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      </div>

      <DataTable
        caption="Orders created and delivered per day"
        columns={['Date', 'Created', 'Delivered']}
        rows={daily.map((d) => [d.date, d.created, d.delivered])}
      />

      {tooltip}
    </div>
  );
}
