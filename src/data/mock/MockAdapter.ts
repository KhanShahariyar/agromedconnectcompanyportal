import type { DataAdapter } from '../DataAdapter'
import { problem } from '../DataAdapter'
import type {
  AdvancePayload, AppNotification, Certificate, DeliveryAssignment, Discount, DiscountConflict,
  FeedbackInput, FulfilmentStep, HandoverInput, IdentityDocument, Listing, ListingStatus,
  MarginBreakdown, MarketIntelligence, Member, OfferStatus, OrderDetail, OrderStatus,
  OrderSummary, Organisation, Page, PageQuery, Payout, PerformanceReport, PortalRole,
  PublishBlocker, PublishReadiness, RegisterCompanyInput, Review, SaveDiscountInput,
  SaveListingInput, ServiceAvailability, Session, Solution, StockRow, SubmitCertificateInput,
  SubmitIdentityInput, Uuid, VerificationDossier,
} from '../contracts'
import { ORDER_STATUS_FLOW } from '../contracts'
import { detectConflicts } from '@/features/discounts/conflicts'
import * as fx from './fixtures'
import { bdt, SEED } from './fixtures'

export interface MockOptions {
  latencyMs?: number
  /** Lets a reviewer exercise error states without editing code. */
  failureRate?: number
}

function paginate<T>(rows: T[], q: PageQuery): Page<T> {
  const page = q.page ?? 1
  const pageSize = q.pageSize ?? 20
  const start = (page - 1) * pageSize
  return { items: rows.slice(start, start + pageSize), page, pageSize, total: rows.length }
}

/**
 * An in-memory backend, not a stub. It mutates its own fixtures, so a review
 * session behaves like the real thing: publishing a listing changes its status
 * for later reads, and advancing an order appends real history.
 */
export class MockAdapter implements DataAdapter {
  readonly seed = SEED
  private readonly latency: number
  private readonly failureRate: number

  private organisation = fx.buildOrganisation()
  private listings = fx.buildListings()
  private certificates = fx.buildCertificates()
  private identityDocs = fx.buildIdentityDocuments()
  private orders = fx.buildOrders(this.listings)
  private stock = fx.buildStock(this.listings)
  private members = fx.buildMembers()
  private discounts = fx.buildDiscounts()
  private assignments = fx.buildAssignments(this.listings)
  private reviews = fx.buildReviews()
  private payouts = fx.buildPayouts()
  private notifications = fx.buildNotifications()
  private solutions = fx.buildSolutions()
  private dossierSubmittedAt: string | null = new Date(Date.now() - 120 * 864e5).toISOString()

  constructor(opts: MockOptions = {}) {
    this.latency = opts.latencyMs ?? 220
    this.failureRate = opts.failureRate ?? 0
  }

  private async settle<T>(value: T): Promise<T> {
    if (this.latency) await new Promise((r) => setTimeout(r, this.latency))
    if (this.failureRate && Math.random() < this.failureRate) {
      throw problem('mock_injected_failure', 'Injected failure for state review', 503)
    }
    return value
  }

  private search<T>(rows: T[], q: PageQuery, fields: (r: T) => string[]): T[] {
    if (!q.search?.trim()) return rows
    const needle = q.search.trim().toLowerCase()
    return rows.filter((r) => fields(r).some((f) => f.toLowerCase().includes(needle)))
  }

  // ---------------------------------------------------------------- auth
  private session(role: PortalRole = 'owner'): Session {
    const member = this.members.find((m) => m.role === role) ?? this.members[0]!
    return {
      accessToken: `mock.${role}.token`,
      refreshToken: 'mock.refresh',
      expiresAt: new Date(Date.now() + 36e5).toISOString(),
      user: member.user,
      organisation: this.organisation,
      role: member.role,
      permissions: [],
    }
  }

  login(identifier: string, password: string) {
    if (!identifier || !password) {
      return Promise.reject(problem('invalid_credentials', 'Sign-in failed', 401, 'Enter your phone or email and password.'))
    }
    const role: PortalRole = identifier.includes('delivery') ? 'delivery_man'
      : identifier.includes('employee') ? 'manager' : 'owner'
    return this.settle(this.session(role))
  }

  register(_input: RegisterCompanyInput) {
    this.organisation = { ...this.organisation, verificationStatus: 'unverified', verifiedAt: null }
    this.dossierSubmittedAt = null
    return this.settle(this.session('owner'))
  }

