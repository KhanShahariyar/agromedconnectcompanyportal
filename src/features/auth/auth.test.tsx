import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { LocaleProvider } from '@/i18n/LocaleProvider'
import { DataProvider } from '@/data/DataProvider'
import { SessionProvider } from '@/auth/SessionProvider'
import { MockAdapter } from '@/data/mock/MockAdapter'
import type { DataAdapter } from '@/data/DataAdapter'
import { Login } from './Login'
import { ForgotPassword } from './ForgotPassword'
import { RegisterCompany } from './RegisterCompany'
import { validatePhoneOrEmail, validatePassword, normalisePhone } from './validation'

function renderAuth(ui: React.ReactNode, adapter: DataAdapter = new MockAdapter({ latencyMs: 0 })) {
  return render(
    <MemoryRouter>
      <LocaleProvider initial="en-US">
        <DataProvider adapter={adapter}>
          <SessionProvider>
            <Routes>
              <Route path="/" element={ui} />
              <Route path="/verification" element={<h1>Verification</h1>} />
            </Routes>
          </SessionProvider>
        </DataProvider>
      </LocaleProvider>
    </MemoryRouter>,
  )
}

describe('validation', () => {
  it('accepts a Bangladeshi phone number in E.164 or local form', () => {
    expect(validatePhoneOrEmail('+8801712345678')).toBeNull()
    expect(validatePhoneOrEmail('01712345678')).toBeNull()
    expect(validatePhoneOrEmail('ops@agroshield.com.bd')).toBeNull()
    expect(validatePhoneOrEmail('nope')).toBe('validation.identifier')
  })

  it('normalises a local number to E.164 so the server sees one shape', () => {
    expect(normalisePhone('01712345678')).toBe('+8801712345678')
    expect(normalisePhone('+8801712345678')).toBe('+8801712345678')
  })

  it('requires a password long enough to resist guessing', () => {
    expect(validatePassword('short')).toBe('validation.password')
    expect(validatePassword('a-long-enough-passphrase')).toBeNull()
  })
})

describe('Login', () => {
  it('shows the logo at 96px above the sign-in card (C13)', () => {
    renderAuth(<Login />)
    expect(screen.getByRole('img', { name: /agromedconnect/i })).toHaveAttribute('width', '96')
  })

  it('rejects a malformed identifier before calling the API', async () => {
    const adapter = new MockAdapter({ latencyMs: 0 })
    const spy = vi.spyOn(adapter, 'login')
    renderAuth(<Login />, adapter)
    await userEvent.type(screen.getByLabelText(/phone or email/i), 'nope')
    await userEvent.type(screen.getByLabelText(/^password/i), 'a-long-enough-pass')
    await userEvent.click(screen.getByRole('button', { name: /sign in/i }))
    expect(screen.getByText(/valid phone number or email/i)).toBeInTheDocument()
    expect(spy).not.toHaveBeenCalled()
  })

  it('surfaces the API problem detail on a failed sign-in, not a generic message', async () => {
    const adapter = new MockAdapter({ latencyMs: 0 })
    vi.spyOn(adapter, 'login').mockRejectedValue({
      code: 'invalid_credentials', title: 'Sign-in failed', detail: 'Wrong password', status: 401, type: 't',
    })
    renderAuth(<Login />, adapter)
    await userEvent.type(screen.getByLabelText(/phone or email/i), '01712345678')
    await userEvent.type(screen.getByLabelText(/^password/i), 'a-long-enough-pass')
    await userEvent.click(screen.getByRole('button', { name: /sign in/i }))
    expect(await screen.findByRole('alert')).toHaveTextContent(/wrong password/i)
  })

  it('offers a locale toggle before sign-in', () => {
    renderAuth(<Login />)
    expect(screen.getByRole('button', { name: /বাংলা|english/i })).toBeInTheDocument()
  })
})

describe('ForgotPassword', () => {
  it('never reveals whether an account exists', async () => {
    renderAuth(<ForgotPassword />)
    await userEvent.type(screen.getByLabelText(/phone or email/i), 'nobody@example.com')
    await userEvent.click(screen.getByRole('button', { name: /send reset link/i }))
    expect(await screen.findByText(/if an account exists/i)).toBeInTheDocument()
  })
})

describe('RegisterCompany', () => {
  it('sends a newly registered company to verification, not the dashboard', async () => {
    renderAuth(<RegisterCompany />)
    await userEvent.type(screen.getByLabelText(/registered legal name/i), 'Test Agro Ltd')
    await userEvent.type(screen.getByLabelText(/business email/i), 'ops@test.com')
    await userEvent.type(screen.getByLabelText(/business phone/i), '01712345678')
    await userEvent.type(screen.getByLabelText(/administrator full name/i), 'Test Admin')
    await userEvent.type(screen.getByLabelText(/^password/i), 'a-long-enough-pass')
    await userEvent.click(screen.getByRole('button', { name: /create a company account/i }))
    expect(await screen.findByRole('heading', { name: /verification/i })).toBeInTheDocument()
  })
})
