import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { useData } from '@/data/DataProvider'
import { ROLE_PERMISSIONS } from '@/access/can'
import type { AccessContext } from '@/access/can'
import type { ApiProblem, Session } from '@/data/contracts'

export const RETURN_TO_KEY = 'agromed.returnTo'

/**
 * The key this used to write a refresh token to, kept only so it can be erased.
 *
 * Removing the code that writes a secret does not remove the secret. Anyone who
 * signed in before the cookie existed still has a live thirty-day refresh token
 * in their browser's session storage, readable by any injected script -- which
 * is the whole reason it moved. So the first load after this change deletes it,
 * and this constant can go once no session predates the cookie.
 */
const LEGACY_REFRESH_KEY = 'agromed.refresh'

interface SessionContextValue {
  session: Session | null
  loading: boolean
  /** True on first paint, while the refresh cookie is being redeemed. */
  restoring: boolean
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
  // Only meaningful when there is a server to ask; the mock adapter has nothing
  // to restore from and must not hold the UI on a promise that never resolves.
  const [restoring, setRestoring] = useState(!initial && !!useData().restoreSession)
  const api = useData()

  /**
   * The access token lives in memory and the refresh token in an HttpOnly
   * cookie the portal cannot read.
   *
   * That cookie is what replaced the sessionStorage write this used to do. The
   * comment here called it Phase 2 debt and it was right to: a stored refresh
   * token is reachable by any injected script, and it is the long-lived half of
   * the credential — losing it is much worse than losing a fifteen-minute
   * access token. The API sets the cookie now, so the debt is paid rather than
   * documented.
   */
  const setSession = useCallback((s: Session) => {
    setSessionState(s)
  }, [])

  /**
   * Redeems the refresh cookie once, on load.
   *
   * Without it the portal dropped its session on every reload — and on a
   * middle-click into a new tab — leaving the user at the sign-in screen with
   * their work behind them. There was no rotation either, so a session simply
   * stopped working after fifteen minutes and every screen started failing at
   * once.
   */
  // Clear the pre-cookie leftovers before anything else touches storage.
  useEffect(() => {
    try {
      sessionStorage.removeItem(LEGACY_REFRESH_KEY)
      localStorage.removeItem(LEGACY_REFRESH_KEY)
    } catch { /* private browsing: nothing was stored to begin with */ }
  }, [])

  useEffect(() => {
    if (!api.restoreSession) return
    let cancelled = false
    api.restoreSession()
      .then((s) => { if (!cancelled && s) setSessionState(s) })
      .finally(() => { if (!cancelled) setRestoring(false) })
    return () => { cancelled = true }
  }, [api])

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
    // The server clears the cookie; there is nothing left here to clear.
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
    () => ({ session, loading, restoring, error, signIn, signOut, setSession, access }),
    [session, loading, restoring, error, signIn, signOut, setSession, access],
  )
  return <SessionCtx.Provider value={value}>{children}</SessionCtx.Provider>
}

export function useSession(): SessionContextValue {
  const ctx = useContext(SessionCtx)
  if (!ctx) throw new Error('useSession must be used inside <SessionProvider>')
  return ctx
}
