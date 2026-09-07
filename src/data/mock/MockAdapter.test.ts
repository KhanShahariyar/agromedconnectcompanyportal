import { describe, it, expect, beforeEach } from 'vitest'
import { MockAdapter } from './MockAdapter'

let api: MockAdapter
beforeEach(() => { api = new MockAdapter({ latencyMs: 0 }) })

describe('MockAdapter', () => {
  it('paginates every list from the first fixture (C10)', async () => {
    const p = await api.listListings({ page: 1, pageSize: 5 })
    expect(p.items).toHaveLength(5)
    expect(p.total).toBeGreaterThan(5)
    expect(p.page).toBe(1)
  })

  it('filters by search term', async () => {
    const all = await api.listListings({ page: 1, pageSize: 100 })
    const term = all.items[0]!.name.slice(0, 4)
    const hit = await api.listListings({ page: 1, pageSize: 100, search: term })
    expect(hit.total).toBeLessThanOrEqual(all.total)
    expect(hit.items.every((l) => l.name.toLowerCase().includes(term.toLowerCase()))).toBe(true)
  })

  it('returns money as minor units plus a display string, never a float (C2)', async () => {
    const { items } = await api.listListings({ page: 1, pageSize: 1 })
    const price = items[0]!.price
    expect(Number.isInteger(price.amountMinor)).toBe(true)
    expect(price.currency).toBe('BDT')
    expect(price.display).not.toBe('')
  })

  it('refuses to publish a listing whose certificate is unverified', async () => {
    const id = api.seed.listingWithUnverifiedCertificateId
    const readiness = await api.getPublishReadiness(id)
    expect(readiness.canPublish).toBe(false)
    expect(readiness.blockers).toContain('certificate_not_verified')
    await expect(api.publishListing(id)).rejects.toMatchObject({ code: 'listing_not_publishable' })
  })

  it('refuses to publish a listing with no primary image', async () => {
    const readiness = await api.getPublishReadiness(api.seed.listingWithoutImageId)
    expect(readiness.blockers).toContain('no_primary_image')
  })

  it('publishes a listing that clears every blocker', async () => {
    const l = await api.publishListing(api.seed.readyListingId)
    expect(l.status).toBe('active')
    expect(l.publishedAt).toBeTruthy()
  })

  it('exposes deliveryMode as read-only platform state (C14)', async () => {
    const org = await api.getOrganisation()
    expect(['own', 'partner', 'both']).toContain(org.deliveryMode)
    await expect(
      api.updateOrganisation({ deliveryMode: 'own' } as never),
    ).rejects.toMatchObject({ code: 'delivery_mode_not_self_assignable' })
  })

  it('records an audit entry on every order transition', async () => {
    const before = await api.getOrder(api.seed.confirmedOrderId)
    const after = await api.advanceOrder(before.id, 'processing')
    expect(after.history.length).toBe(before.history.length + 1)
    expect(after.history.at(-1)).toMatchObject({ toStatus: 'processing' })
    expect(after.history.at(-1)!.occurredAt).toBeTruthy()
  })

  it('offers only the transitions the assigned delivery mode permits (C14)', async () => {
    const partner = await api.getOrder(api.seed.partnerOrderId)
    expect(partner.availableTransitions).not.toContain('assigned')
    const own = await api.getOrder(api.seed.ownOrderId)
    expect(own.availableTransitions).not.toContain('handed_to_platform')
  })

  it('returns market aggregates that never name a competitor (R4)', async () => {
    const mi = await api.getMarketIntelligence('12m')
    const serialised = JSON.stringify(mi.regionalDemand)
    expect(serialised).not.toMatch(/legalName|companyName/)
    expect(mi.regionalDemand.every((r) => typeof r.competitorCount === 'number')).toBe(true)
  })

  it('marks low-sample regions as non-disclosable rather than dropping them', async () => {
    const mi = await api.getMarketIntelligence('12m')
    expect(mi.regionalDemand.some((r) => !r.isDisclosable)).toBe(true)
  })

  it('gives delivery assignments an honest precision flag (D3/R1)', async () => {
    const list = await api.listMyAssignments('active')
    expect(list.some((a) => a.location.precision === 'none')).toBe(true)
    for (const a of list) {
      if (a.location.precision === 'none') expect(a.location.lat).toBeNull()
      else expect(typeof a.location.lat).toBe('number')
    }
  })

  it('rejects with an ApiProblem shape, never a bare Error', async () => {
    await expect(api.getOrder('no-such-order')).rejects.toMatchObject({
      code: expect.any(String),
      status: expect.any(Number),
      title: expect.any(String),
    })
  })
})
