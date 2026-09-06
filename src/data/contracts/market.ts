import type { Money } from './common'

/**
 * Whole-market aggregates. R4 — these cross the RLS boundary, so Phase 2 serves
 * them from a WITH EXECUTE AS procedure that returns aggregates only, above a
 * k-anonymity floor. Nothing here may ever identify an individual competitor.
 */

export interface CategoryDemandPoint {
  month: string
  categoryName: string
  orderCount: number
  /** Fraction 0–1 of total market demand that month. */
  shareOfMarket: number
}

export interface PriceBenchmark {
  categoryName: string
  marketMin: Money
  marketMedian: Money
  marketMax: Money
  myMedian: Money | null
  myPosition: 'below' | 'at' | 'above' | 'absent'
  sampleSize: number
}

export interface RegionalDemand {
  geographyId: string
  districtName: string
  lat: number
  lng: number
  orderCount: number
  /** A count, never a named list. */
  competitorCount: number
  /** False when the cell is below the k-anonymity floor; the UI greys it out. */
  isDisclosable: boolean
}

export interface PricePositionPoint {
  listingId: string | null
  listingName: string | null
  categoryName: string
  unitPriceMinor: number
  unitsSold: number
  isMine: boolean
}

export interface MarketIntelligence {
  /** When the aggregate was computed. Displayed, because it is cached. */
  generatedAt: string
  window: '3m' | '6m' | '12m'
  demandTrend: CategoryDemandPoint[]
  priceBenchmarks: PriceBenchmark[]
  regionalDemand: RegionalDemand[]
  pricePositions: PricePositionPoint[]
}
