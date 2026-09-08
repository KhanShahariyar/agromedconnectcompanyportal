import type { DataAdapter } from '../DataAdapter'
import { problem } from '../DataAdapter'
import type {
  AdvancePayload, AppNotification, Certificate, DeliveryAssignment, Discount, DiscountConflict,
  FeedbackInput, FulfilmentStep, HandoverInput, IdentityDocument, Listing, ListingStatus,
  MarginBreakdown, MarketIntelligence, Member, OfferStatus, OrderDetail, OrderStatus,
  OrderSummary, Organisation, Page, PageQuery, Payout, PerformanceReport, PortalRole,
  PublishReadiness, RegisterCompanyInput, Review, SaveDiscountInput, SaveListingInput,
  ServiceAvailability, Session, Solution, StockRow, SubmitCertificateInput, SubmitIdentityInput,
  Uuid, VerificationDossier,
} from '../contracts'

/**
 * The real API.
 *
 * This is the whole cost of moving off the mock: App.tsx swaps one adapter for
 * another and every screen carries on unchanged, because both implement the
 * same interface and the mock's types were written from the API's contract in
 * the first place.
 *
 * Two shapes need translating, and only two:
 *
 *   1. The API pages by opaque cursor, deliberately — offset paging drifts when
 *      rows are inserted mid-scan and gets slower the deeper you go. The portal
 *      shows page numbers, so this adapter keeps a small cursor ledger per
 *      query and lets the server keep its seek.
 *   2. The API returns { items, nextCursor, totalCount }; the portal wants
 *      { items, page, pageSize, total }.
 */

/**
 * What /auth/login actually returns.
 *
 * Flat, and shared with the Flutter farmer app — which is why the portal adapts
 * to it rather than the other way round. Changing this response to suit a second
 * client would break the first one, and the farmer app is finished and tested.
 */
interface ApiLoginResponse {
  accessToken: string
  refreshToken: string
  expiresAt: string
  user: {
    id: string
    fullName: string
    phoneE164: string | null
    email: string | null
    preferredLocale: 'bn-BD' | 'en-US'
    organisationId: string
    organisationName: string
    organisationKind: string
    roles: string[]
    permissions: string[]
  }
}

interface ApiPaged<T> {
  items: T[]
  nextCursor: string | null
  totalCount: number | null
}

export interface HttpAdapterOptions {
  baseUrl?: string
  /** Called whenever a request comes back 401, so the shell can sign out. */
  onUnauthorised?: () => void
}

export class HttpAdapter implements DataAdapter {
  private readonly baseUrl: string
  private readonly onUnauthorised?: () => void
  private accessToken: string | null = null
  private locale = 'bn-BD'

  /**
   * Cursors seen per query, indexed by page number. Page 1 needs none, so
   * index 0 stays empty; page N uses the cursor returned with page N-1.
   * Stepping one screen at a time is what the UI offers, and that is what this
   * supports.
   */
  private readonly cursors = new Map<string, (string | undefined)[]>()

  constructor(opts: HttpAdapterOptions = {}) {
    this.baseUrl = opts.baseUrl ?? (import.meta.env.VITE_API_URL ?? 'http://localhost:5270')
    this.onUnauthorised = opts.onUnauthorised
  }

  setAccessToken(token: string | null) { this.accessToken = token }

  /** The server renders money and dates, so it has to be told which language. */
  setLocale(locale: string) { this.locale = locale }

  private async request<T>(method: string, path: string, body?: unknown): Promise<T> {
    const headers: Record<string, string> = {
      Accept: 'application/json',
      'Accept-Language': this.locale,
    }
    if (body !== undefined) headers['Content-Type'] = 'application/json'
    if (this.accessToken) headers.Authorization = `Bearer ${this.accessToken}`

    let response: Response
    try {
      response = await fetch(`${this.baseUrl}${path}`, {
        method, headers,
        body: body === undefined ? undefined : JSON.stringify(body),
      })
    } catch {
      // A dead network is not a 500. Saying so lets the error state offer
      // "try again" instead of implying the server rejected the request.
      throw problem('network_unreachable', 'Could not reach the server', 0,
        'Check your connection and try again.')
    }

    if (response.status === 401) {
      this.onUnauthorised?.()
      throw problem('unauthenticated', 'Your session has ended', 401, 'Please sign in again.')
    }

    if (response.status === 204) return undefined as T

    const text = await response.text()
    const payload = text ? JSON.parse(text) : undefined

    if (!response.ok) {
      // The API speaks RFC 9457, so its problem document passes straight
      // through — including the stable `code` screens branch on, which never
      // changes with language.
      throw {
        type: payload?.type ?? 'about:blank',
        title: payload?.title ?? 'Request failed',
        status: response.status,
        detail: payload?.detail,
        code: payload?.code ?? 'unknown_error',
        correlationId: response.headers.get('X-Correlation-Id') ?? undefined,
      }
    }

    return payload as T
  }

