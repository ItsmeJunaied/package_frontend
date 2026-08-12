import { Ban, Check } from 'lucide-react';

import type { OrderDetail } from '@/api/queries';
import { cn } from '@/lib/cn';
import { formatDateTime } from '@/lib/format';
import { PIPELINE, STATUS_META, type OrderStatus } from '@/lib/status';

/**
 * The signature element (DESIGN.md §10.6): a vertical stepper through the five
 * forward states, rendered on a card with a perforated top edge — a torn
 * manifest stub. A numbered stepper earns its place here because the underlying
 * data genuinely is an ordered sequence, not because steppers look nice.
 *
 * Cancelled orders branch off in Alert Red at whichever step they reached,
 * rather than being flattened into a sixth row in the same column.
 */
export function StatusTimeline({ order }: { order: OrderDetail }) {
  const history = order.statusHistory;
  const cancelledEntry = history.find((h) => h.status === 'cancelled');

  // First occurrence wins — history is append-only, so this is the moment the
  // order actually entered that state.
  const reachedAt = new Map<OrderStatus, string>();
  for (const entry of history) {
    if (!reachedAt.has(entry.status)) reachedAt.set(entry.status, entry.changedAt);
  }

  const reachedCount = PIPELINE.filter((s) => reachedAt.has(s)).length;
  const currentIndex = reachedCount - 1;

  return (
    <section
      aria-label="Status timeline"
      className="manifest-edge overflow-hidden rounded-lg border border-hairline bg-slate-surface"
    >
      <header className="flex items-baseline justify-between gap-3 border-b border-hairline px-5 pt-5 pb-3">
        <h2 className="text-sm font-semibold tracking-wide text-ink uppercase">
          Status timeline
        </h2>
        <span className="font-mono text-[11px] text-fog-dim">
          {history.length} {history.length === 1 ? 'entry' : 'entries'}
        </span>
      </header>

      <ol className="px-5 py-5">
        {PIPELINE.map((status, index) => {
          const meta = STATUS_META[status];
          const timestamp = reachedAt.get(status);
          const isReached = Boolean(timestamp);
          const isCurrent = index === currentIndex && !cancelledEntry;
          const isLast = index === PIPELINE.length - 1;
          // Once cancelled, the remaining pipeline steps will never happen —
          // don't draw a hopeful connector through them.
          const connectorReached = Boolean(reachedAt.get(PIPELINE[index + 1] as OrderStatus));

          return (
            <li key={status} className="relative flex gap-4 pb-6 last:pb-0">
              {!isLast && (
                <span
                  aria-hidden
                  className={cn(
                    'absolute top-7 left-3.5 h-full w-px -translate-x-1/2',
                    connectorReached ? 'bg-fog-dim' : 'bg-hairline',
                  )}
                />
              )}

              <span
                className={cn(
                  'relative z-10 flex size-7 shrink-0 items-center justify-center rounded-full border-2 font-mono text-[11px] transition-colors',
                  isReached
                    ? cn(meta.dot, 'border-transparent text-graphite')
                    : 'border-hairline bg-graphite-deep text-fog-dim',
                  isCurrent && 'ring-2 ring-signal ring-offset-2 ring-offset-slate-surface',
                )}
              >
                {isReached ? <Check className="size-3.5" strokeWidth={3} /> : index + 1}
              </span>

              <div className="min-w-0 flex-1 pt-0.5">
                <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                  <p
                    className={cn(
                      'text-sm font-medium',
                      isReached ? 'text-ink' : 'text-fog-dim',
                    )}
                  >
                    {meta.label}
                  </p>
                  {isCurrent && (
                    <span className="rounded-full border border-signal/40 bg-signal/12 px-1.5 py-0.5 text-[10px] font-semibold tracking-wide text-signal uppercase">
                      Current
                    </span>
                  )}
                </div>
                <p className="mt-0.5 font-mono text-[11px] text-fog-dim">
                  {timestamp ? formatDateTime(timestamp) : 'Not yet reached'}
                </p>
              </div>
            </li>
          );
        })}

        {cancelledEntry && (
          <li className="relative mt-1 flex gap-4 border-t border-dashed border-alert/30 pt-5">
            <span className="relative z-10 flex size-7 shrink-0 items-center justify-center rounded-full border-2 border-transparent bg-alert text-graphite">
              <Ban className="size-3.5" strokeWidth={3} />
            </span>
            <div className="min-w-0 flex-1 pt-0.5">
              <p className="text-sm font-medium text-alert">Cancelled</p>
              <p className="mt-0.5 font-mono text-[11px] text-fog-dim">
                {formatDateTime(cancelledEntry.changedAt)}
              </p>
              {cancelledEntry.note && (
                <p className="mt-1 text-xs text-fog">{cancelledEntry.note}</p>
              )}
            </div>
          </li>
        )}
      </ol>
    </section>
  );
}