  forgotPassword(_identifier: string) { return this.settle(undefined as void) }
  resetPassword(_token: string, _password: string) { return this.settle(undefined as void) }
  acceptInvitation(_token: string, _password: string) { return this.settle(this.session('manager')) }
  logout() { return this.settle(undefined as void) }

  // -------------------------------------------------- organisation & verification
  getOrganisation() { return this.settle(this.organisation) }

  updateOrganisation(patch: Partial<Organisation>) {
    // C14 — the company can never assign its own delivery mode. Rejecting here
    // rather than ignoring the field means a UI regression fails loudly.
    if ('deliveryMode' in patch) {
      return Promise.reject(problem(
        'delivery_mode_not_self_assignable',
        'Delivery mode is assigned by the platform',
        403,
        'Contact support to change how your orders are delivered.',
      ))
    }
    this.organisation = { ...this.organisation, ...patch }
    return this.settle(this.organisation)
  }

  getVerificationDossier(): Promise<VerificationDossier> {
    const orgCerts = this.certificates.filter((c) => c.subjectType === 'organisation')
    const outstanding: string[] = []
    if (!this.organisation.tradeLicenceNo) outstanding.push('trade_licence')
    if (!this.organisation.binNumber) outstanding.push('bin')
    if (!this.identityDocs.some((d) => d.kind === 'tin')) outstanding.push('tin')
    if (!this.identityDocs.some((d) => d.kind === 'nid')) outstanding.push('nid')
    return this.settle({
      organisationStatus: this.organisation.verificationStatus,
      submittedAt: this.dossierSubmittedAt,
      decidedAt: this.organisation.verifiedAt,
      rejectionReason: null,
      certificates: [...orgCerts, ...this.certificates.filter((c) => c.subjectType === 'listing')],
      identityDocuments: this.identityDocs,
      timeline: [
        { id: 've-1', fromStatus: null, toStatus: 'submitted', reason: null, occurredAt: this.dossierSubmittedAt ?? new Date().toISOString(), decidedBy: 'Nasrin Akter' },
        { id: 've-2', fromStatus: 'submitted', toStatus: 'under_review', reason: null, occurredAt: this.dossierSubmittedAt ?? new Date().toISOString(), decidedBy: 'Platform ops' },
        ...(this.organisation.verificationStatus === 'verified'
          ? [{ id: 've-3', fromStatus: 'under_review' as const, toStatus: 'verified' as const, reason: null, occurredAt: this.organisation.verifiedAt!, decidedBy: 'Platform ops' }]
          : []),
      ],
      outstanding,
    })
  }

  submitCertificate(input: SubmitCertificateInput): Promise<Certificate> {
    const cert: Certificate = {
      id: `crt-${Date.now()}`,
      subjectType: input.subjectType,
      listingId: input.listingId ?? null,
      certificateType: input.certificateType,
      certificateNumber: input.certificateNumber,
      issuingAuthority: input.issuingAuthority,
      issuedOn: input.issuedOn,
      expiresOn: input.expiresOn ?? null,
      status: 'submitted',
      rejectionReason: null,
      documentUrl: null,
    }
    this.certificates = [...this.certificates, cert]
    return this.settle(cert)
  }

  submitIdentityDocument(input: SubmitIdentityInput): Promise<IdentityDocument> {
    // G1 — only a mask ever reaches the browser. The full number is dropped here
    // exactly as the server will drop it from its response.
    const doc: IdentityDocument = {
      id: `idd-${Date.now()}`,
      kind: input.kind,
      maskedNumber: '••••' + input.number.slice(-4),
      status: 'submitted',
      uploadedAt: new Date().toISOString(),
    }
    this.identityDocs = [...this.identityDocs.filter((d) => d.kind !== input.kind), doc]
    return this.settle(doc)
  }

  async submitDossierForReview() {
    this.dossierSubmittedAt = new Date().toISOString()
    this.organisation = { ...this.organisation, verificationStatus: 'pending' }
    return this.getVerificationDossier()
  }

  // ------------------------------------------------------------ catalogue
  listListings(q: PageQuery & { kind?: 'product' | 'service'; status?: ListingStatus }) {
    let rows = this.listings
    if (q.kind) rows = rows.filter((l) => l.kind === q.kind)
    if (q.status) rows = rows.filter((l) => l.status === q.status)
    rows = this.search(rows, q, (l) => [l.name, l.sku, l.brand ?? ''])
    return this.settle(paginate(rows, q))
  }

