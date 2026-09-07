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
    const table = container.querySelector('.sr-only table')
    expect(table).toBeTruthy()
    // The wrapper carries sr-only, not the table: a table ignores the 1px
    // height clamp and sizes to content, which cost 674px of dead scroll.
    expect(table!.classList.contains('sr-only')).toBe(false)
    expect(table!.parentElement!.classList.contains('sr-only')).toBe(true)
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

  it('treats "below target" as good or bad depending on what is measured', () => {
    // Found by running the app: fulfilment of 2.4 days against a 3-day target
    // was painted danger-red, because Bullet assumed higher is always better.
    // Stock below its reorder point is a problem; days below target is the goal.
    const render1 = render(
      <LocaleProvider initial="en-US">
        <ChartScreen>
          <ChartFrame title="Stock" encoding="bullet">
            <Bullet caption="stock" rows={[{ label: 'Urea', value: 4, target: 20 }]} />
          </ChartFrame>
        </ChartScreen>
      </LocaleProvider>,
    )
    expect(render1.container.querySelector('.sr-only table')!.textContent).toContain('yes')
    render1.unmount()

    const render2 = render(
      <LocaleProvider initial="en-US">
        <ChartScreen>
          <ChartFrame title="Fulfilment" encoding="bullet">
            <Bullet lowerIsBetter caption="sla" rows={[{ label: 'Days', value: 2.4, target: 3 }]} />
          </ChartFrame>
        </ChartScreen>
      </LocaleProvider>,
    )
    // 2.4 days against a 3-day target is on target, not off it.
    expect(render2.container.querySelector('.sr-only table')!.textContent).toContain('no')
  })
})
