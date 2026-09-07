import type { TranslationKey } from '@/i18n/dictionary'

/**
 * Bangladeshi mobile numbers arrive both ways: +8801XXXXXXXXX from a form that
 * knows about E.164, and 01XXXXXXXXX from a person typing what is on their SIM.
 * Both are valid input; normalising is the server's job.
 */
const E164_BD = /^\+8801[3-9]\d{8}$/
const LOCAL_BD = /^01[3-9]\d{8}$/
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function validatePhoneOrEmail(value: string): TranslationKey | null {
  const v = value.trim()
  if (!v) return 'validation.required'
  if (E164_BD.test(v) || LOCAL_BD.test(v) || EMAIL.test(v)) return null
  return 'validation.identifier'
}

export function validatePassword(value: string): TranslationKey | null {
  if (!value) return 'validation.required'
  // Length beats composition rules: a 10-character passphrase resists guessing
  // better than eight characters with a mandatory symbol.
  if (value.length < 10) return 'validation.password'
  return null
}

export function validateRequired(value: string): TranslationKey | null {
  return value.trim() ? null : 'validation.required'
}

export function normalisePhone(value: string): string {
  const v = value.trim()
  return LOCAL_BD.test(v) ? `+88${v}` : v
}
