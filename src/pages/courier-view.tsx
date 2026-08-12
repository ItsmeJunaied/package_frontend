import { Link, useSearchParams } from 'react-router-dom';
import { MapPin, Package, Search, Truck } from 'lucide-react';

import { StatusBadge } from '@/components/status-badge';
import { Button } from '@/components/ui/button';
import { CardSkeleton } from '@/components/ui/skeleton';
import { EmptyState, ErrorState } from '@/components/ui/states';
import { useOrders } from '@/api/queries';
import { formatRelative, formatWeight } from '@/lib/format';
import { STATUS_META, type OrderStatus } from '@/lib/status';

const ACTIVE: readonly OrderStatus[] = ['pending', 'picked_up', 'in_transit', 'out_for_delivery'];

/**
 * Bonus (DESIGN.md §10.8): the courier's own view of their assigned run.
 *
 * Same `useOrders` hook and same data as the ops table — only the layout
 * changes: a single column of touch-sized cards instead of a six-column grid,
 * filtered to one courier and to work that is still outstanding. Polls every
 * 30s so a dispatcher's update shows up on the courier's phone without a reload.
 */
export function CourierView() {
  const [searchParams, setSearchParams] = useSearchParams();
  const courierName = searchParams.get('name') ?? '';

  const query = useOrders(
    { ...(courierName ? { courierName } : {}), limit: 50 },
    { refetchInterval: courierName ? 30_000 : undefined },
  );

  const assigned = (query.data?.data ?? []).filter((o) => ACTIVE.includes(o.status as OrderStatus));

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <div>
        <h1 className="flex items-center gap-2 text-xl font-semibold tracking-tight">
          <Truck className="size-5 text-signal" aria-hidden />
          Courier run
        </h1>
        <p className="mt-1 text-sm text-fog">
          Outstanding deliveries assigned to a courier. Built for a phone in a hand, not a desk.
        </p>
      </div>

      <form
        className="flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          const value = new FormData(e.currentTarget).get('name');
          const params = new URLSearchParams();
          if (typeof value === 'string' && value.trim()) params.set('name', value.trim());
          setSearchParams(params, { replace: true });
        }}
      >
        <div className="relative flex-1">
          <Search
            className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-fog-dim"
            aria-hidden
          />
          <input
            name="name"
            defaultValue={courierName}
            placeholder="Courier name — e.g. Imran Kabir"
            aria-label="Courier name"
            className="h-10 w-full rounded-md border border-hairline bg-graphite-deep pr-3 pl-9 text-sm placeholder:text-fog-dim hover:border-fog-dim focus:border-signal focus:outline-none"
          />
        </div>
        <Button type="submit" variant="primary">
          Load run
        </Button>
      </form>

      {!courierName ? (
        <div className="rounded-lg border border-hairline bg-slate-surface">
          <EmptyState
            icon={Truck}
            title="Enter a courier name"
            description="Seeded couriers: Imran Kabir, Shakib Hasan, Rumana Akter."
          />
        </div>
      ) : query.isError ? (
        <div className="rounded-lg border border-hairline bg-slate-surface">
          <ErrorState message={query.error.message} onRetry={() => void query.refetch()} />
        </div>
      ) : query.isLoading ? (
        <div className="space-y-3">
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
        </div>
      ) : assigned.length === 0 ? (
        <div className="rounded-lg border border-hairline bg-slate-surface">
          <EmptyState
            icon={Package}
            title={`Nothing outstanding for ${courierName}`}
            description="Delivered and cancelled orders are hidden here — this view is the active run only."
          />
        </div>
      ) : (
        <ul className="space-y-3">
          {assigned.map((order) => {
            const meta = STATUS_META[order.status as OrderStatus];
            return (
              <li key={order.id}>
                <Link
                  to={`/orders/${order.id}`}
                  className="block rounded-lg border border-hairline bg-slate-surface p-4 transition-colors hover:border-fog-dim active:bg-slate-raised"
                >
                  <div className="flex items-start justify-between gap-3">
                    <span className="font-mono text-sm text-signal">{order.trackingNumber}</span>
                    <StatusBadge status={order.status as OrderStatus} size="sm" />
                  </div>

                  <p className="mt-2.5 text-base font-medium">{order.customerName}</p>

                  <div className="mt-2 flex gap-2 text-sm text-fog">
                    <MapPin className={`mt-0.5 size-4 shrink-0 ${meta.text}`} aria-hidden />
                    <span>{order.dropoffAddress}</span>
                  </div>

                  <div className="mt-3 flex items-center gap-3 border-t border-hairline pt-3 font-mono text-[11px] text-fog-dim">
                    <span>{formatWeight(order.packageWeightKg)}</span>
                    <span aria-hidden>·</span>
                    <span>created {formatRelative(order.createdAt)}</span>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
