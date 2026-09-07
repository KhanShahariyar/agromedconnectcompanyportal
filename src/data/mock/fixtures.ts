import type {
  AppNotification, Certificate, DeliveryAssignment, Discount, IdentityDocument, Listing,
  Member, Money, OrderDetail, OrderLine, Organisation, Payout, Review, Solution, StockRow,
} from '../contracts'

/** Money helper — mirrors the server's rendering so fixtures look like real payloads. */
export function bdt(amountMinor: number): Money {
  const major = amountMinor / 100
  return {
    amountMinor,
    currency: 'BDT',
    display: '৳' + major.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
  }
}

const iso = (daysAgo: number) => new Date(Date.now() - daysAgo * 864e5).toISOString()

export const ORG_ID = 'org-0001'
export const USER_ID = 'usr-0001'

/**
 * The catalogue mirrors the seeded listings in the API's storage directory, so
 * review screenshots resemble production rather than lorem ipsum.
 */
interface Seedling {
  id: string
  slug: string
  name: string
  brand: string
  category: string
  priceMinor: number
  kind: 'product' | 'service'
  restricted?: boolean
  pack?: [number, string]
  weight?: number
}

const CATALOGUE: Seedling[] = [
  // The marketplace sells agricultural medicines and services, so "category" is
  // the medicine type. Slicing charts by category would otherwise be a constant.
  { id: 'lst-01', slug: 'sonar-20sl', name: 'Sonar 20SL Insecticide', brand: 'AgroShield', category: 'Insecticide', priceMinor: 74500, kind: 'product', restricted: true, pack: [1, 'l'], weight: 1100 },
  { id: 'lst-02', slug: 'cypermex-10ec', name: 'Cypermex 10EC', brand: 'AgroShield', category: 'Insecticide', priceMinor: 62000, kind: 'product', restricted: true, pack: [500, 'ml'], weight: 560 },
  { id: 'lst-03', slug: 'aphidex-25wp', name: 'Aphidex 25WP', brand: 'CropCare', category: 'Insecticide', priceMinor: 48000, kind: 'product', restricted: true, pack: [250, 'g'], weight: 270 },
  { id: 'lst-04', slug: 'fungistop-70wp', name: 'FungiStop 70WP', brand: 'CropCare', category: 'Fungicide', priceMinor: 56000, kind: 'product', restricted: true, pack: [500, 'g'], weight: 520 },
  { id: 'lst-05', slug: 'blight-guard-72wp', name: 'Blight Guard 72WP', brand: 'CropCare', category: 'Fungicide', priceMinor: 69500, kind: 'product', restricted: true, pack: [1, 'kg'], weight: 1050 },
  { id: 'lst-06', slug: 'thiovit-80wg', name: 'Thiovit 80WG', brand: 'AgroShield', category: 'Fungicide', priceMinor: 41000, kind: 'product', restricted: true, pack: [1, 'kg'], weight: 1040 },
  { id: 'lst-07', slug: 'weedclear-80wg', name: 'WeedClear 80WG', brand: 'CropCare', category: 'Herbicide', priceMinor: 61500, kind: 'product', restricted: true, pack: [200, 'g'], weight: 220 },
  { id: 'lst-08', slug: 'grassout-75wg', name: 'GrassOut 75WG', brand: 'AgroShield', category: 'Herbicide', priceMinor: 53000, kind: 'product', restricted: true, pack: [200, 'g'], weight: 220 },
  { id: 'lst-09', slug: 'bioguard-50ec', name: 'BioGuard 50EC', brand: 'AgroShield', category: 'Bio-pesticide', priceMinor: 89000, kind: 'product', pack: [1, 'l'], weight: 1100 },
  { id: 'lst-10', slug: 'neemol-03ec', name: 'Neemol 0.3EC', brand: 'Shobuj', category: 'Bio-pesticide', priceMinor: 37000, kind: 'product', pack: [500, 'ml'], weight: 540 },
  { id: 'lst-11', slug: 'rootshield-bio', name: 'RootShield Bio', brand: 'Shobuj', category: 'Bio-pesticide', priceMinor: 45500, kind: 'product', pack: [1, 'kg'], weight: 1030 },
  { id: 'lst-12', slug: 'vetcare-oxytet-20', name: 'VetCare Oxytet 20', brand: 'VetCare', category: 'Veterinary', priceMinor: 118000, kind: 'product', restricted: true, pack: [100, 'ml'], weight: 130 },
  { id: 'lst-13', slug: 'poultrycare-amox', name: 'PoultryCare Amox', brand: 'VetCare', category: 'Veterinary', priceMinor: 96000, kind: 'product', restricted: true, pack: [100, 'g'], weight: 120 },
  { id: 'lst-14', slug: 'drone-spraying', name: 'Drone Spraying Service', brand: 'AgroShield', category: 'Service', priceMinor: 450000, kind: 'service' },
  { id: 'lst-15', slug: 'soil-health-test', name: 'Soil Health Test', brand: 'AgroLab', category: 'Service', priceMinor: 120000, kind: 'service' },
  { id: 'lst-16', slug: 'agronomist-consultation', name: 'Agronomist Consultation', brand: 'AgroLab', category: 'Service', priceMinor: 80000, kind: 'service' },
  { id: 'lst-17', slug: 'crop-disease-diagnosis', name: 'Crop Disease Diagnosis', brand: 'AgroLab', category: 'Service', priceMinor: 95000, kind: 'service' },
]

