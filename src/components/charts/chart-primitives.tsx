import type { ReactNode } from 'react';

import { cn } from '@/lib/cn';

/**
 * Shared chart furniture.
 *
 * Every mark in this dashboard is a `div` or a CSS gradient rather than an
 * `<svg>` element, and there is no charting library. The shapes are rectangles
 * anchored to a baseline plus one conic ring, all of which CSS does natively
 * and responsively, and it keeps the labels as real text — selectable,
 * translatable, and sized by the same type scale as the rest of the console.
 */

export function ChartCard({
  title,
  subtitle,
  action,
  children,
  className,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn(
        'panel rounded-xl border border-hairline p-4 shadow-[0_1px_2px_rgba(0,0,0,0.4),0_12px_32px_-16px_rgba(0,0,0,0.8)] sm:p-5',
        className,
      )}
    >
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-sm font-semibold tracking-tight">{title}</h2>
          {subtitle && <p className="mt-1 text-xs text-fog">{subtitle}</p>}
        </div>
        {action}
      </header>
      <div className="mt-4">{children}</div>
    </section>
  );
}

export interface LegendItem {
  label: string;
  color: string;
  icon?: React.ComponentType<{ className?: string }>;
}

/**
 * Present whenever a chart carries two or more series. The swatch is never the
 * only cue — status series bring their pipeline icon along, which is what keeps
 * the delivered/out-for-delivery pair legible under deuteranopia.
 */
export function Legend({ items }: { items: LegendItem[] }) {
  return (
    <ul className="flex flex-wrap items-center gap-x-4 gap-y-1.5">
      {items.map(({ label, color, icon: Icon }) => (
        <li key={label} className="flex items-center gap-1.5 text-[11px] text-fog">
          <span
            aria-hidden
            className="size-2 shrink-0 rounded-full"
            style={{
              backgroundColor: color,
              boxShadow: `0 0 0 3px color-mix(in oklab, ${color} 16%, transparent)`,
            }}
          />
          {Icon && <Icon className="size-3 shrink-0 text-fog-dim" aria-hidden />}
          {label}
        </li>
      ))}
    </ul>
  );
}

/** The value line inside a tooltip: a swatch, a name, then the number. */
export function TooltipRow({
  color,
  label,
  value,
}: {
  color?: string;
  label: string;
  value: string | number;
}) {
  return (
    <div className="flex items-center gap-2">
      {color && (
        <span aria-hidden className="size-2 rounded-full" style={{ backgroundColor: color }} />
      )}
      <span className="text-fog">{label}</span>
      <span className="ml-auto pl-3 font-mono font-medium text-ink tabular-nums">{value}</span>
    </div>
  );
}

/**
 * The non-visual reading of a chart. Screen readers and anyone who prints the
 * page get the numbers as a table instead of as coloured rectangles.
 */
export function DataTable({
  caption,
  columns,
  rows,
}: {
  caption: string;
  columns: string[];
  rows: Array<Array<string | number>>;
}) {
  return (
    <table className="sr-only">
      <caption>{caption}</caption>
      <thead>
        <tr>
          {columns.map((c) => (
            <th key={c} scope="col">
              {c}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr key={String(row[0])}>
            {row.map((cell, i) =>
              i === 0 ?
                <th key={i} scope="row">
                  {cell}
                </th>
              : <td key={i}>{cell}</td>,
            )}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
