import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Plus } from 'lucide-react';

import { OrderForm } from '@/components/order-form';
import { OrdersTable } from '@/components/orders-table';
import { Pagination } from '@/components/pagination';
import { StatusFilter } from '@/components/status-filter';
import { Button } from '@/components/ui/button';
import { Dialog } from '@/components/ui/dialog';
import { ErrorState } from '@/components/ui/states';
import { useOrders } from '@/api/queries';
import { ORDER_STATUSES, type OrderStatus } from '@/lib/status';

const PAGE_SIZE = 10;

function parseStatus(value: string | null): OrderStatus | 'all' {
  return value && (ORDER_STATUSES as readonly string[]).includes(value)
    ? (value as OrderStatus)
    : 'all';
}

export function OrdersPage() {
  // Filter and page live in the URL, so an ops user can bookmark or share
  // "all cancelled orders, page 2" and land on exactly that view.
  const [searchParams, setSearchParams] = useSearchParams();
  const [createOpen, setCreateOpen] = useState(false);

  const status = parseStatus(searchParams.get('status'));
  const page = Math.max(1, Number(searchParams.get('page') ?? '1') || 1);

  const query = useOrders({
    ...(status === 'all' ? {} : { status }),
    page,
    limit: PAGE_SIZE,
  });

  const update = (next: { status?: OrderStatus | 'all'; page?: number }) => {
    const params = new URLSearchParams(searchParams);
    if (next.status !== undefined) {
      if (next.status === 'all') params.delete('status');
      else params.set('status', next.status);
      params.delete('page'); // a new filter always starts at page 1
    }
    if (next.page !== undefined) params.set('page', String(next.page));
    setSearchParams(params, { replace: true });
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Orders</h1>
          <p className="mt-1 text-sm text-fog">
            {query.data
              ? `${query.data.pagination.total} order${query.data.pagination.total === 1 ? '' : 's'} in this view`
              : 'Loading the manifest…'}
          </p>
        </div>

        <Button variant="primary" onClick={() => setCreateOpen(true)}>
          <Plus className="size-4" aria-hidden />
          New order
        </Button>
      </div>

      <StatusFilter value={status} onChange={(next) => update({ status: next })} />

      <div className="overflow-hidden rounded-lg border border-hairline bg-slate-surface">
        {query.isError ? (
          <ErrorState
            title="Couldn't load orders"
            message={query.error.message}
            onRetry={() => void query.refetch()}
          />
        ) : (
          <>
            <OrdersTable
              orders={query.data?.data ?? []}
              isLoading={query.isLoading}
              isFetching={query.isFetching && !query.isLoading}
              emptyHint={
                status === 'all'
                  ? 'No orders yet — create the first one to get started.'
                  : `No orders are currently ${status.replace(/_/g, ' ')}.`
              }
            />
            {query.data && (
              <Pagination
                page={query.data.pagination.page}
                limit={query.data.pagination.limit}
                total={query.data.pagination.total}
                totalPages={query.data.pagination.totalPages}
                onPageChange={(next) => update({ page: next })}
              />
            )}
          </>
        )}
      </div>

      <Dialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title="Create delivery order"
        description="The order starts as pending; status changes happen from the detail view."
      >
        <OrderForm onCreated={() => setCreateOpen(false)} />
      </Dialog>
    </div>
  );
}