  private async paged<T>(
    key: string, path: string, q: PageQuery, extra: Record<string, string | undefined> = {},
  ): Promise<Page<T>> {
    const page = q.page ?? 1
    const pageSize = q.pageSize ?? 20

    const ledger = this.cursors.get(key) ?? []
    const params = new URLSearchParams({ limit: String(pageSize) })
    if (q.search) params.set('search', q.search)
    for (const [k, v] of Object.entries(extra)) if (v) params.set(k, v)

    const cursor = ledger[page - 1]
    if (cursor) params.set('cursor', cursor)

    const result = await this.request<ApiPaged<T>>('GET', `${path}?${params}`)

    if (result.nextCursor) {
      ledger[page] = result.nextCursor
      this.cursors.set(key, ledger)
    }

    return {
      items: result.items,
      page,
      pageSize,
      total: result.totalCount ?? result.items.length,
    }
  }

  private queryKey(path: string, q: PageQuery, extra: Record<string, unknown> = {}) {
    return `${path}|${q.search ?? ''}|${q.pageSize ?? 20}|${JSON.stringify(extra)}`
  }

  // ------------------------------------------------------------------- auth

  async login(identifier: string, password: string): Promise<Session> {
    const raw = await this.request<ApiLoginResponse>('POST', '/api/v1/auth/login', { identifier, password })
    this.setAccessToken(raw.accessToken)
    return this.toSession(raw)
  }

  async register(input: RegisterCompanyInput): Promise<Session> {
    const raw = await this.request<ApiLoginResponse>('POST', '/api/v1/auth/register', input)
    this.setAccessToken(raw.accessToken)
    return this.toSession(raw)
  }

  /**
   * Composes the portal's session from the shared login response plus the
   * company record.
   *
   * The second call is not waste: login returns an organisation *id* and a
   * name, and the portal needs verification status, blacklisting and the
   * assigned delivery mode from the first paint — the shell decides whether to
   * show the verification banner before any screen renders.
   */
  private async toSession(raw: ApiLoginResponse): Promise<Session> {
    const organisation = await this.getOrganisation()

    return {
      accessToken: raw.accessToken,
      refreshToken: raw.refreshToken,
      expiresAt: raw.expiresAt,
      user: {
        id: raw.user.id,
        fullName: raw.user.fullName,
        phoneE164: raw.user.phoneE164,
        email: raw.user.email,
        preferredLocale: raw.user.preferredLocale,
        status: 'active',
        lastLoginAt: null,
      },
      organisation,
      role: toPortalRole(raw.user.roles),
      // The server's list, not the portal's. It already accounts for per-member
      // grants and denials, which a role name alone cannot express.
      permissions: raw.user.permissions ?? [],
    }
  }

  forgotPassword(identifier: string): Promise<void> {
    return this.request('POST', '/api/v1/auth/password/forgot', { phoneE164: identifier })
  }

  resetPassword(token: string, password: string): Promise<void> {
    return this.request('POST', '/api/v1/auth/password/reset', { code: token, newPassword: password })
  }

  async acceptInvitation(token: string, password: string): Promise<Session> {
    const s = await this.request<Session>('POST', '/api/v1/auth/invitations/accept', { token, password })
    this.setAccessToken(s.accessToken)
    return s
  }

  async logout(): Promise<void> {
    try { await this.request('POST', '/api/v1/auth/logout') } finally { this.setAccessToken(null) }
  }

  // -------------------------------------------- organisation & verification

  getOrganisation(): Promise<Organisation> {
    return this.request('GET', '/api/v1/company/profile')
  }

