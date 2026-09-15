import type { DataAdapter } from '../DataAdapter'
import { problem } from '../DataAdapter'
import type {
  Category,
  AdvancePayload, AppNotification, Certificate, DeliveryAssignment, Discount, DiscountConflict,
  FeedbackInput, FulfilmentStep, HandoverInput, IdentityDocument, InvitationIssued,
  Listing, ListingStatus,
  MarginBreakdown, MarketIntelligence, Member, OfferStatus, OrderDetail, OrderStatus,
  OrderSummary, Organisation, Page, PageQuery, Payout, PerformanceReport, PortalRole,
  PublishReadiness, RegisterCompanyInput, Review, SaveDiscountInput, SaveListingInput,
  ServiceAvailability, Session, Solution, StockRow, SubmitCertificateInput, SubmitIdentityInput,
  Uuid, VerificationDossier,
} from '../contracts'

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

  onUnauthorised?: () => void
}

export class HttpAdapter implements DataAdapter {
  private readonly baseUrl: string
  private readonly onUnauthorised?: () => void
  private accessToken: string | null = null
  private locale = 'bn-BD'

  private inFlightRefresh: Promise<boolean> | null = null

  private readonly cursors = new Map<string, (string | undefined)[]>()

  constructor(opts: HttpAdapterOptions = {}) {
    this.baseUrl = opts.baseUrl ?? (import.meta.env.VITE_API_URL ?? 'http://localhost:5270')
    this.onUnauthorised = opts.onUnauthorised
  }

  setAccessToken(token: string | null) { this.accessToken = token }

  setLocale(locale: string) { this.locale = locale }

  private static isAuthAttempt(path: string) {
    return path.startsWith('/api/v1/auth/')
  }

  private async refresh(): Promise<boolean> {
    if (this.inFlightRefresh) return this.inFlightRefresh

    const run = async () => {
      try {
        const response = await fetch(`${this.baseUrl}/api/v1/auth/token/refresh`, {
          method: 'POST',
          body: '{}',
          headers: { 'Content-Type': 'application/json', 'X-AgroMed-Client': 'web' },
          credentials: 'include',
        })
        if (!response.ok) return false
        const raw = (await response.json()) as ApiLoginResponse
        this.setAccessToken(raw.accessToken)
        return true
      } catch {

        return false
      }
    }

    this.inFlightRefresh = run().finally(() => { this.inFlightRefresh = null })
    return this.inFlightRefresh
  }

  async restoreSession(): Promise<Session | null> {
    try {
      const response = await fetch(`${this.baseUrl}/api/v1/auth/token/refresh`, {
        method: 'POST',
        body: '{}',
        headers: { 'Content-Type': 'application/json', 'X-AgroMed-Client': 'web' },
        credentials: 'include',
      })
      if (!response.ok) return null
      const raw = (await response.json()) as ApiLoginResponse
      this.setAccessToken(raw.accessToken)

      return await this.toSession(raw)
    } catch {
      return null
    }
  }

