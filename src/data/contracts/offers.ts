import type { Uuid, Money, IsoDateTime } from './common'

export const OFFER_STATUSES = ['draft', 'pending_approval', 'active', 'paused', 'expired', 'cancelled'] as const
export type OfferStatus = (typeof OFFER_STATUSES)[number]

export type DiscountScope =
  | { kind: 'listing'; listingIds: Uuid[] }
  | { kind: 'category'; categoryId: Uuid }

export interface Discount {
  id: Uuid
  code: string
  name: string
  basis: 'percentage' | 'fixed'
  /** 0–100, per CK_offer_percent. Null when basis is 'fixed'. */
  discountPercent: number | null
  discountAmount: Money | null
  maxDiscount: Money | null
  minOrder: Money | null
  scope: DiscountScope
  startsAt: IsoDateTime
  endsAt: IsoDateTime | null
  status: OfferStatus
  isStackable: boolean
  stackPriority: number
  stackGroup: string | null
  maxRedemptions: number | null
  redemptionCount: number
}

/**
 * pricing.offer permits overlapping windows on one listing, with stack_priority
 * deciding the winner. A timeline is the only encoding that makes an accidental
 * overlap visible rather than discovered in a customer complaint.
 */
export interface DiscountConflict {
  listingId: Uuid
  listingName: string
  discountIds: Uuid[]
  overlapFrom: IsoDateTime
  overlapTo: IsoDateTime | null
  resolution: 'stacked' | 'highest_priority_wins' | 'ambiguous'
  winningDiscountId: Uuid | null
}

/** Waterfall input: list price -> discount -> commission -> net, per unit. */
export interface MarginBreakdown {
  listPrice: Money
  discount: Money
  commission: Money
  net: Money
  netMarginFraction: number
}

export interface SaveDiscountInput {
  id?: Uuid
  code: string
  name: string
  basis: 'percentage' | 'fixed'
  discountPercent?: number | null
  discountAmountMinor?: number | null
  maxDiscountMinor?: number | null
  minOrderMinor?: number | null
  scope: DiscountScope
  startsAt: IsoDateTime
  endsAt?: IsoDateTime | null
  isStackable: boolean
  stackPriority: number
  stackGroup?: string | null
  maxRedemptions?: number | null
}
