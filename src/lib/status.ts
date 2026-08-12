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
   * Raw hex for SVG chart marks, which cannot take a Tailwind class.
   *
   * These are the `@theme` tokens from index.css with one deliberate exception:
   * `picked_up` and `in_transit` share one blue in the badge vocabulary (both
   * mean "with the courier"), but two adjacent slices of the same colour is an
   * unreadable chart, so `picked_up` gets a lighter step of the same hue.
   *
   * Checked with the palette validator against the #262c36 chart surface:
   * every pair clears the normal-vision floor and 3:1 contrast. The one
   * borderline pair — delivered/out_for_delivery at ΔE 7.8 under protanopia —
   * is why every mark in this dashboard also carries a direct label and an
   * icon in the legend. Colour is never the only encoding.
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
    chart: '#8b94a3',
  },
  picked_up: {
    label: 'Picked up',
    short: 'Picked',
    icon: PackageCheck,
    badge: 'bg-transit/12 text-transit border-transit/30',
    dot: 'bg-transit',
    text: 'text-transit',
    chart: '#7cc4f8',
  },
  in_transit: {
    label: 'In transit',
    short: 'Transit',
    icon: Truck,
    badge: 'bg-transit/12 text-transit border-transit/30',
    dot: 'bg-transit',
    text: 'text-transit',
    chart: '#4c8dff',
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
    chart: '#34c77b',
  },
  cancelled: {
    label: 'Cancelled',
    short: 'Cancelled',
    icon: Ban,
    badge: 'bg-alert/12 text-alert border-alert/30',
    dot: 'bg-alert',
    text: 'text-alert',
    chart: '#e5484d',
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
