import { useCallback, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';

interface TooltipState {
  x: number;
  y: number;
  node: ReactNode;
}

/**
 * The hover layer every chart on the dashboard shares.
 *
 * Rendered into a portal and positioned against the viewport rather than the
 * chart, so a card near the right edge doesn't clip its own tooltip — and the
 * tooltip can never widen the page into a horizontal scroll.
 */
export function useChartTooltip() {
  const [tip, setTip] = useState<TooltipState | null>(null);

  const show = useCallback((event: { clientX: number; clientY: number }, node: ReactNode) => {
    setTip({ x: event.clientX, y: event.clientY, node });
  }, []);

  const hide = useCallback(() => setTip(null), []);

  const tooltip =
    tip ?
      createPortal(
        <div
          role="tooltip"
          className="pointer-events-none fixed z-50 max-w-[240px] rounded-md border border-hairline bg-graphite-deep px-2.5 py-2 text-xs shadow-lg"
          style={{
            left: Math.min(tip.x + 14, window.innerWidth - 250),
            top: Math.min(tip.y + 14, window.innerHeight - 90),
          }}
        >
          {tip.node}
        </div>,
        document.body,
      )
    : null;

  return { show, hide, tooltip };
}
