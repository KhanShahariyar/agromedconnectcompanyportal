import type { ReactNode } from 'react'
import { Logo } from '@/ui/Logo'
import { useT } from '@/i18n/LocaleProvider'
import { LocaleToggle } from './LocaleToggle'

export function AuthShell({ title, subtitle, children, footer }: {
  title: string
  subtitle?: string
  children: ReactNode
  footer?: ReactNode
}) {
  const t = useT()
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-base px-4 py-10">
      <div className="mb-6 flex flex-col items-center text-center">
        { }
        <Logo size={96} />
        <div className="mt-3 font-serif text-lg text-ink">{t('app.name')}</div>
        <div className="text-xs text-ink-faint">{t('app.portal')}</div>
      </div>

      <div className="w-full max-w-sm rounded-card border border-line bg-panel p-6 shadow-card">
        <h1 className="font-serif text-xl text-ink">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-ink-soft">{subtitle}</p>}
        <div className="mt-5">{children}</div>
      </div>

      {footer && <div className="mt-4 text-sm text-ink-soft">{footer}</div>}
      <LocaleToggle className="mt-6 bg-panel" />
    </div>
  )
}
