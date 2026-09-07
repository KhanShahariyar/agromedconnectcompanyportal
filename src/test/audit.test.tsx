import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { LocaleProvider } from '@/i18n/LocaleProvider'
import { DataProvider } from '@/data/DataProvider'
import { SessionProvider } from '@/auth/SessionProvider'
import { AccessProvider } from '@/access/Gate'
import { ROLE_PERMISSIONS } from '@/access/can'
import { MockAdapter } from '@/data/mock/MockAdapter'
import { CompanyShell } from '@/layouts/CompanyShell'
import { COMPANY_NAV, COMPANY_NAV_ACCOUNT, COMPANY_NAV_SUPPORT, DELIVERY_NAV } from '@/layouts/NavConfig'
import { Settings } from '@/features/misc/Settings'
import { mayChoosePath } from '@/features/orders/machine'
import { googleMapsDirections } from '@/features/delivery/DeliveryLocation'
import { enUS } from '@/i18n/locales/en-US'
import { bnBD } from '@/i18n/locales/bn-BD'
import type { Locale } from '@/i18n/format'

const SRC = join(process.cwd(), 'src')

function walk(dir: string, out: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry)
    if (statSync(full).isDirectory()) walk(full, out)
    else if (/\.(ts|tsx|css)$/.test(entry)) out.push(full)
  }
  return out
}

function wrap(ui: React.ReactNode, locale: Locale = 'en-US', role: 'owner' | 'manager' = 'owner') {
  return render(
    <MemoryRouter>
      <LocaleProvider initial={locale}>
        <DataProvider adapter={new MockAdapter({ latencyMs: 0 })}>
          <SessionProvider>
            <AccessProvider value={{
              permissions: ROLE_PERMISSIONS[role],
              verificationStatus: 'verified',
              isBlacklisted: false,
            }}>
              {ui}
            </AccessProvider>
          </SessionProvider>
        </DataProvider>
      </LocaleProvider>
    </MemoryRouter>,
  )
}

afterEach(cleanup)

describe('audit: colour discipline (C4)', () => {
  it('has no hex colour literal outside src/design', () => {
    const offenders: string[] = []
    for (const file of walk(SRC)) {
      if (file.includes('/design/') || file.endsWith('.test.ts') || file.endsWith('.test.tsx')) continue
      const text = readFileSync(file, 'utf8')
      for (const line of text.split('\n')) {
        const trimmed = line.trim()
        // The rule is about colour in code, not prose. Comments explaining why
        // a token exists are allowed to name the value they are explaining.
        const isComment = trimmed.startsWith('//') || trimmed.startsWith('*') || trimmed.startsWith('/*')
        if (isComment || trimmed.includes('http')) continue
        if (/#[0-9a-fA-F]{6}\b/.test(line)) {
          offenders.push(`${file.replace(SRC, '')}: ${trimmed.slice(0, 70)}`)
        }
      }
    }
    expect(offenders).toEqual([])
  })
})

describe('audit: removals (C11)', () => {
  const allNav = [...COMPANY_NAV, ...COMPANY_NAV_ACCOUNT, ...COMPANY_NAV_SUPPORT, ...DELIVERY_NAV]

  it('has no route for a removed section', () => {
    const removed = ['/opportunities', '/requests', '/promotions']
    expect(allNav.filter((n) => removed.includes(n.to))).toEqual([])
  })

  it('has no translation key for a removed section', () => {
    const keys = Object.keys(enUS).join(' ').toLowerCase()
    for (const gone of ['opportunit', 'farmerrequest', 'promotion']) {
      expect(keys).not.toContain(gone)
    }
  })

  it('renders no search field in the company shell', () => {
    wrap(<CompanyShell organisationName="X" userName="Y" verificationStatus="verified" onSignOut={() => {}}><div /></CompanyShell>)
    expect(screen.queryByRole('searchbox')).not.toBeInTheDocument()
  })
})