  getListing(id: Uuid) {
    const l = this.listings.find((x) => x.id === id)
    return l ? this.settle(l) : Promise.reject(problem('listing_not_found', 'Listing not found', 404))
  }

  saveListing(input: SaveListingInput): Promise<Listing> {
    const existing = input.id ? this.listings.find((l) => l.id === input.id) : undefined
    const next: Listing = existing
      ? { ...existing, name: input.name, sku: input.sku, brand: input.brand ?? null, price: bdt(input.priceMinor) }
      : {
          ...this.listings[0]!,
          id: `lst-${Date.now()}`, kind: input.kind, sku: input.sku, slug: input.sku.toLowerCase(),
          name: input.name, brand: input.brand ?? null, categoryId: input.categoryId,
          categoryName: 'Uncategorised', status: 'draft', publishedAt: null,
          price: bdt(input.priceMinor), media: [], attachedCertificateIds: [],
          requiredCertificateTypes: input.isRestricted ? ['product_registration'] : [],
          isRestricted: Boolean(input.isRestricted),
        }
    this.listings = existing
      ? this.listings.map((l) => (l.id === next.id ? next : l))
      : [...this.listings, next]
    return this.settle(next)
  }

  getPublishReadiness(id: Uuid): Promise<PublishReadiness> {
    const l = this.listings.find((x) => x.id === id)
    if (!l) return Promise.reject(problem('listing_not_found', 'Listing not found', 404))
    const blockers: PublishBlocker[] = []

    if (this.organisation.verificationStatus !== 'verified') blockers.push('organisation_unverified')

    for (const required of l.requiredCertificateTypes) {
      const cert = this.certificates.find((c) => c.listingId === l.id && c.certificateType === required)
      if (!cert) blockers.push('missing_certificate')
      else if (cert.status === 'expired') blockers.push('certificate_expired')
      else if (cert.status !== 'verified') blockers.push('certificate_not_verified')
    }

    const primary = l.media.find((m) => m.isPrimary)
    if (!primary) blockers.push('no_primary_image')
    else if (primary.reviewStatus === 'flagged') blockers.push('image_flagged')

    if (l.price.amountMinor <= 0) blockers.push('no_price')
    if (l.kind === 'product' && (this.stock.find((s) => s.listingId === l.id)?.onHand ?? 0) <= 0) {
      blockers.push('no_stock')
    }

    return this.settle({ canPublish: blockers.length === 0, blockers })
  }

  async publishListing(id: Uuid): Promise<Listing> {
    const readiness = await this.getPublishReadiness(id)
    if (!readiness.canPublish) {
      throw problem('listing_not_publishable', 'This listing cannot go live yet', 409,
        `Outstanding: ${readiness.blockers.join(', ')}`)
    }
    const next = { ...this.listings.find((l) => l.id === id)!, status: 'active' as const, publishedAt: new Date().toISOString() }
    this.listings = this.listings.map((l) => (l.id === id ? next : l))
    return next
  }

  deleteListing(id: Uuid) {
    // Soft delete — order history must keep resolving its snapshots.
    this.listings = this.listings.map((l) => (l.id === id ? { ...l, status: 'withdrawn' as const } : l))
    return this.settle(undefined as void)
  }

  getServiceAvailability(_id: Uuid): Promise<ServiceAvailability[]> {
    return this.settle([
      { dayOfWeek: 0, startTime: '09:00', endTime: '17:00', slotCapacity: 4 },
      { dayOfWeek: 1, startTime: '09:00', endTime: '17:00', slotCapacity: 4 },
      { dayOfWeek: 2, startTime: '09:00', endTime: '13:00', slotCapacity: 2 },
    ])
  }

  saveServiceAvailability(_id: Uuid, slots: ServiceAvailability[]) { return this.settle(slots) }

  // ------------------------------------------------------------ inventory
  listStock(q: PageQuery) {
    const rows = this.search(this.stock, q, (s) => [s.name, s.sku])
      .slice()
      .sort((a, b) => (a.onHand - a.reorderPoint) - (b.onHand - b.reorderPoint))
    return this.settle(paginate(rows, q))
  }

