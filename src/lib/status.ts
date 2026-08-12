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
}

export const STATUS_META: Record<OrderStatus, StatusMeta> = {
  pending: {
    label: 'Pending',
    short: 'Pending',
    icon: Clock,
    badge: 'bg-fog/12 text-fog border-fog/25',
    dot: 'bg-fog',
    text: 'text-fog',
  },
  picked_up: {
    label: 'Picked up',
    short: 'Picked',
    icon: PackageCheck,
    badge: 'bg-transit/12 text-transit border-transit/30',
    dot: 'bg-transit',
    text: 'text-transit',
  },
  in_transit: {
    label: 'In transit',
    short: 'Transit',
    icon: Truck,
    badge: 'bg-transit/12 text-transit border-transit/30',
    dot: 'bg-transit',
    text: 'text-transit',
  },
  out_for_delivery: {
    label: 'Out for delivery',
    short: 'Out',
    icon: Truck,
    badge: 'bg-signal/12 text-signal border-signal/30',
    dot: 'bg-signal',
    text: 'text-signal',
  },
  delivered: {
    label: 'Delivered',
    short: 'Delivered',
    icon: CheckCircle2,
    badge: 'bg-delivered/12 text-delivered border-delivered/30',
    dot: 'bg-delivered',
    text: 'text-delivered',
  },
  cancelled: {
    label: 'Cancelled',
    short: 'Cancelled',
    icon: Ban,
    badge: 'bg-alert/12 text-alert border-alert/30',
    dot: 'bg-alert',
    text: 'text-alert',
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