/** Named ids so tests and review scripts can reach specific states directly. */
export const SEED = {
  readyListingId: 'lst-09',
  listingWithUnverifiedCertificateId: 'lst-03',
  listingWithoutImageId: 'lst-08',
  listingWithFlaggedImageId: 'lst-11',
  serviceId: 'lst-14',
  ownOrderId: 'ord-01',
  partnerOrderId: 'ord-02',
  confirmedOrderId: 'ord-01',
  assignmentWithCoordsId: 'shp-01',
  assignmentWithoutCoordsId: 'shp-02',
  assignmentWithRestrictedItemId: 'shp-01',
  onlyAdminMembershipId: 'mem-01',
  employeeMembershipId: 'mem-02',
} as const

export function buildListings(): Listing[] {
  return CATALOGUE.map((s, i) => {
    const noImage = s.id === SEED.listingWithoutImageId
    const flagged = s.id === SEED.listingWithFlaggedImageId
    return {
      id: s.id,
      kind: s.kind,
      sku: s.slug.toUpperCase().replace(/-/g, '_'),
      slug: s.slug,
      name: s.name,
      brand: s.brand,
      categoryId: `cat-${s.category.toLowerCase()}`,
      categoryName: s.category,
      status: i < 11 ? 'active' : i < 14 ? 'draft' : 'paused',
      isBlocked: false,
      publishedAt: i < 11 ? iso(40 - i) : null,
      price: bdt(s.priceMinor),
      ratingAverage: i % 4 === 0 ? null : 3.6 + ((i * 7) % 13) / 10,
      ratingCount: (i * 13) % 90,
      media: noImage
        ? []
        : [{
            id: `med-${s.id}`,
            url: `/api/v1/media/${s.slug}/primary.jpg`,
            contentType: 'image/jpeg',
            isPrimary: true,
            displayOrder: 0,
            reviewStatus: flagged ? 'flagged' : 'approved',
            duplicateOfListingId: flagged ? 'lst-12' : null,
          }],
      packSize: s.pack?.[0] ?? null,
      unitCode: s.pack?.[1] ?? null,
      packsPerCase: s.kind === 'product' ? 10 : null,
      grossWeightGrams: s.weight ?? null,
      isRestricted: Boolean(s.restricted),
      requiredCertificateTypes: s.restricted ? ['product_registration'] : [],
      attachedCertificateIds: s.restricted ? [`crt-${s.id}`] : [],
    }
  })
}