  adjustStock(listingId: Uuid, delta: number, reason: string) {
    if (!reason.trim()) return Promise.reject(problem('reason_required', 'A reason is required', 422))
    const next = this.stock.map((s) => (s.listingId === listingId ? { ...s, onHand: Math.max(0, s.onHand + delta) } : s))
    this.stock = next
    return this.settle(next.find((s) => s.listingId === listingId)!)
  }

  // --------------------------------------------------------------- orders
  private decorate(o: OrderDetail): OrderDetail {
    const mode = this.organisation.deliveryMode
    const path = o.deliveryType === 'pickup' ? 'own' : o.deliveryType
    const flow = ORDER_STATUS_FLOW[path]
    const idx = o.currentStep ? flow.indexOf(o.currentStep) : -1
    const next = idx >= 0 && idx < flow.length - 1 ? flow[idx + 1]! : null

    // The final step of the partner path belongs to the platform, not the
    // company — so it is never offered here.
    const companyMayAdvance = next !== null && !(path === 'partner' && next === 'delivered')
    // C14 — a path the assigned mode forbids yields no transitions at all.
    const modeAllows = mode === 'both' || mode === path
    return { ...o, availableTransitions: companyMayAdvance && modeAllows ? [next] : [] }
  }

  listOrders(q: PageQuery & { status?: OrderStatus }) {
    let rows: OrderSummary[] = this.orders
    if (q.status) rows = rows.filter((o) => o.status === q.status)
    rows = this.search(rows, q, (o) => [o.orderNumber, o.buyerName])
    return this.settle(paginate(rows, q))
  }

  getOrder(id: Uuid) {
    const o = this.orders.find((x) => x.id === id)
    return o ? this.settle(this.decorate(o)) : Promise.reject(problem('order_not_found', 'Order not found', 404))
  }

  advanceOrder(id: Uuid, to: FulfilmentStep, payload?: AdvancePayload) {
    const o = this.orders.find((x) => x.id === id)
    if (!o) return Promise.reject(problem('order_not_found', 'Order not found', 404))
    const decorated = this.decorate(o)
    if (!decorated.availableTransitions.includes(to)) {
      return Promise.reject(problem('transition_not_permitted', 'That step is not available', 409,
        `Order is at "${o.currentStep}".`))
    }
    const statusFor: Partial<Record<FulfilmentStep, OrderStatus>> = {
      processing: 'processing', dispatched: 'shipped', delivered: 'delivered',
    }
    const next: OrderDetail = {
      ...o,
      currentStep: to,
      status: statusFor[to] ?? o.status,
      history: [...o.history, {
        id: `${id}-h${o.history.length + 1}`,
        fromStatus: o.currentStep,
        toStatus: to,
        reason: payload?.reason ?? null,
        changedBy: 'Nasrin Akter',
        occurredAt: new Date().toISOString(),
      }],
    }
    this.orders = this.orders.map((x) => (x.id === id ? next : x))
    return this.settle(this.decorate(next))
  }

  assignDeliveryPerson(orderId: Uuid, userId: Uuid) {
    const o = this.orders.find((x) => x.id === orderId)
    if (!o) return Promise.reject(problem('order_not_found', 'Order not found', 404))
    if (o.deliveryType !== 'own') {
      return Promise.reject(problem('not_own_delivery', 'This order is delivered by the platform', 409))
    }
    const member = this.members.find((m) => m.user.id === userId)
    const next: OrderDetail = {
      ...o,
      currentStep: 'assigned',
      shipment: {
        id: `shp-${orderId}`, status: 'dispatched', deliveryType: 'own', trackingReference: null,
        assignedToUserId: userId, assignedToName: member?.user.fullName ?? null,
        assignedAt: new Date().toISOString(), dispatchedAt: new Date().toISOString(),
        deliveredAt: null, handedToPlatformAt: null,
      },
      history: [...o.history, {
        id: `${orderId}-h${o.history.length + 1}`, fromStatus: o.currentStep, toStatus: 'assigned',
        reason: null, changedBy: 'Nasrin Akter', occurredAt: new Date().toISOString(),
      }],
    }
    this.orders = this.orders.map((x) => (x.id === orderId ? next : x))
    return this.settle(this.decorate(next))
  }

  // ------------------------------------------------------------ discounts
  listDiscounts(q: PageQuery & { status?: OfferStatus }) {
    let rows = this.discounts
    if (q.status) rows = rows.filter((d) => d.status === q.status)
    rows = this.search(rows, q, (d) => [d.name, d.code])
    return this.settle(paginate(rows, q))
  }

