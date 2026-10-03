

export type Uuid = string
export type IsoDateTime = string
export type IsoDate = string

export interface Money {
  amountMinor: number
  currency: 'BDT'
  display: string
}

export interface Page<T> {
  items: T[]
  page: number
  pageSize: number
  total: number
}

export interface PageQuery {
  page?: number
  pageSize?: number
  search?: string
  sort?: string
}

export interface ApiProblem {
  type: string
  title: string
  status: number
  detail?: string
  code: string
  correlationId?: string
}

export const VERIFICATION_STATUSES = ['unverified', 'pending', 'verified', 'rejected', 'expired'] as const
export type VerificationStatus = (typeof VERIFICATION_STATUSES)[number]

export const DELIVERY_MODES = ['own', 'partner', 'both'] as const
export type DeliveryMode = (typeof DELIVERY_MODES)[number]

export interface GeoPoint {
  lat: number | null
  lng: number | null
  precision: 'exact' | 'none'
}
