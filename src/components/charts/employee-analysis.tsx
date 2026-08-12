import { Search, SlidersHorizontal } from 'lucide-react';
import { useState } from 'react';

import type { OrderStats } from '@/api/queries';

/**
 * "Employee Analysis" — A table showing courier/employee data
 * with avatar, name, role, project count, team count, and contact button.
 * Matches the Manageryo screenshot design.
 */
export function EmployeeAnalysis({ byCourier }: { byCourier: OrderStats['byCourier'] }) {
  const [searchQuery, setSearchQuery] = useState('');

  const employees = byCourier.length > 0 ? byCourier : PLACEHOLDER_EMPLOYEES;

  const filtered = employees.filter((emp) =>
    emp.courierName.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <div>
      {/* Header */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-ink">Employee Analysis</h3>
          <p className="mt-0.5 text-[11px] text-fog-dim">
            Need Renewable Contract By Division
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Search */}
          <div className="flex items-center gap-1.5 rounded-lg border border-hairline bg-graphite-deep px-2.5 py-1.5">
            <Search className="size-3.5 text-fog-dim" />
            <input
              type="text"
              placeholder="Search People"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-28 bg-transparent text-[11px] text-ink placeholder:text-fog-dim focus:outline-none"
            />
          </div>
          {/* Filter icon */}
          <button
            type="button"
            className="grid size-8 place-items-center rounded-lg border border-hairline bg-graphite-deep text-fog-dim transition-colors hover:text-fog"
          >
            <SlidersHorizontal className="size-3.5" />
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-hairline">
        {/* Header */}
        <div className="grid grid-cols-[1fr_70px_70px_90px] items-center gap-2 border-b border-hairline bg-graphite-deep/60 px-4 py-2.5">
          <span className="text-[11px] font-medium text-fog-dim">Employee</span>
          <span className="text-center text-[11px] font-medium text-fog-dim">Project</span>
          <span className="text-center text-[11px] font-medium text-fog-dim">Team</span>
          <span />
        </div>

        {/* Rows */}
        <div className="divide-y divide-hairline">
          {filtered.slice(0, 5).map((emp) => (
            <div
              key={emp.courierName}
              className="group grid grid-cols-[1fr_70px_70px_90px] items-center gap-2 px-4 py-3 transition-colors hover:bg-slate-raised/50"
            >
              {/* Employee info */}
              <div className="flex items-center gap-3 min-w-0">
                <span
                  className="grid size-8 shrink-0 place-items-center rounded-full bg-gradient-to-br from-accent to-violet text-[11px] font-semibold text-white"
                  aria-hidden
                >
                  {emp.courierName
                    .split(/\s+/)
                    .slice(0, 2)
                    .map((p) => p[0]?.toUpperCase() ?? '')
                    .join('')}
                </span>
                <div className="min-w-0">
                  <p className="truncate text-xs font-medium text-ink">{emp.courierName}</p>
                  <p className="truncate text-[10px] text-fog-dim">
                    {emp.total > 5 ? 'Senior Courier' : 'Courier'}
                  </p>
                </div>
              </div>

              {/* Project count */}
              <span className="text-center text-xs font-medium tabular-nums text-ink">
                {emp.total}
              </span>

              {/* Team count */}
              <span className="text-center text-xs font-medium tabular-nums text-ink">
                {emp.delivered + emp.active}
              </span>

              {/* Contact button */}
              <button
                type="button"
                className="rounded-lg border border-accent/30 bg-accent/10 px-3 py-1.5 text-[11px] font-medium text-accent transition-all hover:bg-accent hover:text-white hover:shadow-[0_4px_12px_-4px_rgba(47,107,255,0.6)]"
              >
                Contact
              </button>
            </div>
          ))}

          {filtered.length === 0 && (
            <div className="px-4 py-6 text-center text-xs text-fog-dim">
              No employees match your search.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const PLACEHOLDER_EMPLOYEES: OrderStats['byCourier'] = [
  { courierName: 'Bambang Sugeni', total: 12, active: 5, delivered: 65, cancelled: 0 },
  { courierName: 'Anjani Rana', total: 11, active: 4, delivered: 45, cancelled: 1 },
  { courierName: 'Dewi Sartika', total: 9, active: 3, delivered: 38, cancelled: 0 },
  { courierName: 'Raden Wijaya', total: 8, active: 2, delivered: 30, cancelled: 1 },
  { courierName: 'Putri Lestari', total: 7, active: 3, delivered: 25, cancelled: 0 },
];
