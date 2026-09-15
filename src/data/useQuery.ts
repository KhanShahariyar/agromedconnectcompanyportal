import { useCallback, useEffect, useRef, useState } from 'react'
import type { ApiProblem } from './contracts'

export interface QueryResult<T> {
  data?: T
  loading: boolean
  error?: ApiProblem
  refetch: () => void
}

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
