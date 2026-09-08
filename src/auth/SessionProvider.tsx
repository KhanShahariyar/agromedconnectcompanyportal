import { createContext, useCallback, useContext, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { useData } from '@/data/DataProvider'
import { ROLE_PERMISSIONS } from '@/access/can'
import type { AccessContext } from '@/access/can'
import type { ApiProblem, Session } from '@/data/contracts'

const REFRESH_KEY = 'agromed.refresh'
export const RETURN_TO_KEY = 'agromed.returnTo'

interface SessionContextValue {
  session: Session | null
  loading: boolean
  error?: ApiProblem
  signIn: (identifier: string, password: string) => Promise<void>
  signOut: () => void
  setSession: (s: Session) => void
  access: AccessContext
}

const SessionCtx = createContext<SessionContextValue | null>(null)

export function SessionProvider({ children, initial }: { children: ReactNode; initial?: Session | null }) {
  // The access token lives in memory only — localStorage is readable by any
  // injected script.
  const [session, setSessionState] = useState<Session | null>(initial ?? null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<ApiProblem | undefined>()
  const api = useData()

  const setSession = useCallback((s: Session) => {
    setSessionState(s)
    try {
      // PHASE 2 DEBT: this belongs in an httpOnly cookie. Until the API sets
      // one, a stored refresh token is XSS-reachable. Writing the compromise
      // down beats discovering it later.
      sessionStorage.setItem(REFRESH_KEY, s.refreshToken)
    } catch {
      /* private browsing — the session simply does not survive a reload */
    }
  }, [])

  const signIn = useCallback(async (identifier: string, password: string) => {
    setLoading(true)
    setError(undefined)
    try {
      setSession(await api.login(identifier, password))
    } catch (e) {
      setError(e as ApiProblem)
      throw e
    } finally {
      setLoading(false)
    }
  }, [api, setSession])

  const signOut = useCallback(() => {
    setSessionState(null)
    try { sessionStorage.removeItem(REFRESH_KEY) } catch { /* nothing to clear */ }
    void api.logout()
  }, [api])

  const access = useMemo<AccessContext>(() => ({
    // Prefer the server's permission list. It already folds in per-member
    // grants and denials, which a role name alone cannot express. The local
    // role map is the fallback for the mock adapter, which has no server.
    permissions: session
      ? (session.permissions.length > 0 ? session.permissions : ROLE_PERMISSIONS[session.role])
      : [],
    verificationStatus: session?.organisation?.verificationStatus ?? 'unverified',
    isBlacklisted: session?.organisation?.isBlacklisted ?? false,
  }), [session])

  const value = useMemo(
    () => ({ session, loading, error, signIn, signOut, setSession, access }),
    [session, loading, error, signIn, signOut, setSession, access],
  )
  return <SessionCtx.Provider value={value}>{children}</SessionCtx.Provider>
}

export function useSession(): SessionContextValue {
  const ctx = useContext(SessionCtx)
  if (!ctx) throw new Error('useSession must be used inside <SessionProvider>')
  return ctx
}
