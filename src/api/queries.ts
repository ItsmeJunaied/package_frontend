import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseQueryOptions,
} from '@tanstack/react-query';
import type { InferResponseType } from 'hono/client';

import { client, unwrap } from './client';
import type { CreateOrderPayload } from '@/lib/schemas';
import type { OrderStatus } from '@/lib/status';

/* Response shapes are read off the API's own route types — nothing is
   re-declared by hand, so a backend change surfaces as a compile error here. */
export type OrdersPage = InferResponseType<typeof client.orders.$get, 200>;
export type Order = OrdersPage['data'][number];
export type OrderDetail = InferResponseType<(typeof client.orders)[':id']['$get'], 200>;
export type StatusHistoryEntry = OrderDetail['statusHistory'][number];
export type Session = InferResponseType<typeof client.auth.login.$post, 200>;
export type OrderStats = InferResponseType<typeof client.orders.stats.$get, 200>;

export interface OrdersFilter {
  status?: OrderStatus;
  courierName?: string;
  /** Free-text, matched against customer name and tracking number. */
  q?: string;
  /** Inclusive `createdAt` range, as `YYYY-MM-DD`. */
  from?: string;
  to?: string;
  page?: number;
  limit?: number;
  sort?: 'createdAt:desc' | 'createdAt:asc' | 'updatedAt:desc' | 'updatedAt:asc';
}

/** Either a rolling window of `days`, or an explicit inclusive range. */
export interface StatsRange {
  days?: number;
  from?: string;
  to?: string;
}

export const orderKeys = {
  all: ['orders'] as const,
  list: (filter: OrdersFilter) => [...orderKeys.all, 'list', filter] as const,
  detail: (id: string) => [...orderKeys.all, 'detail', id] as const,
  stats: (range: StatsRange) => [...orderKeys.all, 'stats', range] as const,
};

/**
 * Is this the same query as before, only on a different page?
 *
 * The difference decides whether the previous result may stay on screen while
 * the next one loads. Paging: yes — the rows still belong to the same filter,
 * and blanking the table on every page click reads as slower than it is.
 * Filtering or searching: no — the old rows do *not* match the new filter, and
 * showing them makes the search look like it returned everything before
 * correcting itself.
 */
function sameQueryDifferentPage(a: OrdersFilter, b: OrdersFilter): boolean {
  return (
    a.status === b.status &&
    a.courierName === b.courierName &&
    a.q === b.q &&
    a.from === b.from &&
    a.to === b.to &&
    a.limit === b.limit &&
    a.sort === b.sort
  );
}

/**
 * GET /orders/stats — the dashboard's single request.
 *
 * Everything the page draws comes from here rather than from counting a page
 * of `useOrders` in the browser, which would silently under-report as soon as
 * the table outgrows one page. Because the key sits under `orderKeys.all`, any
 * mutation below invalidates the charts along with the table.
 */
export function useStats(range: StatsRange = { days: 7 }) {
  const custom = Boolean(range.from && range.to);
  return useQuery({
    queryKey: orderKeys.stats(range),
    queryFn: () =>
      unwrap(
        client.orders.stats.$get({
          query:
            custom ?
              { from: range.from as string, to: range.to as string }
            : { days: String(range.days ?? 7) },
        }),
      ),
    // Swapping the window keeps the old numbers up for the moment it takes to
    // fetch — the charts stay put rather than collapsing to skeletons, and
    // every figure still belongs to one coherent window.
    placeholderData: (previous) => previous,
  });
}

export function useOrders(filter: OrdersFilter, options?: { refetchInterval?: number }) {
  return useQuery({
    queryKey: orderKeys.list(filter),
    queryFn: () =>
      unwrap(
        client.orders.$get({
          query: {
            ...(filter.status ? { status: filter.status } : {}),
            ...(filter.courierName ? { courierName: filter.courierName } : {}),
            ...(filter.q ? { q: filter.q } : {}),
            ...(filter.from ? { from: filter.from } : {}),
            ...(filter.to ? { to: filter.to } : {}),
            page: String(filter.page ?? 1),
            limit: String(filter.limit ?? 20),
            sort: filter.sort ?? 'createdAt:desc',
          },
        }),
      ),
    placeholderData: (previous, previousQuery) => {
      const previousFilter = previousQuery?.queryKey[2] as OrdersFilter | undefined;
      if (!previousFilter) return undefined;
      return sameQueryDifferentPage(previousFilter, filter) ? previous : undefined;
    },
    refetchInterval: options?.refetchInterval,
  });
}

export function useOrder(
  id: string | undefined,
  options?: Partial<UseQueryOptions<OrderDetail, Error>>,
) {
  return useQuery({
    queryKey: orderKeys.detail(id ?? ''),
    queryFn: () => unwrap(client.orders[':id'].$get({ param: { id: id as string } })),
    enabled: Boolean(id),
    retry: (failureCount, error) =>
      // A 404 is an answer, not a failure — don't retry it three times.
      'status' in error && (error as { status: number }).status === 404 ? false : failureCount < 2,
    ...options,
  });
}

export function useCreateOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (values: CreateOrderPayload) =>
      unwrap(
        client.orders.$post({
          json: {
            customerName: values.customerName,
            pickupAddress: values.pickupAddress,
            dropoffAddress: values.dropoffAddress,
            packageWeightKg: values.packageWeightKg,
            ...(values.courierName ? { courierName: values.courierName } : {}),
          },
        }),
      ),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: orderKeys.all }),
  });
}

/** PATCH /orders/:id/status — the JWT-protected route. */
export function useUpdateStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: Exclude<OrderStatus, 'pending' | 'cancelled'> }) =>
      unwrap(client.orders[':id'].status.$patch({ param: { id }, json: { status } })),
    onSuccess: (updated) => {
      queryClient.setQueryData(orderKeys.detail(updated.id), updated);
      void queryClient.invalidateQueries({ queryKey: orderKeys.all });
    },
  });
}

/** DELETE /orders/:id — soft delete, the only path to `cancelled`. */
export function useCancelOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => unwrap(client.orders[':id'].$delete({ param: { id } })),
    onSuccess: (cancelled) => {
      queryClient.setQueryData(orderKeys.detail(cancelled.id), cancelled);
      void queryClient.invalidateQueries({ queryKey: orderKeys.all });
    },
  });
}

export function useLogin() {
  return useMutation({
    mutationFn: (credentials: { email: string; password: string }) =>
      unwrap(client.auth.login.$post({ json: credentials })),
  });
}
