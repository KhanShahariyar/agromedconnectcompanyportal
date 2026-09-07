import { useCallback, useEffect, useRef, useState } from 'react'
import type { ApiProblem } from './contracts'

export interface QueryResult<T> {
  data?: T
  loading: boolean
  error?: ApiProblem
  refetch: () => void
}

/**
 * The hook every screen uses, which is what makes C8 (loading / empty / error /
 * data on every screen) mechanical rather than a matter of discipline.
 *
 * The cancellation flag is load-bearing: without it, switching locale or a
 * filter fast enough lets a slow earlier response overwrite a newer one, and
 * the screen shows data for a query the user has already moved on from.
 */
export function useQuery<T>(key: unknown[], fn: () => Promise<T>): QueryResult<T> {
  const [state, setState] = useState<{ data?: T; loading: boolean; error?: ApiProblem }>({ loading: true })
  const serial = JSON.stringify(key)
  const fnRef = useRef(fn)
  fnRef.current = fn
  const [nonce, setNonce] = useState(0)

  useEffect(() => {
    let cancelled = false
    setState((s) => ({ ...s, loading: true, error: undefined }))
    fnRef.current().then(
      (data) => { if (!cancelled) setState({ data, loading: false }) },
      (error: ApiProblem) => { if (!cancelled) setState({ loading: false, error }) },
    )
    return () => { cancelled = true }
  }, [serial, nonce])

  const refetch = useCallback(() => setNonce((n) => n + 1), [])
  return { ...state, refetch }
}