export function buildCertificates(): Certificate[] {
  return CATALOGUE.filter((s) => s.restricted).map((s) => ({
    id: `crt-${s.id}`,
    subjectType: 'listing' as const,
    listingId: s.id,
    certificateType: 'product_registration' as const,
    certificateNumber: `PR-${s.slug.slice(0, 6).toUpperCase()}-2026`,
    issuingAuthority: 'Department of Agricultural Extension',
    issuedOn: '2025-03-14',
    expiresOn: s.id === 'lst-05' ? '2026-10-01' : '2028-03-13',
    // lst-03 is deliberately still under review — it drives the publish-gate test.
    status: s.id === SEED.listingWithUnverifiedCertificateId ? 'under_review' : 'verified',
    rejectionReason: null,
    documentUrl: `/api/v1/certificates/crt-${s.id}/document`,
  }))
}

export function buildOrganisation(): Organisation {
  return {
    id: ORG_ID,
    slug: 'agroshield-bd',
    legalName: 'AgroShield Bangladesh Ltd.',
    kind: 'manufacturer',
    tradeLicenceNo: 'TRAD/DNCC/043912/2024',
    binNumber: '004311829-0203',
    tinNumber: '412886539104',
    verificationStatus: 'verified',
    verifiedAt: iso(120),
    // C14 — assigned by the platform, never editable here.
    deliveryMode: 'both',
    deliveryModeAssignedAt: iso(120),
    isBlacklisted: false,
    status: 'active',
    contactPhone: '+8801711002233',
    contactEmail: 'ops@agroshield.com.bd',
    addressLine: 'House 42, Road 11, Banani, Dhaka 1213',
  }
}

export function buildIdentityDocuments(): IdentityDocument[] {
  return [
    { id: 'idd-01', kind: 'nid', maskedNumber: '••••0123', status: 'verified', uploadedAt: iso(125) },
    { id: 'idd-02', kind: 'tin', maskedNumber: '••••9104', status: 'verified', uploadedAt: iso(125) },
  ]
}

function line(n: number, l: Listing, qty: number): OrderLine {
  return {
    id: `oln-${l.id}-${n}`,
    lineNumber: n,
    listingId: l.id,
    skuSnapshot: l.sku,
    nameSnapshot: l.name,
    quantity: qty,
    unitCode: l.unitCode,
    packSize: l.packSize,
    grossWeightGrams: l.grossWeightGrams,
    isRestricted: l.isRestricted,
    unitPrice: l.price,
    lineTotal: bdt(l.price.amountMinor * qty),
    fulfilledQuantity: 0,
  }
}

