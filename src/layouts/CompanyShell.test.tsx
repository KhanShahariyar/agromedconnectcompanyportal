import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { LocaleProvider } from '@/i18n/LocaleProvider'
import { AccessProvider } from '@/access/Gate'
import { ROLE_PERMISSIONS } from '@/access/can'
import { CompanyShell } from './CompanyShell'
import { DeliveryShell } from './DeliveryShell'
import type { VerificationStatus } from '@/data/contracts'

function renderShell(opts: { verificationStatus?: VerificationStatus; role?: 'owner' | 'manager' } = {}) {
  return render(
    <MemoryRouter>
      <LocaleProvider initial="en-US">
        <AccessProvider value={{
          permissions: ROLE_PERMISSIONS[opts.role ?? 'owner'],
          verificationStatus: opts.verificationStatus ?? 'verified',
          isBlacklisted: false,
        }}>
          <CompanyShell
            organisationName="AgroShield Bangladesh Ltd."
            userName="Nasrin Akter"
            verificationStatus={opts.verificationStatus ?? 'verified'}
            onSignOut={() => {}}
          >
            <div>content</div>
          </CompanyShell>
        </AccessProvider>
      </LocaleProvider>
    </MemoryRouter>,
  )
}

describe('CompanyShell', () => {
  it('has no search field in the topbar (C11)', () => {
    renderShell()
    expect(screen.queryByRole('searchbox')).not.toBeInTheDocument()
  })

  it('does not link to any removed section (C11)', () => {
    renderShell()
    for (const gone of [/farmer opportunit/i, /farmer request/i, /promotion/i]) {
      expect(screen.queryByRole('link', { name: gone })).not.toBeInTheDocument()
    }
  })

  it('shows the official logo at 32px beside the wordmark (C13)', () => {
    renderShell()
    expect(screen.getByRole('img', { name: /agromedconnect/i })).toHaveAttribute('width', '32')
  })

  it('shows a verification banner while the company is not verified (D4)', () => {
    renderShell({ verificationStatus: 'pending' })
    expect(screen.getByRole('status')).toHaveTextContent(/verification in progress/i)
  })

  it('hides the banner once verified', () => {
    renderShell({ verificationStatus: 'verified' })
    expect(screen.queryByRole('status')).not.toBeInTheDocument()
  })

  it('offers a locale toggle that swaps the whole shell', async () => {
    renderShell()
    await userEvent.click(screen.getByRole('button', { name: 'বাংলা' }))
    expect(screen.getByRole('link', { name: 'অর্ডার' })).toBeInTheDocument()
  })

  it('hides nav a role cannot use rather than disabling it — a dead link is worse than none', () => {
    renderShell({ role: 'manager' })
    expect(screen.queryByRole('link', { name: /payments/i })).not.toBeInTheDocument()
    renderShell({ role: 'owner' })
    expect(screen.getAllByRole('link', { name: /payments/i }).length).toBeGreaterThan(0)
  })
})

describe('DeliveryShell', () => {
  const renderDelivery = () =>
    render(
      <MemoryRouter>
        <LocaleProvider initial="en-US">
          <DeliveryShell userName="Rubel Mia" onSignOut={() => {}}>
            <div>content</div>
          </DeliveryShell>
        </LocaleProvider>
      </MemoryRouter>,
    )

  it('has no sidebar and uses a bottom tab bar', () => {
    renderDelivery()
    expect(screen.queryByRole('complementary')).not.toBeInTheDocument()
    expect(screen.getByRole('navigation', { name: /deliveries/i })).toBeInTheDocument()
  })

  it('gives every tab a 44px minimum touch target (C12)', () => {
    renderDelivery()
    const tabs = screen.getAllByRole('link')
    expect(tabs.length).toBeGreaterThan(0)
    for (const tab of tabs) expect(tab.className).toMatch(/min-h-touch/)
  })

  it('shows the logo, so the courier sees the same brand as the farmer app (C13)', () => {
    renderDelivery()
    expect(screen.getByRole('img', { name: /agromedconnect/i })).toHaveAttribute('width', '32')
  })
})

describe('CompanyShell scroll safety', () => {
  it('never leaves overflow:hidden on the body after toggling the drawer', async () => {
    // The bug this guards: the lock effect used to save the previous overflow
    // value and restore it on cleanup. On the second toggle it captured its own
    // 'hidden' and restored that forever, so the page stopped scrolling and
    // stayed stopped. Toggling repeatedly must always end unlocked.
    renderShell()
    const toggle = screen.getByRole('button', { name: /show or hide the menu/i })
    for (let i = 0; i < 4; i++) {
      await userEvent.click(toggle)
    }
    expect(document.body.style.overflow).toBe('')
  })

  it('leaves the body unlocked on first render', () => {
    renderShell()
    expect(document.body.style.overflow).toBe('')
  })
})

describe('CompanyShell collapsed rail', () => {
  it('shows icons only, with the label as a tooltip and an accessible name', async () => {
    renderShell()
    await userEvent.click(screen.getByRole('button', { name: /show or hide the menu/i }))

    const links = screen.getAllByRole('link')
    // Every nav link keeps a name for assistive tech even with the text gone.
    for (const link of links) {
      expect(link.getAttribute('aria-label')).toBeTruthy()
      expect(link.getAttribute('title')).toBeTruthy()
      expect(link.textContent?.trim()).toBe('')
    }
  })

  it('restores the labels when expanded again', async () => {
    renderShell()
    const toggle = screen.getByRole('button', { name: /show or hide the menu/i })
    await userEvent.click(toggle)
    await userEvent.click(toggle)
    expect(screen.getByRole('link', { name: 'Orders' })).toBeInTheDocument()
  })
})
