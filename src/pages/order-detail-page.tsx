import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Ban, MapPin, PackageX, Scale, User } from 'lucide-react';

import { StatusBadge } from '@/components/status-badge';
import { StatusTimeline } from '@/components/status-timeline';
import { Button } from '@/components/ui/button';
import { CardSkeleton, Skeleton } from '@/components/ui/skeleton';
import { EmptyState, ErrorState } from '@/components/ui/states';
import { useToast } from '@/components/ui/toast';
import { ApiError } from '@/api/client';
import { useCancelOrder, useOrder, useUpdateStatus } from '@/api/queries';
import { formatDateTime, formatWeight } from '@/lib/format';
import { canCancel, nextStatus, STATUS_META, type OrderStatus } from '@/lib/status';

export function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const toast = useToast();

  const query = useOrder(id);
  const updateStatus = useUpdateStatus();
  const cancelOrder = useCancelOrder();

  if (query.isLoading) {
    return (
      <div className="space-y-5">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-24 w-full rounded-lg" />
        <div className="grid gap-5 lg:grid-cols-[1fr_20rem]">
          <Skeleton className="h-96 rounded-lg" />
          <CardSkeleton />
        </div>
      </div>
    );
  }

  if (query.isError) {
    const notFound = query.error instanceof ApiError && query.error.status === 404;

    return (
      <div className="rounded-lg border border-hairline bg-slate-surface">
        {notFound ? (
          <EmptyState
            icon={PackageX}
            title="This order doesn't exist or was removed"
            description="The tracking link may be out of date. Head back to the orders list to find it."
            action={
              <Link
                to="/orders"
                className="inline-flex h-8 items-center gap-1.5 rounded-md border border-hairline bg-slate-raised px-3 text-xs font-medium hover:border-fog-dim"
              >
                <ArrowLeft className="size-3.5" aria-hidden />
                Back to orders
              </Link>
            }
          />
        ) : (
          <ErrorState message={query.error.message} onRetry={() => void query.refetch()} />
        )}
      </div>
    );
  }

  const order = query.data;

  // `useOrder` is disabled when the route param is missing, so the query can
  // settle without data. Treat that the same as "no such order".
  if (!order) {
    return (
      <div className="rounded-lg border border-hairline bg-slate-surface">
        <EmptyState
          icon={PackageX}
          title="No order selected"
          description="Pick an order from the list to see its consignment details and status timeline."
          action={
            <Link
              to="/orders"
              className="inline-flex h-8 items-center gap-1.5 rounded-md border border-hairline bg-slate-raised px-3 text-xs font-medium hover:border-fog-dim"
            >
              <ArrowLeft className="size-3.5" aria-hidden />
              Back to orders
            </Link>
          }
        />
      </div>
    );
  }

  const next = nextStatus(order.status as OrderStatus);
  const cancellable = canCancel(order.status as OrderStatus);
  const busy = updateStatus.isPending || cancelOrder.isPending;

  const advance = async () => {
    if (!next || next === 'pending') return;
    try {
      await updateStatus.mutateAsync({
        id: order.id,
        status: next as Exclude<OrderStatus, 'pending' | 'cancelled'>,
      });
      toast.push('success', `Moved to ${STATUS_META[next].label.toLowerCase()}`);
    } catch (error) {
      // A 401 here means the token expired mid-session. `AuthProvider` is
      // already listening for that and will drop the session, which bounces us
      // to the sign-in screen — all this needs to do is say why.
      if (error instanceof ApiError && error.status === 401) {
        toast.push('error', 'Session expired', 'Sign in again to move this order forward.');
        return;
      }
      toast.push('error', 'Status update failed', (error as Error).message);
    }
  };

  const cancel = async () => {
    try {
      await cancelOrder.mutateAsync(order.id);
      toast.push('info', 'Order cancelled', 'The record is kept for audit — nothing was deleted.');
    } catch (error) {
      toast.push('error', 'Could not cancel this order', (error as Error).message);
    }
  };

  return (
    <div className="space-y-5">
      <Link
        to="/orders"
        className="inline-flex items-center gap-1.5 text-xs text-fog transition-colors hover:text-ink"
      >
        <ArrowLeft className="size-3.5" aria-hidden />
        All orders
      </Link>

      <header className="flex flex-wrap items-start justify-between gap-4 rounded-lg border border-hairline bg-slate-surface p-5">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="font-mono text-lg font-semibold text-signal">{order.trackingNumber}</h1>
            <StatusBadge status={order.status as OrderStatus} />
          </div>
          <p className="mt-1.5 text-sm text-fog">
            Created {formatDateTime(order.createdAt)}
            {order.deletedAt && ` · Cancelled ${formatDateTime(order.deletedAt)}`}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {next ? (
            <Button variant="primary" onClick={() => void advance()} loading={busy}>
              <ArrowRight className="size-4" aria-hidden />
              Mark {STATUS_META[next].label.toLowerCase()}
            </Button>
          ) : (
            <span className="rounded-md border border-hairline px-3 py-2 text-xs text-fog-dim">
              {order.status === 'delivered' ? 'Delivery complete' : 'Order cancelled'}
            </span>
          )}

          {cancellable && (
            <Button variant="danger" onClick={() => void cancel()} loading={busy}>
              <Ban className="size-3.5" aria-hidden />
              Cancel
            </Button>
          )}
        </div>
      </header>

      <div className="grid gap-5 lg:grid-cols-[1fr_20rem] lg:items-start">
        <StatusTimeline order={order} />

        <aside className="space-y-3 rounded-lg border border-hairline bg-slate-surface p-5">
          <h2 className="text-sm font-semibold tracking-wide text-ink uppercase">
            Consignment
          </h2>

          <Detail icon={User} label="Customer" value={order.customerName} />
          <Detail icon={MapPin} label="Pickup" value={order.pickupAddress} />
          <Detail icon={MapPin} label="Dropoff" value={order.dropoffAddress} />
          <Detail icon={Scale} label="Weight" value={formatWeight(order.packageWeightKg)} mono />
          <Detail icon={User} label="Courier" value={order.courierName ?? 'Unassigned'} />
        </aside>
      </div>
    </div>
  );
}

function Detail({
  icon: Icon,
  label,
  value,
  mono,
}: {
  icon: typeof User;
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="flex gap-3 border-t border-hairline pt-3 first-of-type:border-0 first-of-type:pt-0">
      <Icon className="mt-0.5 size-3.5 shrink-0 text-fog-dim" aria-hidden />
      <div className="min-w-0">
        <p className="text-[11px] tracking-wide text-fog-dim uppercase">{label}</p>
        <p className={`mt-0.5 text-sm break-words text-ink ${mono ? 'font-mono' : ''}`}>
          {value}
        </p>
      </div>
    </div>
  );
}
