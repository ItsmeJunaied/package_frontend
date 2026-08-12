import { useState } from 'react';

import { DataTable, Legend, TooltipRow } from './chart-primitives';
import { useChartTooltip } from '@/hooks/use-chart-tooltip';
import type { OrderStats } from '@/api/queries';
import { TRACK, markFillY, markGlow } from '@/lib/chart-style';
import { STATUS_META } from '@/lib/status';

/* Both series read off status.ts rather than inventing hexes: a newly created
   order *is* a pending one, so "created" borrows pending's neutral. The pair
   measures ΔE 22.9 under deuteranopia and 28.1 with normal vision — the widest
   separation of any pair on the dashboard, which is what a two-series chart at
   this density needs. */
const CREATED = STATUS_META.pending.chart;
const DELIVERED = STATUS_META.delivered.chart;

const PLOT_H = 172;

const dayLabel = new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short', timeZone: 'UTC' });
const weekday = new Intl.DateTimeFormat('en-GB', { weekday: 'short', timeZone: 'UTC' });

/**
 * Orders created against orders delivered, one pair of bars per day.
 *
 * Both series are counts, so they share one axis — the two-y-axis version of
 * this chart is the single most common way to make a dashboard lie, and it is
 * not available here even if the numbers were on different scales.
 *
 * Days with nothing in them are drawn as empty slots rather than skipped. A
 * gap in deliveries is a fact about the week, and a chart that quietly closes
 * it up reports a busier operation than the one that exists.
 */
export function DailyVolumeChart({ daily }: { daily: OrderStats['daily'] }) {
  const { show, hide, tooltip } = useChartTooltip();
  const [hovered, setHovered] = useState<string | null>(null);

  const peak = Math.max(1, ...daily.flatMap((d) => [d.created, d.delivered]));
  // Round the axis up to something a human would pick, so the gridline reads
  // as "5" or "10" rather than "7".
  const step = peak <= 4 ? 1 : peak <= 10 ? 2 : Math.ceil(peak / 5);
  const ceiling = Math.ceil(peak / step) * step;

  return (
    <div>
      <div className="mb-3">
        <Legend
          items={[
            { label: 'Created', color: CREATED },
            { label: 'Delivered', color: DELIVERED, icon: STATUS_META.delivered.icon },
          ]}
        />
      </div>

      {/* A narrow phone cannot show 30 days at a readable width; the plot
          scrolls inside the card rather than squeezing the bars to hairlines. */}
      <div className="-mx-1 overflow-x-auto px-1 pb-1">
        <div className="flex min-w-[520px] gap-3">
          <div
            className="flex shrink-0 flex-col justify-between text-right font-mono text-[10px] text-fog-dim tabular-nums"
            style={{ height: PLOT_H }}
            aria-hidden
          >
            <span>{ceiling}</span>
            <span>{ceiling / 2}</span>
            <span>0</span>
          </div>

          <div className="relative flex-1">
            {/* Recessive gridlines — present enough to read a value against,
                quiet enough that the bars stay the figure. */}
            <div aria-hidden className="absolute inset-x-0 top-0" style={{ height: PLOT_H }}>
              {[0, 0.5, 1].map((t) => (
                <span
                  key={t}
                  className="absolute inset-x-0 border-t border-white/[0.06]"
                  style={{ top: `${t * 100}%` }}
                />
              ))}
            </div>

            <ul className="relative flex items-end gap-[3px]" style={{ height: PLOT_H }}>
              {daily.map((day, index) => {
                const date = new Date(`${day.date}T00:00:00Z`);
                const label = `${weekday.format(date)} ${dayLabel.format(date)}`;
                const isHovered = hovered === day.date;
                const tip = (
                  <>
                    <p className="mb-1.5 font-medium text-ink">{label}</p>
                    <TooltipRow color={CREATED} label="Created" value={day.created} />
                    <TooltipRow color={DELIVERED} label="Delivered" value={day.delivered} />
                  </>
                );

                return (
                  /* The hit target is the full-height column, not the bar, so a
                     day with nothing in it is still hoverable. */
                  <li
                    key={day.date}
                    className="relative flex h-full flex-1 items-end justify-center gap-[2px]"
                    onMouseMove={(e) => {
                      setHovered(day.date);
                      show(e, tip);
                    }}
                    onMouseLeave={() => {
                      setHovered(null);
                      hide();
                    }}
                  >
                    {/* The column wash: which day you are reading, without
                        dragging a crosshair line across the bars. */}
                    <span
                      aria-hidden
                      className={
                        'pointer-events-none absolute inset-x-[-1px] top-0 bottom-0 rounded-[3px] bg-white/[0.04] transition-opacity ' +
                        (isHovered ? 'opacity-100' : 'opacity-0')
                      }
                    />

                    {(
                      [
                        [day.created, CREATED],
                        [day.delivered, DELIVERED],
                      ] as const
                    ).map(([value, color], i) => (
                      <span
                        key={i}
                        className="animate-rise-y relative w-full max-w-[10px] rounded-t-[4px] transition-[box-shadow,filter] duration-200"
                        style={{
                          height: value === 0 ? 2 : `${Math.max(3, (value / ceiling) * 100)}%`,
                          background: value === 0 ? TRACK : markFillY(color),
                          boxShadow: value === 0 || !isHovered ? undefined : markGlow(color),
                          filter: isHovered && value > 0 ? 'brightness(1.12)' : undefined,
                          // Stagger the growth left-to-right so the plot reads
                          // as filling in rather than snapping into place.
                          animationDelay: `${Math.min(index * 18, 320)}ms`,
                        }}
                      />
                    ))}
                  </li>
                );
              })}
            </ul>

            <ul className="mt-2 flex gap-[3px]" aria-hidden>
              {daily.map((day, i) => {
                const date = new Date(`${day.date}T00:00:00Z`);
                // Labelling all 14–30 days collides; every third tick plus the
                // last one keeps the axis readable at any window size.
                const showTick = i % 3 === 0 || i === daily.length - 1;
                return (
                  <li
                    key={day.date}
                    className={
                      'flex-1 text-center font-mono text-[9px] whitespace-nowrap transition-colors ' +
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
