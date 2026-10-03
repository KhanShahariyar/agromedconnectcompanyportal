import { useCallback, useEffect, useRef, useState } from 'react'
import type { ApiProblem } from './contracts'

export interface QueryResult<T> {
  data?: T
  loading: boolean
  error?: ApiProblem
  refetch: () => void
}

// Ported from the buyer app's useQuery: every run gets an AbortController that is aborted when the
// key changes or the component unmounts. fn receives its signal; a fetch that forwards it is
// cancelled on the wire, and one that does not is still discarded, as before.
export function useQuery<T>(key: unknown[], fn: (signal: AbortSignal) => Promise<T>): QueryResult<T> {
  const [state, setState] = useState<{ data?: T; loading: boolean; error?: ApiProblem }>({ loading: true })
  const serial = JSON.stringify(key)
  const fnRef = useRef(fn)
  fnRef.current = fn
  const [nonce, setNonce] = useState(0)

  useEffect(() => {
    const controller = new AbortController()
    setState((s) => ({ ...s, loading: true, error: undefined }))
    fnRef.current(controller.signal).then(
      (data) => { if (!controller.signal.aborted) setState({ data, loading: false }) },
      (error: ApiProblem) => { if (!controller.signal.aborted) setState({ loading: false, error }) },
    )
    return () => controller.abort()
  }, [serial, nonce])

  const refetch = useCallback(() => setNonce((n) => n + 1), [])
  return { ...state, refetch }
}
