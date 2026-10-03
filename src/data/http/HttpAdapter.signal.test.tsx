import { describe, it, expect, vi, afterEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { HttpAdapter } from './HttpAdapter'
import { useQuery } from '../useQuery'

// Cancellation end to end: the signal useQuery creates must reach fetch through withSignal(),
// for a plain method and for one that goes through the paged() helper.
describe('HttpAdapter.withSignal', () => {
  afterEach(() => vi.unstubAllGlobals())

  function pendingFetch() {
    const calls: RequestInit[] = []
    vi.stubGlobal('fetch', vi.fn((_url: string, init: RequestInit) => {
      calls.push(init)
      return new Promise(() => {}) // never settles: the request is still in flight at unmount
    }))
    return calls
  }

  it('aborts an in-flight request when the screen unmounts (Settings → getOrganisation)', async () => {
    const calls = pendingFetch()
    const api = new HttpAdapter({ baseUrl: 'http://api' })

    const { unmount } = renderHook(() =>
      useQuery(['organisation'], (signal) => api.withSignal(signal).getOrganisation()))

    await waitFor(() => expect(calls).toHaveLength(1))
    expect(calls[0].signal?.aborted).toBe(false)
    unmount()
    expect(calls[0].signal?.aborted).toBe(true)
  })

  it('aborts the superseded request when the key changes (OrderList → paged listOrders)', async () => {
    const calls = pendingFetch()
    const api = new HttpAdapter({ baseUrl: 'http://api' })

    const { rerender } = renderHook(({ page }) =>
      useQuery(['orders', page], (signal) => api.withSignal(signal).listOrders({ page, pageSize: 10 })),
      { initialProps: { page: 1 } })

    await waitFor(() => expect(calls).toHaveLength(1))
    rerender({ page: 2 })
    await waitFor(() => expect(calls).toHaveLength(2))
    expect(calls[0].signal?.aborted).toBe(true)
    expect(calls[1].signal?.aborted).toBe(false)
  })

  it('shares the session with the real adapter rather than copying it', async () => {
    const calls = pendingFetch()
    const api = new HttpAdapter({ baseUrl: 'http://api' })
    const view = api.withSignal(new AbortController().signal)

    api.setAccessToken('token-after-view-was-made')
    void view.getOrganisation()

    await waitFor(() => expect(calls).toHaveLength(1))
    expect((calls[0].headers as Record<string, string>).Authorization).toBe('Bearer token-after-view-was-made')
  })
})