  saveDiscount(input: SaveDiscountInput): Promise<Discount> {
    const existing = input.id ? this.discounts.find((d) => d.id === input.id) : undefined
    const next: Discount = {
      id: existing?.id ?? `off-${Date.now()}`,
      code: input.code,
      name: input.name,
      basis: input.basis,
      discountPercent: input.discountPercent ?? null,
      discountAmount: input.discountAmountMinor != null ? bdt(input.discountAmountMinor) : null,
      maxDiscount: input.maxDiscountMinor != null ? bdt(input.maxDiscountMinor) : null,
      minOrder: input.minOrderMinor != null ? bdt(input.minOrderMinor) : null,
      scope: input.scope,
      startsAt: input.startsAt,
      endsAt: input.endsAt ?? null,
      status: existing?.status ?? 'draft',
      isStackable: input.isStackable,
      stackPriority: input.stackPriority,
      stackGroup: input.stackGroup ?? null,
      maxRedemptions: input.maxRedemptions ?? null,
      redemptionCount: existing?.redemptionCount ?? 0,
    }
    this.discounts = existing
      ? this.discounts.map((d) => (d.id === next.id ? next : d))
      : [...this.discounts, next]
    return this.settle(next)
  }

  setDiscountStatus(id: Uuid, status: OfferStatus) {
    const next = this.discounts.map((d) => (d.id === id ? { ...d, status } : d))
    this.discounts = next
    return this.settle(next.find((d) => d.id === id)!)
  }

  detectDiscountConflicts(draft: SaveDiscountInput): Promise<DiscountConflict[]> {
    const asDiscount: Discount = {
      id: draft.id ?? 'draft', code: draft.code, name: draft.name, basis: draft.basis,
      discountPercent: draft.discountPercent ?? null,
      discountAmount: draft.discountAmountMinor != null ? bdt(draft.discountAmountMinor) : null,
      maxDiscount: null, minOrder: null, scope: draft.scope, startsAt: draft.startsAt,
      endsAt: draft.endsAt ?? null, status: 'draft', isStackable: draft.isStackable,
      stackPriority: draft.stackPriority, stackGroup: draft.stackGroup ?? null,
      maxRedemptions: null, redemptionCount: 0,
    }
    const others = this.discounts.filter((d) => d.id !== asDiscount.id)
    return this.settle(detectConflicts(asDiscount, others, this.categoryMembers()))
  }

  private categoryMembers(): Record<string, string[]> {
    const map: Record<string, string[]> = {}
    for (const l of this.listings) (map[l.categoryId] ??= []).push(l.id)
    return map
  }

  getMarginBreakdown(listingId: Uuid, discountId: Uuid | null): Promise<MarginBreakdown> {
    const l = this.listings.find((x) => x.id === listingId)
    if (!l) return Promise.reject(problem('listing_not_found', 'Listing not found', 404))
    const list = l.price.amountMinor
    const d = discountId ? this.discounts.find((x) => x.id === discountId) : null
    const discount = !d ? 0
      : d.basis === 'percentage' ? Math.round((list * (d.discountPercent ?? 0)) / 100)
      : d.discountAmount?.amountMinor ?? 0
    const afterDiscount = list - discount
    const commission = Math.round(afterDiscount * 0.1)
    const net = afterDiscount - commission
    return this.settle({
      listPrice: bdt(list), discount: bdt(discount), commission: bdt(commission),
      net: bdt(net), netMarginFraction: list ? net / list : 0,
    })
  }