  private async request<T>(method: string, path: string, body?: unknown): Promise<T> {
    const headers: Record<string, string> = {
      Accept: 'application/json',
      'Accept-Language': this.locale,
    }
    const isForm = body instanceof FormData
    // A multipart body writes its own Content-Type, boundary included. Setting
    // it here produces a body the server cannot parse.
    if (body !== undefined && !isForm) headers['Content-Type'] = 'application/json'
    if (this.accessToken) headers.Authorization = `Bearer ${this.accessToken}`

    let response: Response
    try {
      response = await fetch(`${this.baseUrl}${path}`, {
        method, headers,
        body: body === undefined ? undefined : isForm ? (body as FormData) : JSON.stringify(body),

        credentials: 'include',
      })
    } catch {

      throw problem('network_unreachable', 'Could not reach the server', 0,
        'Check your connection and try again.')
    }

    if (response.status === 401 && !HttpAdapter.isAuthAttempt(path)) {

      if (await this.refresh()) {
        try {
          response = await fetch(`${this.baseUrl}${path}`, {
            method,
            headers: { ...headers, Authorization: `Bearer ${this.accessToken}` },
            body: body === undefined ? undefined : JSON.stringify(body),
            credentials: 'include',
          })
        } catch {
          throw problem('network_unreachable', 'Could not reach the server', 0,
            'Check your connection and try again.')
        }
      }

      if (response.status === 401) {
        this.onUnauthorised?.()
        throw problem('unauthenticated', 'Your session has ended', 401, 'Please sign in again.')
      }
    }

    if (response.status === 204) return undefined as T

    const text = await response.text()
    const payload = text ? JSON.parse(text) : undefined

    if (!response.ok) {

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

  getOrganisation(): Promise<Organisation> {
    return this.request('GET', '/api/v1/company/profile')
  }

  updateOrganisation(patch: Partial<Organisation>): Promise<Organisation> {
    if ('deliveryMode' in patch) {

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

  uploadCertificateDocument(certificateId: Uuid, file: File): Promise<Certificate> {
    const form = new FormData()
    form.append('file', file)
    return this.request(
      'POST', `/api/v1/company/verification/certificates/${certificateId}/document`, form)
  }

  submitIdentityDocument(input: SubmitIdentityInput): Promise<IdentityDocument> {
    return this.request('POST', '/api/v1/company/verification/identity', input)
  }

  submitDossierForReview(): Promise<VerificationDossier> {
    return this.request('POST', '/api/v1/company/verification/submit')
  }

  listListings(q: PageQuery & { kind?: 'product' | 'service'; status?: ListingStatus; categoryId?: Uuid }) {
    // category_id may name any tier; the API matches the whole subtree beneath
    // it, so a division here means "everything of mine under Animal".
    return this.paged<Listing>(
      this.queryKey('listings', q, { kind: q.kind, status: q.status, category_id: q.categoryId }),
      '/api/v1/company/listings', q, { kind: q.kind, status: q.status, category_id: q.categoryId })
  }

  listCategories(params?: { level?: number; parentId?: Uuid }): Promise<Category[]> {
    const qs = new URLSearchParams()
    if (params?.parentId) qs.set('parent_id', params.parentId)
    else if (params?.level != null) qs.set('level', String(params.level))
    const suffix = qs.toString()
    return this.request('GET', `/api/v1/categories${suffix ? `?${suffix}` : ''}`)
  }

  getCategoryBreadcrumb(id: Uuid): Promise<Category[]> {
    return this.request('GET', `/api/v1/categories/${id}/breadcrumb`)
  }

  uploadListingImage(listingId: Uuid, file: File): Promise<Listing> {
    const form = new FormData()
    form.append('file', file)
    return this.request('POST', `/api/v1/company/listings/${listingId}/media`, form)
  }

  deleteListingImage(listingId: Uuid, mediaId: Uuid): Promise<Listing> {
    return this.request('DELETE', `/api/v1/company/listings/${listingId}/media/${mediaId}`)
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

  listStock(q: PageQuery) {
    return this.paged<StockRow>(this.queryKey('stock', q), '/api/v1/company/inventory', q)
  }

  adjustStock(listingId: Uuid, delta: number, reason: string): Promise<StockRow> {
    return this.request('POST', `/api/v1/company/inventory/${listingId}/adjust`, { delta, reason })
  }

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

  getMarketIntelligence(window: '3m' | '6m' | '12m'): Promise<MarketIntelligence> {
    return this.request('GET', `/api/v1/company/market?window=${window}`)
  }

  listMembers(q: PageQuery) {
    return this.paged<Member>(this.queryKey('members', q), '/api/v1/company/team', q)
  }

  inviteMember(identifier: string, role: PortalRole): Promise<InvitationIssued> {
    return this.request('POST', '/api/v1/company/team/invitations', { identifier, role })
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
    return this.paged<AppNotification>(this.queryKey('notifications', q), '/api/v1/notifications', q)
  }

  registerDeviceToken(token: string, platform: 'web'): Promise<void> {
    return this.request('POST', '/api/v1/notifications/device-tokens', { token, platform })
  }

  removeDeviceToken(token: string, platform: 'web'): Promise<void> {
    return this.request('DELETE', '/api/v1/notifications/device-tokens', { token, platform })
  }

  markNotificationsRead(id?: Uuid): Promise<void> {
    return this.request('DELETE', `/api/v1/notifications${id ? `/${id}` : ''}`)
  }

  listSolutions(): Promise<Solution[]> {
    return this.request('GET', '/api/v1/company/solutions')
  }

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

function toPortalRole(roles: string[]): PortalRole {
  if (roles.includes('owner')) return 'owner'
  if (roles.includes('delivery_man')) return 'delivery_man'
  return 'manager'
}
