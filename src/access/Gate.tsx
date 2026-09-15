import { createContext, useContext, cloneElement } from 'react'
import type { ReactElement, ReactNode } from 'react'
import { useT } from '@/i18n/LocaleProvider'
import { can } from './can'
import type { AccessContext, Action, Denial } from './can'

const AccessCtx = createContext<AccessContext | null>(null)

export function AccessProvider({ value, children }: { value: AccessContext; children: ReactNode }) {
  return <AccessCtx.Provider value={value}>{children}</AccessCtx.Provider>
}

export function useAccess(): AccessContext {
  const ctx = useContext(AccessCtx)
  if (!ctx) throw new Error('useAccess must be used inside <AccessProvider>')
  return ctx
}

export function useCan(): (action: Action) => Denial {
  const ctx = useAccess()
  return (action: Action) => can(action, ctx)
}

export interface GateProps {
  action: Action
  children: ReactElement

  mode?: 'disable' | 'hide'
}

export function Gate({ action, children, mode = 'disable' }: GateProps) {
  const t = useT()
  const decision = can(action, useAccess())

  if (decision.allowed) return children
  if (mode === 'hide') return null

  const messageKey =
    decision.reason === 'verification' ? 'gate.unverified'
    : decision.reason === 'blacklisted' ? 'gate.blacklisted'
    : 'gate.forbidden'
  const message = t(messageKey)
  const describedById = `gate-${action.replace(/\W/g, '-')}`

  return (
    <span className="inline-flex flex-col gap-1">
      {cloneElement(children as ReactElement<Record<string, unknown>>, {
        disabled: true,
        'aria-describedby': describedById,
      })}
      <span id={describedById} className="text-xs text-ink-faint">{message}</span>
    </span>
  )
}
