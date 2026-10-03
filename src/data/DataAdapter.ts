import type {
  Category,
  AdvancePayload, ApiProblem, AppNotification, Certificate, DeliveryAssignment, Discount,
  DiscountConflict, FeedbackInput, FulfilmentStep, HandoverInput, IdentityDocument,
  InvitationIssued, Listing,
  ListingStatus, MarginBreakdown, MarketIntelligence, Member, OfferStatus, OrderDetail,
  OrderStatus, OrderSummary, Organisation, Page, PageQuery, Payout, PerformanceReport,
  PortalRole, PublishReadiness, RegisterCompanyInput, Review, SaveDiscountInput,
  SaveListingInput, ServiceAvailability, Session, Solution, StockRow, SubmitCertificateInput,
  SubmitIdentityInput, Uuid, VerificationDossier,
} from './contracts'

export interface DataAdapter {

  /** This adapter with `signal` on every request it makes, for useQuery's cancellation. */
  withSignal(signal: AbortSignal): DataAdapter

  login(identifier: string, password: string): Promise<Session>

  restoreSession?(): Promise<Session | null>
  register(input: RegisterCompanyInput): Promise<Session>
  forgotPassword(identifier: string): Promise<void>
  resetPassword(token: string, password: string): Promise<void>
  acceptInvitation(token: string, password: string): Promise<Session>
  logout(): Promise<void>

  getOrganisation(): Promise<Organisation>
  updateOrganisation(patch: Partial<Organisation>): Promise<Organisation>
  getVerificationDossier(): Promise<VerificationDossier>
  submitCertificate(input: SubmitCertificateInput): Promise<Certificate>
  /** Attach the licence scan or photograph to a certificate. */
  uploadCertificateDocument(certificateId: Uuid, file: File): Promise<Certificate>
  submitIdentityDocument(input: SubmitIdentityInput): Promise<IdentityDocument>
  submitDossierForReview(): Promise<VerificationDossier>

  listListings(q: PageQuery & { kind?: 'product' | 'service'; status?: ListingStatus; categoryId?: Uuid }): Promise<Page<Listing>>
  /** One tier of the taxonomy. No argument gives the divisions. */
  listCategories(params?: { level?: number; parentId?: Uuid }): Promise<Category[]>
  /** Division first, the category itself last. */
  getCategoryBreadcrumb(id: Uuid): Promise<Category[]>
  /** Attach a photograph to a listing. Returns the listing with its media. */
  uploadListingImage(listingId: Uuid, file: File): Promise<Listing>
  deleteListingImage(listingId: Uuid, mediaId: Uuid): Promise<Listing>
  getListing(id: Uuid): Promise<Listing>
  saveListing(input: SaveListingInput): Promise<Listing>
  getPublishReadiness(id: Uuid): Promise<PublishReadiness>
  publishListing(id: Uuid): Promise<Listing>
  deleteListing(id: Uuid): Promise<void>
  getServiceAvailability(id: Uuid): Promise<ServiceAvailability[]>
  saveServiceAvailability(id: Uuid, slots: ServiceAvailability[]): Promise<ServiceAvailability[]>

  listStock(q: PageQuery): Promise<Page<StockRow>>
  adjustStock(listingId: Uuid, delta: number, reason: string): Promise<StockRow>

  listOrders(q: PageQuery & { status?: OrderStatus }): Promise<Page<OrderSummary>>
  getOrder(id: Uuid): Promise<OrderDetail>
  advanceOrder(id: Uuid, to: FulfilmentStep, payload?: AdvancePayload): Promise<OrderDetail>
  assignDeliveryPerson(orderId: Uuid, userId: Uuid): Promise<OrderDetail>

  listDiscounts(q: PageQuery & { status?: OfferStatus }): Promise<Page<Discount>>
  saveDiscount(input: SaveDiscountInput): Promise<Discount>
  setDiscountStatus(id: Uuid, status: OfferStatus): Promise<Discount>
  detectDiscountConflicts(draft: SaveDiscountInput): Promise<DiscountConflict[]>
  getMarginBreakdown(listingId: Uuid, discountId: Uuid | null): Promise<MarginBreakdown>

  getMarketIntelligence(window: '3m' | '6m' | '12m'): Promise<MarketIntelligence>

  listMembers(q: PageQuery): Promise<Page<Member>>
  inviteMember(identifier: string, role: PortalRole): Promise<InvitationIssued>
  setMemberRole(membershipId: Uuid, role: PortalRole): Promise<Member>
  setMemberOverride(membershipId: Uuid, permission: string, effect: 'grant' | 'deny' | 'clear'): Promise<Member>
  removeMember(membershipId: Uuid): Promise<void>

  getPerformanceReport(window: '3m' | '6m' | '12m'): Promise<PerformanceReport>
  listReviews(q: PageQuery): Promise<Page<Review>>
  respondToReview(id: Uuid, body: string): Promise<Review>
  listPayouts(q: PageQuery): Promise<Page<Payout>>
  requestPayout(amountMinor: number): Promise<Payout>
  submitFeedback(input: FeedbackInput): Promise<void>
  listNotifications(q: PageQuery): Promise<Page<AppNotification>>
  markNotificationsRead(id?: Uuid): Promise<void>

  registerDeviceToken(token: string, platform: 'web'): Promise<void>

  removeDeviceToken(token: string, platform: 'web'): Promise<void>
  listSolutions(): Promise<Solution[]>

  listMyAssignments(status?: 'active' | 'completed'): Promise<DeliveryAssignment[]>
  getAssignment(shipmentId: Uuid): Promise<DeliveryAssignment>
  confirmHandover(shipmentId: Uuid, input: HandoverInput): Promise<DeliveryAssignment>
}

export function problem(code: string, title: string, status = 400, detail?: string): ApiProblem {
  return { type: `https://agromedconnect.com/problems/${code}`, title, status, code, detail }
}
