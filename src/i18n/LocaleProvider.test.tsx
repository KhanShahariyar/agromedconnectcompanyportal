import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { LocaleProvider, useT, useLocale, useFormat } from './LocaleProvider'

function Probe() {
  const t = useT()
  const { locale, setLocale } = useLocale()
  const f = useFormat()
  return (
    <div>
      <span data-testid="label">{t('nav.orders')}</span>
      <span data-testid="num">{f.number(1234567)}</span>
      <span data-testid="interp">{t('paging.showing', { from: 1, to: 10, total: 50 })}</span>
      <button onClick={() => setLocale(locale === 'en-US' ? 'bn-BD' : 'en-US')}>swap</button>
    </div>
  )
}

describe('LocaleProvider', () => {
  it('translates and formats in the active locale, and swaps both together', async () => {
    render(<LocaleProvider initial="en-US"><Probe /></LocaleProvider>)
    expect(screen.getByTestId('label')).toHaveTextContent('Orders')
    expect(screen.getByTestId('num')).toHaveTextContent('1,234,567')

    await userEvent.click(screen.getByRole('button', { name: 'swap' }))
    expect(screen.getByTestId('label')).toHaveTextContent('অর্ডার')
    expect(screen.getByTestId('num')).toHaveTextContent('১২,৩৪,৫৬৭')
  })

  it('interpolates variables', () => {
    render(<LocaleProvider initial="en-US"><Probe /></LocaleProvider>)
    expect(screen.getByTestId('interp')).toHaveTextContent('Showing 1–10 of 50')
  })

  it('sets document lang so the :lang(bn) Bengali font rule applies', async () => {
    render(<LocaleProvider initial="bn-BD"><Probe /></LocaleProvider>)
    expect(document.documentElement.lang).toBe('bn')
  })
})