describe('audit: delivery mode never appears in the company portal (C14)', () => {
  it('is absent from Settings entirely — not shown, not editable', async () => {
    wrap(<Settings />)
    // Wait for the screen to settle before asserting an absence.
    expect(await screen.findByRole('heading', { name: /settings/i })).toBeInTheDocument()
    expect(screen.queryByTestId('delivery-mode')).not.toBeInTheDocument()
    expect(screen.queryByRole('radiogroup', { name: /delivery/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('switch', { name: /delivery/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('combobox', { name: /delivery/i })).not.toBeInTheDocument()
  })

  it('offers no per-order delivery-path choice either', () => {
    expect(mayChoosePath()).toBe(false)
  })

  it('is rejected by the data layer even if a screen tried', async () => {
    const api = new MockAdapter({ latencyMs: 0 })
    await expect(api.updateOrganisation({ deliveryMode: 'own' } as never))
      .rejects.toMatchObject({ code: 'delivery_mode_not_self_assignable' })
  })
})

describe('audit: the logo goes through one component, never below 32px (C13)', () => {
  it('has no direct brand image reference outside Logo.tsx', () => {
    const offenders = walk(SRC)
      .filter((f) => !f.endsWith('ui/Logo.tsx'))
      .filter((f) => /assets\/brand\//.test(readFileSync(f, 'utf8')))
    expect(offenders).toEqual([])
  })

  it('renders at 32px or larger everywhere it appears in the shells', () => {
    wrap(<CompanyShell organisationName="X" userName="Y" verificationStatus="verified" onSignOut={() => {}}><div /></CompanyShell>)
    for (const img of screen.getAllByRole('img', { name: /agromedconnect/i })) {
      expect(Number(img.getAttribute('width'))).toBeGreaterThanOrEqual(32)
    }
  })
})

describe('audit: bilingual completeness (C7)', () => {
  it('resolves every key in both locales with no fallback warning', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    for (const dict of [enUS, bnBD]) {
      for (const [key, value] of Object.entries(dict)) {
        expect(value, `empty value for ${key}`).toBeTruthy()
      }
    }
    expect(warn).not.toHaveBeenCalled()
    warn.mockRestore()
  })

  it('keeps the two dictionaries the same size', () => {
    expect(Object.keys(bnBD).length).toBe(Object.keys(enUS).length)
  })
})

describe('audit: an Employee never sees the company account or the catalogue', () => {
  const shell = (role: 'owner' | 'manager') =>
    wrap(<CompanyShell organisationName="X" userName="Y" verificationStatus="verified" onSignOut={() => {}}><div /></CompanyShell>, 'en-US', role)

  const hrefs = () => [...document.querySelectorAll('aside a')].map((a) => a.getAttribute('href'))

  it('hides products, services, solutions and settings from an Employee', () => {
    shell('manager')
    for (const gone of ['/products', '/services', '/solutions', '/settings']) {
      expect(hrefs()).not.toContain(gone)
    }
  })

  it('still gives an Employee the day-to-day screens', () => {
    shell('manager')
    for (const kept of ['/orders', '/inventory', '/reviews', '/reports']) {
      expect(hrefs()).toContain(kept)
    }
  })

  it('gives an Admin all of them', () => {
    shell('owner')
    for (const kept of ['/products', '/services', '/solutions', '/settings', '/payments']) {
      expect(hrefs()).toContain(kept)
    }
  })
})

describe('audit: directions always open Google Maps', () => {
  it('for a pinned order and for one with only an address', () => {
    expect(googleMapsDirections({ lat: 1, lng: 2, precision: 'exact' }, 'a'))
      .toMatch(/^https:\/\/www\.google\.com\/maps\/dir\//)
    expect(googleMapsDirections({ lat: null, lng: null, precision: 'none' }, 'a'))
      .toMatch(/^https:\/\/www\.google\.com\/maps\/dir\//)
  })
})

describe('audit: role scoping (C9)', () => {
  it('hides payouts from an Employee and shows them to an Admin', () => {
    wrap(<CompanyShell organisationName="X" userName="Y" verificationStatus="verified" onSignOut={() => {}}><div /></CompanyShell>, 'en-US', 'manager')
    expect(screen.queryByRole('link', { name: /payments/i })).not.toBeInTheDocument()
    cleanup()
    wrap(<CompanyShell organisationName="X" userName="Y" verificationStatus="verified" onSignOut={() => {}}><div /></CompanyShell>, 'en-US', 'owner')
    expect(screen.getByRole('link', { name: /payments/i })).toBeInTheDocument()
  })
})
