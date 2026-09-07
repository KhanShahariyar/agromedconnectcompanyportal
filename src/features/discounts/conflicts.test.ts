import { describe, it, expect } from 'vitest'
import { detectConflicts } from './conflicts'
import type { Discount } from '@/data/contracts'

const win = (
  id: string, from: string, to: string | null, over: string[], extra: Partial<Discount> = {},
): Discount => ({
  id, code: id.toUpperCase(), name: id, basis: 'percentage', discountPercent: 10,
  discountAmount: null, maxDiscount: null, minOrder: null,
  scope: { kind: 'listing', listingIds: over },
  startsAt: from, endsAt: to, status: 'active',
  isStackable: false, stackPriority: 0, stackGroup: null,
  maxRedemptions: null, redemptionCount: 0, ...extra,
})

describe('detectConflicts', () => {
  it('finds no conflict for windows that do not overlap in time', () => {
    expect(detectConflicts(
      win('a', '2026-01-01', '2026-01-31', ['L1']),
      [win('b', '2026-02-01', '2026-02-28', ['L1'])],
    )).toEqual([])
  })

  it('finds no conflict for overlapping windows on different listings', () => {
    expect(detectConflicts(
      win('a', '2026-01-01', '2026-01-31', ['L1']),
      [win('b', '2026-01-15', '2026-02-15', ['L2'])],
    )).toEqual([])
  })

  it('reports an overlap and its exact interval', () => {
    const [c] = detectConflicts(
      win('a', '2026-01-01', '2026-01-31', ['L1']),
      [win('b', '2026-01-15', '2026-02-15', ['L1'])],
    )
    expect(c!.overlapFrom).toBe('2026-01-15')
    expect(c!.overlapTo).toBe('2026-01-31')
  })

  it('treats a null endsAt as open-ended', () => {
    const [c] = detectConflicts(
      win('a', '2026-01-01', null, ['L1']),
      [win('b', '2026-06-01', null, ['L1'])],
    )
    expect(c!.overlapTo).toBeNull()
  })

  it('resolves by priority when neither is stackable', () => {
    const [c] = detectConflicts(
      win('a', '2026-01-01', null, ['L1'], { stackPriority: 5 }),
      [win('b', '2026-01-01', null, ['L1'], { stackPriority: 9 })],
    )
    expect(c!.resolution).toBe('highest_priority_wins')
    expect(c!.winningDiscountId).toBe('b')
  })

  it('reports stacking, not conflict, when both stack in the same group', () => {
    const [c] = detectConflicts(
      win('a', '2026-01-01', null, ['L1'], { isStackable: true, stackGroup: 'g' }),
      [win('b', '2026-01-01', null, ['L1'], { isStackable: true, stackGroup: 'g' })],
    )
    expect(c!.resolution).toBe('stacked')
  })

  it('reports ambiguity when priorities tie and neither stacks — the case a human must settle', () => {
    const [c] = detectConflicts(
      win('a', '2026-01-01', null, ['L1'], { stackPriority: 3 }),
      [win('b', '2026-01-01', null, ['L1'], { stackPriority: 3 })],
    )
    expect(c!.resolution).toBe('ambiguous')
    expect(c!.winningDiscountId).toBeNull()
  })

  it('expands a category scope to its listings before comparing', () => {
    const draft = win('a', '2026-01-01', null, [], { scope: { kind: 'category', categoryId: 'cat-seed' } })
    const [c] = detectConflicts(draft, [win('b', '2026-01-01', null, ['L7'])], { 'cat-seed': ['L7', 'L8'] })
    expect(c!.listingId).toBe('L7')
  })

  it('ignores cancelled and expired discounts', () => {
    expect(detectConflicts(
      win('a', '2026-01-01', null, ['L1']),
      [win('b', '2026-01-01', null, ['L1'], { status: 'expired' }),
       win('c', '2026-01-01', null, ['L1'], { status: 'cancelled' })],
    )).toEqual([])
  })

  it('never reports a discount against itself', () => {
    const d = win('a', '2026-01-01', null, ['L1'])
    expect(detectConflicts(d, [d])).toEqual([])
  })
})