  // -------------------------------------------------- market intelligence
  getMarketIntelligence(window: '3m' | '6m' | '12m'): Promise<MarketIntelligence> {
    const months = window === '3m' ? 3 : window === '6m' ? 6 : 12
    // Everything on this marketplace is an agricultural medicine, so the useful
    // cut is medicine type, not "category" — which would be a single constant.
    const categories = ['Insecticide', 'Fungicide', 'Herbicide', 'Bio-pesticide', 'Veterinary']
    const demandTrend: MarketIntelligence['demandTrend'] = []
    for (let m = months - 1; m >= 0; m--) {
      const date = new Date()
      date.setMonth(date.getMonth() - m)
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
      const raw = categories.map((c, i) => 40 + ((m * 7 + i * 23) % 60) + (c === 'Insecticide' ? 30 : 0))
      const total = raw.reduce((a, b) => a + b, 0)
      categories.forEach((c, i) =>
        demandTrend.push({ month: key, categoryName: c, orderCount: raw[i]!, shareOfMarket: raw[i]! / total }))
    }

    const priceBenchmarks = categories.map((c, i) => {
      const mid = 60000 + i * 42000
      const mine = i === 4 ? null : bdt(mid + (i % 2 ? 9000 : -7000))
      return {
        categoryName: c,
        marketMin: bdt(Math.round(mid * 0.62)),
        marketMedian: bdt(mid),
        marketMax: bdt(Math.round(mid * 1.7)),
        myMedian: mine,
        myPosition: (mine === null ? 'absent' : i % 2 ? 'above' : 'below') as 'above' | 'below' | 'absent',
        sampleSize: 14 + i * 6,
      }
    })

    const districts: [string, number, number][] = [
      ['Dhaka', 23.8103, 90.4125], ['Bogura', 24.8465, 89.3773], ['Rajshahi', 24.3745, 88.6042],
      ['Khulna', 22.8456, 89.5403], ['Comilla', 23.4607, 91.1809], ['Faridpur', 23.6070, 89.8429],
      ['Rangpur', 25.7439, 89.2752], ['Meherpur', 23.7622, 88.6318],
    ]
    const regionalDemand = districts.map(([districtName, lat, lng], i) => {
      const competitorCount = [11, 7, 6, 5, 4, 3, 4, 2][i]!
      return {
        geographyId: `geo-${districtName.toLowerCase()}`,
        districtName, lat, lng,
        orderCount: [412, 268, 233, 197, 164, 121, 143, 38][i]!,
        competitorCount,
        // R4 — below the k-anonymity floor an aggregate stops being anonymous.
        isDisclosable: competitorCount >= 3,
      }
    })

    const pricePositions = this.listings.slice(0, 12).flatMap((l, i) => ([
      { listingId: l.id, listingName: l.name, categoryName: l.categoryName, unitPriceMinor: l.price.amountMinor, unitsSold: 30 + ((i * 17) % 140), isMine: true },
      { listingId: null, listingName: null, categoryName: l.categoryName, unitPriceMinor: Math.round(l.price.amountMinor * (0.8 + ((i * 13) % 45) / 100)), unitsSold: 20 + ((i * 29) % 190), isMine: false },
    ]))

    return this.settle({
      generatedAt: new Date(Date.now() - 42 * 6e4).toISOString(),
      window, demandTrend, priceBenchmarks, regionalDemand, pricePositions,
    })
  }

  // ----------------------------------------------------------------- team
  listMembers(q: PageQuery) {
    const rows = this.search(this.members, q, (m) => [m.user.fullName, m.user.phoneE164 ?? ''])
    return this.settle(paginate(rows, q))
  }

  inviteMember(_email: string, _role: PortalRole) { return this.settle(undefined as void) }

  setMemberRole(membershipId: Uuid, role: PortalRole) {
    const admins = this.members.filter((m) => m.role === 'owner' && m.status === 'active')
    const target = this.members.find((m) => m.membershipId === membershipId)
    if (target?.role === 'owner' && role !== 'owner' && admins.length === 1) {
      return Promise.reject(problem('last_admin', 'An account must keep at least one Admin', 409))
    }
    this.members = this.members.map((m) => (m.membershipId === membershipId ? { ...m, role } : m))
    return this.settle(this.members.find((m) => m.membershipId === membershipId)!)
  }

  setMemberOverride(membershipId: Uuid, permission: string, effect: 'grant' | 'deny' | 'clear') {
    this.members = this.members.map((m) => {
      if (m.membershipId !== membershipId) return m
      const rest = m.overrides.filter((o) => o.permission !== permission)
      return { ...m, overrides: effect === 'clear' ? rest : [...rest, { permission, effect }] }
    })
    return this.settle(this.members.find((m) => m.membershipId === membershipId)!)
  }

  removeMember(membershipId: Uuid) {
    const admins = this.members.filter((m) => m.role === 'owner' && m.status === 'active')
    const target = this.members.find((m) => m.membershipId === membershipId)
    if (target?.role === 'owner' && admins.length === 1) {
      return Promise.reject(problem('last_admin', 'An account must keep at least one Admin', 409,
        'Promote another member to Admin first.'))
    }
    this.members = this.members.filter((m) => m.membershipId !== membershipId)
    return this.settle(undefined as void)
  }

