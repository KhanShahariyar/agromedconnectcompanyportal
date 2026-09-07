import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { LocaleProvider } from '@/i18n/LocaleProvider'
import { AccessProvider, Gate, useCan } from './Gate'
import { ROLE_PERMISSIONS } from './can'
import type { AccessContext } from './can'

const owner: AccessContext = { permissions: ROLE_PERMISSIONS.owner, verificationStatus: 'verified', isBlacklisted: false }
const unverified: AccessContext = { ...owner, verificationStatus: 'pending' }
const manager: AccessContext = { ...owner, permissions: ROLE_PERMISSIONS.manager }

function renderGate(action: Parameters<typeof Gate>[0]['action'], ctx: AccessContext, mode?: 'disable' | 'hide') {
  return render(
    <LocaleProvider initial="en-US">
      <AccessProvider value={ctx}>
        <Gate action={action} mode={mode}>
          <button>Do it</button>
        </Gate>
      </AccessProvider>
    </LocaleProvider>,
  )
}

describe('Gate', () => {
  it('renders children untouched when permitted', () => {
    renderGate('product.publish', owner)
    expect(screen.getByRole('button', { name: 'Do it' })).toBeEnabled()
  })

  it('explains a verification block differently from a role block (C9)', () => {
    const { unmount } = renderGate('product.publish', unverified)
    expect(screen.getByRole('button')).toBeDisabled()
    expect(screen.getByRole('button')).toHaveAccessibleDescription(/verification in progress/i)
    unmount()

    renderGate('payout.request', manager)
    expect(screen.getByRole('button')).toBeDisabled()
    expect(screen.getByRole('button')).toHaveAccessibleDescription(/role does not permit/i)
  })

  it('hides rather than disables when asked — a dead nav link is worse than none', () => {
    renderGate('payout.request', manager, 'hide')
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })

  it('exposes the same decision as a hook for non-element cases', () => {
    function Probe() {
      const c = useCan()
      return <span data-testid="r">{JSON.stringify(c('payout.request'))}</span>
    }
    render(
      <LocaleProvider initial="en-US">
        <AccessProvider value={manager}><Probe /></AccessProvider>
      </LocaleProvider>,
    )
    expect(screen.getByTestId('r')).toHaveTextContent('"reason":"role"')
  })
})
