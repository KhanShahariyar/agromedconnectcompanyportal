import type {
  AdvancePayload, ApiProblem, AppNotification, Certificate, DeliveryAssignment, Discount,
  DiscountConflict, FeedbackInput, FulfilmentStep, HandoverInput, IdentityDocument, Listing,
  ListingStatus, MarginBreakdown, MarketIntelligence, Member, OfferStatus, OrderDetail,
  OrderStatus, OrderSummary, Organisation, Page, PageQuery, Payout, PerformanceReport,
  PortalRole, PublishReadiness, RegisterCompanyInput, Review, SaveDiscountInput,
  SaveListingInput, ServiceAvailability, Session, Solution, StockRow, SubmitCertificateInput,
  SubmitIdentityInput, Uuid, VerificationDossier,
} from './contracts'

/**
 * The single surface every screen consumes.
 *
 * Phase 1 ships MockAdapter; Phase 2 adds HttpAdapter and swaps one provider
 * value. That is what makes "UI first, API second" a real sequence rather than
 * rework — and it means integration failures surface as adapter test failures,
 * not as broken screens.
 *
 * Every method rejects with an `ApiProblem`, never a bare Error, so screens
 * handle exactly one error shape.
 */
export interface DataAdapter {
  // ---- auth
  login(identifier: string, password: string): Promise<Session>

  /**
   * Rebuilds a session on page load from whatever the adapter persisted.
   *
   * Optional because the mock adapter has no server to ask and nothing to
   * restore from. The HTTP adapter redeems the HttpOnly refresh cookie.
   */
  restoreSession?(): Promise<Session | null>
  register(input: RegisterCompanyInput): Promise<Session>
  forgotPassword(identifier: string): Promise<void>
  resetPassword(token: string, password: string): Promise<void>
  acceptInvitation(token: string, password: string): Promise<Session>
  logout(): Promise<void>

  // ---- organisation & verification
  getOrganisation(): Promise<Organisation>
  updateOrganisation(patch: Partial<Organisation>): Promise<Organisation>
  getVerificationDossier(): Promise<VerificationDossier>
  submitCertificate(input: SubmitCertificateInput): Promise<Certificate>
  submitIdentityDocument(input: SubmitIdentityInput): Promise<IdentityDocument>
  submitDossierForReview(): Promise<VerificationDossier>

  // ---- catalogue
  listListings(q: PageQuery & { kind?: 'product' | 'service'; status?: ListingStatus }): Promise<Page<Listing>>
  getListing(id: Uuid): Promise<Listing>
  saveListing(input: SaveListingInput): Promise<Listing>
  getPublishReadiness(id: Uuid): Promise<PublishReadiness>
  publishListing(id: Uuid): Promise<Listing>
  deleteListing(id: Uuid): Promise<void>
  getServiceAvailability(id: Uuid): Promise<ServiceAvailability[]>
  saveServiceAvailability(id: Uuid, slots: ServiceAvailability[]): Promise<ServiceAvailability[]>

  // ---- inventory
  listStock(q: PageQuery): Promise<Page<StockRow>>
  adjustStock(listingId: Uuid, delta: number, reason: string): Promise<StockRow>

  // ---- orders
  listOrders(q: PageQuery & { status?: OrderStatus }): Promise<Page<OrderSummary>>
  getOrder(id: Uuid): Promise<OrderDetail>
  advanceOrder(id: Uuid, to: FulfilmentStep, payload?: AdvancePayload): Promise<OrderDetail>
  assignDeliveryPerson(orderId: Uuid, userId: Uuid): Promise<OrderDetail>

  // ---- discounts
  listDiscounts(q: PageQuery & { status?: OfferStatus }): Promise<Page<Discount>>
  saveDiscount(input: SaveDiscountInput): Promise<Discount>
  setDiscountStatus(id: Uuid, status: OfferStatus): Promise<Discount>
  detectDiscountConflicts(draft: SaveDiscountInput): Promise<DiscountConflict[]>
  getMarginBreakdown(listingId: Uuid, discountId: Uuid | null): Promise<MarginBreakdown>

  // ---- market intelligence
  getMarketIntelligence(window: '3m' | '6m' | '12m'): Promise<MarketIntelligence>

  // ---- team
  listMembers(q: PageQuery): Promise<Page<Member>>
  inviteMember(email: string, role: PortalRole): Promise<void>
  setMemberRole(membershipId: Uuid, role: PortalRole): Promise<Member>
  setMemberOverride(membershipId: Uuid, permission: string, effect: 'grant' | 'deny' | 'clear'): Promise<Member>
  removeMember(membershipId: Uuid): Promise<void>

  // ---- reports, reviews, payments, feedback, notifications, solutions
  getPerformanceReport(window: '3m' | '6m' | '12m'): Promise<PerformanceReport>
  listReviews(q: PageQuery): Promise<Page<Review>>
  respondToReview(id: Uuid, body: string): Promise<Review>
  listPayouts(q: PageQuery): Promise<Page<Payout>>
  requestPayout(amountMinor: number): Promise<Payout>
  submitFeedback(input: FeedbackInput): Promise<void>
  listNotifications(q: PageQuery): Promise<Page<AppNotification>>
  listSolutions(): Promise<Solution[]>

  // ---- delivery shell
  listMyAssignments(status?: 'active' | 'completed'): Promise<DeliveryAssignment[]>
  getAssignment(shipmentId: Uuid): Promise<DeliveryAssignment>
  confirmHandover(shipmentId: Uuid, input: HandoverInput): Promise<DeliveryAssignment>
}

export function problem(code: string, title: string, status = 400, detail?: string): ApiProblem {
  return { type: `https://agromedconnect.com/problems/${code}`, title, status, code, detail }
}
