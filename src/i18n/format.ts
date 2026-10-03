export type Locale = 'bn-BD' | 'en-US'

export interface Money {
  amountMinor: number
  currency: 'BDT'
  display: string
}

const EXPONENT: Record<Money['currency'], number> = { BDT: 2 }
const SYMBOL: Record<Money['currency'], string> = { BDT: '৳' }

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

export function makeTickFormatter(locale: Locale): (v: number) => string {
  return (v: number) => formatCompact(v, locale)
}