  updateOrganisation(patch: Partial<Organisation>): Promise<Organisation> {
    if ('deliveryMode' in patch) {
      // Refused here as well as server-side. A UI regression that tries this
      // should break loudly rather than appear to succeed.
      return Promise.reject(problem(
        'delivery_mode_not_self_assignable',
        'Delivery mode is assigned by the platform', 403,
        'Contact support to change how your orders are delivered.'))
    }
    return this.request('PATCH', '/api/v1/company/profile', patch)
  }

  getVerificationDossier(): Promise<VerificationDossier> {
    return this.request('GET', '/api/v1/company/verification')
  }

  submitCertificate(input: SubmitCertificateInput): Promise<Certificate> {
    return this.request('POST', '/api/v1/company/verification/certificates', input)
  }

  submitIdentityDocument(input: SubmitIdentityInput): Promise<IdentityDocument> {
    return this.request('POST', '/api/v1/company/verification/identity', input)
  }

  submitDossierForReview(): Promise<VerificationDossier> {
    return this.request('POST', '/api/v1/company/verification/submit')
  }

  // --------------------------------------------------------------- catalogue

  listListings(q: PageQuery & { kind?: 'product' | 'service'; status?: ListingStatus }) {
    return this.paged<Listing>(
      this.queryKey('listings', q, { kind: q.kind, status: q.status }),
      '/api/v1/company/listings', q, { kind: q.kind, status: q.status })
  }

  getListing(id: Uuid): Promise<Listing> {
    return this.request('GET', `/api/v1/company/listings/${id}`)
  }

  saveListing(input: SaveListingInput): Promise<Listing> {
    return this.request('POST', '/api/v1/company/listings', input)
  }

  getPublishReadiness(id: Uuid): Promise<PublishReadiness> {
    return this.request('GET', `/api/v1/company/listings/${id}/readiness`)
  }

  publishListing(id: Uuid): Promise<Listing> {
    return this.request('POST', `/api/v1/company/listings/${id}/publish`)
  }

  deleteListing(id: Uuid): Promise<void> {
    return this.request('DELETE', `/api/v1/company/listings/${id}`)
  }

  getServiceAvailability(id: Uuid): Promise<ServiceAvailability[]> {
    return this.request('GET', `/api/v1/company/listings/${id}/availability`)
  }

  saveServiceAvailability(id: Uuid, slots: ServiceAvailability[]): Promise<ServiceAvailability[]> {
    return this.request('PUT', `/api/v1/company/listings/${id}/availability`, slots)
  }

  // --------------------------------------------------------------- inventory

  listStock(q: PageQuery) {
    return this.paged<StockRow>(this.queryKey('stock', q), '/api/v1/company/inventory', q)
  }

  adjustStock(listingId: Uuid, delta: number, reason: string): Promise<StockRow> {
    return this.request('POST', `/api/v1/company/inventory/${listingId}/adjust`, { delta, reason })
  }

  // ------------------------------------------------------------------ orders

  listOrders(q: PageQuery & { status?: OrderStatus }) {
    return this.paged<OrderSummary>(
      this.queryKey('orders', q, { status: q.status }),
      '/api/v1/company/orders', q, { status: q.status })
  }

  getOrder(id: Uuid): Promise<OrderDetail> {
    return this.request('GET', `/api/v1/company/orders/${id}`)
  }

  advanceOrder(id: Uuid, to: FulfilmentStep, payload?: AdvancePayload): Promise<OrderDetail> {
    return this.request('POST', `/api/v1/company/orders/${id}/advance`, {
      to, reason: payload?.reason, trackingReference: payload?.trackingReference,
    })
  }

  assignDeliveryPerson(orderId: Uuid, userId: Uuid): Promise<OrderDetail> {
    return this.request('POST', `/api/v1/company/orders/${orderId}/assign`, { userId })
  }

  // --------------------------------------------------------------- discounts

  listDiscounts(q: PageQuery & { status?: OfferStatus }) {
    return this.paged<Discount>(
      this.queryKey('discounts', q, { status: q.status }),
      '/api/v1/company/discounts', q, { status: q.status })
  }

  saveDiscount(input: SaveDiscountInput): Promise<Discount> {
    return this.request('POST', '/api/v1/company/discounts', input)
  }

