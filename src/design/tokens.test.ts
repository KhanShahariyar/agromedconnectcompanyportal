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

  it('confirms secondary and accent FAIL as text — they are fill-only (spec 6.2)', () => {
    expect(contrastRatio(TOKENS.secondary, TOKENS.base)).toBeLessThan(4.5)
    expect(contrastRatio(TOKENS.accent, TOKENS.base)).toBeLessThan(4.5)
  })

  it('keeps panel lifted off the base without being pure white', () => {
    expect(TOKENS.panel).not.toBe('#FFFFFF')
    expect(contrastRatio(TOKENS.panel, TOKENS.base)).toBeLessThan(1.3)
  })

  it('gives every chart series a distinguishable lightness so greyscale still separates them', () => {
    const series = [TOKENS.series1, TOKENS.series2, TOKENS.series3, TOKENS.series4, TOKENS.series5, TOKENS.series6]
    const lums = series.map((c) => contrastRatio(c, '#FFFFFF')).sort((a, b) => a - b)
    for (let i = 1; i < lums.length; i++) {
      expect(lums[i]! / lums[i - 1]!).toBeGreaterThan(1.15)
    }
  })
})