export function buildOrders(listings: Listing[]): OrderDetail[] {
  const byId = (id: string) => listings.find((l) => l.id === id)!
  const mk = (
    id: string, number: string, status: OrderDetail['status'],
    deliveryType: OrderDetail['deliveryType'], buyer: string, lines: OrderLine[],
    address: string, days: number, coords: [number, number] | null,
  ): OrderDetail => {
    const subtotal = lines.reduce((s, l) => s + l.lineTotal.amountMinor, 0)
    const commission = Math.round(subtotal * 0.1)
    return {
      id, orderNumber: number, status, deliveryType, buyerName: buyer,
      placedAt: iso(days), grandTotal: bdt(subtotal), lineCount: lines.length,
      lines,
      subtotal: bdt(subtotal),
      discountTotal: bdt(0),
      deliveryCharge: bdt(0),
      commissionTotal: bdt(commission),
      sellerNet: bdt(subtotal - commission),
      deliveryAddress: address,
      deliveryContactPhone: '+8801812345678',
      deliveryGeographyName: address.split(',').pop()!.trim(),
      location: coords
        ? { lat: coords[0], lng: coords[1], precision: 'exact' as const }
        : { lat: null, lng: null, precision: 'none' as const },
      history: [
        { id: `${id}-h1`, fromStatus: null, toStatus: 'pending_payment', reason: null, changedBy: buyer, occurredAt: iso(days) },
        { id: `${id}-h2`, fromStatus: 'pending_payment', toStatus: 'paid', reason: null, changedBy: 'system', occurredAt: iso(days) },
        { id: `${id}-h3`, fromStatus: 'paid', toStatus: 'confirmed', reason: null, changedBy: 'system', occurredAt: iso(days) },
      ],
      shipment: null,
      currentStep: 'confirmed',
      availableTransitions: [],
    }
  }

  return [
    mk('ord-01', 'AM-2026-004311', 'confirmed', 'own', 'Karim Traders',
       [line(1, byId('lst-01'), 20), line(2, byId('lst-03'), 6)], 'Village Road 4, Savar, Dhaka', 3, [23.8583, 90.2667]),
    mk('ord-02', 'AM-2026-004312', 'confirmed', 'partner', 'Rahim Agro Store',
       [line(1, byId('lst-07'), 12)], 'Bazar Para, Bogura Sadar, Bogura', 4, [24.8465, 89.3773]),
    mk('ord-03', 'AM-2026-004313', 'processing', 'own', 'Sunrise Farms',
       [line(1, byId('lst-11'), 3), line(2, byId('lst-10'), 8)], 'Char Bhadrasan, Faridpur', 6, [23.4607, 89.8429]),
    mk('ord-04', 'AM-2026-004314', 'shipped', 'partner', 'Green Valley Ltd',
       [line(1, byId('lst-02'), 30)], 'Kotwali, Comilla', 8, [23.4607, 91.1809]),
    mk('ord-05', 'AM-2026-004315', 'delivered', 'own', 'Meherpur Krishi',
       [line(1, byId('lst-09'), 10)], 'Gangni, Meherpur', 14, null),
    mk('ord-06', 'AM-2026-004316', 'completed', 'partner', 'Delta Agro',
       [line(1, byId('lst-13'), 24)], 'Rupsha, Khulna', 21, [22.7965, 89.5762]),
    mk('ord-07', 'AM-2026-004317', 'confirmed', 'own', 'Padma Seeds',
       [line(1, byId('lst-08'), 40)], 'Charghat, Rajshahi', 2, null),
    mk('ord-08', 'AM-2026-004318', 'cancelled', 'partner', 'Hill Tract Agro',
       [line(1, byId('lst-12'), 1)], 'Rangamati Sadar, Rangamati', 30, [22.6533, 92.1752]),
  ]
}

export function buildStock(listings: Listing[]): StockRow[] {
  return listings
    .filter((l) => l.kind === 'product')
    .map((l, i) => ({
      listingId: l.id,
      sku: l.sku,
      name: l.name,
      onHand: [4, 180, 62, 9, 240, 31, 0, 88, 150, 27, 12, 5, 96][i] ?? 40,
      reserved: i % 3,
      reorderPoint: [20, 60, 40, 25, 80, 30, 15, 50, 60, 30, 10, 8, 40][i] ?? 20,
      unitCode: l.unitCode,
      warehouseName: i % 2 ? 'Dhaka Central' : 'Bogura Depot',
    }))
}

export function buildMembers(): Member[] {
  const u = (id: string, name: string, phone: string) => ({
    id, fullName: name, phoneE164: phone, email: null,
    preferredLocale: 'bn-BD' as const, status: 'active' as const, lastLoginAt: iso(1),
  })
  return [
    { membershipId: 'mem-01', user: u(USER_ID, 'Nasrin Akter', '+8801711002233'), role: 'owner', status: 'active', joinedAt: iso(400), overrides: [] },
    { membershipId: 'mem-02', user: u('usr-02', 'Sajid Hasan', '+8801711002244'), role: 'manager', status: 'active', joinedAt: iso(210), overrides: [] },
    { membershipId: 'mem-03', user: u('usr-03', 'Rubel Mia', '+8801711002255'), role: 'delivery_man', status: 'active', joinedAt: iso(90), overrides: [] },
    { membershipId: 'mem-04', user: u('usr-04', 'Farhana Islam', '+8801711002266'), role: 'manager', status: 'active', joinedAt: iso(45), overrides: [{ permission: 'payout.request', effect: 'deny' }] },
  ]
}

