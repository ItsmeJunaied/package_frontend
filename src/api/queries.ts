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

export interface OrdersFilter {
  status?: OrderStatus;
  courierName?: string;
  page?: number;
  limit?: number;
  sort?: 'createdAt:desc' | 'createdAt:asc' | 'updatedAt:desc' | 'updatedAt:asc';
}

export const orderKeys = {
  all: ['orders'] as const,
  list: (filter: OrdersFilter) => [...orderKeys.all, 'list', filter] as const,
  detail: (id: string) => [...orderKeys.all, 'detail', id] as const,
};

export function useOrders(filter: OrdersFilter, options?: { refetchInterval?: number }) {
  return useQuery({
    queryKey: orderKeys.list(filter),
    queryFn: () =>
      unwrap(
        client.orders.$get({
          query: {
            ...(filter.status ? { status: filter.status } : {}),
            ...(filter.courierName ? { courierName: filter.courierName } : {}),
            page: String(filter.page ?? 1),
            limit: String(filter.limit ?? 20),
            sort: filter.sort ?? 'createdAt:desc',
          },
        }),
      ),
    // Keeps the previous page on screen while the next one loads, instead of
    // collapsing the table back to skeletons on every page change.
    placeholderData: (previous) => previous,
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
