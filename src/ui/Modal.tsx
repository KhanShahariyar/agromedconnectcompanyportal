import { useEffect, useRef } from 'react'
import type { ReactNode } from 'react'
import { useT } from '@/i18n/LocaleProvider'
import { Button } from './primitives'

export function Modal({ open, title, children, onClose, footer }: {
  open: boolean
  title: string
  children: ReactNode
  onClose: () => void
  footer?: ReactNode
}) {
  const t = useT()
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    ref.current?.focus()
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4">
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        tabIndex={-1}
        className="w-full max-w-lg rounded-card border border-line bg-panel p-6 shadow-lift focus:outline-none"
      >
        <h2 className="font-serif text-lg text-ink">{title}</h2>
        <div className="mt-3 text-sm text-ink-soft">{children}</div>
        <div className="mt-6 flex justify-end gap-2">
          {footer ?? <Button variant="secondary" onClick={onClose}>{t('action.cancel')}</Button>}
        </div>
      </div>
    </div>
  )
}

export function Tabs<T extends string>({ tabs, active, onChange }: {
  tabs: { key: T; label: string }[]
  active: T
  onChange: (k: T) => void
}) {
  return (
    <div role="tablist" className="mb-4 flex gap-1 border-b border-line">
      {tabs.map((tab) => (
        <button
          key={tab.key}
          role="tab"
          aria-selected={tab.key === active}
          onClick={() => onChange(tab.key)}
          className={`min-h-touch px-3 py-2 text-sm transition-colors ${
            tab.key === active ? 'border-b-2 border-primary font-medium text-primary' : 'text-ink-soft hover:text-ink'
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  )
}
