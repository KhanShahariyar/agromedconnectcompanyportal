import { useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { NavLink } from 'react-router-dom'
import { PanelLeft, X, LogOut } from 'lucide-react'
import { Logo } from '@/ui/Logo'
import { useT } from '@/i18n/LocaleProvider'
import { useCan } from '@/access/Gate'
import type { VerificationStatus } from '@/data/contracts'
import { COMPANY_NAV, COMPANY_NAV_ACCOUNT, COMPANY_NAV_SUPPORT } from './NavConfig'
import type { NavItem } from './NavConfig'
import { LocaleToggle } from './LocaleToggle'

/** jsdom and any SSR pass have no matchMedia; default to the wide layout. */
function isWide(): boolean {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return true
  return window.matchMedia('(min-width: 1024px)').matches
}

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
  // One state, one button, both breakpoints. On a wide screen the rail starts
  // open and collapsing it gives the content the full width; on a narrow one it
  // starts closed and behaves as an overlay drawer.
  const [open, setOpen] = useState(() => isWide())
  const unverified = verificationStatus !== 'verified'

  /*
   * Lock the page behind the overlay drawer, and unlock it unconditionally.
   *
   * An earlier version saved the previous overflow value and restored that on
   * cleanup. On the second toggle it captured its own 'hidden' and restored it
   * forever, so the page stopped scrolling and stayed that way — the "stuck
   * scrolling" this was meant to avoid. There is only ever one owner of this
   * style, so clearing it outright is both simpler and correct.
   */
  useEffect(() => {
    if (!open || isWide()) return
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [open])

  // Following the breakpoint keeps the rail open on a desktop and shut on a
  // phone when the window is resized across it — and guarantees the lock is
  // released on the way to a wide layout.
  useEffect(() => {
    const onResize = () => {
      if (isWide()) {
        document.body.style.overflow = ''
        setOpen(true)
      } else {
        setOpen(false)
      }
    }
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  return (
    /*
     * The document scrolls. Not a pane.
     *
     * Two earlier attempts got this wrong in opposite directions. The first
     * left `height: 100%` on html/body/#root, which pinned the page to the
     * viewport so everything below the fold was unreachable. The second made
     * the frame `h-screen overflow-hidden` with an inner scroll pane, which
     * stopped the gap but clipped anything wider or taller than the frame.
     *
     * Letting the browser scroll the document is the one arrangement that
     * cannot clip and cannot stick: the rail is sticky beside it, the header is
     * sticky above it, and the content is free to be any size it likes.
     */
    <div className="flex min-h-screen bg-base">
      {open && (
        <div className="fixed inset-0 z-30 bg-ink/30 lg:hidden" onClick={() => setOpen(false)} />
      )}

      <aside
        aria-hidden={!open}
        className={`fixed inset-y-0 left-0 z-40 flex w-[248px] shrink-0 transform flex-col border-r border-line bg-panel transition-transform lg:sticky lg:top-0 lg:h-screen ${
          open ? 'translate-x-0' : '-translate-x-full lg:hidden'
        }`}
      >
        <div className="flex h-16 shrink-0 items-center justify-between border-b border-line px-4">
          <div className="flex min-w-0 items-center gap-2">
            <Logo size={32} />
            <div className="min-w-0 leading-tight">
              <div className="truncate font-serif text-sm text-ink">{t('app.name')}</div>
              <div className="truncate text-[10px] text-ink-faint">{t('app.portal')}</div>
            </div>
          </div>
          <button
            className="min-h-touch min-w-touch shrink-0 text-ink-soft"
            onClick={() => setOpen(false)}
            aria-label={t('nav.closeMenu')}
          >
            <X size={18} />
          </button>
        </div>

        {/* The rail scrolls itself, so a long menu on a short screen stays
            reachable instead of hiding under the account block. */}
        <div className="min-h-0 flex-1 overflow-y-auto px-2.5 pt-4">
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

      {/* min-w-0 lets this column shrink instead of forcing the page sideways
          when a wide table or chart sits inside it. */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 flex h-16 shrink-0 items-center gap-3 border-b border-line bg-base/95 px-4 backdrop-blur sm:px-6">
          <button
            className="min-h-touch min-w-touch text-ink-soft"
            onClick={() => setOpen((v) => !v)}
            aria-label={t('nav.toggleMenu')}
            aria-expanded={open}
          >
            <PanelLeft size={20} />
          </button>
          {/* No search here (C11) — search lives on the lists that need it. */}
          <div className="flex-1" />
          <LocaleToggle />
        </header>

        {unverified && (
          <div role="status" className="shrink-0 border-b border-warning/40 bg-warning/10 px-4 py-2.5 text-sm text-ink sm:px-6">
            {t('gate.unverified')}{' '}
            <NavLink to="/verification" className="font-medium text-primary underline">
              {t('nav.verification')}
            </NavLink>
          </div>
        )}

        {/* Fills whatever width the screen gives it — no fixed cap. */}
        <main className="w-full min-w-0 flex-1 px-4 py-6 sm:px-6 lg:px-8">{children}</main>
      </div>
    </div>
  )
}
