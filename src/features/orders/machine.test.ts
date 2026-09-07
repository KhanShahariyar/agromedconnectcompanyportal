import { describe, it, expect } from 'vitest'
import { stepsFor, pathFor, mayChoosePath, isAwaitingPlatform, currentIndex } from './machine'
import type { OrderDetail } from '@/data/contracts'

const order = (over: Partial<OrderDetail>): OrderDetail => ({
  id: 'o', orderNumber: 'AM-1', status: 'confirmed', deliveryType: 'own', buyerName: 'B',
  placedAt: '2026-01-01T00:00:00Z', grandTotal: { amountMinor: 0, currency: 'BDT', display: '৳0' },
  lineCount: 0, lines: [], subtotal: { amountMinor: 0, currency: 'BDT', display: '৳0' },
  discountTotal: { amountMinor: 0, currency: 'BDT', display: '৳0' },
  deliveryCharge: { amountMinor: 0, currency: 'BDT', display: '৳0' },
  commissionTotal: { amountMinor: 0, currency: 'BDT', display: '৳0' },
  sellerNet: { amountMinor: 0, currency: 'BDT', display: '৳0' },
  deliveryAddress: null, deliveryContactPhone: null, deliveryGeographyName: null,
  history: [], shipment: null, currentStep: 'confirmed', availableTransitions: [], ...over,
})

describe('fulfilment machines', () => {
  it('gives own delivery a delivery-man step', () => {
    expect([...stepsFor('own')]).toEqual(['confirmed', 'processing', 'dispatched', 'assigned', 'delivered'])
  })

  it('gives partner delivery a handover-to-platform step instead', () => {
    expect([...stepsFor('partner')]).toEqual(['confirmed', 'processing', 'dispatched', 'handed_to_platform', 'delivered'])
  })

  it('treats pickup as the own path — there is no courier leg', () => {
    expect(pathFor('pickup')).toBe('own')
  })

  it('offers a per-order path choice only when the platform assigned "both"', () => {
    expect(mayChoosePath('both', order({ currentStep: 'confirmed' }))).toBe(true)
    expect(mayChoosePath('partner', order({ currentStep: 'confirmed' }))).toBe(false)
    expect(mayChoosePath('own', order({ currentStep: 'confirmed' }))).toBe(false)
  })

  it('withdraws the path choice once the order has moved past confirmation', () => {
    expect(mayChoosePath('both', order({ currentStep: 'dispatched' }))).toBe(false)
  })

  it('knows when a partner order is waiting on the platform, not the company', () => {
    expect(isAwaitingPlatform(order({ deliveryType: 'partner', currentStep: 'handed_to_platform' }))).toBe(true)
    expect(isAwaitingPlatform(order({ deliveryType: 'own', currentStep: 'assigned' }))).toBe(false)
  })

  it('locates the current step within its own machine', () => {
    expect(currentIndex(order({ deliveryType: 'partner', currentStep: 'handed_to_platform' }))).toBe(3)
    expect(currentIndex(order({ currentStep: null }))).toBe(-1)
  })
})
