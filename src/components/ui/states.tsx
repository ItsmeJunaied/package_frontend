import type { LucideIcon } from 'lucide-react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

import { Button } from './button';

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 px-6 py-16 text-center">
      <div className="rounded-full border border-hairline bg-graphite-deep p-3">
        <Icon className="size-5 text-fog-dim" aria-hidden />
      </div>
      <div>
        <p className="text-sm font-medium text-ink">{title}</p>
        <p className="mx-auto mt-1 max-w-sm text-xs text-fog">{description}</p>
      </div>
      {action}
    </div>
  );
}

/** Every failed fetch gets the server's own message plus a way to try again. */
export function ErrorState({
  title = 'Something went wrong',
  message,
  onRetry,
}: {
  title?: string;
  message: string;
  onRetry?: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 px-6 py-16 text-center">
      <div className="rounded-full border border-alert/30 bg-alert/10 p-3">
        <AlertTriangle className="size-5 text-alert" aria-hidden />
      </div>
      <div>
        <p className="text-sm font-medium text-ink">{title}</p>
        <p className="mx-auto mt-1 max-w-md text-xs break-words text-fog">{message}</p>
      </div>
      {onRetry && (
        <Button size="sm" onClick={onRetry}>
          <RefreshCw className="size-3.5" aria-hidden />
          Try again
        </Button>
      )}
    </div>
  );
}
