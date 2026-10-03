import { createContext, useContext } from 'react'
import type { ReactNode } from 'react'
import type { DataAdapter } from './DataAdapter'

const DataContext = createContext<DataAdapter | null>(null)

export function DataProvider({ adapter, children }: { adapter: DataAdapter; children: ReactNode }) {
  return <DataContext.Provider value={adapter}>{children}</DataContext.Provider>
}

export function useData(): DataAdapter {
  const ctx = useContext(DataContext)
  if (!ctx) throw new Error('useData must be used inside <DataProvider>')
  return ctx
}
