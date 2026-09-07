import { createContext, useContext } from 'react'
import type { ReactNode } from 'react'
import type { DataAdapter } from './DataAdapter'

const DataContext = createContext<DataAdapter | null>(null)

/**
 * Phase 1 supplies MockAdapter here; Phase 2 supplies HttpAdapter. That single
 * swap is the whole cost of moving the portal onto real endpoints.
 */
export function DataProvider({ adapter, children }: { adapter: DataAdapter; children: ReactNode }) {
  return <DataContext.Provider value={adapter}>{children}</DataContext.Provider>
}

export function useData(): DataAdapter {
  const ctx = useContext(DataContext)
  if (!ctx) throw new Error('useData must be used inside <DataProvider>')
  return ctx
}