  setDiscountStatus(id: Uuid, status: OfferStatus): Promise<Discount> {
    return this.request('POST', `/api/v1/company/discounts/${id}/status`, status)
  }

  detectDiscountConflicts(draft: SaveDiscountInput): Promise<DiscountConflict[]> {
    return this.request('POST', '/api/v1/company/discounts/conflicts', draft)
  }

  getMarginBreakdown(listingId: Uuid, discountId: Uuid | null): Promise<MarginBreakdown> {
    const params = new URLSearchParams({ listingId })
    if (discountId) params.set('discountId', discountId)
    return this.request('GET', `/api/v1/company/discounts/margin?${params}`)
  }

  // ---------------------------------------------------- market intelligence

  getMarketIntelligence(window: '3m' | '6m' | '12m'): Promise<MarketIntelligence> {
    return this.request('GET', `/api/v1/company/market?window=${window}`)
  }

  // -------------------------------------------------------------------- team

  listMembers(q: PageQuery) {
    return this.paged<Member>(this.queryKey('members', q), '/api/v1/company/team', q)
  }

  inviteMember(email: string, role: PortalRole): Promise<void> {
    return this.request('POST', '/api/v1/company/team/invitations', { identifier: email, role })
  }

  setMemberRole(membershipId: Uuid, role: PortalRole): Promise<Member> {
    return this.request('PUT', `/api/v1/company/team/${membershipId}/role`, { role })
  }

  setMemberOverride(membershipId: Uuid, permission: string, effect: 'grant' | 'deny' | 'clear'): Promise<Member> {
    return this.request('PUT', `/api/v1/company/team/${membershipId}/permissions`, { permission, effect })
  }

  removeMember(membershipId: Uuid): Promise<void> {
    return this.request('DELETE', `/api/v1/company/team/${membershipId}`)
  }

  // -------------------------------------- reports, reviews, payments, misc

  getPerformanceReport(window: '3m' | '6m' | '12m'): Promise<PerformanceReport> {
    return this.request('GET', `/api/v1/company/reports/performance?window=${window}`)
  }

  listReviews(q: PageQuery) {
    return this.paged<Review>(this.queryKey('reviews', q), '/api/v1/company/reviews', q)
  }

  respondToReview(id: Uuid, body: string): Promise<Review> {
    return this.request('POST', `/api/v1/company/reviews/${id}/response`, { body })
  }

  listPayouts(q: PageQuery) {
    return this.paged<Payout>(this.queryKey('payouts', q), '/api/v1/company/payouts', q)
  }

  requestPayout(amountMinor: number): Promise<Payout> {
    return this.request('POST', '/api/v1/company/payouts', { amountMinor })
  }

  submitFeedback(input: FeedbackInput): Promise<void> {
    return this.request('POST', '/api/v1/company/reports/feedback', input)
  }

  listNotifications(q: PageQuery) {
    return this.paged<AppNotification>(this.queryKey('notifications', q), '/api/v1/company/notifications', q)
  }

  listSolutions(): Promise<Solution[]> {
    return this.request('GET', '/api/v1/company/solutions')
  }

  // ---------------------------------------------------------------- delivery

  listMyAssignments(status: 'active' | 'completed' = 'active'): Promise<DeliveryAssignment[]> {
    return this.request('GET', `/api/v1/company/deliveries?status=${status}`)
  }

  getAssignment(shipmentId: Uuid): Promise<DeliveryAssignment> {
    return this.request('GET', `/api/v1/company/deliveries/${shipmentId}`)
  }

  confirmHandover(shipmentId: Uuid, input: HandoverInput): Promise<DeliveryAssignment> {
    return this.request('POST', `/api/v1/company/deliveries/${shipmentId}/handover`, input)
  }
}

/**
 * Database roles onto the three the portal knows.
 *
 * `inventory_staff` and `support` are seeded seller roles that predate this
 * portal. They are day-to-day operational roles, so they land on Employee
 * rather than being rejected — an existing member should not be locked out
 * because the portal recognises fewer names than the database does.
 */
function toPortalRole(roles: string[]): PortalRole {
  if (roles.includes('owner')) return 'owner'
  if (roles.includes('delivery_man')) return 'delivery_man'
  return 'manager'
}
