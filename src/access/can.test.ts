import { describe, it, expect } from 'vitest'
import { can, ROLE_PERMISSIONS } from './can'

const verifiedOwner = {
  permissions: ROLE_PERMISSIONS.owner,
  verificationStatus: 'verified' as const,
  isBlacklisted: false,
}
const unverifiedOwner = { ...verifiedOwner, verificationStatus: 'pending' as const }
const manager = { ...verifiedOwner, permissions: ROLE_PERMISSIONS.manager }

describe('can()', () => {
  it('lets a verified owner publish', () => {
    expect(can('product.publish', verifiedOwner)).toEqual({ allowed: true })
  })

  it('blocks an unverified company from writing, citing verification not role (D4)', () => {
    expect(can('product.publish', unverifiedOwner)).toEqual({ allowed: false, reason: 'verification' })
  })

  it('still lets an unverified company READ — the portal is open, writes are not', () => {
    expect(can('report.read', unverifiedOwner)).toEqual({ allowed: true })
  })

  it('lets an unverified company submit certificates — otherwise it can never get verified', () => {
    expect(can('certificate.submit', unverifiedOwner)).toEqual({ allowed: true })
  })

  it('blocks a manager from payouts, citing role', () => {
    expect(can('payout.request', manager)).toEqual({ allowed: false, reason: 'role' })
  })

  it('blocks everything for a blacklisted organisation, and says so', () => {
    expect(can('product.create', { ...verifiedOwner, isBlacklisted: true }))
      .toEqual({ allowed: false, reason: 'blacklisted' })
  })

  it('gives delivery_man handover but never fulfilment', () => {
    const dm = { ...verifiedOwner, permissions: ROLE_PERMISSIONS.delivery_man }
    expect(can('order.handover', dm)).toEqual({ allowed: true })
    expect(can('order.fulfil', dm)).toEqual({ allowed: false, reason: 'role' })
  })

  it('reports blacklisting ahead of verification — the more severe block wins', () => {
    expect(can('product.publish', { ...unverifiedOwner, isBlacklisted: true }))
      .toEqual({ allowed: false, reason: 'blacklisted' })
  })

  it('honours a per-member deny override on top of the role', () => {
    expect(can('payout.request', { ...verifiedOwner, overrides: [{ permission: 'payout.request', effect: 'deny' }] }))
      .toEqual({ allowed: false, reason: 'role' })
  })

  it('honours a per-member grant override on top of the role', () => {
    expect(can('payout.request', { ...manager, overrides: [{ permission: 'payout.request', effect: 'grant' }] }))
      .toEqual({ allowed: true })
  })

  it('lets deny beat grant, because deny always wins', () => {
    expect(can('payout.request', {
      ...verifiedOwner,
      overrides: [{ permission: 'payout.request', effect: 'grant' }, { permission: 'payout.request', effect: 'deny' }],
    })).toEqual({ allowed: false, reason: 'role' })
  })
})

describe('ROLE_PERMISSIONS mirrors the database seed', () => {
  it('withholds catalogue management, the company account and payouts from an Employee', () => {
    const missing = ROLE_PERMISSIONS.owner.filter((p) => !ROLE_PERMISSIONS.manager.includes(p))
    expect(missing.sort()).toEqual([
      'catalog.publish', 'catalog.write', 'member.remove',
      'organisation.manage', 'payout.approve', 'payout.request',
    ].sort())
  })

  it('blocks an Employee from creating products or services, citing role', () => {
    expect(can('product.create', manager)).toEqual({ allowed: false, reason: 'role' })
    expect(can('service.create', manager)).toEqual({ allowed: false, reason: 'role' })
    expect(can('organisation.manage', manager)).toEqual({ allowed: false, reason: 'role' })
  })

  it('still lets an Employee run day-to-day operations', () => {
    expect(can('order.fulfil', manager)).toEqual({ allowed: true })
    expect(can('inventory.write', manager)).toEqual({ allowed: true })
    expect(can('review.respond', manager)).toEqual({ allowed: true })
  })

  it('keeps delivery_man to the two things a courier does', () => {
    expect([...ROLE_PERMISSIONS.delivery_man].sort()).toEqual(['order.handover', 'order.read'])
  })
})
