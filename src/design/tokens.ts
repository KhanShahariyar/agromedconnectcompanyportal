/**
 * Olive Earth — the portal's single source of colour truth.
 *
 * The four values the brief mandates (primary, secondary, accent, base) are
 * verbatim. Everything else is derived to serve them, and the derivations are
 * asserted in tokens.test.ts rather than left to judgement.
 */
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

  // Categorical series. Olive Earth is a single-hue family, so three greens
  // cannot encode four series — these vary in lightness as well as hue so the
  // set survives greyscale and the common colour-vision deficiencies.
  series1: '#004B23',
  series2: '#A7C957',
  series3: '#B8752F',
  series4: '#2F6B8F',
  series5: '#7D3C5A',
  series6: '#C9A227',
} as const satisfies Record<string, string>

export type TokenName = keyof typeof TOKENS

export const SERIES = [
  TOKENS.series1,
  TOKENS.series2,
  TOKENS.series3,
  TOKENS.series4,
  TOKENS.series5,
  TOKENS.series6,
] as const

/** Colours permitted as text on `base`. Enforced by tokens.test.ts. */
export const TEXT_ON_BASE = [TOKENS.ink, TOKENS.inkSoft, TOKENS.primary] as const
