import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { MapPin, Package, Search, Truck } from 'lucide-react';

import { StatusBadge } from '@/components/status-badge';
import { Button } from '@/components/ui/button';
import { CardSkeleton } from '@/components/ui/skeleton';
import { EmptyState, ErrorState } from '@/components/ui/states';
import { useOrders, useStats } from '@/api/queries';
import { formatRelative, formatWeight } from '@/lib/format';
import { STATUS_META, type OrderStatus } from '@/lib/status';

const ACTIVE: readonly OrderStatus[] = ['pending', 'picked_up', 'in_transit', 'out_for_delivery'];

/**
 * Resolve what someone typed to a courier the database actually knows about.
 *
 * `GET /orders?courierName=` matches the whole name — case-insensitively, but
 * with no wildcards — so "imran" returns nothing while "imran kabir" returns
 * four rows. Widening the API filter to a substring match would be a contract
 * change, and would also let a one-letter query put three couriers' runs on one
 * screen. So the guessing happens here, against the real roster, and only when
 * it is unambiguous.
 */
function resolveCourier(input: string, known: readonly string[]): string {
  const q = input.trim();
  if (!q) return '';
  const lower = q.toLowerCase();

  const exact = known.find((n) => n.toLowerCase() === lower);
  if (exact) return exact;

  const [onlyPrefix, ...morePrefix] = known.filter((n) => n.toLowerCase().startsWith(lower));
  if (onlyPrefix && morePrefix.length === 0) return onlyPrefix;

  const [onlyMatch, ...moreMatches] = known.filter((n) => n.toLowerCase().includes(lower));
  if (onlyMatch && moreMatches.length === 0) return onlyMatch;

  // Ambiguous or unknown — send it as typed and let the empty state explain.
  return q;
}

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
  const [term, setTerm] = useState(courierName);

  /*
   * The roster is fetched but never rendered — it exists only so a partial or
   * differently-cased name can be resolved to the exact string the API needs.
   * 90 days because the dashboard's default window is a week, and a courier
   * with nothing outstanding this week is exactly who someone might look up.
   */
  const roster = useStats({ days: 90 });
  const names = (roster.data?.byCourier ?? [])
    .filter((c) => c.courierName !== 'Unassigned')
    .map((c) => c.courierName);

  const query = useOrders(
    { ...(courierName ? { courierName } : {}), limit: 50 },
    { refetchInterval: courierName ? 30_000 : undefined },
  );

  const assigned = (query.data?.data ?? []).filter((o) => ACTIVE.includes(o.status as OrderStatus));
  const known = (roster.data?.byCourier ?? []).find(
    (c) => c.courierName.toLowerCase() === courierName.toLowerCase(),
  );

  const submit = (raw: string) => {
    const resolved = resolveCourier(raw, names);
    setTerm(resolved || raw);
    const params = new URLSearchParams();
    if (resolved) params.set('name', resolved);
    setSearchParams(params, { replace: true });
  };

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <div>
        <h1 className="flex items-center gap-2 text-xl font-semibold tracking-tight">
          <Truck className="size-5 text-accent" aria-hidden />
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
          submit(term);
        }}
      >
        <div className="relative flex-1">
          <Search
            className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-fog-dim"
            aria-hidden
          />
          <input
            value={term}
            onChange={(e) => setTerm(e.target.value)}
            placeholder="Courier name"
            aria-label="Courier name"
            className="h-10 w-full rounded-lg border border-hairline bg-graphite-deep pr-3 pl-9 text-sm text-ink placeholder:text-fog-dim hover:border-fog-dim focus:border-accent focus:outline-none"
          />
        </div>
        <Button type="submit" variant="primary">
          Load run
        </Button>
      </form>

      {!courierName ? (
        <div className="panel rounded-xl border border-hairline">
          <EmptyState
            icon={Truck}
            title="Search for a courier"
            description="Type a name and load their run. A partial name works if it matches only one courier."
          />
        </div>
      ) : query.isError ? (
        <div className="panel rounded-xl border border-hairline">
          <ErrorState message={query.error.message} onRetry={() => void query.refetch()} />
        </div>
      ) : /*
         * `isFetching`, not `isLoading`. A filter change no longer keeps the
         * previous result on screen (see `useOrders`), so during a new search
         * there is nothing to show — and showing the *last* courier's run under
         * the new name was the bug: it read as "all the data came back, then
         * corrected itself".
         */
      query.isLoading || query.isFetching ? (
        <div className="space-y-3">
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
        </div>
      ) : assigned.length === 0 ? (
        <div className="panel rounded-xl border border-hairline">
          {/* Two different situations that used to render the same message:
              a courier with nothing left to do, and a name that does not
              exist. Only the second one is a mistake. */}
          <EmptyState
            icon={Package}
            title={
              known ?
                `${known.courierName} has nothing outstanding`
              : `No courier named "${courierName}"`
            }
            description={
              known ?
                `Their run is clear — ${known.delivered} delivered, ${known.cancelled} cancelled in the last 90 days. This view shows active work only.`
              : 'Check the spelling and try again.'
            }
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
                  className="panel block rounded-xl border border-hairline p-4 transition-colors hover:border-fog-dim active:bg-slate-raised"
                >
                  <div className="flex items-start justify-between gap-3">
                    <span className="font-mono text-sm font-medium text-ink">
                      {order.trackingNumber}
                    </span>
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
