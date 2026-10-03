import { Navigate, useLocation } from 'react-router-dom'
import type { ReactNode } from 'react'
import { useSession, RETURN_TO_KEY } from './SessionProvider'

export function RequireAuth({ children }: { children: ReactNode }) {
  const { session, restoring } = useSession()
  const location = useLocation()

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
    } catch { void 0 }
    return <Navigate to="/login" replace />
  }
  return <>{children}</>
}

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
