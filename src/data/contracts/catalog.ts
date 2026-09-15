import type { Uuid, Money, IsoDateTime } from './common'

export const LISTING_STATUSES = ['draft', 'pending_review', 'active', 'paused', 'withdrawn'] as const
export type ListingStatus = (typeof LISTING_STATUSES)[number]

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

/**
 * A node in the platform taxonomy. The tree is three levels deep -- division,
 * category, subcategory -- and a listing always hangs off a subcategory.
 *
 * `level` is 1-based to match how the tiers are talked about; the API derives
 * it from the row's 0-based depth. Nothing here is hard-coded on the client:
 * every option comes from /api/v1/categories, so a superadmin adding a
 * subcategory shows up without a deploy.
 */
export interface Category {
  id: Uuid
  code: string
  name: string
  parentId: Uuid | null
  depth: number
  listingKind: 'product' | 'service' | 'both'
  displayOrder: number
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
  formulation?: string | null
  composition?: ListingCompositionInput[]
}

export interface ListingCompositionInput {
  activeIngredientCode: string
  concentration: number
  concentrationBasis: 'percent' | 'g_per_litre' | 'g_per_kg'
  activeIngredientGramsPerPack: number
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
