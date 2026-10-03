import { describe, it, expect } from 'vitest'
import {
  ORDER_STATUSES, LISTING_STATUSES, OFFER_STATUSES,
  CERTIFICATE_STATUSES, VERIFICATION_STATUSES, SHIPMENT_STATUSES,
  DELIVERY_TYPES, DELIVERY_MODES, ORDER_STATUS_FLOW,
} from './index'

describe('contract enums mirror the live database CHECK constraints', () => {
  it('sales.order.status — CK_order_status', () => {
    expect([...ORDER_STATUSES]).toEqual([
      'pending_payment', 'paid', 'confirmed', 'processing',
      'shipped', 'delivered', 'completed', 'cancelled', 'refunded', 'disputed',
    ])
  })
  it('catalog.listing.status — CK_listing_status', () => {
    expect([...LISTING_STATUSES]).toEqual(['draft', 'pending_review', 'active', 'paused', 'withdrawn'])
  })
  it('pricing.offer.status — CK_offer_status', () => {
    expect([...OFFER_STATUSES]).toEqual(['draft', 'pending_approval', 'active', 'paused', 'expired', 'cancelled'])
  })
  it('compliance.certificate.status — CK_cert_status', () => {
    expect([...CERTIFICATE_STATUSES]).toEqual(['submitted', 'under_review', 'verified', 'rejected', 'expired', 'revoked'])
  })
  it('iam.organisation.verification_status — CK_org_verification', () => {
    expect([...VERIFICATION_STATUSES]).toEqual(['unverified', 'pending', 'verified', 'rejected', 'expired'])
  })
  it('sales.shipment.status — CK_shipment_status', () => {
    expect([...SHIPMENT_STATUSES]).toEqual(['pending', 'dispatched', 'in_transit', 'delivered', 'failed', 'returned'])
  })
  it('sales.order.delivery_type — CK_order_delivery_type', () => {
    expect([...DELIVERY_TYPES]).toEqual(['own', 'partner', 'pickup'])
  })
  it('organisation.delivery_mode — new in Phase 2, gap G6', () => {
    expect([...DELIVERY_MODES]).toEqual(['own', 'partner', 'both'])
  })
})

describe('ORDER_STATUS_FLOW', () => {
  it('gives own delivery a delivery-man handover step the partner path does not have', () => {
    expect(ORDER_STATUS_FLOW.own).toContain('assigned')
    expect(ORDER_STATUS_FLOW.partner).not.toContain('assigned')
  })
  it('gives the partner path a handover-to-platform step the own path does not have', () => {
    expect(ORDER_STATUS_FLOW.partner).toContain('handed_to_platform')
    expect(ORDER_STATUS_FLOW.own).not.toContain('handed_to_platform')
  })
  it('ends both machines at delivered', () => {
    expect(ORDER_STATUS_FLOW.own.at(-1)).toBe('delivered')
    expect(ORDER_STATUS_FLOW.partner.at(-1)).toBe('delivered')
  })
})
