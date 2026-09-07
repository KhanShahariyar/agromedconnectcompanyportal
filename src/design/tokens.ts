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

  // Categorical series — VALIDATED, not chosen by eye.
  //
  //   node scripts/validate_palette.js \
  //     "#00703A,#1E97C4,#D06810,#BE2F6E,#7A4CC0" --mode light --surface "#FDFBF4"
  //
  // The brand palette is not a series palette: #004B23 fell outside the
  // lightness band and read grey on chroma, and #A7C957 failed contrast against
  // the panel. These five sit inside the band, clear the chroma floor, keep
  // >= 3:1 against the surface, and separate under deuteranopia and tritanopia.
  //
  // Five is the ceiling, not a preference. No sixth hue survives deuteranopia
  // beside these — an olive sixth scored dE 1.2 against the orange, which is
  // indistinguishable. A sixth category folds into `seriesOther` instead.
  //
  // All-pairs protan separation is dE 7.5, inside the 6–8 band that is legal
  // only with secondary encoding — so every multi-series chart ships a legend,
  // and <= 4 series are also direct-labelled.
  series1: '#00703A',
  series2: '#1E97C4',
  series3: '#D06810',
  series4: '#BE2F6E',
  series5: '#7A4CC0',
  seriesOther: '#8B8778',
} as const satisfies Record<string, string>

export type TokenName = keyof typeof TOKENS

/** Assign in fixed order, never cycled. A 6th category becomes `SERIES_OTHER`. */
export const SERIES = [
  TOKENS.series1,
  TOKENS.series2,
  TOKENS.series3,
  TOKENS.series4,
  TOKENS.series5,
] as const

export const SERIES_OTHER = TOKENS.seriesOther

/** Status colours are reserved and never reused as a series hue. */
export const STATUS = {
  success: TOKENS.success,
  warning: TOKENS.warning,
  danger: TOKENS.danger,
  info: TOKENS.info,
} as const

/** Colours permitted as text on `base`. Enforced by tokens.test.ts. */
export const TEXT_ON_BASE = [TOKENS.ink, TOKENS.inkSoft, TOKENS.primary] as const

/**
 * Fixed-order categorical assignment. Never cycled: index 5 and beyond fall to
 * the neutral, because no sixth hue survives deuteranopia beside these five.
 *
 * Lives here rather than beside the Recharts components so the SVG charts can
 * use it without pulling Recharts into their bundle chunk.
 */
export function seriesColour(index: number): string {
  return SERIES[index] ?? SERIES_OTHER
}