export function buildDiscounts(): Discount[] {
  const d = (n: number) => new Date(Date.now() + n * 864e5).toISOString()
  return [
    // These two deliberately collide: a type-wide offer and a single-product
    // offer over the same days, at equal priority and neither stackable. That
    // is the ambiguous case the editor refuses to save.
    { id: 'off-01', code: 'INSECT10', name: 'Insecticide season 10%', basis: 'percentage', discountPercent: 10, discountAmount: null, maxDiscount: bdt(50000), minOrder: bdt(100000), scope: { kind: 'category', categoryId: 'cat-insecticide' }, startsAt: d(-10), endsAt: d(20), status: 'active', isStackable: false, stackPriority: 5, stackGroup: null, maxRedemptions: 500, redemptionCount: 143 },
    { id: 'off-02', code: 'SONAR50', name: '৳500 off Sonar 20SL', basis: 'fixed', discountPercent: null, discountAmount: bdt(50000), maxDiscount: null, minOrder: bdt(200000), scope: { kind: 'listing', listingIds: ['lst-01'] }, startsAt: d(-5), endsAt: d(15), status: 'active', isStackable: false, stackPriority: 5, stackGroup: null, maxRedemptions: null, redemptionCount: 22 },
    { id: 'off-03', code: 'FUNGI15', name: 'Fungicide pre-monsoon 15%', basis: 'percentage', discountPercent: 15, discountAmount: null, maxDiscount: null, minOrder: null, scope: { kind: 'category', categoryId: 'cat-fungicide' }, startsAt: d(3), endsAt: d(45), status: 'draft', isStackable: true, stackPriority: 2, stackGroup: 'seasonal', maxRedemptions: null, redemptionCount: 0 },
    { id: 'off-04', code: 'BIO8', name: 'Bio-pesticide 8%', basis: 'percentage', discountPercent: 8, discountAmount: null, maxDiscount: null, minOrder: null, scope: { kind: 'category', categoryId: 'cat-bio-pesticide' }, startsAt: d(-2), endsAt: d(30), status: 'active', isStackable: true, stackPriority: 3, stackGroup: 'seasonal', maxRedemptions: null, redemptionCount: 17 },
    { id: 'off-05', code: 'VET5', name: 'Veterinary 5%', basis: 'percentage', discountPercent: 5, discountAmount: null, maxDiscount: null, minOrder: null, scope: { kind: 'category', categoryId: 'cat-veterinary' }, startsAt: d(-60), endsAt: d(-2), status: 'expired', isStackable: false, stackPriority: 1, stackGroup: null, maxRedemptions: null, redemptionCount: 61 },
  ]
}

