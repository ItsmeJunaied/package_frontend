import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Activity,
  CheckCircle2,
  CircleSlash,
  Package,
  Timer,
  Weight,
} from 'lucide-react';

import { ChartCard } from '@/components/charts/chart-primitives';
import { CourierLoadChart } from '@/components/charts/courier-load-chart';
import { DailyVolumeChart } from '@/components/charts/daily-volume-chart';
import { PipelineFunnel } from '@/components/charts/pipeline-funnel';
import { StatTile } from '@/components/charts/stat-tile';
import { StatusDonut } from '@/components/charts/status-donut';
import { StatusBadge } from '@/components/status-badge';
import { ErrorState } from '@/components/ui/states';
import { useStats } from '@/api/queries';
import { cn } from '@/lib/cn';
import { formatRelative } from '@/lib/format';
import { STATUS_META, type OrderStatus } from '@/lib/status';

const WINDOWS = [7, 14, 30] as const;

/*
 * Tile accents are chrome, not encoding — the tile already names its metric in
 * words, so the colour is only there to keep six identical cards from reading
 * as one grey slab. That is why `--color-violet`, which is banned from chart
 * marks for sitting too close to `in_transit` blue, is allowed on a tile.
 */
const VIOLET = 'var(--color-violet)';

/** "6.4 h" while it is hours, "2.1 d" once it stops being. */
function formatDuration(hours: number | null): string {
  if (hours === null) return '—';
  return hours < 48 ? `${hours.toFixed(1)} h` : `${(hours / 24).toFixed(1)} d`;
}

