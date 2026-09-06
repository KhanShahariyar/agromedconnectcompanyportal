import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { DICTIONARIES, DEFAULT_LOCALE } from './dictionary'
import type { TranslationKey } from './dictionary'
import {
  formatCompact,
  formatDate,
  formatDateTime,
  formatMoney,
  formatNumber,
  formatPercent,
  makeTickFormatter,
} from './format'
import type { Locale, Money } from './format'

const STORAGE_KEY = 'agromed.locale'

export type Translate = (key: TranslationKey, vars?: Record<string, string | number>) => string

export interface FormatBundle {
  number: (v: number, opts?: Intl.NumberFormatOptions) => string
  money: (m: Money) => string
  percent: (fraction: number, digits?: number) => string
  date: (iso: string, style?: 'short' | 'medium' | 'long') => string
  dateTime: (iso: string) => string
  compact: (v: number) => string
  tick: (v: number) => string
}

interface LocaleContextValue {
  locale: Locale
  setLocale: (l: Locale) => void
  t: Translate
  format: FormatBundle
}

const LocaleContext = createContext<LocaleContextValue | null>(null)

function readStoredLocale(): Locale | null {
  try {
    const v = localStorage.getItem(STORAGE_KEY)
    return v === 'bn-BD' || v === 'en-US' ? v : null
  } catch {
    // Private browsing and blocked site data both throw here. A portal that
    // cannot read a preference should still render, in the default language.
    return null
  }
}

export function LocaleProvider({ children, initial }: { children: ReactNode; initial?: Locale }) {
  const [locale, setLocaleState] = useState<Locale>(() => initial ?? readStoredLocale() ?? DEFAULT_LOCALE)

  const setLocale = useCallback((l: Locale) => {
    setLocaleState(l)
    try {
      localStorage.setItem(STORAGE_KEY, l)
    } catch {
      /* preference simply does not persist */
    }
  }, [])

  useEffect(() => {
    // Drives the :lang(bn) rule in tokens.css that swaps in Noto Sans Bengali.
    document.documentElement.lang = locale === 'bn-BD' ? 'bn' : 'en'
  }, [locale])

  const t = useCallback<Translate>(
    (key, vars) => {
      const raw = DICTIONARIES[locale][key] ?? DICTIONARIES['en-US'][key]
      if (raw === undefined) {
        console.warn(`[i18n] missing translation: ${String(key)}`)
        return String(key)
      }
      if (!vars) return raw
      return raw.replace(/\{(\w+)\}/g, (whole, name: string) =>
        name in vars ? String(vars[name]) : whole,
      )
    },
    [locale],
  )

  const format = useMemo<FormatBundle>(
    () => ({
      number: (v, opts) => formatNumber(v, locale, opts),
      money: (m) => formatMoney(m, locale),
      percent: (f, digits) => formatPercent(f, locale, digits),
      date: (iso, style) => formatDate(iso, locale, style),
      dateTime: (iso) => formatDateTime(iso, locale),
      compact: (v) => formatCompact(v, locale),
      tick: makeTickFormatter(locale),
    }),
    [locale],
  )

  const value = useMemo(() => ({ locale, setLocale, t, format }), [locale, setLocale, t, format])
  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>
}

function useLocaleContext(): LocaleContextValue {
  const ctx = useContext(LocaleContext)
  if (!ctx) throw new Error('useLocale must be used inside <LocaleProvider>')
  return ctx
}

export function useLocale() {
  const { locale, setLocale } = useLocaleContext()
  return { locale, setLocale }
}

export function useT(): Translate {
  return useLocaleContext().t
}

/** Screens use this, never the raw formatters — which is what makes C6 reviewable. */
export function useFormat(): FormatBundle {
  return useLocaleContext().format
}
