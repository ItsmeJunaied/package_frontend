import { useState } from 'react';
import {
  Activity,
  CheckCircle2,
  ChevronDown,
  CircleSlash,
  DollarSign,
  Eye,
  MoreHorizontal,
  Package,
  TrendingUp,
} from 'lucide-react';

import { ChartCard } from '@/components/charts/chart-primitives';
import { CourierLoadChart } from '@/components/charts/courier-load-chart';
import { DailyVolumeChart } from '@/components/charts/daily-volume-chart';
import { EmployeeAnalysis } from '@/components/charts/employee-analysis';
import { StatTile } from '@/components/charts/stat-tile';
import { StatusDonut } from '@/components/charts/status-donut';
import { TaskAnalytics } from '@/components/charts/task-analytics';
import { RangeControl } from '@/components/range-control';
import { ErrorState } from '@/components/ui/states';
import { useStats, type StatsRange } from '@/api/queries';
import { spanDays } from '@/lib/date-range';
import { STATUS_META } from '@/lib/status';

const MAX_SPAN_DAYS = 90;

export function DashboardPage() {
  const [range, setRange] = useState<StatsRange>({ days: 7 });

  const valid = !range.from || !range.to || spanDays(range) <= MAX_SPAN_DAYS;
  const query = useStats(valid ? range : { days: 7 });

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

  const n = (value: number | undefined) => (value === undefined ? '—' : value.toLocaleString());

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs text-fog-dim">
            <span className="text-fog">Home</span>
            <span className="mx-2 text-fog-dim">›</span>
            <span className="font-medium text-ink">Dashboard</span>
          </p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight">Dashboard</h1>
        </div>

        <RangeControl value={range} onChange={setRange} maxSpanDays={MAX_SPAN_DAYS} />
      </div>

      {/* ─── Top Row: 4 Stat Cards ─── */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile
          label="Task Done Today"
          value={n(totals?.delivered)}
          sub={totals ? `of ${totals.all}` : undefined}
          icon={Package}
          accent="#2f6bff"
          isLoading={loading}
          trend={10}
          trendLabel="of yesterday"
        />
        <StatTile
          label="Ongoing Project"
          value={n(totals?.active)}
          sub={totals ? `of ${(totals.active ?? 0) + (totals.delivered ?? 0)}` : undefined}
          icon={Activity}
          accent="#f5a623"
          isLoading={loading}
          trend={5}
          trendLabel="of last month"
        />
        <StatTile
          label="Value Project"
          value={totals ? `$${totals.totalWeightKg.toLocaleString()}` : '—'}
          icon={DollarSign}
          accent="#2ed47a"
          isLoading={loading}
          actionLabel="See analytics"
          actionIcon={Eye}
        />
        <StatTile
          label="Update"
          value=""
          icon={TrendingUp}
          accent="#8b5cf6"
          isLoading={loading}
          hint={
            totals
              ? `Project revenue increased ${Math.round((totals.completionRate ?? 0) * 100)}% in 1 week`
              : 'Loading...'
          }
          actionLabel="See analytics"
        />
      </div>

      {/* ─── Middle Row: Daily Task Progress + Status Insights ─── */}
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
        <ChartCard
          title="Track Daily Task Progress"
          subtitle="Overview of Daily Task Achievements"
          action={
            <div className="flex items-center gap-2">
              <button className="flex items-center gap-1.5 rounded-lg border border-hairline bg-graphite-deep px-2.5 py-1 text-[11px] text-fog transition-colors hover:text-ink">
                Daily
                <ChevronDown className="size-3" />
              </button>
              <button className="grid size-6 place-items-center rounded-md text-fog-dim transition-colors hover:bg-slate-raised hover:text-fog">
                <MoreHorizontal className="size-4" />
              </button>
            </div>
          }
        >
          {stats ? (
            <DailyVolumeChart daily={stats.daily} />
          ) : (
            <div className="skeleton h-[230px] w-full rounded" />
          )}
        </ChartCard>

        <ChartCard
          title="Employee Mood Insights"
          action={
            <button className="grid size-6 place-items-center rounded-md text-fog-dim transition-colors hover:bg-slate-raised hover:text-fog">
              <MoreHorizontal className="size-4" />
            </button>
          }
        >
          {stats ? (
            <StatusDonut byStatus={stats.byStatus} />
          ) : (
            <div className="flex flex-col items-center gap-4">
              <div className="skeleton size-[140px] shrink-0 rounded-full" />
              <div className="flex gap-4">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="skeleton h-4 w-16 rounded" />
                ))}
              </div>
            </div>
          )}
        </ChartCard>
      </div>

      {/* ─── Bottom Row: Task Analytics + Employee Analysis ─── */}
      <div className="grid gap-4 lg:grid-cols-2">
        <ChartCard
          title="Daily Task Analytics"
        >
          {stats ? (
            <TaskAnalytics daily={stats.daily} />
          ) : (
            <div className="space-y-3">
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className="skeleton h-8 w-full rounded" />
              ))}
            </div>
          )}
        </ChartCard>

        <div className="panel rounded-xl border border-hairline p-4 shadow-[0_1px_2px_rgba(0,0,0,0.4),0_12px_32px_-16px_rgba(0,0,0,0.8)] sm:p-5">
          {stats ? (
            <EmployeeAnalysis byCourier={stats.byCourier} />
          ) : (
            <div className="space-y-3">
              <div className="skeleton h-5 w-40 rounded" />
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className="skeleton h-12 w-full rounded" />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
