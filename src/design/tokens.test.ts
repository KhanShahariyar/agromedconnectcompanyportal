import { describe, it, expect } from 'vitest'
import { TOKENS, SERIES, SERIES_OTHER, STATUS } from './tokens'
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

  it('ships exactly the five validated series colours, in order', () => {
    // Verified with the dataviz validator against surface #FDFBF4:
    // lightness band, chroma floor, CVD separation, normal-vision floor and
    // contrast all PASS. Changing any value here re-opens that question — re-run
    // scripts/validate_palette.js before editing.
    expect([...SERIES]).toEqual(['#00703A', '#1E97C4', '#D06810', '#BE2F6E', '#7A4CC0'])
  })

  it('caps categorical hues at five and gives overflow a neutral, not a sixth hue', () => {
    // No sixth hue survives deuteranopia beside these five, so a 6th category
    // folds into "Other" rather than getting a generated colour.
    expect(SERIES).toHaveLength(5)
    expect(SERIES_OTHER).not.toEqual(expect.stringMatching(new RegExp(SERIES.join('|'), 'i')))
  })

  it('keeps every series colour clear of the surface by at least 3:1', () => {
    for (const c of SERIES) {
      expect(contrastRatio(c, TOKENS.panel)).toBeGreaterThanOrEqual(3)
    }
  })

  it('never reuses a status colour as a series hue', () => {
    for (const status of Object.values(STATUS)) {
      expect(SERIES as readonly string[]).not.toContain(status)
    }
  })
})
