import { describe, it, expect } from 'vitest'
import { enUS } from './locales/en-US'
import { bnBD } from './locales/bn-BD'

/**
 * C7. A missing Bengali key is invisible during an English-language review,
 * so it is guarded by a test rather than by care.
 */
describe('translation parity', () => {
  it('has no key present in en-US but missing from bn-BD', () => {
    expect(Object.keys(enUS).filter((k) => !(k in bnBD))).toEqual([])
  })

  it('has no key present in bn-BD but missing from en-US', () => {
    expect(Object.keys(bnBD).filter((k) => !(k in enUS))).toEqual([])
  })

  it('has no empty string standing in for a real translation', () => {
    expect(Object.entries(bnBD).filter(([, v]) => !String(v).trim())).toEqual([])
  })

  it('keeps interpolation variables identical across locales', () => {
    const vars = (s: string) => (s.match(/\{(\w+)\}/g) ?? []).sort()
    for (const [k, en] of Object.entries(enUS)) {
      expect(vars(bnBD[k as keyof typeof bnBD])).toEqual(vars(en))
    }
  })
})
