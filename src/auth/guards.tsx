import { Navigate, useLocation } from 'react-router-dom'
import type { ReactNode } from 'react'
import { useSession, RETURN_TO_KEY } from './SessionProvider'

/** Sends an unauthenticated visitor to sign-in, remembering where they meant to go. */
export function RequireAuth({ children }: { children: ReactNode }) {
  const { session, restoring } = useSession()
  const location = useLocation()

  // On first paint the answer is genuinely unknown -- the refresh cookie is
  // still being redeemed. Redirecting now would bounce a signed-in user to the
  // sign-in screen for a moment on every single load, which reads as a bug and
  // loses the route they asked for.
  if (restoring) {
    return (
      <div className="grid min-h-screen place-items-center text-sm text-ink-faint" role="status">
        <span className="sr-only">Restoring your session</span>
        <span aria-hidden>·  ·  ·</span>
      </div>
    )
  }

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
