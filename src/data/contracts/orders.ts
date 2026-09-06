import type { Uuid, Money, IsoDateTime } from './common'

export const ORDER_STATUSES = [
  'pending_payment', 'paid', 'confirmed', 'processing',
  'shipped', 'delivered', 'completed', 'cancelled', 'refunded', 'disputed',
] as const
export type OrderStatus = (typeof ORDER_STATUSES)[number]

export const SHIPMENT_STATUSES = ['pending', 'dispatched', 'in_transit', 'delivered', 'failed', 'returned'] as const
export type ShipmentStatus = (typeof SHIPMENT_STATUSES)[number]

export const DELIVERY_TYPES = ['own', 'partner', 'pickup'] as const
export type DeliveryType = (typeof DELIVERY_TYPES)[number]

/**
 * UI-level fulfilment steps, wider than the DB status column, because
 * "assigned to a delivery man" and "handed to platform delivery" are shipment
 * facts rather than order statuses.
 */
export type FulfilmentStep =
  | 'confirmed'
  | 'processing'
  | 'dispatched'
  | 'assigned'
  | 'handed_to_platform'
  | 'delivered'

/** Spec 8.1 — the two machines. Only one applies to any given order. */
export const ORDER_STATUS_FLOW: Record<'own' | 'partner', readonly FulfilmentStep[]> = {
  own: ['confirmed', 'processing', 'dispatched', 'assigned', 'delivered'],
  partner: ['confirmed', 'processing', 'dispatched', 'handed_to_platform', 'delivered'],
} as const

export interface OrderLine {
  id: Uuid
  lineNumber: number
  listingId: Uuid
  /** Snapshots — what was ordered, not what the listing says today. */
  skuSnapshot: string
  nameSnapshot: string
  quantity: number
  unitCode: string | null
  packSize: number | null
  grossWeightGrams: number | null
  isRestricted: boolean
  unitPrice: Money
  lineTotal: Money
  fulfilledQuantity: number
}

export interface StatusHistoryEntry {
  id: Uuid
  fromStatus: string | null
  toStatus: string
  reason: string | null
  changedBy: string | null
  occurredAt: IsoDateTime
}

export interface Shipment {
  id: Uuid
  status: ShipmentStatus
  deliveryType: DeliveryType
  trackingReference: string | null
  /** G2 — new nullable column on sales.shipment. */
  assignedToUserId: Uuid | null
  assignedToName: string | null
  assignedAt: IsoDateTime | null
  dispatchedAt: IsoDateTime | null
  deliveredAt: IsoDateTime | null
  handedToPlatformAt: IsoDateTime | null
}

export interface OrderSummary {
  id: Uuid
  orderNumber: string
  status: OrderStatus
  deliveryType: DeliveryType
  buyerName: string
  placedAt: IsoDateTime
  grandTotal: Money
  lineCount: number
}

export interface OrderDetail extends OrderSummary {
  lines: OrderLine[]
  subtotal: Money
  discountTotal: Money
  deliveryCharge: Money
  commissionTotal: Money
  sellerNet: Money
  deliveryAddress: string | null
  deliveryContactPhone: string | null
  deliveryGeographyName: string | null
  history: StatusHistoryEntry[]
  shipment: Shipment | null
  /** Derived server-side so the UI never guesses. */
  currentStep: FulfilmentStep | null
  availableTransitions: FulfilmentStep[]
}

export interface AdvancePayload {
  reason?: string
  trackingReference?: string
  deliveryType?: DeliveryType
}
