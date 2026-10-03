# Company Portal UI Rebuild — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild the AgroMedConnect Company Portal UI end-to-end on the Olive Earth design system, with three roles, bilingual bn/en, two delivery shells, and a typed mock data layer whose contracts become the Phase 2 API contract.

**Architecture:** Foundation-first. Six cross-cutting layers (design tokens, i18n, data contracts + adapter, auth/session, capability gate, UI + chart primitives) are built and tested before any screen. Screens then compose those layers only. Every screen consumes data through one `DataAdapter` interface implemented by `MockAdapter` in Phase 1 and `HttpAdapter` in Phase 2 — so swapping to real endpoints changes one provider value, not 27 screens.

**Tech Stack:** Vite 5, React 18, **TypeScript 5** (new — see Global Constraints C1), Tailwind 3, Recharts 2, React Router 6, Leaflet + react-leaflet, Vitest + Testing Library + jsdom, lucide-react.

**Spec:** `docs/superpowers/specs/2026-09-06-company-portal-ui-design.md` — read it first. Every task below argues from a section of that spec and cites it.

## Global Constraints

Every task's requirements implicitly include this section. Values are copied verbatim from the spec.

- **C1 — TypeScript.** The rebuild is in `.ts` / `.tsx`. This is a plan-level decision not in the spec: the spec requires `data/contracts/` to be "complete enough to serve as the Phase 2 API contract", and database CHECK-constraint enums expressed as TS union types are machine-checked rather than aspirational. Existing `.jsx` files are deleted, not migrated.
- **C2 — Money is never a number.** Every monetary value is `{ amountMinor: number; currency: 'BDT'; display: string }`. No floats, no bare numbers, no client-side arithmetic on money for display. Prefer the server's `display` string; the client formatter is only for values the client derives (chart ticks, computed totals).
- **C3 — Enums are the database's CHECK values verbatim.** Order status is exactly `pending_payment | paid | confirmed | processing | shipped | delivered | completed | cancelled | refunded | disputed`. Listing status: `draft | pending_review | active | paused | withdrawn`. Offer status: `draft | pending_approval | active | paused | expired | cancelled`. Certificate status: `submitted | under_review | verified | rejected | expired | revoked`. Organisation verification: `unverified | pending | verified | rejected | expired`. Shipment status: `pending | dispatched | in_transit | delivered | failed | returned`. Delivery type: `own | partner | pickup`. Never reword a value; labels are an i18n concern.
- **C4 — Colour rules are hard.** `#6A994E` and `#A7C957` fail WCAG AA as text on `#F2E8CF` and are **fill/border only**. All text on the cream base is `--ink`, `--ink-soft` or `--primary` `#004B23`. Cards are `--panel` `#FDFBF4`, never pure white.
- **C5 — One chart encoding per screen.** No screen may render two charts with the same encoding. The per-screen assignment in spec §7 is binding.
- **C6 — Every chart is locale-aware.** Every Recharts axis, tooltip and label passes a formatter from `src/i18n/format.ts`. A chart with default Recharts number formatting is a defect.
- **C7 — Translation key parity.** Every key exists in both `bn-BD` and `en-US`. A build-time test fails on divergence.
- **C8 — Four states per data screen.** Every screen that loads data renders loading, empty, error and populated. No exceptions.
- **C9 — No hard-coded `disabled`.** Every write affordance is wrapped in `<Gate>` or gated by `can()`. Blocked-by-verification and blocked-by-role must produce different messages.
- **C10 — Lists are paginated** from the first mock: `{ items, page, pageSize, total }`.
- **C11 — Removed, do not rebuild:** Farmer Opportunities, Farmer Request Center, Promotions, the Business Insights dashboard widget, the topbar/dashboard search. Search exists only on Products, Orders, Inventory and Team.
- **C12 — Touch targets in `DeliveryShell` are minimum 44×44 px.**
- **C13 — The logo goes through one component.** `<Logo size={32|48|64|96|192|512} />` from `src/ui/Logo.tsx`. No screen references a brand image path directly. **Never rendered below 32 px** (verified: detail is lost) and **never on a `--primary` fill** — the mark's mid-green fights `#004B23`.
- **C14 — The company can never change its own delivery mode.** `organisation.deliveryMode` (`own | partner | both`) is assigned by the platform super admin. Settings renders it read-only. Where the mode permits only one fulfilment path, the other path's controls are **absent, not disabled**.

---

## File structure

```
src/
  design/
    tokens.css            CSS custom properties — the single source of colour truth
    tailwind-preset.cjs   maps tokens into Tailwind theme
  i18n/
    locales/en-US.ts      flat key → string
    locales/bn-BD.ts
    dictionary.ts         type-safe key union derived from en-US
    format.ts             formatNumber/Money/Date/Percent — Bengali numerals + 2,2,3 grouping
    LocaleProvider.tsx    context + useT()
  data/
    contracts/            *.ts — pure types, imports nothing. THE PHASE 2 CONTRACT.
      common.ts  money, paging, enums
      catalog.ts orders.ts offers.ts iam.ts compliance.ts market.ts delivery.ts
    DataAdapter.ts        the interface every screen consumes
    mock/                 MockAdapter + fixture builders
    DataProvider.tsx      React context supplying the adapter
  auth/
    SessionProvider.tsx   { user, organisation, role, permissions, verificationStatus }
    guards.tsx            RequireAuth, RequireShell
  access/
    permissions.ts        permission codes + role→permission map (mirrors DB seed)
    can.ts                the single resolver
    Gate.tsx              <Gate action="…">
  assets/brand/           logo-master.png + 512/192/96/64/48/32 derivatives
  ui/                     Logo Card Button Field Select Table Badge Tabs Modal
                          EmptyState ErrorState Skeleton Stepper Pagination Toast
  charts/                 LineTrend Funnel Bullet StackedArea Dumbbell Scatter
                          GanttTimeline Waterfall GroupedBar CohortHeatmap Donut
                          DemandMap (Leaflet choropleth)
  layouts/                AuthShell CompanyShell DeliveryShell
  features/               one folder per screen group
  routes.tsx  main.tsx  App.tsx
```

Rule: `features/` may import from any layer above; nothing imports from `features/`. `data/contracts/` imports nothing.

---

## Task 1: Toolchain, design tokens, and the Logo component

Establishes TypeScript, the test runner, the Olive Earth token set, and the one component through which the brand mark is ever rendered. Everything downstream depends on this task, so it lands first and lands whole.

**Files:**
- Modify: `package.json`, `vite.config.js` → `vite.config.ts`, `tailwind.config.js`, `index.html`
- Create: `tsconfig.json`, `tsconfig.node.json`, `vitest.config.ts`, `src/test/setup.ts`
- Create: `src/design/tokens.css`, `src/design/tailwind-preset.cjs`
- Create: `src/ui/Logo.tsx`
- Test: `src/design/tokens.test.ts`, `src/ui/Logo.test.tsx`
- Already done: `src/assets/brand/logo-{master,512,192,96,64,48,32}.png`, `public/favicon.png`

**Interfaces:**
- Consumes: nothing.
- Produces:
  - CSS custom properties on `:root` — `--primary --primary-hover --secondary --accent --base --panel --sunken --border --ink --ink-soft --ink-faint --success --warning --danger --info --series-1..--series-6`
  - Tailwind colour names — `primary primary-hover secondary accent base panel sunken border ink ink-soft ink-faint success warning danger info`
  - `export type LogoSize = 32 | 48 | 64 | 96 | 192 | 512`
  - `export function Logo(props: { size?: LogoSize; className?: string; title?: string }): JSX.Element`
  - `export const TOKENS: Record<string, string>` from `src/design/tokens.ts` — the same hex values as the CSS, for chart components that need them as JS strings
  - `export function contrastRatio(hexA: string, hexB: string): number` from `src/design/contrast.ts`

- [ ] **Step 1: Install dependencies**

```bash
npm i -D typescript @types/react @types/react-dom @types/node \
  vitest @vitest/coverage-v8 jsdom \
  @testing-library/react @testing-library/jest-dom @testing-library/user-event
npm i leaflet react-leaflet
npm i -D @types/leaflet
```

- [ ] **Step 2: Add TypeScript and Vitest configuration**

