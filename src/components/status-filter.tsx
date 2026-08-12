import { cn } from '@/lib/cn';
import { ORDER_STATUSES, STATUS_META, type OrderStatus } from '@/lib/status';

/**
 * A segmented control rather than a dropdown: there are exactly six fixed
 * values, and always-visible tabs make the current filter obvious at a glance
 * on an ops screen (DESIGN.md §10.4). Scrolls horizontally on narrow viewports.
 */
export function StatusFilter({
  value,
  counts,
  onChange,
}: {
  value: OrderStatus | 'all';
  counts?: Partial<Record<OrderStatus | 'all', number>>;
  onChange: (next: OrderStatus | 'all') => void;
}) {
  const options: Array<{ key: OrderStatus | 'all'; label: string }> = [
    { key: 'all', label: 'All' },
    ...ORDER_STATUSES.map((s) => ({ key: s, label: STATUS_META[s].short })),
  ];

  return (
    <div
      role="tablist"
      aria-label="Filter orders by status"
      className="flex gap-1 overflow-x-auto rounded-lg border border-hairline bg-graphite-deep p-1"
    >
      {options.map(({ key, label }) => {
        const active = value === key;
        const count = counts?.[key];

        return (
          <button
            key={key}
            role="tab"
            type="button"
            aria-selected={active}
            onClick={() => onChange(key)}
            className={cn(
              'flex shrink-0 items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors',
              active
                ? 'bg-slate-raised text-[#e6eaf0] shadow-sm'
                : 'text-fog hover:bg-slate-raised/50 hover:text-[#e6eaf0]',
            )}
          >
            {key !== 'all' && (
              <span className={cn('size-1.5 rounded-full', STATUS_META[key].dot)} aria-hidden />
            )}
            {label}
            {count !== undefined && (
              <span className="font-mono text-[10px] text-fog-dim tabular-nums">{count}</span>
            )}
          </button>
        );
      })}
    </div>
  );
}