export function DashboardPage() {
  const [days, setDays] = useState<(typeof WINDOWS)[number]>(14);
  const query = useStats(days);

  if (query.isError) {
    return (
      <div className="panel rounded-xl border border-hairline">
        <ErrorState
          title="Couldn't load the dashboard"
          message={query.error.message}
          onRetry={() => void query.refetch()}
        />
      </div>
    );
  }

  const stats = query.data;
  const totals = stats?.totals;
  const loading = !stats;

  /* An em dash rather than a 0 while loading: a placeholder zero is a number
     the user will read as real. */
  const n = (value: number | undefined) => (value === undefined ? '—' : value.toLocaleString());

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
          <p className="mt-1.5 text-sm text-fog">
            Aggregated in Postgres, not counted in the browser — these numbers cover every order,
            not just the current page.
          </p>
        </div>
        {stats && (
          <p className="flex items-center gap-2 font-mono text-[11px] text-fog-dim">
            <span aria-hidden className="size-1.5 rounded-full bg-delivered shadow-[0_0_8px_var(--color-delivered)]" />
            updated {formatRelative(stats.generatedAt)}
          </p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <StatTile
          label="Total orders"
          value={n(totals?.all)}
          icon={Package}
          accent={VIOLET}
          isLoading={loading}
        />
        <StatTile
          label="In flight"
          value={n(totals?.active)}
          hint="Not yet delivered or cancelled"
          icon={Activity}
          accent={STATUS_META.in_transit.chart}
          isLoading={loading}
        />
        <StatTile
          label="Delivered"
          value={n(totals?.delivered)}
          icon={CheckCircle2}
          accent={STATUS_META.delivered.chart}
          isLoading={loading}
        />
        <StatTile
          label="Cancelled"
          value={n(totals?.cancelled)}
          icon={CircleSlash}
          accent={STATUS_META.cancelled.chart}
          isLoading={loading}
        />
        <StatTile
          label="Completion"
          value={
            totals?.completionRate == null ? '—' : `${Math.round(totals.completionRate * 100)}%`
          }
          hint="Delivered vs. settled"
          icon={CheckCircle2}
          accent={STATUS_META.out_for_delivery.chart}
          isLoading={loading}
        />
        <StatTile
          label="Avg delivery"
          value={formatDuration(totals?.avgHoursToDeliver ?? null)}
          hint="Creation to delivered"
          icon={Timer}
          accent={STATUS_META.picked_up.chart}
          isLoading={loading}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <ChartCard
          title="Status mix"
          subtitle="Every order on the books — hover a status to isolate it"
          action={
            totals && (
              <span className="flex items-center gap-1.5 rounded-full border border-hairline bg-graphite-deep px-2.5 py-1 font-mono text-[11px] text-fog">
                <Weight className="size-3.5 text-fog-dim" aria-hidden />
                {totals.totalWeightKg.toLocaleString()} kg
              </span>
            )
          }
        >
          {stats ?
            <StatusDonut byStatus={stats.byStatus} />
          : <div className="flex items-center gap-6">
              <div className="skeleton size-[152px] shrink-0 rounded-full" />
              <div className="flex-1 space-y-2">
                {[0, 1, 2, 3].map((i) => (
                  <div key={i} className="skeleton h-5 w-full rounded" />
                ))}
              </div>
            </div>
          }
        </ChartCard>

        <ChartCard
          title="Pipeline"
          subtitle="Orders sitting in each stage right now — click a stage to filter the table"
        >
          {stats ?
            <PipelineFunnel byStatus={stats.byStatus} />
          : <SkeletonRows />}
        </ChartCard>
      </div>

      <ChartCard
        title="Daily volume"
        subtitle="Created against delivered, by UTC day"
        action={
          <div
            role="group"
            aria-label="Time window"
            className="flex rounded-full border border-hairline bg-graphite-deep p-1"
          >
            {WINDOWS.map((w) => (
              <button
                key={w}
                type="button"
                onClick={() => setDays(w)}
                aria-pressed={days === w}
                className={cn(
                  'rounded-full px-3 py-1 font-mono text-[11px] transition-all',
                  days === w ?
                    'bg-accent text-white shadow-[0_3px_10px_-3px_rgba(47,107,255,0.9)]'
                  : 'text-fog-dim hover:text-fog',
                )}
              >
                {w}d
              </button>
            ))}
          </div>
        }
      >
        {stats ?
          <DailyVolumeChart daily={stats.daily} />
        : <div className="skeleton h-[172px] w-full rounded" />}
      </ChartCard>

      <div className="grid gap-4 lg:grid-cols-2">
        <ChartCard title="Courier load" subtitle="Assigned orders per courier, by outcome">
          {stats ?
            <CourierLoadChart byCourier={stats.byCourier} />
          : <SkeletonRows />}
        </ChartCard>

        <ChartCard title="Recent activity" subtitle="The last eight status_history rows">
          {stats ?
            <ol className="space-y-2">
              {stats.recentActivity.map((entry) => (
                <li key={entry.id}>
                  <Link
                    to={`/orders/${entry.orderId}`}
                    className="flex items-center gap-3 rounded-lg border border-hairline bg-graphite-deep px-3 py-2 transition-colors hover:border-fog-dim hover:bg-slate-raised"
                  >
                    <StatusBadge status={entry.status as OrderStatus} size="sm" />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-xs font-medium">
                        {entry.customerName}
                      </span>
                      <span className="block font-mono text-[10px] text-fog-dim">
                        {entry.trackingNumber}
                      </span>
                    </span>
                    <span className="shrink-0 font-mono text-[10px] whitespace-nowrap text-fog-dim">
                      {formatRelative(entry.changedAt)}
                    </span>
                  </Link>
                </li>
              ))}
              {stats.recentActivity.length === 0 && (
                <li className="text-xs text-fog-dim">Nothing has moved yet.</li>
              )}
            </ol>
          : <SkeletonRows />}
        </ChartCard>
      </div>
    </div>
  );
}

function SkeletonRows() {
  return (
    <div className="space-y-2.5">
      {[0, 1, 2, 3, 4].map((i) => (
        <div key={i} className="skeleton h-6 w-full rounded" />
      ))}
    </div>
  );
}
