import { cn } from '@/lib/cn';
import { STATUS_META, type OrderStatus } from '@/lib/status';

/**
 * The only place a status becomes a colour. Everything — table rows, timeline,
 * courier cards — routes through here, so the status vocabulary stays exactly
 * six colours across the whole app (DESIGN.md §10.3).
 */
export function StatusBadge({
  status,
  size = 'md',
  className,
}: {
  status: OrderStatus;
  size?: 'sm' | 'md';
  className?: string;
}) {
  const meta = STATUS_META[status];
  const Icon = meta.icon;

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border font-medium whitespace-nowrap',
        size === 'sm' ? 'px-2 py-0.5 text-[11px]' : 'px-2.5 py-1 text-xs',
        meta.badge,
        className,
      )}
    >
      <Icon className={size === 'sm' ? 'size-3' : 'size-3.5'} aria-hidden />
      {meta.label}
    </span>
  );
}
