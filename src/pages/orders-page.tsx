import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Plus } from 'lucide-react';

import { OrderFilters, type OrderFilterValues } from '@/components/order-filters';
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

/** Only pass through what the API will accept, so a hand-edited URL can't 400. */
function parseDate(value: string | null): string {
  return value && /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : '';
}

export function OrdersPage() {
  // Every filter and the page live in the URL, so an ops user can bookmark or
  // share "cancelled orders for Hossain in the first week of August, page 2"
  // and land on exactly that view.
  const [searchParams, setSearchParams] = useSearchParams();
  const [createOpen, setCreateOpen] = useState(false);

  const status = parseStatus(searchParams.get('status'));
  const page = Math.max(1, Number(searchParams.get('page') ?? '1') || 1);
  const filters: OrderFilterValues = {
    q: searchParams.get('q') ?? '',
    from: parseDate(searchParams.get('from')),
    to: parseDate(searchParams.get('to')),
  };

  const query = useOrders({
    ...(status === 'all' ? {} : { status }),
    ...(filters.q ? { q: filters.q } : {}),
    ...(filters.from ? { from: filters.from } : {}),
    ...(filters.to ? { to: filters.to } : {}),
    page,
    limit: PAGE_SIZE,
  });

  const update = (next: {
    status?: OrderStatus | 'all';
    filters?: OrderFilterValues;
    page?: number;
  }) => {
    const params = new URLSearchParams(searchParams);

    if (next.status !== undefined) {
      if (next.status === 'all') params.delete('status');
      else params.set('status', next.status);
    }

    if (next.filters) {
      for (const key of ['q', 'from', 'to'] as const) {
        const value = next.filters[key];
        if (value) params.set(key, value);
        else params.delete(key);
      }
    }

    // Any change to *what* is being listed resets to page 1 — page 4 of a
    // narrower result set is usually empty, which looks like "no results".
    if (next.status !== undefined || next.filters) params.delete('page');
    if (next.page !== undefined) params.set('page', String(next.page));

    setSearchParams(params, { replace: true });
  };

  const narrowed = Boolean(filters.q || filters.from || filters.to || status !== 'all');

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Orders</h1>
          <p className="mt-1.5 text-sm text-fog">
            {query.data ?
              `${query.data.pagination.total} order${query.data.pagination.total === 1 ? '' : 's'}${narrowed ? ' match this view' : ' in this view'}`
            : 'Loading the manifest…'}
          </p>
        </div>

        <Button variant="primary" onClick={() => setCreateOpen(true)}>
          <Plus className="size-4" aria-hidden />
          New order
        </Button>
      </div>

      <div className="space-y-3">
        <OrderFilters value={filters} onChange={(next) => update({ filters: next })} />
        <StatusFilter value={status} onChange={(next) => update({ status: next })} />
      </div>

      <div className="panel overflow-hidden rounded-xl border border-hairline">
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
                narrowed ?
                  'Nothing matches these filters — try widening the date range or clearing the search.'
                : 'No orders yet — create the first one to get started.'
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
