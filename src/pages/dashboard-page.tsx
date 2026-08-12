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
import { StatusShareBar } from '@/components/charts/status-share-bar';
import { StatusBadge } from '@/components/status-badge';
import { ErrorState } from '@/components/ui/states';
import { useStats } from '@/api/queries';
import { cn } from '@/lib/cn';
import { formatRelative } from '@/lib/format';
import { STATUS_META, type OrderStatus } from '@/lib/status';

const WINDOWS = [7, 14, 30] as const;

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
      <div className="rounded-lg border border-hairline bg-slate-surface">
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
          <h1 className="text-xl font-semibold tracking-tight">Dashboard</h1>
          <p className="mt-1 text-sm text-fog">
            Aggregated in Postgres, not counted in the browser — these numbers cover every order,
            not just the current page.
          </p>
        </div>
        {stats && (
          <p className="font-mono text-[11px] text-fog-dim">
            updated {formatRelative(stats.generatedAt)}
          </p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <StatTile
          label="Total orders"
          value={n(totals?.all)}
          icon={Package}
          accent={STATUS_META.pending.chart}
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

      <ChartCard
        title="Status mix"
        subtitle={
          totals ?
            `${totals.all} orders · ${totals.totalWeightKg.toLocaleString()} kg on the books`
          : 'Loading…'
        }
        action={
          totals && (
            <span className="flex items-center gap-1.5 font-mono text-[11px] text-fog-dim">
              <Weight className="size-3.5" aria-hidden />
              {totals.totalWeightKg.toLocaleString()} kg
            </span>
          )
        }
      >
        {stats ?
          <StatusShareBar byStatus={stats.byStatus} />
        : <div className="skeleton h-7 w-full rounded-[4px]" />}
      </ChartCard>

      <div className="grid gap-4 lg:grid-cols-2">
        <ChartCard
          title="Pipeline"
          subtitle="Orders sitting in each stage right now — click a stage to filter the table"
        >
          {stats ?
            <PipelineFunnel byStatus={stats.byStatus} />
          : <SkeletonRows />}
        </ChartCard>

        <ChartCard
          title="Daily volume"
          subtitle="Created against delivered, by UTC day"
          action={
            <div
              role="group"
              aria-label="Time window"
              className="flex rounded-md border border-hairline bg-graphite-deep p-0.5"
            >
              {WINDOWS.map((w) => (
                <button
                  key={w}
                  type="button"
                  onClick={() => setDays(w)}
                  aria-pressed={days === w}
                  className={cn(
                    'rounded px-2 py-1 font-mono text-[11px] transition-colors',
                    days === w ?
                      'bg-slate-raised text-[#e6eaf0]'
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
          : <div className="skeleton h-[168px] w-full rounded" />}
        </ChartCard>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <ChartCard title="Courier load" subtitle="Assigned orders per courier, by outcome">
          {stats ?
            <CourierLoadChart byCourier={stats.byCourier} />
          : <SkeletonRows />}
        </ChartCard>

        <ChartCard title="Recent activity" subtitle="The last eight status_history rows">
          {stats ?
            <ol className="space-y-2.5">
              {stats.recentActivity.map((entry) => (
                <li key={entry.id}>
                  <Link
                    to={`/orders/${entry.orderId}`}
                    className="flex items-center gap-3 rounded-md border border-hairline bg-graphite-deep px-3 py-2 transition-colors hover:border-fog-dim"
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