export function buildAssignments(listings: Listing[]): DeliveryAssignment[] {
  const byId = (id: string) => listings.find((l) => l.id === id)!
  return [
    {
      shipmentId: 'shp-01', orderId: 'ord-03', orderNumber: 'AM-2026-004313', status: 'assigned',
      assignedAt: iso(0), buyerName: 'Sunrise Farms', buyerPhone: '+8801812345678',
      deliveryAddress: 'Char Bhadrasan, Faridpur', geographyName: 'Faridpur',
      location: { lat: 23.4607, lng: 89.8429, precision: 'exact' },
      lines: [line(1, byId('lst-03'), 6), line(2, byId('lst-10'), 8)],
      totalWeightGrams: 206600, hasRestrictedItems: true, deliveredAt: null,
    },
    {
      // The common case until the Flutter app ships coordinate capture (R1).
      shipmentId: 'shp-02', orderId: 'ord-05', orderNumber: 'AM-2026-004315', status: 'assigned',
      assignedAt: iso(0), buyerName: 'Meherpur Krishi', buyerPhone: '+8801912345678',
      deliveryAddress: 'Gangni Bazar, Gangni, Meherpur', geographyName: 'Meherpur',
      location: { lat: null, lng: null, precision: 'none' },
      lines: [line(1, byId('lst-09'), 10)],
      totalWeightGrams: 50000, hasRestrictedItems: false, deliveredAt: null,
    },
    {
      shipmentId: 'shp-03', orderId: 'ord-06', orderNumber: 'AM-2026-004316', status: 'delivered',
      assignedAt: iso(20), buyerName: 'Delta Agro', buyerPhone: '+8801612345678',
      deliveryAddress: 'Rupsha, Khulna', geographyName: 'Khulna',
      location: { lat: 22.7965, lng: 89.5762, precision: 'exact' },
      lines: [line(1, byId('lst-13'), 24)],
      totalWeightGrams: 3120, hasRestrictedItems: true, deliveredAt: iso(19),
    },
  ]
}

export function buildReviews(): Review[] {
  return [
    { id: 'rev-01', listingId: 'lst-01', listingName: 'Urea 46% (BADC)', buyerName: 'Karim Traders', rating: 5, body: 'Good quality, delivered on time.', createdAt: iso(5), response: null },
    { id: 'rev-02', listingId: 'lst-03', listingName: 'Sonar 20SL Insecticide', buyerName: 'Sunrise Farms', rating: 3, body: 'Effective but packaging was damaged.', createdAt: iso(9), response: { body: 'Sorry about that — we have changed the outer carton.', respondedAt: iso(8) } },
    { id: 'rev-03', listingId: 'lst-11', listingName: 'Knapsack Sprayer 16L', buyerName: 'Green Valley Ltd', rating: 4, body: 'Sturdy build.', createdAt: iso(12), response: null },
  ]
}

export function buildPayouts(): Payout[] {
  return [
    { id: 'pay-01', reference: 'PO-2026-0087', amount: bdt(4820000), status: 'paid', requestedAt: iso(30), paidAt: iso(27), deductions: [{ label: 'Platform commission', amount: bdt(535000) }, { label: 'Refunds', amount: bdt(64000) }] },
    { id: 'pay-02', reference: 'PO-2026-0102', amount: bdt(2140000), status: 'approved', requestedAt: iso(6), paidAt: null, deductions: [{ label: 'Platform commission', amount: bdt(238000) }] },
  ]
}

export function buildNotifications(): AppNotification[] {
  return [
    { id: 'ntf-01', kind: 'order', title: 'New order AM-2026-004317', body: 'Padma Seeds placed an order for ৳12,400.00', createdAt: iso(0), readAt: null, link: '/orders/ord-07' },
    { id: 'ntf-02', kind: 'verification', title: 'Certificate expiring', body: 'FungiStop 70WP registration expires in 25 days.', createdAt: iso(1), readAt: null, link: '/verification' },
    { id: 'ntf-03', kind: 'discount', title: 'Discount ending soon', body: 'UREA50 ends in 15 days.', createdAt: iso(2), readAt: iso(1), link: '/discounts' },
  ]
}

export function buildSolutions(): Solution[] {
  return [
    { id: 'sol-01', title: 'Boro rice starter pack', target: 'Boro paddy, 1 bigha', includes: ['BRRI Dhan89 seed 10kg', 'Urea 46% 50kg', 'Soil health test'], price: bdt(285000), status: 'active', buyersEnrolled: 34 },
    { id: 'sol-02', title: 'Tomato pest shield', target: 'Winter tomato', includes: ['BARI Tomato 14 seed', 'BioGuard 50EC', 'Agronomist consultation'], price: bdt(198000), status: 'draft', buyersEnrolled: 0 },
  ]
}
