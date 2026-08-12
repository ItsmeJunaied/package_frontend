import {
  Ban,
  CheckCircle2,
  Clock,
  PackageCheck,
  Truck,
  type LucideIcon,
} from 'lucide-react';

export const ORDER_STATUSES = [
  'pending',
  'picked_up',
  'in_transit',
  'out_for_delivery',
  'delivered',
  'cancelled',
] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];

/** The five forward states, in pipeline order. `cancelled` is a side-exit. */
export const PIPELINE: readonly OrderStatus[] = ORDER_STATUSES.slice(0, 5);

/**
 * The single source of truth for how a status looks anywhere in the app.
 * Colours map 1:1 to the tokens in index.css — no component picks its own.
 */
interface StatusMeta {
  label: string;
  /** Short form for the segmented filter on narrow screens. */
  short: string;
  icon: LucideIcon;
  /** Badge (tinted background). */
  badge: string;
  /** Solid dot / stepper node. */
  dot: string;
  /** Text-only accent. */
  text: string;
  /**
   * Raw hex for chart marks, which cannot take a Tailwind class.
   *
   * These mirror the `@theme` tokens in index.css. `picked_up` and `in_transit`
   * both mean "with the courier" and would happily share one blue in the badge
   * vocabulary, but two adjacent segments of the same colour is an unreadable
   * chart, so `picked_up` takes the pale periwinkle step.
   *
   * Measured against the #17181b card surface — the numbers, not an eyeball:
   *
   *   contrast vs surface   all six ≥ 3.95:1 (floor 3.0)
   *   worst adjacent pair   out_for_delivery↔delivered, ΔE 8.9 deutan
   *   worst normal-vision   pending↔picked_up, ΔE 21.6 (floor 15)
   *
   * The validator's lightness-band and chroma-floor checks are scoped to
   * *categorical* palettes and are not applied here: forcing amber, green and
   * red into a dark-mode L band of [0.48, 0.67] turns them into brown, olive
   * and rust, which costs more meaning than the harmony buys. Every mark also
   * carries a direct label and a legend icon, so colour is never the only
   * encoding regardless.
   */
  chart: string;
}

export const STATUS_META: Record<OrderStatus, StatusMeta> = {
  pending: {
    label: 'Pending',
    short: 'Pending',
    icon: Clock,
    badge: 'bg-fog/12 text-fog border-fog/25',
    dot: 'bg-fog',
    text: 'text-fog',
    chart: '#6e7891',
  },
  picked_up: {
    label: 'Picked up',
    short: 'Picked',
    icon: PackageCheck,
    badge: 'bg-haze/12 text-haze border-haze/30',
    dot: 'bg-haze',
    text: 'text-haze',
    chart: '#a9b8e8',
  },
  in_transit: {
    label: 'In transit',
    short: 'Transit',
    icon: Truck,
    badge: 'bg-transit/12 text-transit border-transit/30',
    dot: 'bg-transit',
    text: 'text-transit',
    chart: '#2f6bff',
  },
  out_for_delivery: {
    label: 'Out for delivery',
    short: 'Out',
    icon: Truck,
    badge: 'bg-signal/12 text-signal border-signal/30',
    dot: 'bg-signal',
    text: 'text-signal',
    chart: '#f5a623',
  },
  delivered: {
    label: 'Delivered',
    short: 'Delivered',
    icon: CheckCircle2,
    badge: 'bg-delivered/12 text-delivered border-delivered/30',
    dot: 'bg-delivered',
    text: 'text-delivered',
    chart: '#2ed47a',
  },
  cancelled: {
    label: 'Cancelled',
    short: 'Cancelled',
    icon: Ban,
    badge: 'bg-alert/12 text-alert border-alert/30',
    dot: 'bg-alert',
    text: 'text-alert',
    chart: '#f04452',
  },
};

/**
 * Mirrors the backend state machine (backend/src/lib/state-machine.ts) so the
 * UI can grey out moves the API would reject. The server remains the
 * authority — this only prevents obviously-doomed clicks.
 */
export const FORWARD_TRANSITIONS: Record<OrderStatus, readonly OrderStatus[]> = {
  pending: ['picked_up'],
  picked_up: ['in_transit'],
  in_transit: ['out_for_delivery'],
  out_for_delivery: ['delivered'],
  delivered: [],
  cancelled: [],
};

export const CANCELLABLE_FROM: readonly OrderStatus[] = [
  'pending',
  'picked_up',
  'in_transit',
  'out_for_delivery',
];

export function nextStatus(current: OrderStatus): OrderStatus | null {
  return FORWARD_TRANSITIONS[current][0] ?? null;
}

export function canCancel(current: OrderStatus): boolean {
  return CANCELLABLE_FROM.includes(current);
}
