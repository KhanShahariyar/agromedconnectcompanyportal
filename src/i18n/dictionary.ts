import { enUS } from './locales/en-US'
import { bnBD } from './locales/bn-BD'
import type { Locale } from './format'

export type TranslationKey = keyof typeof enUS

export const DICTIONARIES: Record<Locale, Record<TranslationKey, string>> = {
  'en-US': enUS,
  'bn-BD': bnBD,
}

export const DEFAULT_LOCALE: Locale = 'bn-BD'
