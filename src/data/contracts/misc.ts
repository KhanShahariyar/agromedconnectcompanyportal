import type { Uuid, Money, IsoDateTime } from './common'

export interface PerformanceReport {
  window: '3m' | '6m' | '12m'
  revenueByCategory: { categoryName: string; month: string; revenueMinor: number }[]
  repeatCohorts: { cohortMonth: string; monthsSince: number; repeatRate: number; buyers: number }[]
  deliveryMix: { deliveryType: 'own' | 'partner' | 'pickup'; orderCount: number }[]
  totals: { revenue: Money; orders: number; averageFulfilmentDays: number; slaTargetDays: number }
}

export interface Review {
  id: Uuid
  listingId: Uuid
  listingName: string
  buyerName: string
  rating: number
  body: string
  createdAt: IsoDateTime
  response: { body: string; respondedAt: IsoDateTime } | null
}

export interface Payout {
  id: Uuid
  reference: string
  amount: Money
  status: 'requested' | 'approved' | 'paid' | 'rejected'
  requestedAt: IsoDateTime
  paidAt: IsoDateTime | null
  deductions: { label: string; amount: Money }[]
}

export interface FeedbackInput {
  category: 'bug' | 'feature' | 'billing' | 'other'
  subject: string
  body: string
}

export interface AppNotification {
  id: Uuid
  kind: 'order' | 'verification' | 'discount' | 'payout' | 'system'
  title: string
  body: string
  createdAt: IsoDateTime
  readAt: IsoDateTime | null
  link: string | null
}

export interface Solution {
  id: Uuid
  title: string
  target: string
  includes: string[]
  price: Money
  status: 'draft' | 'active' | 'ended'
  buyersEnrolled: number
}
