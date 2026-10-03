

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

  series1: '#00703A',
  series2: '#1E97C4',
  series3: '#D06810',
  series4: '#BE2F6E',
  series5: '#7A4CC0',
  seriesOther: '#8B8778',
} as const satisfies Record<string, string>

export type TokenName = keyof typeof TOKENS

export const SERIES = [
  TOKENS.series1,
  TOKENS.series2,
  TOKENS.series3,
  TOKENS.series4,
  TOKENS.series5,
] as const

export const SERIES_OTHER = TOKENS.seriesOther

export const STATUS = {
  success: TOKENS.success,
  warning: TOKENS.warning,
  danger: TOKENS.danger,
  info: TOKENS.info,
} as const

export const TEXT_ON_BASE = [TOKENS.ink, TOKENS.inkSoft, TOKENS.primary] as const

export function seriesColour(index: number): string {
  return SERIES[index] ?? SERIES_OTHER
}
