import type { Uuid, Money, IsoDateTime } from './common'

export const LISTING_STATUSES = ['draft', 'pending_review', 'active', 'paused', 'withdrawn'] as const
export type ListingStatus = (typeof LISTING_STATUSES)[number]

/**
 * R3 — image authenticity is decided by manual admin review. Perceptual-hash
 * matching only raises the flag; nothing here means "verified authentic".
 */
export const IMAGE_REVIEW_STATUSES = ['not_submitted', 'pending_review', 'approved', 'flagged'] as const
export type ImageReviewStatus = (typeof IMAGE_REVIEW_STATUSES)[number]

export interface MediaItem {
  id: Uuid
  url: string
  contentType: string
  isPrimary: boolean
  displayOrder: number
  reviewStatus: ImageReviewStatus
  duplicateOfListingId: Uuid | null
}

export interface Listing {
  id: Uuid
  kind: 'product' | 'service'
  sku: string
  slug: string
  name: string
  brand: string | null
  categoryId: Uuid
  categoryName: string
  status: ListingStatus
  isBlocked: boolean
  publishedAt: IsoDateTime | null
  price: Money
  ratingAverage: number | null
  ratingCount: number
  media: MediaItem[]
  packSize: number | null
  unitCode: string | null
  packsPerCase: number | null
  grossWeightGrams: number | null
  isRestricted: boolean
  requiredCertificateTypes: string[]
  attachedCertificateIds: Uuid[]
}

export type PublishBlocker =
  | 'missing_certificate'
  | 'certificate_not_verified'
  | 'certificate_expired'
  | 'no_primary_image'
  | 'image_flagged'
  | 'organisation_unverified'
  | 'no_price'
  | 'no_stock'

/** The single source of truth for "can this go live?". */
export interface PublishReadiness {
  canPublish: boolean
  blockers: PublishBlocker[]
}

export interface SaveListingInput {
  id?: Uuid
  kind: 'product' | 'service'
  sku: string
  name: string
  brand?: string | null
  categoryId: Uuid
  priceMinor: number
  packSize?: number | null
  unitCode?: string | null
  isRestricted?: boolean
}

export interface StockRow {
  listingId: Uuid
  sku: string
  name: string
  onHand: number
  reserved: number
  reorderPoint: number
  unitCode: string | null
  warehouseName: string
}

export interface ServiceAvailability {
  dayOfWeek: 0 | 1 | 2 | 3 | 4 | 5 | 6
  startTime: string
  endTime: string
  slotCapacity: number
}

export interface ServiceBlackout {
  id: Uuid
  date: string
  reason: string | null
}
