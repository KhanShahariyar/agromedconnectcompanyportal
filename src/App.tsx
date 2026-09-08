import { useMemo } from 'react'
import { BrowserRouter } from 'react-router-dom'
import { LocaleProvider } from '@/i18n/LocaleProvider'
import { DataProvider } from '@/data/DataProvider'
import { SessionProvider } from '@/auth/SessionProvider'
import { MockAdapter } from '@/data/mock/MockAdapter'
import { HttpAdapter } from '@/data/http/HttpAdapter'
import type { DataAdapter } from '@/data/DataAdapter'
import { AppRoutes } from './routes'

/**
 * Which backend the portal talks to.
 *
 * This is the whole of the Phase 1 → Phase 2 switch. Both adapters implement
 * the same interface, and the mock's types were written from the API's contract
 * before either existed, so no screen changes when this flips.
 *
 * Set VITE_USE_MOCK=true to run against in-memory fixtures — useful for design
 * work, for demos with no database, and for reviewing empty and error states
 * that real data will not reliably produce.
 */
const useMock = import.meta.env.VITE_USE_MOCK === 'true'

function createAdapter(): DataAdapter {
  return useMock ? new MockAdapter() : new HttpAdapter()
}

export default function App() {
  const adapter = useMemo(createAdapter, [])

  return (
    <BrowserRouter>
      <LocaleProvider>
        <DataProvider adapter={adapter}>
          <SessionProvider>
            <AppRoutes />
          </SessionProvider>
        </DataProvider>
      </LocaleProvider>
    </BrowserRouter>
  )
}
