import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { LocaleProvider } from '@/i18n/LocaleProvider'
import { AsyncBoundary } from './AsyncBoundary'
import type { QueryResult } from '@/data/useQuery'

const wrap = (ui: React.ReactNode) => render(<LocaleProvider initial="en-US">{ui}</LocaleProvider>)
const problem = { type: 't', title: 'Boom', status: 500, code: 'boom', detail: 'It broke' }

describe('AsyncBoundary', () => {
  it('renders a skeleton while loading', () => {
    const q: QueryResult<string> = { loading: true, refetch: vi.fn() }
    wrap(<AsyncBoundary query={q}>{() => <div>done</div>}</AsyncBoundary>)
    expect(screen.getByTestId('skeleton')).toBeInTheDocument()
  })

  it('renders the error state with a retry that calls refetch', async () => {
    const refetch = vi.fn()
    const q: QueryResult<string> = { loading: false, error: problem, refetch }
    wrap(<AsyncBoundary query={q}>{() => <div>done</div>}</AsyncBoundary>)
    expect(screen.getByText('It broke')).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: /try again/i }))
    expect(refetch).toHaveBeenCalledOnce()
  })

  it('renders the empty state for an empty page rather than an empty table', () => {
    const q: QueryResult<{ items: string[]; page: number; pageSize: number; total: number }> = {
      loading: false, data: { items: [], page: 1, pageSize: 20, total: 0 }, refetch: vi.fn(),
    }
    wrap(<AsyncBoundary query={q}>{() => <div>rows</div>}</AsyncBoundary>)
    expect(screen.getByText(/nothing here yet/i)).toBeInTheDocument()
    expect(screen.queryByText('rows')).not.toBeInTheDocument()
  })

  it('renders the empty state for an empty array too', () => {
    const q: QueryResult<string[]> = { loading: false, data: [], refetch: vi.fn() }
    wrap(<AsyncBoundary query={q}>{() => <div>rows</div>}</AsyncBoundary>)
    expect(screen.getByText(/nothing here yet/i)).toBeInTheDocument()
  })

  it('renders children once data arrives', () => {
    const q: QueryResult<string> = { loading: false, data: 'ok', refetch: vi.fn() }
    wrap(<AsyncBoundary query={q}>{(d) => <div>{d}</div>}</AsyncBoundary>)
    expect(screen.getByText('ok')).toBeInTheDocument()
  })

  it('keeps showing data while a refetch is in flight, rather than flashing a skeleton', () => {
    const q: QueryResult<string> = { loading: true, data: 'ok', refetch: vi.fn() }
    wrap(<AsyncBoundary query={q}>{(d) => <div>{d}</div>}</AsyncBoundary>)
    expect(screen.getByText('ok')).toBeInTheDocument()
    expect(screen.queryByTestId('skeleton')).not.toBeInTheDocument()
  })
})
