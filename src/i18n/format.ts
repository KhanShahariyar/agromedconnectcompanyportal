export type Locale = 'bn-BD' | 'en-US'

/**
 * C2 — money is never a bare number. `display` is rendered by the server
 * because Bengali numerals and Indian 2,2,3 grouping are a localisation
 * concern it already solved, and its string is the one the buyer saw.
 */
export interface Money {
  amountMinor: number
  currency: 'BDT'
  display: string
}

// ref.currency owns the real exponent; BDT is the only currency in the system.
const EXPONENT: Record<Money['currency'], number> = { BDT: 2 }
const SYMBOL: Record<Money['currency'], string> = { BDT: '৳' }

/**
 * ICU already renders bn-BD as Bengali digits with 2,2,3 grouping — verified
 * before writing this. Do not hand-roll digit substitution.
 */
export function formatNumber(value: number, locale: Locale, opts?: Intl.NumberFormatOptions): string {
  return new Intl.NumberFormat(locale, opts).format(value)
}

export function formatMoney(money: Money, locale: Locale): string {
  if (money.display) return money.display
  const exp = EXPONENT[money.currency]
  const major = money.amountMinor / 10 ** exp
  return (
    SYMBOL[money.currency] +
    formatNumber(major, locale, { minimumFractionDigits: exp, maximumFractionDigits: exp })
  )
}

/** Takes a fraction (0.125), not a percentage (12.5). */
export function formatPercent(fraction: number, locale: Locale, digits = 0): string {
  return formatNumber(fraction, locale, {
    style: 'percent',
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  })
}

export function formatDate(iso: string, locale: Locale, style: 'short' | 'medium' | 'long' = 'medium'): string {
  return new Intl.DateTimeFormat(locale, { dateStyle: style }).format(new Date(iso))
}

export function formatDateTime(iso: string, locale: Locale): string {
  return new Intl.DateTimeFormat(locale, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(iso))
}

export function formatCompact(value: number, locale: Locale): string {
  return formatNumber(value, locale, { notation: 'compact', maximumFractionDigits: 1 })
}

/**
 * C6 — pass this to every Recharts `tickFormatter`. Without it an axis renders
 * ASCII digits beside a Bengali money label on the same card.
 */
export function makeTickFormatter(locale: Locale): (v: number) => string {
  return (v: number) => formatCompact(v, locale)
}
