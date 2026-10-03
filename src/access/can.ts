import type { PortalRole, VerificationStatus } from '@/data/contracts'

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

const WRITE_ACTIONS = new Set<Action>([
  'product.create', 'product.publish', 'product.delete', 'service.create',
  'inventory.write', 'order.fulfil', 'order.handover', 'order.assign',
  'discount.manage', 'member.invite', 'member.remove',
  'payout.request', 'payout.approve', 'organisation.manage', 'review.respond',
])

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

  overrides?: readonly { permission: string; effect: 'grant' | 'deny' }[]
}

export type Denial =
  | { allowed: true }
  | { allowed: false; reason: 'role' | 'verification' | 'blacklisted' }

const ALLOWED: Denial = { allowed: true }

export function can(action: Action, ctx: AccessContext): Denial {

  if (ctx.isBlacklisted) return { allowed: false, reason: 'blacklisted' }

  const required = REQUIRES[action]
  const overrides = ctx.overrides ?? []

  const denied = overrides.some((o) => o.permission === required && o.effect === 'deny')
  const granted = overrides.some((o) => o.permission === required && o.effect === 'grant')

  const hasPermission = !denied && (granted || ctx.permissions.includes(required))
  if (!hasPermission) return { allowed: false, reason: 'role' }

  if (WRITE_ACTIONS.has(action) && ctx.verificationStatus !== 'verified') {
    return { allowed: false, reason: 'verification' }
  }

  return ALLOWED
}
