import type { Uuid, IsoDate, IsoDateTime, VerificationStatus } from './common'

export const CERTIFICATE_STATUSES = ['submitted', 'under_review', 'verified', 'rejected', 'expired', 'revoked'] as const
export type CertificateStatus = (typeof CERTIFICATE_STATUSES)[number]

export const CERTIFICATE_TYPES = [
  'trade_licence', 'product_registration', 'import_permit',
  'manufacturing_licence', 'quality_certificate', 'other',
] as const
export type CertificateType = (typeof CERTIFICATE_TYPES)[number]

export interface Certificate {
  id: Uuid
  subjectType: 'organisation' | 'listing'
  listingId: Uuid | null
  certificateType: CertificateType
  certificateNumber: string
  issuingAuthority: string
  issuedOn: IsoDate
  expiresOn: IsoDate | null
  status: CertificateStatus
  rejectionReason: string | null
  documentUrl: string | null
}

export interface VerificationEvent {
  id: Uuid
  fromStatus: CertificateStatus | null
  toStatus: CertificateStatus
  reason: string | null
  occurredAt: IsoDateTime
  decidedBy: string | null
}

export interface IdentityDocument {
  id: Uuid
  kind: 'nid' | 'tin' | 'passport'
  maskedNumber: string
  status: CertificateStatus
  uploadedAt: IsoDateTime
}

export interface VerificationDossier {
  organisationStatus: VerificationStatus
  submittedAt: IsoDateTime | null
  decidedAt: IsoDateTime | null
  rejectionReason: string | null
  certificates: Certificate[]
  identityDocuments: IdentityDocument[]
  timeline: VerificationEvent[]

  outstanding: string[]
}

export interface SubmitCertificateInput {
  subjectType: 'organisation' | 'listing'
  listingId?: Uuid | null
  certificateType: CertificateType
  certificateNumber: string
  issuingAuthority: string
  issuedOn: IsoDate
  expiresOn?: IsoDate | null
  fileName: string
}

export interface SubmitIdentityInput {
  kind: 'nid' | 'tin' | 'passport'
  number: string
  fileName: string
}
