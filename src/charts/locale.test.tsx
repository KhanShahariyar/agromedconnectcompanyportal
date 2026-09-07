import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { LocaleProvider } from '@/i18n/LocaleProvider'
import { ChartScreen, ChartFrame } from './ChartFrame'
import { Bullet, Funnel } from './custom'

/** C6 — a chart with default Recharts number formatting is a defect. */
describe('chart localisation', () => {
  it('renders values in Bengali numerals under bn-BD', () => {
    const { container } = render(
      <LocaleProvider initial="bn-BD">
        <ChartScreen>
          <ChartFrame title="মজুদ" encoding="bullet">
            <Bullet caption="stock" rows={[{ label: 'Urea', value: 1500, target: 2000 }]} />
          </ChartFrame>
        </ChartScreen>
      </LocaleProvider>,
    )
    expect(container.textContent).toMatch(/[০-৯]/)
    expect(container.textContent).not.toMatch(/1,500/)
  })

  it('renders ASCII digits under en-US', () => {
    const { container } = render(
      <LocaleProvider initial="en-US">
        <ChartScreen>
          <ChartFrame title="Stock" encoding="bullet">
            <Bullet caption="stock" rows={[{ label: 'Urea', value: 1500, target: 2000 }]} />
          </ChartFrame>
        </ChartScreen>
      </LocaleProvider>,
    )
    expect(container.textContent).toMatch(/1,500/)
  })

  it('ships an accessible table alongside every chart, so identity is never colour alone', () => {
    const { container } = render(
      <LocaleProvider initial="en-US">
        <ChartScreen>
          <ChartFrame title="Pipeline" encoding="funnel">
            <Funnel stages={[{ key: 'a', label: 'Confirmed', count: 10 }, { key: 'b', label: 'Shipped', count: 4 }]} />
          </ChartFrame>
        </ChartScreen>
      </LocaleProvider>,
    )
    const table = container.querySelector('table.sr-only')
    expect(table).toBeTruthy()
    expect(table!.textContent).toContain('Confirmed')
  })

  it('shows stage-to-stage drop-off, which is the decision a funnel exists to serve', () => {
    const { container } = render(
      <LocaleProvider initial="en-US">
        <ChartScreen>
          <ChartFrame title="Pipeline" encoding="funnel">
            <Funnel stages={[{ key: 'a', label: 'Confirmed', count: 10 }, { key: 'b', label: 'Shipped', count: 4 }]} />
          </ChartFrame>
        </ChartScreen>
      </LocaleProvider>,
    )
    expect(container.textContent).toContain('−6')
  })
})
