import type { PortalRole, VerificationStatus } from '@/data/contracts'

/**
 * The single answer to "may this user do this?".
 *
 * D4 puts the portal in an unusual state: an unverified company sees every
 * screen but may not write. That rule could easily have become a `disabled`
 * prop scattered across 27 screens, each subtly different. Instead it lives
 * here, and screens ask.
 */

export type Action =
  | 'product.create' | 'product.publish' | 'product.delete'
  | 'service.create'
  | 'inventory.write'
  | 'order.fulfil' | 'order.handover' | 'order.assign'
  | 'discount.manage'
  | 'member.invite' | 'member.remove'
  | 'payout.request' | 'payout.approve'
  | 'certificate.submit'
  | 'organisation.manage'
  | 'review.respond'
  | 'report.read'
  | 'feedback.submit'
  | 'catalog.read' | 'order.read' | 'member.read' | 'certificate.read'

/** Action -> the database permission code it requires. */
const REQUIRES: Record<Action, string> = {
  'product.create': 'catalog.write',
  'product.publish': 'catalog.publish',
  'product.delete': 'catalog.write',
  'service.create': 'catalog.write',
  'inventory.write': 'inventory.write',
  'order.fulfil': 'order.fulfil',
  'order.handover': 'order.handover',
  'order.assign': 'order.fulfil',
  'discount.manage': 'offer.manage',
  'member.invite': 'member.invite',
  'member.remove': 'member.remove',
  'payout.request': 'payout.request',
  'payout.approve': 'payout.approve',
  'certificate.submit': 'certificate.submit',
  'organisation.manage': 'organisation.manage',
  'review.respond': 'review.respond',
  'report.read': 'report.read',
  'feedback.submit': 'report.read',
  'catalog.read': 'catalog.read',
  'order.read': 'order.read',
  'member.read': 'member.read',
  'certificate.read': 'certificate.read',
}

/**
 * Actions the verification gate applies to. Reads are absent by design, and so
 * is `certificate.submit` — gating it would trap a company in a loop where it
 * cannot get verified because it is not verified.
 */
const WRITE_ACTIONS = new Set<Action>([
  'product.create', 'product.publish', 'product.delete', 'service.create',
  'inventory.write', 'order.fulfil', 'order.handover', 'order.assign',
  'discount.manage', 'member.invite', 'member.remove',
  'payout.request', 'payout.approve', 'organisation.manage', 'review.respond',
])

/** Mirrors seed/001_reference_seed.sql, with delivery_man added (gap G3). */
export const ROLE_PERMISSIONS: Record<PortalRole, string[]> = {
  owner: [
    'catalog.read', 'catalog.write', 'catalog.publish',
    'inventory.read', 'inventory.write',
    'order.read', 'order.fulfil', 'order.cancel',
    'offer.manage', 'pricing.read', 'pricing.write',
    'certificate.read', 'certificate.submit',
    'member.read', 'member.invite', 'member.remove',
    'organisation.manage',
    'payout.read', 'payout.request', 'payout.approve', 'settlement.read',
    'review.respond', 'report.read',
  ],
  // Employee runs day-to-day operations: orders, stock, reviews, reports.
  // Deliberately NOT catalogue management (catalog.write / catalog.publish) and
  // NOT the company account itself — those belong to an Admin.
  manager: [
    'catalog.read',
    'inventory.read', 'inventory.write',
    'order.read', 'order.fulfil', 'order.cancel',
    'offer.manage', 'pricing.read', 'pricing.write',
    'certificate.read', 'certificate.submit',
    'member.read', 'member.invite',
    'payout.read', 'settlement.read',
    'review.respond', 'report.read',
  ],
  delivery_man: ['order.read', 'order.handover'],
}

export interface AccessContext {
  permissions: readonly string[]
  verificationStatus: VerificationStatus
  isBlacklisted: boolean
  /** iam.membership_permission — per-member overrides on top of the role. */
  overrides?: readonly { permission: string; effect: 'grant' | 'deny' }[]
}

export type Denial =
  | { allowed: true }
  | { allowed: false; reason: 'role' | 'verification' | 'blacklisted' }

const ALLOWED: Denial = { allowed: true }

export function can(action: Action, ctx: AccessContext): Denial {
  // Ordered most-severe first: a suspended account is not merely unverified,
  // and telling it "verification in progress" would be misleading.
  if (ctx.isBlacklisted) return { allowed: false, reason: 'blacklisted' }

  const required = REQUIRES[action]
  const overrides = ctx.overrides ?? []
  // Deny always beats grant — a targeted revocation must not be undone by a
  // stale grant sitting alongside it.
  const denied = overrides.some((o) => o.permission === required && o.effect === 'deny')
  const granted = overrides.some((o) => o.permission === required && o.effect === 'grant')

  const hasPermission = !denied && (granted || ctx.permissions.includes(required))
  if (!hasPermission) return { allowed: false, reason: 'role' }

  if (WRITE_ACTIONS.has(action) && ctx.verificationStatus !== 'verified') {
    return { allowed: false, reason: 'verification' }
  }

  return ALLOWED
}
