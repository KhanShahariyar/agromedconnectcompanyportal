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

const DESKTOP = '(min-width: 1024px)'

/** jsdom and any SSR pass have no matchMedia; default to the wide layout. */
function isWide(): boolean {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return true
  return window.matchMedia(DESKTOP).matches
}

function NavGroup({ items, heading, collapsed }: {
  items: NavItem[]
  heading?: string
  collapsed: boolean
}) {
  const t = useT()
  const can = useCan()

  // A nav link to a page the role cannot use is a dead end, so it is removed
  // rather than disabled — the one place the gate hides instead of disabling.
  // A link blocked only by verification stays: the company can still prepare
  // that work while review is pending.
  const visible = items.filter((i) => {
    if (!i.action) return true
    const decision = can(i.action)
    return decision.allowed || decision.reason === 'verification'
  })
  if (visible.length === 0) return null

  return (
    <div className={collapsed ? 'mb-1.5' : 'mb-4'}>
      {heading && !collapsed && (
        <div className="mb-1 px-3 text-[11px] font-medium text-ink-faint">{heading}</div>
      )}
      {/* Collapsed groups are separated by a rule instead of a label, so the
          grouping survives without the words that carry it. */}
      {heading && collapsed && <div className="mx-3 mb-1.5 border-t border-line" />}
      <nav className="space-y-0.5">
        {visible.map(({ to, labelKey, icon: Icon, end }) => {
          const label = t(labelKey)
          return (
            <NavLink
              key={to}
              to={to}
              end={end}
              title={collapsed ? label : undefined}
              aria-label={collapsed ? label : undefined}
              className={({ isActive }) =>
                /*
                 * 38px rows when collapsed, 44 when expanded.
                 *
                 * Nineteen items at 44px need 836px of a 723px rail, so the last
                 * few icons sat below the fold behind a scrollbar nobody looks
                 * for. At 36 they all fit on a 900px screen. The target is still
                 * 48px wide and well past the 24px WCAG minimum, and this rail
                 * is a desktop-only, mouse-driven state — the courier's shell,
                 * which is finger-driven, keeps its 44px targets.
                 */
                `flex items-center rounded-md text-sm transition-colors ${
                  collapsed ? 'min-h-[36px] justify-center px-0' : 'min-h-touch gap-2.5 px-3'
                } ${
                  isActive ? 'bg-primary font-medium text-panel' : 'text-ink-soft hover:bg-sunken hover:text-ink'
                }`
              }
            >
              <Icon size={18} strokeWidth={2} aria-hidden className="shrink-0" />
              {!collapsed && <span className="truncate">{label}</span>}
            </NavLink>
          )
        })}
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
  const [wide, setWide] = useState(isWide)
  // On a wide screen this means "expanded"; on a narrow one, "drawer open".
  const [open, setOpen] = useState(isWide)
  const unverified = verificationStatus !== 'verified'

  useEffect(() => {
    let previous = isWide()
    const onResize = () => {
      const nowWide = isWide()
      setWide(nowWide)
      // Only act when the breakpoint is actually crossed. Reacting to every
      // resize event re-expanded the rail each time the window moved, which
      // overrode a collapse the user had deliberately chosen.
      if (nowWide === previous) return
      previous = nowWide
      if (nowWide) {
        // The overlay is gone, so its page lock must go with it.
        document.body.style.overflow = ''
        setOpen(true)
      } else {
        setOpen(false)
      }
    }
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  /*
   * Lock the page behind the overlay drawer, and unlock it unconditionally.
   *
   * An earlier version saved the previous body overflow and restored it on
   * cleanup. On the second toggle it captured its own 'hidden' and restored
   * that forever, so the page stopped scrolling and stayed stopped. There is
   * only ever one owner of this style, so clearing it outright is correct.
   */
  useEffect(() => {
    if (!open || wide) return
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [open, wide])

  // Collapsed is a desktop state. On a phone the drawer is either over the
  // content at full width, or off-screen — an icon strip there would eat a
  // sixth of a 390px screen to no benefit.
  const collapsed = wide && !open
  const overlayOpen = !wide && open

  return (
    /*
     * The document scrolls. Not a pane.
     *
     * Two earlier attempts got this wrong in opposite directions: one left
     * `height: 100%` on the root chain, which pinned the page to the viewport
     * so everything below the fold was unreachable; the other made the frame
     * `h-screen overflow-hidden` with an inner pane, which stopped the gap and
     * clipped anything larger than the frame. Letting the browser scroll the
     * document is the one arrangement that cannot clip and cannot stick.
     */
    <div className="flex min-h-screen bg-base">
      {overlayOpen && (
        <div className="fixed inset-0 z-30 bg-ink/30 lg:hidden" onClick={() => setOpen(false)} />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-40 flex shrink-0 transform flex-col border-r border-line bg-panel transition-[transform,width] duration-200 lg:sticky lg:top-0 lg:h-screen lg:translate-x-0 ${
          collapsed ? 'w-16' : 'w-[248px]'
        } ${open || wide ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <div className={`flex h-16 shrink-0 items-center border-b border-line ${collapsed ? 'justify-center px-2' : 'justify-between px-4'}`}>
          {collapsed ? (
            <Logo size={32} />
          ) : (
            <>
              <div className="flex min-w-0 items-center gap-2">
                <Logo size={32} />
                <div className="min-w-0 leading-tight">
                  <div className="truncate font-serif text-sm text-ink">{t('app.name')}</div>
                  <div className="truncate text-[10px] text-ink-faint">{t('app.portal')}</div>
                </div>
              </div>
              {/* Closing from inside the panel is a phone gesture; on desktop
                  the header button is always in reach. */}
              <button
                className="min-h-touch min-w-touch shrink-0 text-ink-soft lg:hidden"
                onClick={() => setOpen(false)}
                aria-label={t('nav.closeMenu')}
              >
                <X size={18} />
              </button>
            </>
          )}
        </div>

        <div className={`min-h-0 flex-1 overflow-y-auto ${collapsed ? 'px-2 pt-2' : 'px-2.5 pt-3'}`}>
          <NavGroup items={COMPANY_NAV} collapsed={collapsed} />
          <NavGroup items={COMPANY_NAV_ACCOUNT} heading={t('nav.group.company')} collapsed={collapsed} />
          <NavGroup items={COMPANY_NAV_SUPPORT} heading={t('nav.group.support')} collapsed={collapsed} />
        </div>

        <div className={`shrink-0 border-t border-line ${collapsed ? 'p-2' : 'p-3'}`}>
          {!collapsed && (
            <>
              <div className="truncate px-2 text-sm font-medium text-ink">{organisationName}</div>
              <div className="truncate px-2 text-xs text-ink-faint">{userName}</div>
            </>
          )}
          <button
            onClick={onSignOut}
            title={collapsed ? t('action.signOut') : undefined}
            aria-label={t('action.signOut')}
            className={`mt-2 flex min-h-touch w-full items-center rounded-md text-sm text-ink-soft hover:text-ink ${
              collapsed ? 'justify-center' : 'gap-2 px-2'
            }`}
          >
            <LogOut size={16} aria-hidden />
            {!collapsed && t('action.signOut')}
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
