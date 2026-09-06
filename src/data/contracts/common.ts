/**
 * Shared primitives. This folder imports no runtime code — it is the artefact
 * Phase 2 implements against, and it must stay readable as a contract.
 */

export type Uuid = string
export type IsoDateTime = string
export type IsoDate = string

/** C2 — never a bare number. `display` is server-rendered and authoritative. */
export interface Money {
  amountMinor: number
  currency: 'BDT'
  display: string
}

/** C10 — every list is paginated from the first mock. */
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

/** RFC 9457 problem document, as the API already emits. */
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

/** G6/C14 — assigned by the platform super admin, never by the company. */
export const DELIVERY_MODES = ['own', 'partner', 'both'] as const
export type DeliveryMode = (typeof DELIVERY_MODES)[number]
