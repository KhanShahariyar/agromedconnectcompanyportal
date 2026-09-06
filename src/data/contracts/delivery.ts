import type { Uuid, IsoDateTime } from './common'
import type { OrderLine } from './orders'

/**
 * D3/R1 — coordinates are captured at checkout by the Flutter farmer app.
 * Until that ships, `precision: 'none'` is the normal case, so every consumer
 * must render an honest address-only state rather than a misleading pin.
 */
export interface GeoPoint {
  lat: number | null
  lng: number | null
  precision: 'exact' | 'none'
}

export type AssignmentStatus = 'assigned' | 'picked_up' | 'delivered' | 'failed'

export interface DeliveryAssignment {
  shipmentId: Uuid
  orderId: Uuid
  orderNumber: string
  status: AssignmentStatus
  assignedAt: IsoDateTime
  buyerName: string
  buyerPhone: string | null
  deliveryAddress: string
  geographyName: string | null
  location: GeoPoint
  lines: OrderLine[]
  totalWeightGrams: number | null
  hasRestrictedItems: boolean
  deliveredAt: IsoDateTime | null
}

export interface HandoverInput {
  receivedByName: string
  note?: string
}
