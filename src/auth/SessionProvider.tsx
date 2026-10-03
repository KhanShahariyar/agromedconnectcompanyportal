import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { useData } from '@/data/DataProvider'
import { ROLE_PERMISSIONS } from '@/access/can'
import { registerPush, unregisterPush } from '@/push/push'
import type { AccessContext } from '@/access/can'
import type { ApiProblem, Session } from '@/data/contracts'

export const RETURN_TO_KEY = 'agromed.returnTo'

const LEGACY_REFRESH_KEY = 'agromed.refresh'

interface SessionContextValue {
  session: Session | null
  loading: boolean

  restoring: boolean
  error?: ApiProblem
  signIn: (identifier: string, password: string) => Promise<void>
  signOut: () => void
  setSession: (s: Session) => void
  access: AccessContext
}

const SessionCtx = createContext<SessionContextValue | null>(null)

export function SessionProvider({ children, initial }: { children: ReactNode; initial?: Session | null }) {

  const [session, setSessionState] = useState<Session | null>(initial ?? null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<ApiProblem | undefined>()

  const [restoring, setRestoring] = useState(!initial && !!useData().restoreSession)
  const api = useData()

  const setSession = useCallback((s: Session) => {
    setSessionState(s)
  }, [])

  useEffect(() => {
    try {
      sessionStorage.removeItem(LEGACY_REFRESH_KEY)
      localStorage.removeItem(LEGACY_REFRESH_KEY)
    } catch { return }
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

    void (async () => {
      await unregisterPush(api.removeDeviceToken.bind(api))
      await api.logout()
    })()
  }, [api])

  const pushUserId = session?.user?.id ?? null
  useEffect(() => {
    if (!pushUserId || !api.restoreSession) return
    void registerPush(
      pushUserId,
      api.registerDeviceToken.bind(api),
      api.removeDeviceToken.bind(api),
    )
  }, [pushUserId, api])

  const access = useMemo<AccessContext>(() => ({

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
