import { Link } from 'react-router-dom';
import { ChevronRight, Package } from 'lucide-react';

import { StatusBadge } from './status-badge';
import { EmptyState } from './ui/states';
import { TableSkeleton } from './ui/skeleton';
import type { Order } from '@/api/queries';
import { cn } from '@/lib/cn';
import { formatRelative, formatWeight } from '@/lib/format';

interface OrdersTableProps {
  orders: Order[];
  isLoading: boolean;
  isFetching?: boolean;
  emptyHint?: string;
}

/**
 * Desktop: a dense table. Below `md`: the same rows as stacked cards, because a
 * five-column table on a phone is unreadable (DESIGN.md §10.8).
 */
export function OrdersTable({ orders, isLoading, isFetching, emptyHint }: OrdersTableProps) {
  if (isLoading) return <TableSkeleton />;

  if (orders.length === 0) {
    return (
      <EmptyState
        icon={Package}
        title="No orders match this view"
        description={emptyHint ?? 'Try a different status filter, or create the first order.'}
      />
    );
  }

  return (
    <div className={cn('transition-opacity', isFetching && 'opacity-60')}>
      {/* Desktop */}
      <table className="hidden w-full border-collapse md:table">
        <thead>
          <tr className="border-b border-hairline text-left">
            {['Tracking', 'Customer', 'Dropoff', 'Weight', 'Status', 'Created', ''].map((h, i) => (
              <th
                key={h || i}
                scope="col"
                className="px-4 py-2.5 text-[11px] font-semibold tracking-wider text-fog-dim uppercase"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-hairline">
          {orders.map((order) => (
            <tr key={order.id} className="group transition-colors hover:bg-slate-raised/40">
              <td className="px-4 py-3">
                <Link
                  to={`/orders/${order.id}`}
                  className="font-mono text-xs text-signal hover:underline"
                >
                  {order.trackingNumber}
                </Link>
              </td>
              <td className="px-4 py-3 text-sm text-ink">{order.customerName}</td>
              <td className="max-w-[22rem] truncate px-4 py-3 text-sm text-fog">
                {order.dropoffAddress}
              </td>
              <td className="px-4 py-3 font-mono text-xs text-fog tabular-nums">
                {formatWeight(order.packageWeightKg)}
              </td>
              <td className="px-4 py-3">
                <StatusBadge status={order.status} size="sm" />
              </td>
              <td className="px-4 py-3 font-mono text-xs whitespace-nowrap text-fog-dim">
                {formatRelative(order.createdAt)}
              </td>
              <td className="px-4 py-3 text-right">
                <Link
                  to={`/orders/${order.id}`}
                  aria-label={`Open order ${order.trackingNumber}`}
                  className="inline-flex text-fog-dim transition-colors group-hover:text-signal"
                >
                  <ChevronRight className="size-4" />
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Mobile */}
      <ul className="divide-y divide-hairline md:hidden">
        {orders.map((order) => (
          <li key={order.id}>
            <Link to={`/orders/${order.id}`} className="block px-4 py-3.5 active:bg-slate-raised/50">
              <div className="flex items-center justify-between gap-3">
                <span className="font-mono text-xs text-signal">{order.trackingNumber}</span>
                <StatusBadge status={order.status} size="sm" />
              </div>
              <p className="mt-2 text-sm font-medium text-ink">{order.customerName}</p>
              <p className="mt-0.5 truncate text-xs text-fog">{order.dropoffAddress}</p>
              <div className="mt-2 flex items-center gap-3 font-mono text-[11px] text-fog-dim">
                <span>{formatWeight(order.packageWeightKg)}</span>
                <span aria-hidden>·</span>
                <span>{formatRelative(order.createdAt)}</span>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
