import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { StrictMode } from 'react'
import { LocaleProvider } from '@/i18n/LocaleProvider'
import { ChartScreen, ChartFrame } from './ChartFrame'

afterEach(() => vi.restoreAllMocks())

const wrap = (ui: React.ReactNode) => render(<LocaleProvider initial="en-US">{ui}</LocaleProvider>)

describe('ChartScreen encoding uniqueness', () => {
  it('reports when a screen renders two charts with the same encoding (C5)', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    wrap(
      <ChartScreen>
        <ChartFrame title="Revenue" encoding="line"><div /></ChartFrame>
        <ChartFrame title="Orders" encoding="line"><div /></ChartFrame>
      </ChartScreen>,
    )
    expect(spy).toHaveBeenCalledWith(expect.stringMatching(/duplicate chart encoding "line"/i))
  })

  it('permits distinct encodings on one screen', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    wrap(
      <ChartScreen>
        <ChartFrame title="Revenue" encoding="line"><div /></ChartFrame>
        <ChartFrame title="Pipeline" encoding="funnel"><div /></ChartFrame>
      </ChartScreen>,
    )
    expect(spy).not.toHaveBeenCalled()
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

  it('does not report a duplicate when the same frame re-renders (StrictMode)', () => {
    // The first version of this guard reset a Set during ChartScreen's render.
    // Tests passed; the real app threw immediately, because StrictMode renders
    // children twice and each frame re-claimed its own encoding.
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    render(
      <StrictMode>
        <LocaleProvider initial="en-US">
          <ChartScreen>
            <ChartFrame title="Revenue" encoding="line"><div /></ChartFrame>
            <ChartFrame title="Pipeline" encoding="funnel"><div /></ChartFrame>
            <ChartFrame title="SLA" encoding="bullet"><div /></ChartFrame>
          </ChartScreen>
        </LocaleProvider>
      </StrictMode>,
    )
    expect(spy).not.toHaveBeenCalled()
  })

  it('still catches two different frames sharing an encoding under StrictMode', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    render(
      <StrictMode>
        <LocaleProvider initial="en-US">
          <ChartScreen>
            <ChartFrame title="A" encoding="donut"><div /></ChartFrame>
            <ChartFrame title="B" encoding="donut"><div /></ChartFrame>
          </ChartScreen>
        </LocaleProvider>
      </StrictMode>,
    )
    expect(spy).toHaveBeenCalledWith(expect.stringMatching(/duplicate chart encoding "donut"/i))
  })
})
