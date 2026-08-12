import { forwardRef, type ButtonHTMLAttributes } from 'react';
import { Loader2 } from 'lucide-react';

import { cn } from '@/lib/cn';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';
type Size = 'sm' | 'md';

const VARIANTS: Record<Variant, string> = {
  /* The bloom under the primary button is the same treatment the chart marks
     get — one light source, applied consistently, is what stops "dark theme"
     from reading as "flat theme". */
  primary:
    'bg-accent text-white font-semibold shadow-[0_4px_14px_-4px_rgba(47,107,255,0.75)] ' +
    'hover:bg-accent-hi hover:shadow-[0_6px_20px_-4px_rgba(47,107,255,0.9)]',
  secondary:
    'bg-slate-raised text-ink border border-hairline hover:bg-slate-raised/70 hover:border-fog-dim',
  ghost: 'text-fog hover:text-ink hover:bg-slate-raised/60',
  danger: 'bg-alert/12 text-alert border border-alert/35 hover:bg-alert/20',
};

const SIZES: Record<Size, string> = {
  sm: 'h-8 px-3 text-xs gap-1.5',
  md: 'h-10 px-4 text-sm gap-2',
};

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'secondary', size = 'md', loading = false, disabled, className, children, ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      disabled={disabled ?? loading}
      className={cn(
        'inline-flex items-center justify-center rounded-lg whitespace-nowrap transition-all',
        'disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none',
        VARIANTS[variant],
        SIZES[size],
        className,
      )}
      {...props}
    >
      {loading && <Loader2 className="size-4 animate-spin" aria-hidden />}
      {children}
    </button>
  );
});
