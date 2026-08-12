import { DataTable, Legend, TooltipRow } from './chart-primitives';
import { useChartTooltip } from '@/hooks/use-chart-tooltip';
import type { OrderStats } from '@/api/queries';
import { STATUS_META } from '@/lib/status';

/* Both series read off status.ts rather than inventing hexes: a newly created
   order *is* a pending one, so "created" borrows pending's neutral. The pair
   clears CVD separation (ΔE 11.2 deutan) and the normal-vision floor (18.7). */
const CREATED = STATUS_META.pending.chart;
const DELIVERED = STATUS_META.delivered.chart;

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
            className="flex shrink-0 flex-col justify-between py-0 text-right font-mono text-[10px] text-fog-dim"
            style={{ height: 168 }}
            aria-hidden
          >
            <span>{ceiling}</span>
            <span>{ceiling / 2}</span>
            <span>0</span>
          </div>

          <div className="relative flex-1">
            {/* Recessive gridlines — present enough to read a value against,
                quiet enough that the bars stay the figure. */}
            <div aria-hidden className="absolute inset-x-0 top-0 h-[168px]">
              {[0, 0.5, 1].map((t) => (
                <span
                  key={t}
                  className="absolute inset-x-0 border-t border-hairline/60"
                  style={{ top: `${t * 100}%` }}
                />
              ))}
            </div>

            <ul className="relative flex h-[168px] items-end gap-[3px]">
              {daily.map((day) => {
                const date = new Date(`${day.date}T00:00:00Z`);
                const label = `${weekday.format(date)} ${dayLabel.format(date)}`;
                const tip = (
                  <>
                    <p className="mb-1.5 font-medium text-[#e6eaf0]">{label}</p>
                    <TooltipRow color={CREATED} label="Created" value={day.created} />
                    <TooltipRow color={DELIVERED} label="Delivered" value={day.delivered} />
                  </>
                );

                return (
                  /* The hit target is the full-height column, not the bar, so a
                     day with nothing in it is still hoverable. */
                  <li
                    key={day.date}
                    className="group flex h-full flex-1 items-end justify-center gap-[2px]"
                    onMouseMove={(e) => show(e, tip)}
                    onMouseLeave={hide}
                  >
                    {(
                      [
                        [day.created, CREATED],
                        [day.delivered, DELIVERED],
                      ] as const
                    ).map(([value, color], i) => (
                      <span
                        key={i}
                        className="w-full max-w-[9px] rounded-t-[4px] transition-opacity group-hover:opacity-85"
                        style={{
                          height: value === 0 ? 2 : `${Math.max(3, (value / ceiling) * 100)}%`,
                          backgroundColor: value === 0 ? '#343b46' : color,
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
                    className="flex-1 text-center font-mono text-[9px] whitespace-nowrap text-fog-dim"
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
