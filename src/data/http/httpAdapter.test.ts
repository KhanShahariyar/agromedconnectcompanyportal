import { describe, it, expect, vi, afterEach } from 'vitest'
import { HttpAdapter } from './HttpAdapter'

const originalFetch = globalThis.fetch
afterEach(() => { globalThis.fetch = originalFetch })

function respondWith(status: number, body: unknown) {
  globalThis.fetch = vi.fn(async () => new Response(JSON.stringify(body), {
    status, headers: { 'Content-Type': 'application/json' },
  })) as typeof fetch
}

describe('HttpAdapter auth errors', () => {
  it('surfaces the real reason a sign-in failed, not "session ended"', async () => {

    respondWith(401, {
      code: 'invalid_credentials', title: 'Unauthenticated',
      detail: 'That phone number, email or password is incorrect.',
    })
    const onUnauthorised = vi.fn()
    const api = new HttpAdapter({ baseUrl: 'http://x', onUnauthorised })

    await expect(api.login('01712345678', 'wrong')).rejects.toMatchObject({
      code: 'invalid_credentials',
      detail: 'That phone number, email or password is incorrect.',
    })

    expect(onUnauthorised).not.toHaveBeenCalled()
  })

  it('passes a locked account straight through', async () => {
    respondWith(423, {
      code: 'account_locked', title: 'Locked',
      detail: 'Too many failed attempts. Please try again later.',
    })
    const api = new HttpAdapter({ baseUrl: 'http://x' })
    await expect(api.login('01712345678', 'x')).rejects.toMatchObject({
      code: 'account_locked', status: 423,
    })
  })

  it('still signs the user out when a 401 arrives mid-session', async () => {
    respondWith(401, { code: 'token_expired', title: 'Unauthenticated' })
    const onUnauthorised = vi.fn()
    const api = new HttpAdapter({ baseUrl: 'http://x', onUnauthorised })

    await expect(api.getOrganisation()).rejects.toMatchObject({ code: 'unauthenticated' })
    expect(onUnauthorised).toHaveBeenCalledOnce()
  })

  it('says the network is unreachable rather than blaming the server', async () => {
    globalThis.fetch = vi.fn(async () => { throw new TypeError('failed to fetch') }) as typeof fetch
    const api = new HttpAdapter({ baseUrl: 'http://x' })
    await expect(api.getOrganisation()).rejects.toMatchObject({ code: 'network_unreachable' })
  })
})
