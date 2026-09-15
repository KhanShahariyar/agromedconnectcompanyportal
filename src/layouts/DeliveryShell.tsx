import type { ReactNode } from 'react'
import { NavLink } from 'react-router-dom'
import { LogOut } from 'lucide-react'
import { Logo } from '@/ui/Logo'
import { useT } from '@/i18n/LocaleProvider'
import { DELIVERY_NAV } from './NavConfig'
import { LocaleToggle } from './LocaleToggle'

export function DeliveryShell({ userName, onSignOut, children }: {
  userName: string
  onSignOut: () => void
  children: ReactNode
}) {
  const t = useT()
  return (
    <div className="flex min-h-screen flex-col bg-base">
      <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-line bg-panel px-4">
        <Logo size={32} />
        <div className="min-w-0 leading-tight">
          <div className="truncate font-serif text-sm text-ink">{t('nav.deliveries')}</div>
          <div className="truncate text-[11px] text-ink-faint">{userName}</div>
        </div>
        <div className="flex-1" />
        <LocaleToggle />
        <button onClick={onSignOut} aria-label={t('action.signOut')} className="min-h-touch min-w-touch text-ink-soft">
          <LogOut size={18} />
        </button>
      </header>

      <main className="flex-1 px-4 pb-24 pt-4">{children}</main>

      <nav
        aria-label={t('nav.deliveries')}
        className="fixed inset-x-0 bottom-0 z-30 flex border-t border-line bg-panel"
      >
        {DELIVERY_NAV.map(({ to, labelKey, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `flex min-h-touch flex-1 flex-col items-center justify-center gap-1 py-2 text-xs ${
                isActive ? 'font-medium text-primary' : 'text-ink-soft'
              }`
            }
          >
            <Icon size={20} aria-hidden />
            {t(labelKey)}
          </NavLink>
        ))}
      </nav>
    </div>
  )
}
