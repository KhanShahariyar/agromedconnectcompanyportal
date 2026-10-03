import { useEffect, useMemo } from 'react'
import { BrowserRouter } from 'react-router-dom'
import { LocaleProvider, useLocale } from '@/i18n/LocaleProvider'
import { DataProvider } from '@/data/DataProvider'
import { SessionProvider } from '@/auth/SessionProvider'
import { HttpAdapter } from '@/data/http/HttpAdapter'
import { AppRoutes } from './routes'

/**
 * Keep the HTTP layer's locale in step with the UI's.
 *
 * The adapter sends Accept-Language on every request, and the API translates
 * names, categories and every other piece of user-facing text to it. Nothing
 * connected the two, so the adapter sat on its 'bn-BD' default forever and an
 * English UI still received Bangla category names. The locale lives in React
 * state; this is the one place it crosses into the transport.
 */
function LocaleBridge({ adapter }: { adapter: HttpAdapter }) {
  const { locale } = useLocale()
  useEffect(() => { adapter.setLocale(locale) }, [adapter, locale])
  return null
}

export default function App() {
  const adapter = useMemo(() => new HttpAdapter(), [])

  return (
    <BrowserRouter>
      <LocaleProvider>
        <LocaleBridge adapter={adapter} />
        <DataProvider adapter={adapter}>
          <SessionProvider>
            <AppRoutes />
          </SessionProvider>
        </DataProvider>
      </LocaleProvider>
    </BrowserRouter>
  )
}
