import { describe, it, expect, vi } from 'vitest'
import { renderHook, waitFor, act } from '@testing-library/react'
import { useQuery } from './useQuery'

describe('useQuery', () => {
  it('reports loading, then data', async () => {
    const { result } = renderHook(() => useQuery(['k'], async () => 42))
    expect(result.current.loading).toBe(true)
    await waitFor(() => expect(result.current.data).toBe(42))
    expect(result.current.loading).toBe(false)
  })

  it('reports an ApiProblem rather than throwing', async () => {
    const boom = { code: 'boom', title: 'Boom', status: 500, type: 't' }
    const { result } = renderHook(() => useQuery(['k'], async () => { throw boom }))
    await waitFor(() => expect(result.current.error).toEqual(boom))
  })

  it('refetches on demand', async () => {
    let n = 0
    const { result } = renderHook(() => useQuery(['k'], async () => ++n))
    await waitFor(() => expect(result.current.data).toBe(1))
    act(() => result.current.refetch())
    await waitFor(() => expect(result.current.data).toBe(2))
  })

  it('discards a slow earlier response when the key changes', async () => {
    const fn = vi.fn()
      .mockImplementationOnce(() => new Promise((r) => setTimeout(() => r('stale'), 50)))
      .mockImplementationOnce(() => Promise.resolve('fresh'))
    const { result, rerender } = renderHook(({ k }) => useQuery([k], fn as () => Promise<string>), {
      initialProps: { k: 'a' },
    })
    rerender({ k: 'b' })
    await waitFor(() => expect(result.current.data).toBe('fresh'))
    await new Promise((r) => setTimeout(r, 80))
    expect(result.current.data).toBe('fresh')
  })
})
