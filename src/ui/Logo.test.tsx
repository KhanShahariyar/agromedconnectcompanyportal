import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Logo } from './Logo'

describe('Logo', () => {
  it('renders the official mark with an accessible name', () => {
    render(<Logo size={64} />)
    expect(screen.getByRole('img', { name: /agromedconnect/i })).toBeInTheDocument()
  })

  it('requests a raster at least as large as the rendered size, for retina crispness', () => {
    render(<Logo size={48} />)
    const img = screen.getByRole('img', { name: /agromedconnect/i })
    expect(img.getAttribute('src')).toMatch(/logo-96\.png/)
  })

  it('renders at the requested CSS size', () => {
    render(<Logo size={32} />)
    const img = screen.getByRole('img', { name: /agromedconnect/i })
    expect(img).toHaveAttribute('width', '32')
    expect(img).toHaveAttribute('height', '32')
  })

  it('defaults to 32 px — the verified legibility floor (spec 6.5)', () => {
    render(<Logo />)
    expect(screen.getByRole('img', { name: /agromedconnect/i })).toHaveAttribute('width', '32')
  })
})
