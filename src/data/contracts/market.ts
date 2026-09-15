import type { Money } from './common'

export interface CategoryDemandPoint {
  month: string
  categoryName: string
  orderCount: number

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

  competitorCount: number

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

  generatedAt: string
  window: '3m' | '6m' | '12m'
  demandTrend: CategoryDemandPoint[]
  priceBenchmarks: PriceBenchmark[]
  regionalDemand: RegionalDemand[]
  pricePositions: PricePositionPoint[]
}
