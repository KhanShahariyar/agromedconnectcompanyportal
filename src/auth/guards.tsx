import { Navigate, useLocation } from 'react-router-dom'
import type { ReactNode } from 'react'
import { useSession, RETURN_TO_KEY } from './SessionProvider'

/** Sends an unauthenticated visitor to sign-in, remembering where they meant to go. */
export function RequireAuth({ children }: { children: ReactNode }) {
  const { session } = useSession()
  const location = useLocation()

  if (!session) {
    try {
      sessionStorage.setItem(RETURN_TO_KEY, location.pathname + location.search)
    } catch { /* the redirect still works, it just lands on the dashboard */ }
    return <Navigate to="/login" replace />
  }
  return <>{children}</>
}

/**
 * Keeps a delivery_man out of company routes even by direct URL. This is a
 * usability guard, not a security boundary — the server's RLS is that.
 */
export function RequireCompanyRole({ children }: { children: ReactNode }) {
  const { session } = useSession()
  if (session?.role === 'delivery_man') {
    return (
      <div role="alert" className="mx-auto mt-16 max-w-md rounded-card border border-line bg-panel p-6 text-center">
        <p className="text-ink">This section is not available for your role.</p>
        <a href="/deliveries" className="mt-3 inline-block text-primary underline">Go to my deliveries</a>
      </div>
    )
  }
  return <>{children}</>
}

export function consumeReturnTo(): string {
  try {
    const v = sessionStorage.getItem(RETURN_TO_KEY)
    sessionStorage.removeItem(RETURN_TO_KEY)
    return v ?? '/'
  } catch {
    return '/'
  }
}
