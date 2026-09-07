import { BrowserRouter } from 'react-router-dom'
import { LocaleProvider } from '@/i18n/LocaleProvider'
import { DataProvider } from '@/data/DataProvider'
import { SessionProvider } from '@/auth/SessionProvider'
import { MockAdapter } from '@/data/mock/MockAdapter'
import { AppRoutes } from './routes'

// Phase 1 supplies the mock; Phase 2 swaps this one line for HttpAdapter.
const adapter = new MockAdapter()

export default function App() {
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