`tsconfig.json`:
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "moduleResolution": "bundler",
    "jsx": "react-jsx",
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noEmit": true,
    "skipLibCheck": true,
    "resolveJsonModule": true,
    "allowImportingTsExtensions": true,
    "baseUrl": ".",
    "paths": { "@/*": ["src/*"] },
    "types": ["vitest/globals", "@testing-library/jest-dom"]
  },
  "include": ["src"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

`vitest.config.ts`:
```ts
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'node:path'

export default defineConfig({
  plugins: [react()],
  resolve: { alias: { '@': path.resolve(__dirname, './src') } },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    css: true,
  },
})
```

`src/test/setup.ts`:
```ts
import '@testing-library/jest-dom/vitest'
```

Add to `package.json` scripts: `"test": "vitest run"`, `"test:watch": "vitest"`, `"typecheck": "tsc --noEmit"`.

- [ ] **Step 3: Write the failing contrast test**

This test encodes spec §6.2 — the two findings that constrain the whole palette. It is a real regression guard: if someone later "fixes" the palette by using `--secondary` for body text, this fails.

`src/design/tokens.test.ts`:
```ts
import { describe, it, expect } from 'vitest'
import { TOKENS } from './tokens'
import { contrastRatio } from './contrast'

describe('Olive Earth tokens', () => {
  it('exposes the four brief-mandated colours verbatim', () => {
    expect(TOKENS.primary).toBe('#004B23')
    expect(TOKENS.secondary).toBe('#6A994E')
    expect(TOKENS.accent).toBe('#A7C957')
    expect(TOKENS.base).toBe('#F2E8CF')
  })

  it('passes AA for every colour permitted as text on the base', () => {
    for (const name of ['ink', 'inkSoft', 'primary'] as const) {
      expect(contrastRatio(TOKENS[name], TOKENS.base)).toBeGreaterThanOrEqual(4.5)
    }
  })

  it('confirms secondary and accent FAIL as text — they are fill-only (spec §6.2)', () => {
    expect(contrastRatio(TOKENS.secondary, TOKENS.base)).toBeLessThan(4.5)
    expect(contrastRatio(TOKENS.accent, TOKENS.base)).toBeLessThan(4.5)
  })

  it('keeps panel lifted off the base without being pure white', () => {
    expect(TOKENS.panel).not.toBe('#FFFFFF')
    expect(contrastRatio(TOKENS.panel, TOKENS.base)).toBeLessThan(1.3)
  })

  it('gives every chart series a distinguishable lightness so greyscale still separates them', () => {
    const series = [1, 2, 3, 4, 5, 6].map((n) => TOKENS[`series${n}`])
    const lums = series.map((c) => contrastRatio(c, '#FFFFFF')).sort((a, b) => a - b)
    for (let i = 1; i < lums.length; i++) {
      expect(lums[i] / lums[i - 1]).toBeGreaterThan(1.15)
    }
  })
})
```

- [ ] **Step 4: Run it and watch it fail**

Run: `npx vitest run src/design/tokens.test.ts`
Expected: FAIL — `Cannot find module './tokens'`.

- [ ] **Step 5: Implement tokens and the contrast helper**

`src/design/contrast.ts`:
```ts
function srgbToLinear(c: number): number {
  const s = c / 255
  return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4
}

export function relativeLuminance(hex: string): number {
  const h = hex.replace('#', '')
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16))
  return 0.2126 * srgbToLinear(r!) + 0.7152 * srgbToLinear(g!) + 0.0722 * srgbToLinear(b!)
}

export function contrastRatio(hexA: string, hexB: string): number {
  const a = relativeLuminance(hexA)
  const b = relativeLuminance(hexB)
  const [hi, lo] = a > b ? [a, b] : [b, a]
  return (hi + 0.05) / (lo + 0.05)
}
```

`src/design/tokens.ts`:
```ts
export const TOKENS = {
  primary: '#004B23',
  primaryHover: '#00381A',
  secondary: '#6A994E',
  accent: '#A7C957',
  base: '#F2E8CF',
  panel: '#FDFBF4',
  sunken: '#EADFC0',
  border: '#DDD0AC',
  ink: '#1B2A20',
  inkSoft: '#4A5A4E',
  inkFaint: '#7C8A7E',
  success: '#3F7A34',
  warning: '#C77E23',
  danger: '#A8321E',
  info: '#2F6B8F',
  series1: '#004B23',
  series2: '#A7C957',
  series3: '#B8752F',
  series4: '#2F6B8F',
  series5: '#7D3C5A',
  series6: '#C9A227',
} as const satisfies Record<string, string>

export type TokenName = keyof typeof TOKENS
export const SERIES = [
  TOKENS.series1, TOKENS.series2, TOKENS.series3,
  TOKENS.series4, TOKENS.series5, TOKENS.series6,
] as const
```

`src/design/tokens.css` declares the same values as custom properties on `:root` (kebab-case names), and sets `body { background: var(--base); color: var(--ink); }`.

`src/design/tailwind-preset.cjs` maps each custom property into `theme.extend.colors` via `var(--token)`, keeps the existing Fraunces / Public Sans / IBM Plex Mono stacks, adds `bengali: ['"Noto Sans Bengali"', ...sans]`, and sets `borderRadius.card: '10px'`.

- [ ] **Step 6: Run the tests and confirm they pass**

Run: `npx vitest run src/design/tokens.test.ts`
Expected: PASS, 5 tests.

- [ ] **Step 7: Write the failing Logo test**

`src/ui/Logo.test.tsx`:
```tsx
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Logo } from './Logo'

describe('Logo', () => {
  it('renders the official mark with an accessible name', () => {
    render(<Logo size={64} />)
    expect(screen.getByRole('img', { name: /agromedconnect/i })).toBeInTheDocument()
  })

  it('requests a raster at least as large as the rendered size, for retina crispness', () => {
    render(<Logo size={48} />)
    const img = screen.getByRole('img', { name: /agromedconnect/i })
    expect(img.getAttribute('src')).toMatch(/logo-96\.png/)
  })

  it('renders at the requested CSS size', () => {
    render(<Logo size={32} />)
    const img = screen.getByRole('img', { name: /agromedconnect/i })
    expect(img).toHaveAttribute('width', '32')
    expect(img).toHaveAttribute('height', '32')
  })

  it('defaults to 32 px — the verified legibility floor (spec §6.5)', () => {
    render(<Logo />)
    expect(screen.getByRole('img', { name: /agromedconnect/i })).toHaveAttribute('width', '32')
  })
})
```

- [ ] **Step 8: Run it and watch it fail**

Run: `npx vitest run src/ui/Logo.test.tsx`
Expected: FAIL — `Cannot find module './Logo'`.

- [ ] **Step 9: Implement Logo**

`src/ui/Logo.tsx`:
```tsx
import logo512 from '@/assets/brand/logo-512.png'
import logo192 from '@/assets/brand/logo-192.png'
import logo96 from '@/assets/brand/logo-96.png'
import logo64 from '@/assets/brand/logo-64.png'

export type LogoSize = 32 | 48 | 64 | 96 | 192 | 512

// Serve a raster at 2x the CSS size so the mark stays crisp on retina displays.
// 32 and 48 deliberately map upward: at their native raster they visibly soften.
const RASTER: Record<LogoSize, string> = {
  32: logo64, 48: logo96, 64: logo96, 96: logo192, 192: logo512, 512: logo512,
}

export function Logo({ size = 32, className = '', title = 'AgroMedConnect' }: {
  size?: LogoSize
  className?: string
  title?: string
}) {
  return (
    <img
      src={RASTER[size]}
      alt={title}
      width={size}
      height={size}
      className={`shrink-0 select-none ${className}`}
      draggable={false}
    />
  )
}
```

Add `declare module '*.png'` to `src/vite-env.d.ts` so TypeScript accepts the imports.

- [ ] **Step 10: Run the tests and confirm they pass**

Run: `npx vitest run` — all of Task 1's tests green. Then `npm run typecheck` — clean.

- [ ] **Step 11: Wire the favicon and commit**

In `index.html`, replace the existing icon link with `<link rel="icon" type="image/png" href="/favicon.png" />` and set `<title>AgroMedConnect — Company Portal</title>`.

```bash
git add -A
git commit -m "feat: TypeScript toolchain, Olive Earth tokens, official Logo component

Tokens carry a regression guard for the two contrast findings in spec 6.2:
secondary and accent are asserted to FAIL as text, so nobody later
'fixes' the palette by using them for body copy.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01GELJmXtQYQ29TYEJmMnkDs"
```

---

## Task 2: Locale-aware formatters

The load-bearing half of internationalisation. Built before dictionaries because charts and money depend on formatters, not on copy.

**Verified before planning:** Node/browser ICU renders `bn-BD` natively as `১২,৩৪,৫৬৭` — Bengali digits *and* 2,2,3 Indian grouping. Do **not** hand-roll digit substitution or grouping; wrap `Intl`.

**Files:**
- Create: `src/i18n/format.ts`
- Test: `src/i18n/format.test.ts`

**Interfaces:**
- Consumes: `Money` is declared here as a local type and re-exported from `data/contracts/common.ts` in Task 4; keep the shapes identical.
- Produces:
  - `export type Locale = 'bn-BD' | 'en-US'`
  - `export function formatNumber(value: number, locale: Locale, opts?: Intl.NumberFormatOptions): string`
  - `export function formatMoney(money: Money, locale: Locale): string`
  - `export function formatPercent(fraction: number, locale: Locale, digits?: number): string`
  - `export function formatDate(iso: string, locale: Locale, style?: 'short' | 'medium' | 'long'): string`
  - `export function formatDateTime(iso: string, locale: Locale): string`
  - `export function formatCompact(value: number, locale: Locale): string` — for chart axes
  - `export function makeTickFormatter(locale: Locale): (v: number) => string` — pass straight to Recharts `tickFormatter`

- [ ] **Step 1: Write the failing test**

`src/i18n/format.test.ts`:
```ts
import { describe, it, expect } from 'vitest'
import { formatNumber, formatMoney, formatPercent, formatDate, makeTickFormatter } from './format'

const bdt = (amountMinor: number, display: string) =>
  ({ amountMinor, currency: 'BDT' as const, display })

describe('formatNumber', () => {
  it('renders Bengali numerals with Indian 2,2,3 grouping in bn-BD', () => {
    expect(formatNumber(1234567, 'bn-BD')).toBe('১২,৩৪,৫৬৭')
  })
  it('renders ASCII digits with thousands grouping in en-US', () => {
    expect(formatNumber(1234567, 'en-US')).toBe('1,234,567')
  })
})

describe('formatMoney', () => {
  it('prefers the server-rendered display string, which is authoritative', () => {
    expect(formatMoney(bdt(49500, '৳৪৯৫.০০'), 'bn-BD')).toBe('৳৪৯৫.০০')
  })
  it('falls back to client formatting only when display is absent', () => {
    expect(formatMoney({ amountMinor: 49500, currency: 'BDT', display: '' }, 'en-US'))
      .toBe('৳495.00')
  })
  it('divides by the currency exponent rather than assuming a bare number', () => {
    expect(formatMoney({ amountMinor: 100, currency: 'BDT', display: '' }, 'en-US'))
      .toBe('৳1.00')
  })
})

describe('formatPercent', () => {
  it('takes a fraction, not a percentage, and says so by example', () => {
    expect(formatPercent(0.125, 'en-US', 1)).toBe('12.5%')
  })
})

describe('formatDate', () => {
  it('renders Bengali month names and numerals', () => {
    expect(formatDate('2026-09-06', 'bn-BD', 'medium')).toContain('২০২৬')
  })
})

describe('makeTickFormatter', () => {
  it('compacts large axis values so ticks do not collide', () => {
    expect(makeTickFormatter('en-US')(1500000)).toBe('1.5M')
  })
  it('compacts in Bengali numerals too — the reason this exists (C6)', () => {
    expect(makeTickFormatter('bn-BD')(1500)).toMatch(/[০-৯]/)
  })
})
```

- [ ] **Step 2: Run it and watch it fail**

Run: `npx vitest run src/i18n/format.test.ts`
Expected: FAIL — `Cannot find module './format'`.

- [ ] **Step 3: Implement the formatters**

```ts
export type Locale = 'bn-BD' | 'en-US'

export interface Money {
  amountMinor: number
  currency: 'BDT'
  display: string
}

// ref.currency owns the real exponent; BDT is the only currency in the system today.
const EXPONENT: Record<Money['currency'], number> = { BDT: 2 }
const SYMBOL: Record<Money['currency'], string> = { BDT: '৳' }

export function formatNumber(value: number, locale: Locale, opts?: Intl.NumberFormatOptions) {
  return new Intl.NumberFormat(locale, opts).format(value)
}

export function formatMoney(money: Money, locale: Locale): string {
  // The server renders money for a reason: Bengali numerals and 2,2,3 grouping are a
  // localisation concern it already solved, and its string is the one the buyer saw.
  if (money.display) return money.display
  const exp = EXPONENT[money.currency]
  const major = money.amountMinor / 10 ** exp
  return SYMBOL[money.currency] + formatNumber(major, locale, {
    minimumFractionDigits: exp,
    maximumFractionDigits: exp,
  })
}

export function formatPercent(fraction: number, locale: Locale, digits = 0) {
  return formatNumber(fraction, locale, {
    style: 'percent',
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  })
}

export function formatDate(iso: string, locale: Locale, style: 'short' | 'medium' | 'long' = 'medium') {
  return new Intl.DateTimeFormat(locale, { dateStyle: style }).format(new Date(iso))
}

export function formatDateTime(iso: string, locale: Locale) {
  return new Intl.DateTimeFormat(locale, { dateStyle: 'medium', timeStyle: 'short' })
    .format(new Date(iso))
}

export function formatCompact(value: number, locale: Locale) {
  return formatNumber(value, locale, { notation: 'compact', maximumFractionDigits: 1 })
}

export function makeTickFormatter(locale: Locale) {
  return (v: number) => formatCompact(v, locale)
}
```

- [ ] **Step 4: Run the tests and confirm they pass**

Run: `npx vitest run src/i18n/format.test.ts`
Expected: PASS, 9 tests. If `formatCompact` in `bn-BD` returns an unexpected shape, adjust the assertion to the ICU output rather than fighting it — the goal is Bengali numerals, not a specific abbreviation.

- [ ] **Step 5: Commit**

```bash
git add src/i18n/format.ts src/i18n/format.test.ts
git commit -m "feat: locale-aware formatters wrapping Intl for bn-BD and en-US

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01GELJmXtQYQ29TYEJmMnkDs"
```

---

## Task 3: Dictionaries, LocaleProvider, and the key-parity guard

**Files:**
- Create: `src/i18n/locales/en-US.ts`, `src/i18n/locales/bn-BD.ts`, `src/i18n/dictionary.ts`, `src/i18n/LocaleProvider.tsx`
- Test: `src/i18n/parity.test.ts`, `src/i18n/LocaleProvider.test.tsx`

**Interfaces:**
- Consumes: `Locale` from `@/i18n/format`.
- Produces:
  - `export type TranslationKey = keyof typeof enUS`
  - `export function LocaleProvider(props: { children: ReactNode; initial?: Locale }): JSX.Element`
  - `export function useLocale(): { locale: Locale; setLocale(l: Locale): void }`
  - `export function useT(): (key: TranslationKey, vars?: Record<string, string | number>) => string`
  - `export function useFormat(): { number; money; percent; date; dateTime; tick }` — every formatter from Task 2 pre-bound to the active locale. **Screens use this, never the raw functions**, which is what makes C6 enforceable by review.

- [ ] **Step 1: Write the failing parity test**

This is C7 made executable. It is the single most valuable test in the i18n layer, because a missing Bengali key is invisible in an English-language review.

`src/i18n/parity.test.ts`:
```ts
import { describe, it, expect } from 'vitest'
import { enUS } from './locales/en-US'
import { bnBD } from './locales/bn-BD'

describe('translation parity', () => {
  it('has no key present in en-US but missing from bn-BD', () => {
    const missing = Object.keys(enUS).filter((k) => !(k in bnBD))
    expect(missing).toEqual([])
  })
  it('has no key present in bn-BD but missing from en-US', () => {
    const orphan = Object.keys(bnBD).filter((k) => !(k in enUS))
    expect(orphan).toEqual([])
  })
  it('has no empty string standing in for a real translation', () => {
    const blank = Object.entries(bnBD).filter(([, v]) => !String(v).trim())
    expect(blank).toEqual([])
  })
  it('keeps interpolation variables identical across locales', () => {
    const vars = (s: string) => (s.match(/\{(\w+)\}/g) ?? []).sort()
    for (const [k, en] of Object.entries(enUS)) {
      expect(vars(bnBD[k as keyof typeof bnBD])).toEqual(vars(en))
    }
  })
})
```

- [ ] **Step 2: Run it and watch it fail**

Run: `npx vitest run src/i18n/parity.test.ts`
Expected: FAIL — modules not found.

- [ ] **Step 3: Create the seed dictionaries**

Start with the shell and common vocabulary only; each later screen task appends its own keys and the parity test guards every addition.

`src/i18n/locales/en-US.ts`:
```ts
export const enUS = {
  'app.name': 'AgroMedConnect',
  'app.portal': 'Company Portal',
  'nav.dashboard': 'Dashboard',
  'nav.market': 'Market Intelligence',
  'nav.products': 'Products',
  'nav.services': 'Services',
  'nav.solutions': 'Solution Center',
  'nav.inventory': 'Inventory',
  'nav.orders': 'Orders',
  'nav.discounts': 'Discounts',
  'nav.reviews': 'Reviews & Trust',
  'nav.payments': 'Payments & Payouts',
  'nav.reports': 'Reports',
  'nav.feedback': 'Feedback',
  'nav.notifications': 'Notifications',
  'nav.profile': 'Company Profile',
  'nav.verification': 'Verification',
  'nav.team': 'Team',
  'nav.settings': 'Settings',
  'nav.help': 'Help Center',
  'nav.support': 'Contact Support',
  'nav.deliveries': 'My Deliveries',
  'nav.history': 'History',
  'state.loading': 'Loading…',
  'state.empty.title': 'Nothing here yet',
  'state.error.title': 'Something went wrong',
  'state.error.retry': 'Try again',
  'action.save': 'Save',
  'action.cancel': 'Cancel',
  'action.search': 'Search',
  'gate.unverified': 'Verification in progress — you can prepare this, but not publish it yet.',
  'gate.forbidden': 'Your role does not permit this action.',
  'paging.showing': 'Showing {from}–{to} of {total}',
} as const
```

`src/i18n/locales/bn-BD.ts` mirrors every key with Bengali text, e.g. `'nav.dashboard': 'ড্যাশবোর্ড'`, `'nav.orders': 'অর্ডার'`, `'nav.products': 'পণ্য'`, `'state.loading': 'লোড হচ্ছে…'`, `'gate.unverified': 'যাচাই চলছে — আপনি প্রস্তুত করতে পারেন, তবে এখনো প্রকাশ করতে পারবেন না।'`, `'paging.showing': '{total} টির মধ্যে {from}–{to} দেখানো হচ্ছে'`.

`src/i18n/dictionary.ts`:
```ts
import { enUS } from './locales/en-US'
import { bnBD } from './locales/bn-BD'
import type { Locale } from './format'

export type TranslationKey = keyof typeof enUS
export const DICTIONARIES: Record<Locale, Record<TranslationKey, string>> = {
  'en-US': enUS,
  'bn-BD': bnBD,
}
```

- [ ] **Step 4: Run the parity test and confirm it passes**

Run: `npx vitest run src/i18n/parity.test.ts` → PASS, 4 tests.

- [ ] **Step 5: Write the failing provider test**

`src/i18n/LocaleProvider.test.tsx`:
```tsx
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { LocaleProvider, useT, useLocale, useFormat } from './LocaleProvider'

function Probe() {
  const t = useT()
  const { locale, setLocale } = useLocale()
  const f = useFormat()
  return (
    <div>
      <span data-testid="label">{t('nav.orders')}</span>
      <span data-testid="num">{f.number(1234567)}</span>
      <span data-testid="interp">{t('paging.showing', { from: 1, to: 10, total: 50 })}</span>
      <button onClick={() => setLocale(locale === 'en-US' ? 'bn-BD' : 'en-US')}>swap</button>
    </div>
  )
}

describe('LocaleProvider', () => {
  it('translates and formats in the active locale, and swaps both together', async () => {
    render(<LocaleProvider initial="en-US"><Probe /></LocaleProvider>)
    expect(screen.getByTestId('label')).toHaveTextContent('Orders')
    expect(screen.getByTestId('num')).toHaveTextContent('1,234,567')

    await userEvent.click(screen.getByRole('button', { name: 'swap' }))
    expect(screen.getByTestId('label')).toHaveTextContent('অর্ডার')
    expect(screen.getByTestId('num')).toHaveTextContent('১২,৩৪,৫৬৭')
  })

  it('interpolates variables', () => {
    render(<LocaleProvider initial="en-US"><Probe /></LocaleProvider>)
    expect(screen.getByTestId('interp')).toHaveTextContent('Showing 1–10 of 50')
  })
})
```

- [ ] **Step 6: Run it and watch it fail**, then implement

`src/i18n/LocaleProvider.tsx` holds `locale` in state (seeded from `localStorage.agromed.locale`, else `'bn-BD'`), writes it back on change, sets `document.documentElement.lang` so the `:lang(bn)` Noto Sans Bengali rule from Task 1 applies, and memoises the bound formatter bundle. `t()` looks the key up in the active dictionary, falls back to `en-US`, and replaces `{var}` tokens.

- [ ] **Step 7: Run the tests, confirm PASS, and commit**

```bash
git add src/i18n
git commit -m "feat: bilingual dictionaries, LocaleProvider, and build-time key parity guard

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01GELJmXtQYQ29TYEJmMnkDs"
```

---

## Task 4: Data contracts — the Phase 2 API contract

**This is the most consequential task in Phase 1.** These types are the artefact the API is built against. Every enum value is copied from a live database CHECK constraint (C3); if a value here disagrees with the database, the database is right.

**Files:**
- Create: `src/data/contracts/common.ts`, `iam.ts`, `catalog.ts`, `compliance.ts`, `orders.ts`, `offers.ts`, `market.ts`, `delivery.ts`, `index.ts`
- Test: `src/data/contracts/contracts.test.ts`

**Interfaces:**
- Consumes: nothing. `contracts/` imports no runtime code — pure type declarations plus frozen enum arrays.
- Produces: every type below, re-exported from `src/data/contracts/index.ts`.

- [ ] **Step 1: Write the failing test**

Types vanish at runtime, so the test guards the enum arrays — the part that can silently drift from the database.

`src/data/contracts/contracts.test.ts`:
```ts
import { describe, it, expect } from 'vitest'
import {
  ORDER_STATUSES, LISTING_STATUSES, OFFER_STATUSES,
  CERTIFICATE_STATUSES, VERIFICATION_STATUSES, SHIPMENT_STATUSES,
  DELIVERY_TYPES, DELIVERY_MODES, ORDER_STATUS_FLOW,
} from './index'

describe('contract enums mirror the live database CHECK constraints', () => {
  it('sales.order.status — CK_order_status', () => {
    expect([...ORDER_STATUSES]).toEqual([
      'pending_payment', 'paid', 'confirmed', 'processing',
      'shipped', 'delivered', 'completed', 'cancelled', 'refunded', 'disputed',
    ])
  })
  it('catalog.listing.status — CK_listing_status', () => {
    expect([...LISTING_STATUSES]).toEqual([
      'draft', 'pending_review', 'active', 'paused', 'withdrawn',
    ])
  })
  it('pricing.offer.status — CK_offer_status', () => {
    expect([...OFFER_STATUSES]).toEqual([
      'draft', 'pending_approval', 'active', 'paused', 'expired', 'cancelled',
    ])
  })
  it('compliance.certificate.status — CK_cert_status', () => {
    expect([...CERTIFICATE_STATUSES]).toEqual([
      'submitted', 'under_review', 'verified', 'rejected', 'expired', 'revoked',
    ])
  })
  it('iam.organisation.verification_status — CK_org_verification', () => {
    expect([...VERIFICATION_STATUSES]).toEqual([
      'unverified', 'pending', 'verified', 'rejected', 'expired',
    ])
  })
  it('sales.shipment.status — CK_shipment_status', () => {
    expect([...SHIPMENT_STATUSES]).toEqual([
      'pending', 'dispatched', 'in_transit', 'delivered', 'failed', 'returned',
    ])
  })
  it('sales.order.delivery_type — CK_order_delivery_type', () => {
    expect([...DELIVERY_TYPES]).toEqual(['own', 'partner', 'pickup'])
  })
  it('organisation.delivery_mode — new in Phase 2, gap G6', () => {
    expect([...DELIVERY_MODES]).toEqual(['own', 'partner', 'both'])
  })
})

describe('ORDER_STATUS_FLOW', () => {
  it('gives own delivery a delivery-man handover step the partner path does not have', () => {
    expect(ORDER_STATUS_FLOW.own).toContain('assigned')
    expect(ORDER_STATUS_FLOW.partner).not.toContain('assigned')
  })
  it('gives the partner path a handover-to-platform step the own path does not have', () => {
    expect(ORDER_STATUS_FLOW.partner).toContain('handed_to_platform')
    expect(ORDER_STATUS_FLOW.own).not.toContain('handed_to_platform')
  })
  it('ends both machines at delivered', () => {
    expect(ORDER_STATUS_FLOW.own.at(-1)).toBe('delivered')
    expect(ORDER_STATUS_FLOW.partner.at(-1)).toBe('delivered')
  })
})
```

- [ ] **Step 2: Run it and watch it fail**

Run: `npx vitest run src/data/contracts` → FAIL, module not found.

- [ ] **Step 3: Write `common.ts`**

```ts
export type Uuid = string
export type IsoDateTime = string
export type IsoDate = string

/** C2. Never a bare number. `display` is server-rendered and authoritative. */
export interface Money {
  amountMinor: number
  currency: 'BDT'
  display: string
}

/** C10. Every list is paginated from the first mock. */
export interface Page<T> {
  items: T[]
  page: number
  pageSize: number
  total: number
}

export interface PageQuery {
  page?: number
  pageSize?: number
  search?: string
  sort?: string
}

/** RFC 9457 problem document, as the API already emits. */
export interface ApiProblem {
  type: string
  title: string
  status: number
  detail?: string
  code: string
  correlationId?: string
}

export const VERIFICATION_STATUSES = [
  'unverified', 'pending', 'verified', 'rejected', 'expired',
] as const
export type VerificationStatus = (typeof VERIFICATION_STATUSES)[number]

export const DELIVERY_MODES = ['own', 'partner', 'both'] as const
export type DeliveryMode = (typeof DELIVERY_MODES)[number]
```

- [ ] **Step 4: Write `iam.ts`**

```ts
import type { Uuid, IsoDateTime, VerificationStatus, DeliveryMode } from './common'

export const PORTAL_ROLES = ['owner', 'manager', 'delivery_man'] as const
export type PortalRole = (typeof PORTAL_ROLES)[number]

export const ORG_KINDS = ['manufacturer', 'importer_supplier'] as const
export type OrgKind = (typeof ORG_KINDS)[number]

export interface Organisation {
  id: Uuid
  slug: string
  legalName: string
  kind: OrgKind
  tradeLicenceNo: string | null
  binNumber: string | null
  tinNumber: string | null
  verificationStatus: VerificationStatus
  verifiedAt: IsoDateTime | null
  /** G6/C14 — assigned by the platform super admin. Read-only to the company. */
  deliveryMode: DeliveryMode
  deliveryModeAssignedAt: IsoDateTime | null
  isBlacklisted: boolean
  status: 'active' | 'suspended' | 'closed'
  contactPhone: string | null
  contactEmail: string | null
  addressLine: string | null
}

export interface AppUser {
  id: Uuid
  fullName: string
  phoneE164: string | null
  email: string | null
  preferredLocale: 'bn-BD' | 'en-US'
  status: 'active' | 'suspended' | 'closed'
  lastLoginAt: IsoDateTime | null
}

export interface Member {
  membershipId: Uuid
  user: AppUser
  role: PortalRole
  status: 'active' | 'suspended' | 'removed'
  joinedAt: IsoDateTime
  /** iam.membership_permission — per-member overrides on top of the role. */
  overrides: { permission: string; effect: 'grant' | 'deny' }[]
}

export interface Session {
  accessToken: string
  refreshToken: string
  expiresAt: IsoDateTime
  user: AppUser
  organisation: Organisation
  role: PortalRole
  permissions: string[]
}
```

- [ ] **Step 5: Write `catalog.ts` and `compliance.ts`**

```ts
// catalog.ts
import type { Uuid, Money, IsoDateTime } from './common'

export const LISTING_STATUSES = [
  'draft', 'pending_review', 'active', 'paused', 'withdrawn',
] as const
export type ListingStatus = (typeof LISTING_STATUSES)[number]

export const IMAGE_REVIEW_STATUSES = [
  'not_submitted', 'pending_review', 'approved', 'flagged',
] as const
export type ImageReviewStatus = (typeof IMAGE_REVIEW_STATUSES)[number]

export interface MediaItem {
  id: Uuid
  url: string
  contentType: string
  isPrimary: boolean
  displayOrder: number
  /** R3 — manual admin review is the mechanism; hash matching only raises the flag. */
  reviewStatus: ImageReviewStatus
  duplicateOfListingId: Uuid | null
}

export interface Listing {
  id: Uuid
  kind: 'product' | 'service'
  sku: string
  slug: string
  name: string
  brand: string | null
  categoryId: Uuid
  categoryName: string
  status: ListingStatus
  isBlocked: boolean
  publishedAt: IsoDateTime | null
  price: Money
  ratingAverage: number | null
  ratingCount: number
  media: MediaItem[]
  /** Product-only, from catalog.product. */
  packSize: number | null
  unitCode: string | null
  packsPerCase: number | null
  grossWeightGrams: number | null
  isRestricted: boolean
  /** Drives the publish gate. */
  requiredCertificateTypes: string[]
  attachedCertificateIds: Uuid[]
}

/** Spec §8 #8. The single source of truth for "can this go live?". */
export interface PublishReadiness {
  canPublish: boolean
  blockers: (
    | 'missing_certificate'
    | 'certificate_not_verified'
    | 'certificate_expired'
    | 'no_primary_image'
    | 'image_flagged'
    | 'organisation_unverified'
    | 'no_price'
    | 'no_stock'
  )[]
}
```

```ts
// compliance.ts
import type { Uuid, IsoDate, IsoDateTime } from './common'

export const CERTIFICATE_STATUSES = [
  'submitted', 'under_review', 'verified', 'rejected', 'expired', 'revoked',
] as const
export type CertificateStatus = (typeof CERTIFICATE_STATUSES)[number]

export const CERTIFICATE_TYPES = [
  'trade_licence', 'product_registration', 'import_permit',
  'manufacturing_licence', 'quality_certificate', 'other',
] as const
export type CertificateType = (typeof CERTIFICATE_TYPES)[number]

export interface Certificate {
  id: Uuid
  subjectType: 'organisation' | 'listing'
  listingId: Uuid | null
  certificateType: CertificateType
  certificateNumber: string
  issuingAuthority: string
  issuedOn: IsoDate
  expiresOn: IsoDate | null
  status: CertificateStatus
  rejectionReason: string | null
  documentUrl: string | null
}

export interface VerificationEvent {
  id: Uuid
  fromStatus: CertificateStatus | null
  toStatus: CertificateStatus
  reason: string | null
  occurredAt: IsoDateTime
  decidedBy: string | null
}

/** G1 — NID/TIN are sensitive PII, so the portal only ever sees presence and status. */
export interface IdentityDocument {
  id: Uuid
  kind: 'nid' | 'tin' | 'passport'
  /** Last 4 characters only. The full value never reaches the browser. */
  maskedNumber: string
  status: CertificateStatus
  uploadedAt: IsoDateTime
}

export interface VerificationDossier {
  organisationStatus: import('./common').VerificationStatus
  submittedAt: IsoDateTime | null
  decidedAt: IsoDateTime | null
  certificates: Certificate[]
  identityDocuments: IdentityDocument[]
  timeline: VerificationEvent[]
  /** What is still required before the dossier can be submitted. */
  outstanding: string[]
}
```

- [ ] **Step 6: Write `orders.ts` and `delivery.ts`**

```ts
// orders.ts
import type { Uuid, Money, IsoDateTime } from './common'

export const ORDER_STATUSES = [
  'pending_payment', 'paid', 'confirmed', 'processing',
  'shipped', 'delivered', 'completed', 'cancelled', 'refunded', 'disputed',
] as const
export type OrderStatus = (typeof ORDER_STATUSES)[number]

export const SHIPMENT_STATUSES = [
  'pending', 'dispatched', 'in_transit', 'delivered', 'failed', 'returned',
] as const
export type ShipmentStatus = (typeof SHIPMENT_STATUSES)[number]

export const DELIVERY_TYPES = ['own', 'partner', 'pickup'] as const
export type DeliveryType = (typeof DELIVERY_TYPES)[number]

/** Spec §8.1. UI-level steps, wider than the DB status column, because
 *  "assigned to a delivery man" and "handed to platform delivery" are shipment
 *  facts rather than order statuses. */
export type FulfilmentStep =
  | 'confirmed' | 'processing' | 'dispatched'
  | 'assigned' | 'handed_to_platform' | 'delivered'

export const ORDER_STATUS_FLOW: Record<'own' | 'partner', readonly FulfilmentStep[]> = {
  own: ['confirmed', 'processing', 'dispatched', 'assigned', 'delivered'],
  partner: ['confirmed', 'processing', 'dispatched', 'handed_to_platform', 'delivered'],
} as const

export interface OrderLine {
  id: Uuid
  lineNumber: number
  listingId: Uuid
  /** Snapshots — what was ordered, not what the listing says today. */
  skuSnapshot: string
  nameSnapshot: string
  quantity: number
  unitCode: string | null
  packSize: number | null
  grossWeightGrams: number | null
  isRestricted: boolean
  unitPrice: Money
  lineTotal: Money
  fulfilledQuantity: number
}

export interface StatusHistoryEntry {
  id: Uuid
  fromStatus: string | null
  toStatus: string
  reason: string | null
  changedBy: string | null
  occurredAt: IsoDateTime
}

export interface OrderSummary {
  id: Uuid
  orderNumber: string
  status: OrderStatus
  deliveryType: DeliveryType
  buyerName: string
  placedAt: IsoDateTime
  grandTotal: Money
  lineCount: number
}

export interface OrderDetail extends OrderSummary {
  lines: OrderLine[]
  subtotal: Money
  discountTotal: Money
  deliveryCharge: Money
  commissionTotal: Money
  sellerNet: Money
  deliveryAddress: string | null
  deliveryContactPhone: string | null
  deliveryGeographyName: string | null
  history: StatusHistoryEntry[]
  shipment: Shipment | null
  /** Derived server-side so the UI never guesses. */
  currentStep: FulfilmentStep | null
  availableTransitions: FulfilmentStep[]
}

export interface Shipment {
  id: Uuid
  status: ShipmentStatus
  deliveryType: DeliveryType
  trackingReference: string | null
  assignedToUserId: Uuid | null   // G2
  assignedToName: string | null
  assignedAt: IsoDateTime | null
  dispatchedAt: IsoDateTime | null
  deliveredAt: IsoDateTime | null
}
```

```ts
// delivery.ts — the Delivery Man shell
import type { Uuid, IsoDateTime } from './common'
import type { OrderLine } from './orders'

/** D3/R1. `precision: 'none'` is the normal case until the Flutter app ships
 *  coordinate capture, so the UI must render an address-only state honestly. */
export interface GeoPoint {
  lat: number | null
  lng: number | null
  precision: 'exact' | 'none'
}

export interface DeliveryAssignment {
  shipmentId: Uuid
  orderId: Uuid
  orderNumber: string
  status: 'assigned' | 'picked_up' | 'delivered' | 'failed'
  assignedAt: IsoDateTime
  buyerName: string
  buyerPhone: string | null
  deliveryAddress: string
  geographyName: string | null
  location: GeoPoint
  lines: OrderLine[]
  totalWeightGrams: number | null
  hasRestrictedItems: boolean
}
```

- [ ] **Step 7: Write `offers.ts` and `market.ts`**

```ts
// offers.ts
import type { Uuid, Money, IsoDateTime } from './common'

export const OFFER_STATUSES = [
  'draft', 'pending_approval', 'active', 'paused', 'expired', 'cancelled',
] as const
export type OfferStatus = (typeof OFFER_STATUSES)[number]

export interface Discount {
  id: Uuid
  code: string
  name: string
  basis: 'percentage' | 'fixed'
  discountPercent: number | null      // 0–100, per CK_offer_percent
  discountAmount: Money | null
  maxDiscount: Money | null
  minOrder: Money | null
  scope: { kind: 'listing'; listingIds: Uuid[] } | { kind: 'category'; categoryId: Uuid }
  startsAt: IsoDateTime
  endsAt: IsoDateTime | null
  status: OfferStatus
  isStackable: boolean
  stackPriority: number
  stackGroup: string | null
  maxRedemptions: number | null
  redemptionCount: number
}

/** Spec §7 — what the Gantt makes visible. */
export interface DiscountConflict {
  listingId: Uuid
  listingName: string
  discountIds: Uuid[]
  overlapFrom: IsoDateTime
  overlapTo: IsoDateTime | null
  resolution: 'stacked' | 'highest_priority_wins' | 'ambiguous'
  winningDiscountId: Uuid | null
}

/** Waterfall input: list price → discount → commission → net, per unit. */
export interface MarginBreakdown {
  listPrice: Money
  discount: Money
  commission: Money
  net: Money
  netMarginFraction: number
}
```

```ts
// market.ts — whole-market aggregates (spec §7, R4)
import type { Money } from './common'

export interface CategoryDemandPoint {
  month: string           // 'YYYY-MM'
  categoryName: string
  orderCount: number
  shareOfMarket: number   // fraction 0–1
}

export interface PriceBenchmark {
  categoryName: string
  marketMin: Money
  marketMedian: Money
  marketMax: Money
  myMedian: Money | null
  myPosition: 'below' | 'at' | 'above' | 'absent'
  sampleSize: number
}

export interface RegionalDemand {
  geographyId: string
  districtName: string
  orderCount: number
  /** R4 — a count, never a named list of competitors. */
  competitorCount: number
  /** False when the cell is below the k-anonymity floor; the UI greys it out. */
  isDisclosable: boolean
}

export interface PricePositionPoint {
  listingId: string | null
  listingName: string | null
  categoryName: string
  unitPriceMinor: number
  unitsSold: number
  isMine: boolean
}

export interface MarketIntelligence {
  generatedAt: string
  demandTrend: CategoryDemandPoint[]
  priceBenchmarks: PriceBenchmark[]
  regionalDemand: RegionalDemand[]
  pricePositions: PricePositionPoint[]
}
```

- [ ] **Step 8: Barrel-export from `index.ts`, run the tests, and typecheck**

Run: `npx vitest run src/data/contracts` → PASS, 11 tests. Then `npm run typecheck` → clean.

- [ ] **Step 9: Commit**

```bash
git add src/data/contracts
git commit -m "feat: data contracts — the Phase 2 API contract

Enum arrays are asserted against the live CHECK constraint values so the
client cannot silently drift from the database.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01GELJmXtQYQ29TYEJmMnkDs"
```

---

## Task 5: DataAdapter interface, MockAdapter, and DataProvider

**Files:**
- Create: `src/data/DataAdapter.ts`, `src/data/DataProvider.tsx`, `src/data/mock/MockAdapter.ts`, `src/data/mock/fixtures/*.ts`, `src/data/useQuery.ts`
- Test: `src/data/mock/MockAdapter.test.ts`, `src/data/useQuery.test.tsx`

**Interfaces:**
- Consumes: everything from `@/data/contracts`.
- Produces:
  - `export interface DataAdapter { … }` — the full method surface below
  - `export function DataProvider(props: { adapter: DataAdapter; children: ReactNode })`
  - `export function useData(): DataAdapter`
  - `export function useQuery<T>(key: unknown[], fn: () => Promise<T>): { data?: T; loading: boolean; error?: ApiProblem; refetch(): void }` — the hook every screen uses, which is what makes C8 mechanical

```ts
export interface DataAdapter {
  // auth
  login(id: string, password: string): Promise<Session>
  register(input: RegisterCompanyInput): Promise<Session>
  forgotPassword(identifier: string): Promise<void>
  resetPassword(token: string, password: string): Promise<void>
  acceptInvitation(token: string, password: string): Promise<Session>
  logout(): Promise<void>

  // organisation & verification
  getOrganisation(): Promise<Organisation>
  updateOrganisation(patch: Partial<Organisation>): Promise<Organisation>
  getVerificationDossier(): Promise<VerificationDossier>
  submitCertificate(input: SubmitCertificateInput): Promise<Certificate>
  submitIdentityDocument(input: SubmitIdentityInput): Promise<IdentityDocument>
  submitDossierForReview(): Promise<VerificationDossier>

  // catalogue
  listListings(q: PageQuery & { kind?: 'product' | 'service'; status?: ListingStatus })
    : Promise<Page<Listing>>
  getListing(id: Uuid): Promise<Listing>
  saveListing(input: SaveListingInput): Promise<Listing>
  getPublishReadiness(id: Uuid): Promise<PublishReadiness>
  publishListing(id: Uuid): Promise<Listing>
  deleteListing(id: Uuid): Promise<void>       // soft delete

  // inventory
  listStock(q: PageQuery): Promise<Page<StockRow>>
  adjustStock(listingId: Uuid, delta: number, reason: string): Promise<StockRow>

  // orders
  listOrders(q: PageQuery & { status?: OrderStatus }): Promise<Page<OrderSummary>>
  getOrder(id: Uuid): Promise<OrderDetail>
  advanceOrder(id: Uuid, to: FulfilmentStep, payload?: AdvancePayload): Promise<OrderDetail>
  assignDeliveryPerson(orderId: Uuid, userId: Uuid): Promise<OrderDetail>

  // discounts
  listDiscounts(q: PageQuery & { status?: OfferStatus }): Promise<Page<Discount>>
  saveDiscount(input: SaveDiscountInput): Promise<Discount>
  setDiscountStatus(id: Uuid, status: OfferStatus): Promise<Discount>
  detectDiscountConflicts(draft: SaveDiscountInput): Promise<DiscountConflict[]>
  getMarginBreakdown(listingId: Uuid, discountId: Uuid | null): Promise<MarginBreakdown>

  // market intelligence
  getMarketIntelligence(window: '3m' | '6m' | '12m'): Promise<MarketIntelligence>

  // team
  listMembers(q: PageQuery): Promise<Page<Member>>
  inviteMember(email: string, role: PortalRole): Promise<void>
  setMemberRole(membershipId: Uuid, role: PortalRole): Promise<Member>
  setMemberOverride(membershipId: Uuid, permission: string,
                    effect: 'grant' | 'deny' | 'clear'): Promise<Member>
  removeMember(membershipId: Uuid): Promise<void>

  // reports, reviews, payments, feedback, notifications
  getPerformanceReport(window: '3m' | '6m' | '12m'): Promise<PerformanceReport>
  listReviews(q: PageQuery): Promise<Page<Review>>
  respondToReview(id: Uuid, body: string): Promise<Review>
  listPayouts(q: PageQuery): Promise<Page<Payout>>
  requestPayout(amountMinor: number): Promise<Payout>
  submitFeedback(input: FeedbackInput): Promise<void>
  listNotifications(q: PageQuery): Promise<Page<Notification>>

  // delivery shell
  listMyAssignments(status?: 'active' | 'completed'): Promise<DeliveryAssignment[]>
  getAssignment(shipmentId: Uuid): Promise<DeliveryAssignment>
  confirmHandover(shipmentId: Uuid, input: HandoverInput): Promise<DeliveryAssignment>
}
```

- [ ] **Step 1: Write the failing MockAdapter test**

```ts
import { describe, it, expect, beforeEach } from 'vitest'
import { MockAdapter } from './MockAdapter'

let api: MockAdapter
beforeEach(() => { api = new MockAdapter({ latencyMs: 0 }) })

describe('MockAdapter', () => {
  it('paginates every list from the first fixture (C10)', async () => {
    const p = await api.listListings({ page: 1, pageSize: 5 })
    expect(p.items).toHaveLength(5)
    expect(p.total).toBeGreaterThan(5)
    expect(p.page).toBe(1)
  })

  it('filters by search term', async () => {
    const all = await api.listListings({ page: 1, pageSize: 100 })
    const term = all.items[0]!.name.slice(0, 4)
    const hit = await api.listListings({ page: 1, pageSize: 100, search: term })
    expect(hit.total).toBeLessThanOrEqual(all.total)
    expect(hit.items.every((l) => l.name.toLowerCase().includes(term.toLowerCase()))).toBe(true)
  })

  it('returns money as minor units plus a display string, never a float (C2)', async () => {
    const { items } = await api.listListings({ page: 1, pageSize: 1 })
    const price = items[0]!.price
    expect(Number.isInteger(price.amountMinor)).toBe(true)
    expect(price.currency).toBe('BDT')
    expect(price.display).not.toBe('')
  })

  it('refuses to publish a listing whose certificate is unverified', async () => {
    const id = api.seed.listingWithUnverifiedCertificateId
    const readiness = await api.getPublishReadiness(id)
    expect(readiness.canPublish).toBe(false)
    expect(readiness.blockers).toContain('certificate_not_verified')
    await expect(api.publishListing(id)).rejects.toMatchObject({ code: 'listing_not_publishable' })
  })

  it('refuses to publish a listing with no primary image', async () => {
    const readiness = await api.getPublishReadiness(api.seed.listingWithoutImageId)
    expect(readiness.blockers).toContain('no_primary_image')
  })

  it('exposes deliveryMode as read-only platform state (C14)', async () => {
    const org = await api.getOrganisation()
    expect(['own', 'partner', 'both']).toContain(org.deliveryMode)
    await expect(
      api.updateOrganisation({ deliveryMode: 'own' } as never),
    ).rejects.toMatchObject({ code: 'delivery_mode_not_self_assignable' })
  })

  it('records an audit entry on every order transition', async () => {
    const { items } = await api.listOrders({ page: 1, pageSize: 50, status: 'confirmed' })
    const before = await api.getOrder(items[0]!.id)
    const after = await api.advanceOrder(before.id, 'processing')
    expect(after.history.length).toBe(before.history.length + 1)
    expect(after.history.at(-1)).toMatchObject({ toStatus: 'processing' })
    expect(after.history.at(-1)!.occurredAt).toBeTruthy()
  })

  it('offers only the transitions the assigned delivery mode permits (C14)', async () => {
    const partner = await api.getOrder(api.seed.partnerOrderId)
    expect(partner.availableTransitions).not.toContain('assigned')
    const own = await api.getOrder(api.seed.ownOrderId)
    expect(own.availableTransitions).not.toContain('handed_to_platform')
  })

  it('returns market aggregates that never name a competitor (R4)', async () => {
    const mi = await api.getMarketIntelligence('12m')
    const serialised = JSON.stringify(mi.regionalDemand)
    expect(serialised).not.toMatch(/legalName|companyName/)
    expect(mi.regionalDemand.every((r) => typeof r.competitorCount === 'number')).toBe(true)
  })

  it('marks low-sample regions as non-disclosable rather than dropping them', async () => {
    const mi = await api.getMarketIntelligence('12m')
    expect(mi.regionalDemand.some((r) => !r.isDisclosable)).toBe(true)
  })

  it('gives delivery assignments an honest precision flag (D3/R1)', async () => {
    const list = await api.listMyAssignments('active')
    expect(list.some((a) => a.location.precision === 'none')).toBe(true)
    for (const a of list) {
      if (a.location.precision === 'none') expect(a.location.lat).toBeNull()
      else expect(typeof a.location.lat).toBe('number')
    }
  })
})
```

- [ ] **Step 2: Run it, watch it fail, then implement**

`MockAdapter` holds fixtures in memory and mutates them, so a session behaves like a real backend: publishing a listing changes its status for later reads, advancing an order appends real history. Constructor takes `{ latencyMs = 220, failureRate = 0 }`; `latencyMs` makes loading states visible during review and `failureRate` lets a reviewer exercise error states. Rejections are `ApiProblem` objects, never bare `Error`, so screens handle one shape.

`seed` exposes named ids (`listingWithUnverifiedCertificateId`, `ownOrderId`, `partnerOrderId`, …) so tests and review scripts can reach specific states without searching.

Fixtures mirror the real seeded catalogue in `agromed-api/src/AgroMed.Api/storage/listings/` — `urea-46-badc`, `bari-tomato-14`, `sonar-20sl`, `bioguard-50ec`, `knapsack-sprayer-16l`, `drone-spraying`, `soil-health-test` and the rest — so screenshots resemble production rather than lorem ipsum.

- [ ] **Step 3: Implement `useQuery` and `DataProvider`**

```tsx
export function useQuery<T>(key: unknown[], fn: () => Promise<T>) {
  const [state, setState] = useState<{ data?: T; loading: boolean; error?: ApiProblem }>({
    loading: true,
  })
  const serial = JSON.stringify(key)
  const run = useCallback(() => {
    let cancelled = false
    setState((s) => ({ ...s, loading: true, error: undefined }))
    fn().then(
      (data) => { if (!cancelled) setState({ data, loading: false }) },
      (error: ApiProblem) => { if (!cancelled) setState({ loading: false, error }) },
    )
    return () => { cancelled = true }
  }, [serial])
  useEffect(run, [run])
  return { ...state, refetch: run }
}
```

The cancellation flag matters: without it, switching locale or filters fast enough leaves a slow earlier response overwriting a newer one.

- [ ] **Step 4: Run the tests, confirm PASS, and commit**

---

## Task 6: Session, authentication, and route guards

**Files:**
- Create: `src/auth/SessionProvider.tsx`, `src/auth/guards.tsx`
- Test: `src/auth/SessionProvider.test.tsx`, `src/auth/guards.test.tsx`

**Interfaces:**
- Consumes: `DataAdapter` via `useData()`, `Session` / `PortalRole` from contracts.
- Produces:
  - `export function SessionProvider(props: { children: ReactNode })`
  - `export function useSession(): { session: Session | null; loading: boolean; signIn(id, pw): Promise<void>; signOut(): void }`
  - `export function RequireAuth(props: { children: ReactNode })` — redirects to `/login`, preserving intended destination
  - `export function ShellRouter()` — renders `DeliveryShell` for `delivery_man`, `CompanyShell` otherwise

- [ ] **Step 1: Write the failing guard test**

```tsx
it('sends an unauthenticated visitor to /login and remembers where they were going', async () => {
  renderAt('/orders', { session: null })
  expect(await screen.findByRole('heading', { name: /sign in/i })).toBeInTheDocument()
  expect(sessionStorage.getItem('agromed.returnTo')).toBe('/orders')
})

it('gives a delivery_man the delivery shell, not the company sidebar', async () => {
  renderAt('/', { session: sessionWithRole('delivery_man') })
  expect(await screen.findByRole('navigation', { name: /deliveries/i })).toBeInTheDocument()
  expect(screen.queryByRole('link', { name: /market intelligence/i })).not.toBeInTheDocument()
})

it('keeps a delivery_man out of company routes even by direct URL', async () => {
  renderAt('/discounts', { session: sessionWithRole('delivery_man') })
  expect(await screen.findByText(/not available for your role/i)).toBeInTheDocument()
})

it('gives owner and manager the company shell', async () => {
  renderAt('/', { session: sessionWithRole('manager') })
  expect(await screen.findByRole('link', { name: /market intelligence/i })).toBeInTheDocument()
})
```

- [ ] **Step 2: Implement**

Access token in React state (memory) — never `localStorage`, which is readable by any injected script. Refresh token in `sessionStorage` under `agromed.refresh`, with a comment stating plainly that this is a **Phase 2 debt**: it moves to an httpOnly cookie once the API sets one, and until then a stored refresh token is XSS-reachable. Writing the compromise down beats discovering it later.

- [ ] **Step 3: Run the tests, confirm PASS, and commit**

---

## Task 7: The capability gate

Spec §5.3. The one place that answers "may this user do this?", so D4's "full portal with writes disabled" does not become a rule scattered across 27 screens.

**Files:**
- Create: `src/access/permissions.ts`, `src/access/can.ts`, `src/access/Gate.tsx`
- Test: `src/access/can.test.ts`, `src/access/Gate.test.tsx`

**Interfaces:**
- Produces:
  - `export type Action = 'product.create' | 'product.publish' | 'product.delete' | 'service.create' | 'order.fulfil' | 'order.handover' | 'order.assign' | 'discount.manage' | 'member.invite' | 'member.remove' | 'payout.request' | 'certificate.submit' | 'organisation.manage' | 'review.respond' | 'report.read' | 'feedback.submit' | 'inventory.write'`
  - `export const ROLE_PERMISSIONS: Record<PortalRole, string[]>` — mirrors the DB seed
  - `export type Denial = { allowed: true } | { allowed: false; reason: 'role' | 'verification' | 'blacklisted' }`
  - `export function can(action: Action, ctx: { permissions: string[]; verificationStatus: VerificationStatus; isBlacklisted: boolean }): Denial`
  - `export function Gate(props: { action: Action; children: ReactElement; mode?: 'disable' | 'hide' }): JSX.Element`

- [ ] **Step 1: Write the failing test**

```ts
const verifiedOwner = {
  permissions: ROLE_PERMISSIONS.owner,
  verificationStatus: 'verified' as const,
  isBlacklisted: false,
}
const unverifiedOwner = { ...verifiedOwner, verificationStatus: 'pending' as const }
const manager = { ...verifiedOwner, permissions: ROLE_PERMISSIONS.manager }

describe('can()', () => {
  it('lets a verified owner publish', () => {
    expect(can('product.publish', verifiedOwner)).toEqual({ allowed: true })
  })

  it('blocks an unverified company from writing, citing verification not role (D4)', () => {
    expect(can('product.publish', unverifiedOwner))
      .toEqual({ allowed: false, reason: 'verification' })
  })

  it('still lets an unverified company READ — the portal is open, writes are not', () => {
    expect(can('report.read', unverifiedOwner)).toEqual({ allowed: true })
  })

  it('lets an unverified company submit certificates — otherwise it can never get verified', () => {
    expect(can('certificate.submit', unverifiedOwner)).toEqual({ allowed: true })
  })

  it('blocks a manager from payouts, citing role', () => {
    expect(can('payout.request', manager)).toEqual({ allowed: false, reason: 'role' })
  })

  it('blocks everything for a blacklisted organisation, and says so', () => {
    expect(can('product.create', { ...verifiedOwner, isBlacklisted: true }))
      .toEqual({ allowed: false, reason: 'blacklisted' })
  })

  it('gives delivery_man handover but never fulfilment', () => {
    const dm = { ...verifiedOwner, permissions: ROLE_PERMISSIONS.delivery_man }
    expect(can('order.handover', dm)).toEqual({ allowed: true })
    expect(can('order.fulfil', dm)).toEqual({ allowed: false, reason: 'role' })
  })
})
```

And for `Gate`, the distinction that matters most:

```tsx
it('explains a verification block differently from a role block (C9)', () => {
  renderGate('product.publish', unverifiedOwner)
  expect(screen.getByRole('button')).toBeDisabled()
  expect(screen.getByRole('button')).toHaveAccessibleDescription(/verification in progress/i)

  renderGate('payout.request', manager)
  expect(screen.getByRole('button')).toHaveAccessibleDescription(/role does not permit/i)
})
```

Telling a user "not permitted" when the truth is "not yet verified" sends them to the wrong screen — that is the entire reason `Denial` carries a reason rather than a boolean.

- [ ] **Step 2: Run it, watch it fail, implement, confirm PASS, commit**

`certificate.submit` and every read action are exempt from the verification gate. Everything else in `WRITE_ACTIONS` requires `verificationStatus === 'verified'`.

---

## Task 8: UI primitives

**Files:**
- Create: `src/ui/{Card,Button,Field,Select,Textarea,Table,Badge,Tabs,Modal,EmptyState,ErrorState,Skeleton,Stepper,Pagination,Toast,StatTile,SearchInput,FileDrop}.tsx`, `src/ui/index.ts`
- Test: `src/ui/states.test.tsx`, `src/ui/Table.test.tsx`, `src/ui/Stepper.test.tsx`

**Interfaces:**
- Produces (the signatures later tasks rely on):
  - `Button({ variant?: 'primary'|'secondary'|'ghost'|'danger'; size?: 'sm'|'md'; loading?: boolean; ...ButtonHTMLAttributes })`
  - `Field({ label, error?, hint?, required?, children })`
  - `Table<T>({ columns: Column<T>[], rows: T[], empty?, loading?, error?, onRetry?, rowKey })` where `Column<T> = { key: string; header: string; render(row: T): ReactNode; align?: 'left'|'right'; width?: string }`
  - `AsyncBoundary({ query, children })` — takes a `useQuery` result and renders `Skeleton` / `ErrorState` / `EmptyState` / children. **This is how C8 stops being a discipline and becomes a default.**
  - `Stepper({ steps: { key: string; label: string; at?: string; actor?: string }[]; current: number; tone?: 'default'|'muted' })`
  - `Pagination({ page, pageSize, total, onChange })` — renders `paging.showing` via `useT`
  - `StatTile({ label, value, delta?, tone? })` — value already formatted by the caller; the tile never formats

- [ ] **Step 1: Write the failing state-machine test for `AsyncBoundary`**

```tsx
it('renders a skeleton while loading', () => {
  render(<AsyncBoundary query={{ loading: true, refetch }}> <div>done</div> </AsyncBoundary>)
  expect(screen.getByTestId('skeleton')).toBeInTheDocument()
})

it('renders the error state with a retry that calls refetch', async () => {
  const refetch = vi.fn()
  render(<AsyncBoundary query={{ loading: false, error: problem, refetch }}><div/></AsyncBoundary>)
  await userEvent.click(screen.getByRole('button', { name: /try again/i }))
  expect(refetch).toHaveBeenCalledOnce()
})

it('renders the empty state for an empty page rather than an empty table', () => {
  render(
    <AsyncBoundary query={{ loading: false, data: { items: [], page: 1, pageSize: 20, total: 0 }, refetch }}>
      {() => <div>rows</div>}
    </AsyncBoundary>,
  )
  expect(screen.getByText(/nothing here yet/i)).toBeInTheDocument()
})

it('renders children once data arrives', () => { /* … */ })
```

- [ ] **Step 2: Run it, watch it fail, implement all primitives, confirm PASS, commit**

Every primitive draws colour from Tailwind token classes only — no hex literals below `src/design/`. `Button` variant `primary` is `bg-primary text-panel`; **never** place `<Logo/>` inside it (C13).

---

## Task 9: Chart primitives

**Before writing any chart code, load the `dataviz` skill** — it carries the form heuristic, mark specs and interaction rules this task assumes.

**Files:**
- Create: `src/charts/{ChartFrame,LineTrend,Funnel,Bullet,StackedArea,Dumbbell,Scatter,GanttTimeline,Waterfall,GroupedBar,CohortHeatmap,Donut,DemandMap}.tsx`, `src/charts/index.ts`, `src/charts/encodings.ts`
- Test: `src/charts/locale.test.tsx`, `src/charts/encodings.test.ts`

**Interfaces:**
- Produces:
  - `export type Encoding = 'line'|'funnel'|'bullet'|'stacked-area'|'dumbbell'|'scatter'|'gantt'|'waterfall'|'grouped-bar'|'heatmap'|'donut'|'choropleth'`
  - Every chart component exports `Component.encoding: Encoding` as a static property
  - `ChartFrame({ title, subtitle?, encoding, children, footnote? })` — registers the encoding with a per-screen context
  - `ChartScreen({ children })` — the context provider that **throws in development if two charts on one screen declare the same encoding**

- [ ] **Step 1: Write the failing encoding-uniqueness test**

This is C5 turned into a test rather than a review note, and it is what stops the `Analytics.jsx` mistake from recurring.

```tsx
it('throws when a screen renders two charts with the same encoding (C5)', () => {
  expect(() =>
    render(
      <ChartScreen>
        <ChartFrame title="Revenue" encoding="line"><div/></ChartFrame>
        <ChartFrame title="Orders" encoding="line"><div/></ChartFrame>
      </ChartScreen>,
    ),
  ).toThrow(/duplicate chart encoding "line"/i)
})

it('permits distinct encodings on one screen', () => {
  expect(() =>
    render(
      <ChartScreen>
        <ChartFrame title="Revenue" encoding="line"><div/></ChartFrame>
        <ChartFrame title="Pipeline" encoding="funnel"><div/></ChartFrame>
      </ChartScreen>,
    ),
  ).not.toThrow()
})
```

- [ ] **Step 2: Write the failing locale test**

```tsx
it('formats every axis through the active locale (C6)', () => {
  render(
    <LocaleProvider initial="bn-BD">
      <ChartScreen>
        <LineTrend title="Revenue" data={[{ x: '2026-01', y: 1500000 }]} />
      </ChartScreen>
    </LocaleProvider>,
  )
  expect(document.body.textContent).toMatch(/[০-৯]/)
  expect(document.body.textContent).not.toMatch(/1,500,000/)
})
```

Recharts needs a non-zero container size under jsdom — wrap test renders in a fixed-size div and pass explicit `width`/`height` rather than `ResponsiveContainer` in tests.

- [ ] **Step 3: Implement**

Every chart: takes already-shaped data (no fetching, no aggregation), pulls colours from `SERIES` in `@/design/tokens`, passes `makeTickFormatter(locale)` to every axis, and renders an accessible `<table>` of the same data visually hidden beneath it — a chart nobody can read with a screen reader is a chart half the audience cannot use.

`DemandMap` wraps `react-leaflet` with OSM tiles (D7), colouring districts by `orderCount` and greying cells where `isDisclosable === false`.

`GanttTimeline` is the highest-value component (spec §7): rows are listings, bars are discount windows, and overlapping bars on one row are drawn stacked with a hatched intersection so a conflict is *seen*, not computed.

- [ ] **Step 4: Run the tests, confirm PASS, and commit**

---

## Task 10: Shells and routing

**Files:**
- Create: `src/layouts/{AuthShell,CompanyShell,DeliveryShell,NavConfig}.tsx`, `src/routes.tsx`, `src/App.tsx`, `src/main.tsx`
- Delete: `src/components/Sidebar.jsx`, `src/components/Topbar.jsx`, `src/components/ui.jsx`, `src/App.jsx`, `src/main.jsx`
- Test: `src/layouts/CompanyShell.test.tsx`, `src/layouts/DeliveryShell.test.tsx`

**Interfaces:**
- Consumes: `Logo`, `useT`, `useLocale`, `useSession`, `can`.
- Produces: `NAV_ITEMS: { to: string; labelKey: TranslationKey; icon: LucideIcon; action?: Action }[]`, the three shells, and the route tree.

- [ ] **Step 1: Write the failing shell tests**

```tsx
it('has no search field in the topbar (C11)', () => {
  renderShell()
  expect(screen.queryByPlaceholderText(/search/i)).not.toBeInTheDocument()
})

it('does not link to any removed section (C11)', () => {
  renderShell()
  for (const gone of [/farmer opportunit/i, /farmer request/i, /promotion/i]) {
    expect(screen.queryByRole('link', { name: gone })).not.toBeInTheDocument()
  }
})

it('shows the official logo at 32px beside the wordmark (C13)', () => {
  renderShell()
  const logo = screen.getByRole('img', { name: /agromedconnect/i })
  expect(logo).toHaveAttribute('width', '32')
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
  await userEvent.click(screen.getByRole('button', { name: /বাংলা|english/i }))
  expect(screen.getByRole('link', { name: 'অর্ডার' })).toBeInTheDocument()
})
```

```tsx
// DeliveryShell
it('has no sidebar and uses a bottom tab bar', () => {
  renderDelivery()
  expect(screen.queryByRole('complementary')).not.toBeInTheDocument()
  expect(screen.getByRole('navigation', { name: /deliveries/i })).toBeInTheDocument()
})

it('gives every tab a 44px minimum touch target (C12)', () => {
  renderDelivery()
  for (const tab of screen.getAllByRole('link')) {
    expect(tab).toHaveClass('min-h-[44px]')
  }
})
```

- [ ] **Step 2: Run them, watch them fail, implement, confirm PASS**

`CompanyShell` filters `NAV_ITEMS` by `can(item.action)` with `mode: 'hide'` — a nav link to a page the role cannot use is a dead end, so it is removed rather than disabled. This is the one place `Gate` hides instead of disabling.

- [ ] **Step 3: Delete the old JSX shell and commit**

```bash
git rm src/components/Sidebar.jsx src/components/Topbar.jsx src/components/ui.jsx src/App.jsx src/main.jsx
git add -A
git commit -m "feat: three shells, permission-filtered nav, bilingual topbar

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01GELJmXtQYQ29TYEJmMnkDs"
```

---

## Task 11: Authentication screens

**Files:**
- Create: `src/features/auth/{Login,RegisterCompany,ForgotPassword,ResetPassword,AcceptInvitation}.tsx`, `src/features/auth/validation.ts`
- Test: `src/features/auth/auth.test.tsx`

**Interfaces:**
- Consumes: `useData()`, `useSession()`, `Logo`, `Field`, `Button`.
- Produces: five route components, and `validatePhoneOrEmail(v: string): string | null` / `validatePassword(v: string): string | null`.

- [ ] **Step 1: Write the failing tests**

```tsx
it('shows the logo at 96px above the sign-in card (C13)', () => {
  render(<Login />)
  expect(screen.getByRole('img', { name: /agromedconnect/i })).toHaveAttribute('width', '96')
})

it('accepts a Bangladeshi phone number in E.164 or local form', () => {
  expect(validatePhoneOrEmail('+8801712345678')).toBeNull()
  expect(validatePhoneOrEmail('01712345678')).toBeNull()
  expect(validatePhoneOrEmail('nope')).toMatch(/phone or email/i)
})

it('surfaces the API problem detail on a failed sign-in, not a generic message', async () => {
  adapter.login = vi.fn().mockRejectedValue({ code: 'invalid_credentials', detail: 'Wrong password' })
  await signIn('01712345678', 'bad')
  expect(await screen.findByRole('alert')).toHaveTextContent(/wrong password/i)
})

it('sends a newly registered company to verification, not the dashboard (spec §8 #2)', async () => {
  await completeRegistration()
  expect(await screen.findByRole('heading', { name: /verification/i })).toBeInTheDocument()
})

it('never reveals whether an account exists on forgot-password', async () => {
  await requestReset('nobody@example.com')
  expect(await screen.findByText(/if an account exists/i)).toBeInTheDocument()
})

it('offers a locale toggle before sign-in', () => {
  render(<Login />)
  expect(screen.getByRole('button', { name: /বাংলা|english/i })).toBeInTheDocument()
})
```

The forgot-password test encodes a security property: a message that differs for known and unknown accounts is an account-enumeration oracle.

- [ ] **Step 2: Run, fail, implement, confirm PASS, commit**

---

## Task 12: Dashboard

Spec §7 row 1. Three charts, three distinct encodings, no search, no Business Insights widget.

**Files:** Create `src/features/dashboard/Dashboard.tsx`, `src/features/dashboard/dashboard.test.tsx`

**Interfaces:** Consumes `useQuery`, `useData().getPerformanceReport`, `listOrders`, `ChartScreen`, `LineTrend`, `Funnel`, `Bullet`, `StatTile`, `AsyncBoundary`.

- [ ] **Step 1: Write the failing tests**

```tsx
it('renders exactly three charts, all with distinct encodings (C5)', async () => {
  await renderDashboard()
  const frames = await screen.findAllByTestId('chart-frame')
  const encodings = frames.map((f) => f.dataset.encoding)
  expect(encodings).toHaveLength(3)
  expect(new Set(encodings).size).toBe(3)
})

it('has no search field (C11)', async () => {
  await renderDashboard()
  expect(screen.queryByRole('searchbox')).not.toBeInTheDocument()
})

it('has no Business Insights widget (C11)', async () => {
  await renderDashboard()
  expect(screen.queryByText(/business insights/i)).not.toBeInTheDocument()
})

it('links to nothing that was removed (C11)', async () => { /* opportunities, requests, promotions */ })

it('renders loading, then error with retry, then data (C8)', async () => { /* three renders */ })

it('formats every money figure through the server display string (C2)', async () => {
  await renderDashboard()
  expect(screen.getByTestId('kpi-revenue')).toHaveTextContent('৳')
})
```

- [ ] **Step 2: Implement**

Layout: a greeting row (no search), four `StatTile`s (revenue, orders awaiting action, active listings, average fulfilment days), then `ChartScreen` with:
1. `LineTrend` — revenue, 12 weeks
2. `Funnel` — order pipeline by status, each stage clickable through to Orders pre-filtered
3. `Bullet` — fulfilment SLA against target

Then an "Needs your attention" list: orders awaiting dispatch, certificates expiring within 30 days, discounts ending within 7 days. Every row is a link, because a dashboard that reports without routing is a wall.

- [ ] **Step 3: Run, confirm PASS, commit**

---

## Task 13: Market Intelligence

Spec §7 row 2 and §9 R4. Four charts, four encodings, whole-market data.

**Files:** Create `src/features/market/MarketIntelligence.tsx`, `src/features/market/market.test.tsx`

- [ ] **Step 1: Write the failing tests**

```tsx
it('renders four charts with four distinct encodings (C5)', async () => { /* as Task 12 */ })

it('never displays a competitor name (R4)', async () => {
  await renderMarket()
  for (const name of fixtures.competitorLegalNames) {
    expect(screen.queryByText(name)).not.toBeInTheDocument()
  }
})

it('greys out and labels regions below the k-anonymity floor rather than hiding them', async () => {
  await renderMarket()
  const cell = await screen.findByTestId('region-suppressed')
  expect(cell).toHaveAttribute('aria-label', expect.stringMatching(/too few sellers/i))
})

it('states when the aggregate was computed, because it is cached (spec §9 R4)', async () => {
  await renderMarket()
  expect(screen.getByTestId('generated-at')).toHaveTextContent(/updated/i)
})

it('marks my own position distinctly in the price scatter', async () => {
  await renderMarket()
  expect(await screen.findAllByTestId('scatter-mine')).not.toHaveLength(0)
})

it('says plainly when I do not sell in a benchmarked category', async () => {
  await renderMarket()
  expect(screen.getByText(/you do not sell in this category/i)).toBeInTheDocument()
})
```

- [ ] **Step 2: Implement**

`ChartScreen` with a 3m/6m/12m window selector driving one `getMarketIntelligence(window)` call:

1. **StackedArea** — category demand share, whole market, over the window
2. **Dumbbell** — my median price against market min/median/max per category; `myPosition: 'absent'` renders the "you do not sell here" note instead of a marker
3. **DemandMap** (choropleth) — district demand intensity, competitor **count** in the tooltip, suppressed cells greyed with an explanatory `aria-label`
4. **Scatter** — unit price against units sold, my listings highlighted against the market cloud

A `generatedAt` line under the header states when the aggregate was computed. This is not decoration: the Phase 2 figures come from a cached, scheduled recomputation, and a stale number presented as live is how a pricing decision goes wrong.

- [ ] **Step 3: Run, confirm PASS, commit**

---

## Task 14: Products — list, editor, and the publish gate

**Files:** Create `src/features/catalog/{ProductList,ProductEditor,PublishGate,MediaManager}.tsx`, `src/features/catalog/catalog.test.tsx`

- [ ] **Step 1: Write the failing tests**

```tsx
it('has a search field, because this is a list worth searching (C11)', async () => {
  await renderProducts()
  expect(screen.getByRole('searchbox')).toBeInTheDocument()
})

it('paginates rather than rendering everything (C10)', async () => {
  await renderProducts()
  expect(screen.getByTestId('pagination')).toHaveTextContent(/of \d+/)
})

it('blocks publish when no verified certificate is attached, and names the blocker', async () => {
  await openProduct(seed.listingWithUnverifiedCertificateId)
  const btn = screen.getByRole('button', { name: /publish/i })
  expect(btn).toBeDisabled()
  expect(screen.getByTestId('publish-blockers'))
    .toHaveTextContent(/certificate is awaiting verification/i)
})

it('blocks publish when there is no primary image', async () => {
  await openProduct(seed.listingWithoutImageId)
  expect(screen.getByTestId('publish-blockers')).toHaveTextContent(/primary image/i)
})

it('blocks publish for an unverified company, citing verification not role (D4/C9)', async () => {
  await openProduct(seed.readyListingId, { verificationStatus: 'pending' })
  expect(screen.getByRole('button', { name: /publish/i }))
    .toHaveAccessibleDescription(/verification in progress/i)
})

it('publishes when every blocker is cleared', async () => {
  await openProduct(seed.readyListingId)
  await userEvent.click(screen.getByRole('button', { name: /publish/i }))
  expect(await screen.findByText(/active/i)).toBeInTheDocument()
})

it('warns that images must be photographs of the actual item, and flags duplicates (R3)', async () => {
  await openProduct(seed.listingWithFlaggedImageId)
  expect(screen.getByTestId('image-flag'))
    .toHaveTextContent(/matches an image already on the platform/i)
})

it('soft-deletes, and says order history is preserved', async () => {
  await openProduct(seed.readyListingId)
  await userEvent.click(screen.getByRole('button', { name: /delete/i }))
  expect(screen.getByRole('dialog')).toHaveTextContent(/order history is kept/i)
})
```

- [ ] **Step 2: Implement**

`PublishGate` renders `PublishReadiness.blockers` as a checklist with one line per blocker and a direct link to the screen that fixes it — a disabled Publish button with no explanation is the single most common way a compliance rule reads as a bug.

`MediaManager` uploads, reorders, sets the primary image, and surfaces `reviewStatus`. Per R3 it is explicit that authenticity is decided by **manual admin review**; perceptual-hash duplicate detection only raises a flag. The UI must never claim an image was "verified authentic" by a machine.

- [ ] **Step 3: Run, confirm PASS, commit**

---

## Task 15: Services

Same shape as Task 14 for `kind: 'service'`, plus availability windows and blackout dates, minus stock. Reuses `ProductEditor` sub-components; only the attribute panel and the availability editor differ.

**Files:** Create `src/features/catalog/{ServiceList,ServiceEditor,AvailabilityEditor}.tsx`, `src/features/catalog/services.test.tsx`

Tests mirror Task 14's publish-gate cases, plus:

```tsx
it('rejects an availability window that ends before it starts', async () => { /* … */ })
it('shows blackout dates as excluded from the weekly pattern', async () => { /* … */ })
it('has no stock field — a service has no inventory', async () => {
  await openService(seed.serviceId)
  expect(screen.queryByLabelText(/stock/i)).not.toBeInTheDocument()
})
```

---

## Task 16: Inventory

**Files:** Create `src/features/inventory/Inventory.tsx`, `src/features/inventory/inventory.test.tsx`

One chart, one encoding: `Bullet` — stock on hand against reorder point per SKU.

```tsx
it('renders exactly one chart (C5)', async () => { /* … */ })
it('flags every SKU below its reorder point', async () => { /* … */ })
it('sorts the most urgent shortfall first, because that is the decision', async () => { /* … */ })
it('requires a reason on every manual stock adjustment', async () => { /* … */ })
it('is searchable and paginated (C10/C11)', async () => { /* … */ })
```

---

## Task 17: Orders — list, detail, and the two state machines

Spec §8.1 and C14. The most behaviour-dense screen in the portal.

**Files:** Create `src/features/orders/{OrderList,OrderDetail,FulfilmentStepper,AssignDeliveryDialog,StatusHistory}.tsx`, `src/features/orders/orders.test.tsx`

**Interfaces:**
- Produces: `export function stepsFor(mode: DeliveryMode, deliveryType: DeliveryType): FulfilmentStep[]` and `export function nextAction(order: OrderDetail): { step: FulfilmentStep; labelKey: TranslationKey } | null`

- [ ] **Step 1: Write the failing tests**

```tsx
it('shows the own-delivery machine for an own-delivery order (spec §8.1)', async () => {
  await openOrder(seed.ownOrderId)
  expect(stepLabels()).toEqual([
    'Confirmed', 'Processing', 'Dispatched', 'Assigned to delivery man', 'Delivered',
  ])
})

it('shows the partner machine for a partner order', async () => {
  await openOrder(seed.partnerOrderId)
  expect(stepLabels()).toEqual([
    'Confirmed', 'Processing', 'Dispatched', 'Handed to platform delivery', 'Delivered',
  ])
})

it('OMITS the final delivered action on a partner order — it is not the company\'s to make', async () => {
  await openOrder(seed.partnerOrderId, { status: 'shipped', handedToPlatform: true })
  expect(screen.queryByRole('button', { name: /mark delivered/i })).not.toBeInTheDocument()
  expect(screen.getByTestId('awaiting-platform'))
    .toHaveTextContent(/our delivery team will confirm/i)
})

it('never offers a company the delivery-man assignment on a partner order (C14)', async () => {
  await openOrder(seed.partnerOrderId)
  expect(screen.queryByRole('button', { name: /assign delivery/i })).not.toBeInTheDocument()
})

it('offers a per-order choice only when the platform assigned mode "both" (C14)', async () => {
  await openOrder(seed.confirmedOrderId, { deliveryMode: 'both' })
  expect(screen.getByRole('group', { name: /delivery path/i })).toBeInTheDocument()

  await openOrder(seed.confirmedOrderId, { deliveryMode: 'partner' })
  expect(screen.queryByRole('group', { name: /delivery path/i })).not.toBeInTheDocument()
})

it('records every transition with a timestamp and actor', async () => {
  await openOrder(seed.confirmedOrderId)
  await userEvent.click(screen.getByRole('button', { name: /start processing/i }))
  const rows = await screen.findAllByTestId('history-row')
  expect(rows.at(-1)).toHaveTextContent(/processing/i)
  expect(rows.at(-1)).toHaveTextContent(/\d/)
})

it('blocks fulfilment for a role without order.fulfil, citing role (C9)', async () => { /* … */ })
it('shows the restricted-item warning on lines that carry one', async () => { /* … */ })
it('is searchable by order number and buyer, and paginated', async () => { /* … */ })
```

The third test is the load-bearing one: the brief says our delivery team "later confirms back". A company that can mark a partner delivery complete can close an order it has no knowledge of, so the control is **absent**, not disabled, and the UI states who the system is waiting on.

- [ ] **Step 2: Implement**

`stepsFor` derives the visible machine from `ORDER_STATUS_FLOW` keyed by the order's `deliveryType`, which itself is constrained by the organisation's platform-assigned `deliveryMode`. When `deliveryMode === 'both'` and the order is at `confirmed`, a radio group picks the path for that order; otherwise the path is fixed and no control is shown.

`StatusHistory` renders `order.history` in full, newest last, each row `to_status · actor · timestamp · reason`. This is the audit trail the brief asks for, and it is read-only in the UI forever.

- [ ] **Step 3: Run, confirm PASS, commit**

---

## Task 18: Discounts

Spec §7 row 3. The Gantt and the conflict detector are the point of this screen.

**Files:** Create `src/features/discounts/{DiscountList,DiscountEditor,ConflictPanel,MarginPanel}.tsx`, `src/features/discounts/conflicts.ts`, `src/features/discounts/discounts.test.ts(x)`

**Interfaces:**
- Produces: `export function detectConflicts(draft: Discount, existing: Discount[]): DiscountConflict[]` — pure, synchronous, and unit-tested independently of React.

- [ ] **Step 1: Write the failing conflict-detector tests**

```ts
const win = (id: string, from: string, to: string | null, over: string[], extra = {}) =>
  ({ id, startsAt: from, endsAt: to, scope: { kind: 'listing', listingIds: over },
     status: 'active', isStackable: false, stackPriority: 0, ...extra }) as Discount

describe('detectConflicts', () => {
  it('finds no conflict for windows that do not overlap in time', () => {
    expect(detectConflicts(
      win('a', '2026-01-01', '2026-01-31', ['L1']),
      [win('b', '2026-02-01', '2026-02-28', ['L1'])],
    )).toEqual([])
  })

  it('finds no conflict for overlapping windows on different listings', () => {
    expect(detectConflicts(
      win('a', '2026-01-01', '2026-01-31', ['L1']),
      [win('b', '2026-01-15', '2026-02-15', ['L2'])],
    )).toEqual([])
  })

  it('reports an overlap and its exact interval', () => {
    const [c] = detectConflicts(
      win('a', '2026-01-01', '2026-01-31', ['L1']),
      [win('b', '2026-01-15', '2026-02-15', ['L1'])],
    )
    expect(c!.overlapFrom).toBe('2026-01-15')
    expect(c!.overlapTo).toBe('2026-01-31')
  })

  it('treats a null endsAt as open-ended', () => {
    const [c] = detectConflicts(
      win('a', '2026-01-01', null, ['L1']),
      [win('b', '2026-06-01', null, ['L1'])],
    )
    expect(c!.overlapTo).toBeNull()
  })

  it('resolves by priority when neither is stackable', () => {
    const [c] = detectConflicts(
      win('a', '2026-01-01', null, ['L1'], { stackPriority: 5 }),
      [win('b', '2026-01-01', null, ['L1'], { stackPriority: 9 })],
    )
    expect(c!.resolution).toBe('highest_priority_wins')
    expect(c!.winningDiscountId).toBe('b')
  })

  it('reports stacking, not conflict, when both stack in the same group', () => {
    const [c] = detectConflicts(
      win('a', '2026-01-01', null, ['L1'], { isStackable: true, stackGroup: 'g' }),
      [win('b', '2026-01-01', null, ['L1'], { isStackable: true, stackGroup: 'g' })],
    )
    expect(c!.resolution).toBe('stacked')
  })

  it('reports ambiguity when priorities tie and neither stacks — the case a human must settle', () => {
    const [c] = detectConflicts(
      win('a', '2026-01-01', null, ['L1'], { stackPriority: 3 }),
      [win('b', '2026-01-01', null, ['L1'], { stackPriority: 3 })],
    )
    expect(c!.resolution).toBe('ambiguous')
    expect(c!.winningDiscountId).toBeNull()
  })

  it('expands a category scope to its listings before comparing', () => { /* … */ })
  it('ignores cancelled and expired discounts', () => { /* … */ })
})
```

- [ ] **Step 2: Implement `detectConflicts`**

Expand each discount's scope to a listing-id set, intersect the sets, and for any non-empty intersection compute the time overlap as `[max(startsAt), min(endsAt ?? ∞)]`. Classify: both stackable and same `stackGroup` → `stacked`; distinct `stackPriority` → `highest_priority_wins`; otherwise → `ambiguous`. Only `ambiguous` blocks save; the other two warn.

- [ ] **Step 3: Write and pass the screen tests**

```tsx
it('renders exactly two charts with distinct encodings (C5)', async () => { /* gantt + waterfall */ })
it('draws overlapping windows on one row so a clash is visible', async () => { /* … */ })
it('blocks save on an ambiguous conflict and names both discounts', async () => { /* … */ })
it('warns but allows save when priority resolves the clash', async () => { /* … */ })
it('rejects a percentage outside 0–100 (CK_offer_percent)', async () => { /* … */ })
it('rejects an end date before the start date (CK_offer_dates)', async () => { /* … */ })
it('requires an amount for a fixed discount and a percent for a percentage one (CK_offer_value)', async () => { /* … */ })
it('shows the margin waterfall so a discount that erases margin is visible before saving', async () => { /* … */ })
it('supports bulk application across selected products', async () => { /* … */ })
```

- [ ] **Step 4: Run, confirm PASS, commit**

---

## Task 19: Verification

Spec §8 #20, G1. The screen that decides whether the company can trade.

**Files:** Create `src/features/verification/{Verification,DocumentChecklist,IdentityUpload,VerificationTimeline}.tsx`, `src/features/verification/verification.test.tsx`

- [ ] **Step 1: Write the failing tests**

```tsx
it('states "Verification in progress" while pending, verbatim from the brief', async () => {
  await renderVerification({ organisationStatus: 'pending' })
  expect(screen.getByRole('status')).toHaveTextContent(/verification in progress/i)
})

it('lists every outstanding document before submission is possible', async () => {
  await renderVerification({ organisationStatus: 'unverified' })
  expect(screen.getByTestId('outstanding')).toHaveTextContent(/trade licence/i)
  expect(screen.getByTestId('outstanding')).toHaveTextContent(/tin/i)
  expect(screen.getByTestId('outstanding')).toHaveTextContent(/nid/i)
  expect(screen.getByRole('button', { name: /submit for review/i })).toBeDisabled()
})

it('enables submission once nothing is outstanding', async () => { /* … */ })

it('shows only the last four characters of an NID, never the full number (G1)', async () => {
  await renderVerification({ withNid: '1234567890123' })
  expect(screen.getByTestId('nid')).toHaveTextContent('••••0123')
  expect(document.body.textContent).not.toContain('1234567890123')
})

it('lets an unverified company submit documents — otherwise it can never get verified (D4)', async () => {
  await renderVerification({ organisationStatus: 'unverified' })
  expect(screen.getByRole('button', { name: /upload/i })).toBeEnabled()
})

it('shows the rejection reason and what to do next when rejected', async () => {
  await renderVerification({ organisationStatus: 'rejected' })
  expect(screen.getByRole('alert')).toHaveTextContent(/resubmit/i)
})

it('renders the decision timeline from verification events, newest last', async () => { /* … */ })

it('warns about certificates expiring within 30 days', async () => { /* … */ })
```

The masking test is a real security property, not a display preference: NID and TIN are the most sensitive PII in the system, and the full value must never reach the browser at all — the mask is rendered server-side and the client is simply never given the rest.

- [ ] **Step 2: Implement**

Checklist of required documents for the Bangladesh market — **trade licence**, **BIN**, **TIN**, **admin NID**, plus any product-category-specific registration — each with status, expiry, and an upload control. `VerificationTimeline` renders `VerificationDossier.timeline`. The submit button is gated on `outstanding.length === 0`.

- [ ] **Step 3: Run, confirm PASS, commit**

---

## Task 20: Team — roles and per-member permissions

**Files:** Create `src/features/team/{TeamList,InviteDialog,MemberDrawer,PermissionMatrix}.tsx`, `src/features/team/team.test.tsx`

```tsx
it('offers exactly the three portal roles', async () => {
  await openInvite()
  expect(roleOptions()).toEqual(['Admin', 'Employee', 'Delivery Man'])
})

it('shows what each role can do before you assign it', async () => {
  await openInvite()
  await selectRole('Employee')
  expect(screen.getByTestId('role-summary')).toHaveTextContent(/cannot request payouts/i)
})

it('hides member management from a role without member.invite (C9)', async () => { /* … */ })

it('prevents removing the last Admin, and explains why', async () => {
  await removeMember(seed.onlyAdminMembershipId)
  expect(await screen.findByRole('alert'))
    .toHaveTextContent(/at least one admin/i)
})

it('supports per-member grant and deny overrides on top of the role', async () => {
  await openMember(seed.employeeMembershipId)
  await toggleOverride('payout.request', 'grant')
  expect(await screen.findByTestId('override-payout.request')).toHaveTextContent(/granted/i)
})

it('shows deny overriding grant, because deny wins', async () => { /* … */ })
it('is searchable and paginated (C10/C11)', async () => { /* … */ })
```

The last-Admin guard prevents a company locking itself out of its own account — a support burden that is far cheaper to prevent than to fix.

---

## Task 21: Reports

Spec §7 row 4. Three charts, three encodings, own-company data only.

**Files:** Create `src/features/reports/Reports.tsx`, `src/features/reports/reports.test.tsx`

1. **GroupedBar** — revenue by category over the window
2. **CohortHeatmap** — repeat-purchase rate by acquisition month
3. **Donut** — own vs partner delivery mix

```tsx
it('renders three charts with three distinct encodings (C5)', async () => { /* … */ })
it('gates the whole screen on report.read (C9)', async () => { /* … */ })
it('exports the current window as CSV with the active locale\'s number format', async () => { /* … */ })
it('shows the delivery mix as counts, not just percentages, so a small sample is visible', async () => { /* … */ })
it('says how many buyers a cohort cell represents, so a 100% cell of one buyer cannot mislead', async () => { /* … */ })
```

---

## Task 22: Delivery Man shell screens

Spec §8 #25–27, D2, D3, C12. Mobile-first, map-led.

**Files:** Create `src/features/delivery/{MyDeliveries,DeliveryDetail,DeliveryMap,RunSheet,HandoverDialog,DeliveryHistory}.tsx`, `src/features/delivery/delivery.test.tsx`

- [ ] **Step 1: Write the failing tests**

```tsx
it('lists assignments with 44px minimum rows (C12)', async () => { /* … */ })

it('renders a map pin when coordinates are exact', async () => {
  await openAssignment(seed.assignmentWithCoordsId)
  expect(await screen.findByTestId('delivery-map')).toBeInTheDocument()
})

it('renders address-only, and says why, when coordinates are absent (D3/R1)', async () => {
  await openAssignment(seed.assignmentWithoutCoordsId)
  expect(screen.queryByTestId('delivery-map')).not.toBeInTheDocument()
  expect(screen.getByTestId('no-map-notice'))
    .toHaveTextContent(/no map location was captured for this order/i)
  expect(screen.getByTestId('delivery-address')).toBeInTheDocument()
})

it('shows the run sheet from order-line snapshots — code, name, quantity, unit', async () => {
  await openAssignment(seed.assignmentWithCoordsId)
  const row = screen.getAllByTestId('run-sheet-row')[0]!
  expect(row).toHaveTextContent(fixtures.line.skuSnapshot)
  expect(row).toHaveTextContent(fixtures.line.nameSnapshot)
  expect(row).toHaveTextContent(String(fixtures.line.quantity))
})

it('warns prominently when the load contains a restricted item', async () => {
  await openAssignment(seed.assignmentWithRestrictedItemId)
  expect(screen.getByRole('alert')).toHaveTextContent(/restricted/i)
})

it('offers tap-to-call on the buyer phone number', async () => {
  await openAssignment(seed.assignmentWithCoordsId)
  expect(screen.getByRole('link', { name: /call/i }))
    .toHaveAttribute('href', expect.stringMatching(/^tel:/))
})

it('confirms handover and nothing else — a delivery man cannot edit an order', async () => {
  await openAssignment(seed.assignmentWithCoordsId)
  expect(screen.getByRole('button', { name: /confirm handover/i })).toBeInTheDocument()
  expect(screen.queryByRole('button', { name: /cancel order|edit|refund/i })).not.toBeInTheDocument()
})

it('requires an explicit confirmation step before marking handed over', async () => {
  await userEvent.click(screen.getByRole('button', { name: /confirm handover/i }))
  expect(await screen.findByRole('dialog')).toHaveTextContent(/cannot be undone/i)
})

it('renders in Bengali when the locale is bn-BD', async () => { /* … */ })
```

- [ ] **Step 2: Implement**

`DeliveryDetail` order, top to bottom: status chip → map (or the honest no-map notice) → address block with tap-to-call → run sheet from `OrderLine` snapshots including pack size, weight and the restricted-item alert → one full-width confirm-handover button pinned to the bottom of the viewport.

`DeliveryMap` renders `react-leaflet` with OSM tiles, one marker, and a "directions" link that opens the platform's map app with the coordinates. It is only mounted when `location.precision === 'exact'` — mounting a map centred on a district and calling it a delivery address would be a lie the courier acts on.

- [ ] **Step 3: Run, confirm PASS, commit**

---

## Task 23: Reviews, Payments & Payouts

**Files:** Create `src/features/reviews/Reviews.tsx`, `src/features/payments/Payments.tsx`, plus tests.

Reviews: list with rating filter, respond inline (`review.respond`), report abusive content. No charts — a rating distribution bar adds nothing a filter does not.

Payments: settlement runs, payout requests, ledger lines. `payout.request` is Admin-only (C9), so an Employee sees the history and no request control.

```tsx
it('hides the payout request control from an Employee, citing role (C9)', async () => { /* … */ })
it('never shows a payout amount as a float (C2)', async () => { /* … */ })
it('shows what a settlement deducted — commission, refunds — not just a net figure', async () => { /* … */ })
it('prevents responding to the same review twice', async () => { /* … */ })
```

---

## Task 24: Settings, Company Profile, Notifications, Feedback, Solution Center, Help, Support

Grouped because each is a single form or list over the primitives already built.

**Files:** Create `src/features/settings/Settings.tsx`, `src/features/profile/CompanyProfile.tsx`, `src/features/notifications/Notifications.tsx`, `src/features/feedback/Feedback.tsx`, `src/features/solutions/SolutionCenter.tsx`, `src/features/support/{HelpCenter,ContactSupport}.tsx`, plus tests.

The tests that matter here are the delivery-mode ones (C14):

```tsx
it('shows the platform-assigned delivery mode as read-only text, not a control (C14)', async () => {
  await renderSettings({ deliveryMode: 'partner' })
  expect(screen.getByTestId('delivery-mode')).toHaveTextContent(/our delivery/i)
  expect(screen.queryByRole('radiogroup', { name: /delivery/i })).not.toBeInTheDocument()
  expect(screen.queryByRole('combobox', { name: /delivery/i })).not.toBeInTheDocument()
  expect(screen.queryByRole('switch', { name: /delivery/i })).not.toBeInTheDocument()
})

it('says who to contact to change the delivery mode', async () => {
  await renderSettings({ deliveryMode: 'own' })
  expect(screen.getByTestId('delivery-mode')).toHaveTextContent(/contact support/i)
})

it('shows when the mode was assigned', async () => { /* … */ })

it('lets a company delete its account, and states what is retained', async () => {
  await renderSettings()
  await userEvent.click(screen.getByRole('button', { name: /delete company/i }))
  expect(screen.getByRole('dialog'))
    .toHaveTextContent(/transactional records are retained/i)
})
```

The deletion copy is not boilerplate: `privacy.usp_execute_erasure` overwrites personal data but retains the transactional record, and a dialog promising total erasure would be false.

**Solution Center** is built as a card grid over bundles from the mock adapter, and its file carries a header comment recording open question O1 — it has no database backing and Phase 2 cannot deliver it without new tables.

---

## Task 25: Route wiring, removals, and the old-portal teardown

**Files:** Modify `src/routes.tsx`; delete all remaining `src/pages/*.jsx` and `src/data/mockData.js`.

```bash
git rm src/pages/FarmerOpportunities.jsx src/pages/FarmerRequests.jsx src/pages/Promotions.jsx
git rm src/pages/*.jsx src/data/mockData.js
```

```tsx
it('has no route for a removed section (C11)', () => {
  for (const p of ['/opportunities', '/requests', '/promotions']) {
    expect(routeExists(p)).toBe(false)
  }
})
it('404s gracefully with a link home rather than a blank screen', () => { /* … */ })
it('restores the intended destination after sign-in', async () => { /* … */ })
```

---

## Task 26: Final audit

The definition of done from spec §11, run as tests rather than a checklist read.

**Files:** Create `src/test/audit.test.tsx`

```tsx
it('renders every route in both locales with no missing translation key', async () => {
  const missing: string[] = []
  vi.spyOn(console, 'warn').mockImplementation((m) => {
    if (String(m).includes('missing translation')) missing.push(String(m))
  })
  for (const locale of ['en-US', 'bn-BD'] as const) {
    for (const route of ALL_ROUTES) await renderRoute(route, { locale })
  }
  expect(missing).toEqual([])
})

it('never renders the logo below 32px anywhere (C13)', async () => {
  for (const route of ALL_ROUTES) {
    await renderRoute(route)
    for (const img of screen.queryAllByRole('img', { name: /agromedconnect/i })) {
      expect(Number(img.getAttribute('width'))).toBeGreaterThanOrEqual(32)
    }
  }
})

it('has no screen with duplicate chart encodings (C5)', async () => { /* ChartScreen throws */ })

it('offers no control anywhere for the company to change its own delivery mode (C14)', async () => {
  for (const route of ALL_ROUTES) {
    await renderRoute(route)
    expect(screen.queryByRole('radiogroup', { name: /delivery mode/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('switch', { name: /delivery mode/i })).not.toBeInTheDocument()
  }
})

it('has no hex colour literal outside src/design (C4)', async () => {
  const offenders = await grepSource(/#[0-9a-fA-F]{6}/, { exclude: ['src/design'] })
  expect(offenders).toEqual([])
})

it('renders loading, empty and error states on every data screen (C8)', async () => { /* … */ })
```

- [ ] **Final steps**

1. `npm run test` — all green
2. `npm run typecheck` — clean
3. `npm run build` — succeeds
4. `npm run dev`, then walk all three roles by hand and capture screenshots for review
5. Commit, then **stop and present the UI for confirmation.** Phase 2 does not begin until that gate is passed — it is the brief's own checkpoint.

---

## Self-review

**Spec coverage.** Every spec section maps to a task: §5.1→T6, §5.2→T2/T3, §5.3→T7, §5.4→T4/T5, §5.5→T10, §6→T1, §6.5→T1/T10, §7→T9 and each screen task, §8 screens 1–5→T11, 6→T12, 7→T13, 8→T14, 9→T15, 10→T24, 11→T16, 12→T17, 13→T18, 14→T23, 15→T23, 16→T21, 17→T24, 18–19→T24, 20→T19, 21→T20, 22→T24, 23–24→T24, 25–27→T22. §8.1→T17. §9 R1→T22, R3→T14, R4→T13. §11→T26.

**Gaps found and closed during review.** The spec's §8 numbering listed Verification at #20 and Team at #21 after Reports; the plan orders them earlier (T19, T20) because the publish gate in T14 depends on certificate state, and T14 ships before them — so T14's tests use fixture certificates rather than the Verification screen, and T19 only adds the management UI over data T5 already models. No circular dependency.

**Type consistency.** `Money`, `Page<T>`, `ApiProblem` are declared once in `contracts/common.ts` and re-exported; `format.ts` declares a structurally identical `Money` for import-cycle reasons and Task 4 Step 3 notes they must stay identical. `FulfilmentStep` is used consistently in `ORDER_STATUS_FLOW`, `OrderDetail.currentStep`, `availableTransitions`, `advanceOrder` and `stepsFor`. `DeliveryMode` is `own|partner|both` in `common.ts`, `Organisation.deliveryMode`, C14 and every Task 17/24 test. `Denial` is used identically in T7 and every `<Gate>` consumer.