  // ------------------------------------- reports, reviews, payments, misc
  getPerformanceReport(window: '3m' | '6m' | '12m'): Promise<PerformanceReport> {
    const months = window === '3m' ? 3 : window === '6m' ? 6 : 12
    const categories = ['Insecticide', 'Fungicide', 'Herbicide', 'Bio-pesticide', 'Veterinary']
    const revenueByCategory: PerformanceReport['revenueByCategory'] = []
    for (let m = months - 1; m >= 0; m--) {
      const date = new Date(); date.setMonth(date.getMonth() - m)
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
      categories.forEach((c, i) =>
        revenueByCategory.push({ categoryName: c, month: key, revenueMinor: 400000 + ((m * 31 + i * 97) % 55) * 21000 }))
    }
    const repeatCohorts: PerformanceReport['repeatCohorts'] = []
    for (let c = 0; c < 6; c++) {
      const date = new Date(); date.setMonth(date.getMonth() - (5 - c))
      const cohortMonth = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
      for (let s = 0; s <= 5 - c; s++) {
        repeatCohorts.push({ cohortMonth, monthsSince: s, repeatRate: Math.max(0, 0.62 - s * 0.09 + (c % 3) * 0.03), buyers: 40 - c * 4 })
      }
    }
    return this.settle({
      window, revenueByCategory, repeatCohorts,
      deliveryMix: [
        { deliveryType: 'own', orderCount: 214 },
        { deliveryType: 'partner', orderCount: 331 },
        { deliveryType: 'pickup', orderCount: 27 },
      ],
      totals: { revenue: bdt(18420000), orders: 572, averageFulfilmentDays: 2.4, slaTargetDays: 3 },
    })
  }

  listReviews(q: PageQuery) {
    const rows = this.search(this.reviews, q, (r) => [r.listingName, r.buyerName, r.body])
    return this.settle(paginate(rows, q))
  }

  respondToReview(id: Uuid, body: string) {
    const target = this.reviews.find((r) => r.id === id)
    if (!target) return Promise.reject(problem('review_not_found', 'Review not found', 404))
    if (target.response) return Promise.reject(problem('already_responded', 'You have already responded', 409))
    const next: Review = { ...target, response: { body, respondedAt: new Date().toISOString() } }
    this.reviews = this.reviews.map((r) => (r.id === id ? next : r))
    return this.settle(next)
  }

  listPayouts(q: PageQuery) { return this.settle(paginate(this.payouts, q)) }

  requestPayout(amountMinor: number): Promise<Payout> {
    const p: Payout = {
      id: `pay-${Date.now()}`, reference: `PO-2026-${String(this.payouts.length + 103).padStart(4, '0')}`,
      amount: bdt(amountMinor), status: 'requested', requestedAt: new Date().toISOString(),
      paidAt: null, deductions: [],
    }
    this.payouts = [p, ...this.payouts]
    return this.settle(p)
  }

  submitFeedback(_input: FeedbackInput) { return this.settle(undefined as void) }

  listNotifications(q: PageQuery): Promise<Page<AppNotification>> {
    return this.settle(paginate(this.notifications, q))
  }

  listSolutions(): Promise<Solution[]> { return this.settle(this.solutions) }

  // ------------------------------------------------------------- delivery
  listMyAssignments(status: 'active' | 'completed' = 'active') {
    const rows = this.assignments.filter((a) =>
      status === 'active' ? a.status !== 'delivered' && a.status !== 'failed' : a.status === 'delivered')
    return this.settle(rows)
  }

  getAssignment(shipmentId: Uuid) {
    const a = this.assignments.find((x) => x.shipmentId === shipmentId)
    return a ? this.settle(a) : Promise.reject(problem('assignment_not_found', 'Delivery not found', 404))
  }

  confirmHandover(shipmentId: Uuid, input: HandoverInput): Promise<DeliveryAssignment> {
    const a = this.assignments.find((x) => x.shipmentId === shipmentId)
    if (!a) return Promise.reject(problem('assignment_not_found', 'Delivery not found', 404))
    if (!input.receivedByName.trim()) {
      return Promise.reject(problem('receiver_required', 'Record who received the delivery', 422))
    }
    const next: DeliveryAssignment = { ...a, status: 'delivered', deliveredAt: new Date().toISOString() }
    this.assignments = this.assignments.map((x) => (x.shipmentId === shipmentId ? next : x))
    return this.settle(next)
  }
}
