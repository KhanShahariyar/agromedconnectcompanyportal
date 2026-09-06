import type { Uuid, IsoDateTime, VerificationStatus, DeliveryMode } from './common'

/**
 * The three portal roles map onto seeded database roles: Admin -> `owner`,
 * Employee -> `manager`, Delivery Man -> `delivery_man` (new, gap G3).
 */
export const PORTAL_ROLES = ['owner', 'manager', 'delivery_man'] as const
export type PortalRole = (typeof PORTAL_ROLES)[number]

export const ORG_KINDS = ['manufacturer', 'importer_supplier'] as const
export type OrgKind = (typeof ORG_KINDS)[number]

export interface Organisation {
  id: Uuid
  slug: string
  legalName: string
  kind: OrgKind
  tradeLicenceNo: string | null
  binNumber: string | null
  tinNumber: string | null
  verificationStatus: VerificationStatus
  verifiedAt: IsoDateTime | null
  /** C14 — read-only to the company. Rendered as text, never as a control. */
  deliveryMode: DeliveryMode
  deliveryModeAssignedAt: IsoDateTime | null
  isBlacklisted: boolean
  status: 'active' | 'suspended' | 'closed'
  contactPhone: string | null
  contactEmail: string | null
  addressLine: string | null
}

export interface AppUser {
  id: Uuid
  fullName: string
  phoneE164: string | null
  email: string | null
  preferredLocale: 'bn-BD' | 'en-US'
  status: 'active' | 'suspended' | 'closed'
  lastLoginAt: IsoDateTime | null
}

export interface Member {
  membershipId: Uuid
  user: AppUser
  role: PortalRole
  status: 'active' | 'suspended' | 'removed'
  joinedAt: IsoDateTime
  /** iam.membership_permission — per-member overrides on top of the role. */
  overrides: { permission: string; effect: 'grant' | 'deny' }[]
}

export interface Session {
  accessToken: string
  refreshToken: string
  expiresAt: IsoDateTime
  user: AppUser
  organisation: Organisation
  role: PortalRole
  permissions: string[]
}

export interface RegisterCompanyInput {
  legalName: string
  kind: OrgKind
  contactEmail: string
  contactPhone: string
  adminFullName: string
  password: string
}
