import type { Uuid, IsoDateTime, GeoPoint } from './common'
export type { GeoPoint }
import type { OrderLine } from './orders'

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
