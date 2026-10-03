import { describe, it, expect } from 'vitest'
import { formatNumber, formatMoney, formatPercent, formatDate, makeTickFormatter } from './format'

const bdt = (amountMinor: number, display: string) =>
  ({ amountMinor, currency: 'BDT' as const, display })

describe('formatNumber', () => {
  it('renders Bengali numerals with Indian 2,2,3 grouping in bn-BD', () => {
    expect(formatNumber(1234567, 'bn-BD')).toBe('১২,৩৪,৫৬৭')
  })
  it('renders ASCII digits with thousands grouping in en-US', () => {
    expect(formatNumber(1234567, 'en-US')).toBe('1,234,567')
  })
})

describe('formatMoney', () => {
  it('prefers the server-rendered display string, which is authoritative', () => {
    expect(formatMoney(bdt(49500, '৳৪৯৫.০০'), 'bn-BD')).toBe('৳৪৯৫.০০')
  })
  it('falls back to client formatting only when display is absent', () => {
    expect(formatMoney({ amountMinor: 49500, currency: 'BDT', display: '' }, 'en-US')).toBe('৳495.00')
  })
  it('divides by the currency exponent rather than assuming a bare number', () => {
    expect(formatMoney({ amountMinor: 100, currency: 'BDT', display: '' }, 'en-US')).toBe('৳1.00')
  })
})

describe('formatPercent', () => {
  it('takes a fraction, not a percentage, and says so by example', () => {
    expect(formatPercent(0.125, 'en-US', 1)).toBe('12.5%')
  })
})

describe('formatDate', () => {
  it('renders Bengali month names and numerals', () => {
    expect(formatDate('2026-09-06', 'bn-BD', 'medium')).toContain('২০২৬')
  })
})

describe('makeTickFormatter', () => {
  it('compacts large axis values so ticks do not collide', () => {
    expect(makeTickFormatter('en-US')(1500000)).toBe('1.5M')
  })
  it('compacts in Bengali numerals too — the reason this exists', () => {
    expect(makeTickFormatter('bn-BD')(1500)).toMatch(/[০-৯]/)
  })
})
