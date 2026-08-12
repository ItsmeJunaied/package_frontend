import { forwardRef, useId, type InputHTMLAttributes, type TextareaHTMLAttributes } from 'react';

import { cn } from '@/lib/cn';

const CONTROL =
  'w-full rounded-md bg-graphite-deep border border-hairline px-3 py-2 text-sm text-ink ' +
  'placeholder:text-fog-dim transition-colors hover:border-fog-dim ' +
  'focus:border-accent focus:outline-none disabled:opacity-50';

interface BaseProps {
  label: string;
  error?: string | undefined;
  hint?: string;
}

function Shell({
  id,
  label,
  error,
  hint,
  children,
}: BaseProps & { id: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-xs font-medium tracking-wide text-fog uppercase">
        {label}
      </label>
      {children}
      {error ? (
        <p role="alert" className="text-xs text-alert">
          {error}
        </p>
      ) : hint ? (
        <p className="text-xs text-fog-dim">{hint}</p>
      ) : null}
    </div>
  );
}

type InputFieldProps = BaseProps & InputHTMLAttributes<HTMLInputElement>;

export const InputField = forwardRef<HTMLInputElement, InputFieldProps>(function InputField(
  { label, error, hint, className, ...props },
  ref,
) {
  const generatedId = useId();
  const id = props.id ?? generatedId;

  return (
    <Shell id={id} label={label} error={error} hint={hint}>
      <input
        ref={ref}
        id={id}
        aria-invalid={Boolean(error)}
        className={cn(CONTROL, error && 'border-alert/60', className)}
        {...props}
      />
    </Shell>
  );
});

type TextareaFieldProps = BaseProps & TextareaHTMLAttributes<HTMLTextAreaElement>;

export const TextareaField = forwardRef<HTMLTextAreaElement, TextareaFieldProps>(
  function TextareaField({ label, error, hint, className, ...props }, ref) {
    const generatedId = useId();
    const id = props.id ?? generatedId;

    return (
      <Shell id={id} label={label} error={error} hint={hint}>
        <textarea
          ref={ref}
          id={id}
          rows={2}
          aria-invalid={Boolean(error)}
          className={cn(CONTROL, 'resize-y', error && 'border-alert/60', className)}
          {...props}
        />
      </Shell>
    );
  },
);
