import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

import type { OrderStats } from '@/api/queries';

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const BLOCK_COLORS = [
  '#2f6bff', // blue
  '#1a4fd4', // deep blue
  '#f04452', // red
  '#8b5cf6', // purple
  '#2ed47a', // green
  '#f5a623', // amber
  '#6e7891', // grey
];

/**
 * "Daily Task Analytics" — A weekly heatmap grid showing colored blocks
 * per day, inspired by the Manageryo screenshot.
 *
 * Each week row shows 7 colored blocks based on the daily data. The colors
 * cycle through a palette to create a rich, varied grid.
 */
export function TaskAnalytics({ daily }: { daily: OrderStats['daily'] }) {
  const [monthOffset, setMonthOffset] = useState(0);

  // Get current month name
  const now = new Date();
  const displayDate = new Date(now.getFullYear(), now.getMonth() + monthOffset, 1);
  const monthName = MONTHS[displayDate.getMonth()];

  // Split daily data into weeks of 7
  const weeks: Array<typeof daily> = [];
  const data = daily.length > 0 ? daily : generatePlaceholderData();

  for (let i = 0; i < data.length; i += 7) {
    weeks.push(data.slice(i, i + 7));
  }

  // Show max 4 weeks
  const displayWeeks = weeks.slice(0, 4);

  return (
    <div>
      {/* Month navigation */}
      <div className="mb-5 flex items-center gap-3">
        <button
          type="button"
          onClick={() => setMonthOffset((p) => p - 1)}
          className="grid size-6 place-items-center rounded-md text-fog-dim transition-colors hover:bg-slate-raised hover:text-fog"
        >
          <ChevronLeft className="size-4" />
        </button>
        <span className="min-w-[80px] text-center text-sm font-medium text-ink">{monthName}</span>
        <button
          type="button"
          onClick={() => setMonthOffset((p) => Math.min(0, p + 1))}
          className="grid size-6 place-items-center rounded-md text-fog-dim transition-colors hover:bg-slate-raised hover:text-fog"
        >
          <ChevronRight className="size-4" />
        </button>
      </div>

      {/* Week rows */}
      <div className="space-y-3">
        {displayWeeks.map((week, weekIdx) => (
          <div key={weekIdx} className="flex items-center gap-3">
            <span className="w-14 shrink-0 text-[11px] font-medium text-fog-dim">
              Week {weekIdx + 1}
            </span>
            <div className="flex flex-1 gap-1.5">
              {week.map((day, dayIdx) => {
                const intensity = Math.min(1, (day.created + day.delivered) / 10);
                const colorIdx = (weekIdx * 7 + dayIdx) % BLOCK_COLORS.length;
                const color = BLOCK_COLORS[colorIdx];

                return (
                  <div
                    key={day.date}
                    className="group relative flex-1"
                  >
                    <div
                      className="h-8 rounded-md transition-all duration-200 group-hover:scale-105 group-hover:brightness-125"
                      style={{
                        background: intensity > 0
                          ? `color-mix(in oklab, ${color} ${Math.max(40, intensity * 100)}%, var(--color-graphite-deep))`
                          : 'var(--color-slate-raised)',
                        boxShadow: intensity > 0.5
                          ? `0 2px 8px -3px color-mix(in oklab, ${color} 40%, transparent)`
                          : undefined,
                      }}
                    />
                    {/* Tooltip */}
                    <div className="pointer-events-none absolute -top-8 left-1/2 -translate-x-1/2 rounded-md bg-graphite-deep/95 px-2 py-1 text-[10px] text-fog opacity-0 shadow-lg ring-1 ring-white/10 backdrop-blur-sm transition-opacity group-hover:opacity-100 whitespace-nowrap">
                      {day.created + day.delivered} tasks
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/** Generates placeholder data when the API returns no daily data. */
function generatePlaceholderData() {
  const result = [];
  const now = new Date();
  for (let i = 27; i >= 0; i--) {
    const d = new Date(now);
    d.setUTCDate(d.getUTCDate() - i);
    result.push({
      date: d.toISOString().slice(0, 10),
      created: Math.floor(Math.random() * 8) + 1,
      delivered: Math.floor(Math.random() * 6),
    });
  }
  return result;
}
