import { useState } from 'react'
import type { ReactNode } from 'react'
import { NavLink } from 'react-router-dom'
import { Menu, X, LogOut } from 'lucide-react'
import { Logo } from '@/ui/Logo'
import { useT } from '@/i18n/LocaleProvider'
import { useCan } from '@/access/Gate'
import type { VerificationStatus } from '@/data/contracts'
import { COMPANY_NAV, COMPANY_NAV_ACCOUNT, COMPANY_NAV_SUPPORT } from './NavConfig'
import type { NavItem } from './NavConfig'
import { LocaleToggle } from './LocaleToggle'

function NavGroup({ items, heading }: { items: NavItem[]; heading?: string }) {
  const t = useT()
  const can = useCan()
  // A nav link to a page the role cannot use is a dead end, so it is removed
  // rather than disabled — the one place the gate hides instead of disabling.
  const visible = items.filter((i) => {
    if (!i.action) return true
    const decision = can(i.action)
    // A link blocked only by verification stays: the company can still prepare
    // that work while review is pending. A role block removes it entirely.
    return decision.allowed || decision.reason === 'verification'
  })

  if (visible.length === 0) return null
  return (
    <div className="mb-5">
      {heading && <div className="mb-1.5 px-3 text-[11px] font-medium text-ink-faint">{heading}</div>}
      <nav className="space-y-0.5">
        {visible.map(({ to, labelKey, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `flex min-h-touch items-center gap-2.5 rounded-md px-3 py-2 text-sm transition-colors ${
                isActive ? 'bg-primary font-medium text-panel' : 'text-ink-soft hover:bg-sunken hover:text-ink'
              }`
            }
          >
            <Icon size={16} strokeWidth={2} aria-hidden />
            <span className="truncate">{t(labelKey)}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  )
}

export function CompanyShell({ organisationName, userName, verificationStatus, onSignOut, children }: {
  organisationName: string
  userName: string
  verificationStatus: VerificationStatus
  onSignOut: () => void
  children: ReactNode
}) {
  const t = useT()
  const [open, setOpen] = useState(false)
  const unverified = verificationStatus !== 'verified'

  return (
    <div className="flex min-h-screen bg-base">
      {open && <div className="fixed inset-0 z-30 bg-ink/30 lg:hidden" onClick={() => setOpen(false)} />}

      <aside
        className={`fixed top-0 z-40 flex h-screen w-[248px] shrink-0 transform flex-col border-r border-line bg-panel transition-transform lg:sticky lg:translate-x-0 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex h-16 shrink-0 items-center justify-between border-b border-line px-4">
          <div className="flex items-center gap-2">
            <Logo size={32} />
            <div className="leading-tight">
              <div className="font-serif text-sm text-ink">{t('app.name')}</div>
              <div className="text-[10px] text-ink-faint">{t('app.portal')}</div>
            </div>
          </div>
          <button className="text-ink-soft lg:hidden" onClick={() => setOpen(false)} aria-label="Close menu">
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-2.5 pt-4">
          <NavGroup items={COMPANY_NAV} />
          <NavGroup items={COMPANY_NAV_ACCOUNT} heading={t('nav.group.company')} />
          <NavGroup items={COMPANY_NAV_SUPPORT} heading={t('nav.group.support')} />
        </div>

        <div className="shrink-0 border-t border-line p-3">
          <div className="truncate px-2 text-sm font-medium text-ink">{organisationName}</div>
          <div className="truncate px-2 text-xs text-ink-faint">{userName}</div>
          <button
            onClick={onSignOut}
            className="mt-2 flex min-h-touch w-full items-center gap-2 rounded-md px-2 text-sm text-ink-soft hover:text-ink"
          >
            <LogOut size={15} aria-hidden /> {t('action.signOut')}
          </button>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-line bg-base/90 px-4 backdrop-blur sm:px-6">
          <button className="text-ink-soft lg:hidden" onClick={() => setOpen(true)} aria-label="Open menu">
            <Menu size={20} />
          </button>
          {/* No search here (C11) — search lives on the lists that need it. */}
          <div className="flex-1" />
          <LocaleToggle />
        </header>

        {unverified && (
          <div role="status" className="border-b border-warning/40 bg-warning/10 px-4 py-2.5 text-sm text-ink sm:px-6">
            {t('gate.unverified')}{' '}
            <NavLink to="/verification" className="font-medium text-primary underline">
              {t('nav.verification')}
            </NavLink>
          </div>
        )}

        <main className="mx-auto w-full max-w-[1400px] flex-1 px-4 py-6 sm:px-6">{children}</main>
      </div>
    </div>
  )
}
