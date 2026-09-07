import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { LocaleProvider } from '@/i18n/LocaleProvider'
import { ChartScreen, ChartFrame } from './ChartFrame'

afterEach(() => vi.restoreAllMocks())

const wrap = (ui: React.ReactNode) => render(<LocaleProvider initial="en-US">{ui}</LocaleProvider>)

describe('ChartScreen encoding uniqueness', () => {
  it('throws when a screen renders two charts with the same encoding (C5)', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    expect(() =>
      wrap(
        <ChartScreen>
          <ChartFrame title="Revenue" encoding="line"><div /></ChartFrame>
          <ChartFrame title="Orders" encoding="line"><div /></ChartFrame>
        </ChartScreen>,
      ),
    ).toThrow(/duplicate chart encoding "line"/i)
  })

  it('permits distinct encodings on one screen', () => {
    expect(() =>
      wrap(
        <ChartScreen>
          <ChartFrame title="Revenue" encoding="line"><div /></ChartFrame>
          <ChartFrame title="Pipeline" encoding="funnel"><div /></ChartFrame>
        </ChartScreen>,
      ),
    ).not.toThrow()
  })

  it('exposes the encoding on the frame so an audit can sweep every screen', () => {
    wrap(
      <ChartScreen>
        <ChartFrame title="Revenue" encoding="line"><div /></ChartFrame>
      </ChartScreen>,
    )
    expect(screen.getByTestId('chart-frame')).toHaveAttribute('data-encoding', 'line')
  })

  it('names the chart with a real heading, so a screen reader can navigate charts', () => {
    wrap(
      <ChartScreen>
        <ChartFrame title="Revenue" encoding="line"><div /></ChartFrame>
      </ChartScreen>,
    )
    expect(screen.getByRole('heading', { name: 'Revenue' })).toBeInTheDocument()
  })
})
