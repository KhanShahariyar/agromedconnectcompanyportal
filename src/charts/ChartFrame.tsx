import { createContext, useContext, useEffect, useId, useMemo, useRef } from 'react'
import type { ReactNode } from 'react'
import { Card } from '@/ui/primitives'

export type Encoding =
  | 'line' | 'funnel' | 'bullet' | 'stacked-area' | 'dumbbell' | 'scatter'
  | 'gantt' | 'waterfall' | 'grouped-bar' | 'heatmap' | 'donut' | 'choropleth'

const ScreenCtx = createContext<{
  register: (encoding: Encoding, instanceId: string) => () => void
} | null>(null)

export function ChartScreen({ children }: { children: ReactNode }) {
  const claims = useRef(new Map<Encoding, string>())

  const value = useMemo(() => ({
    register(encoding: Encoding, instanceId: string) {
      const holder = claims.current.get(encoding)
      if (holder !== undefined && holder !== instanceId) {
        console.error(
          `duplicate chart encoding "${encoding}" on one screen — each chart must show a different kind of insight`,
        )
      } else {
        claims.current.set(encoding, instanceId)
      }
      return () => {
        if (claims.current.get(encoding) === instanceId) claims.current.delete(encoding)
      }
    },
  }), [])

  return <ScreenCtx.Provider value={value}>{children}</ScreenCtx.Provider>
}

export function ChartFrame({ title, subtitle, encoding, footnote, action, children }: {
  title: string
  subtitle?: string
  encoding: Encoding
  footnote?: string
  action?: ReactNode
  children: ReactNode
}) {
  const screen = useContext(ScreenCtx)
  const instanceId = useId()
  useEffect(() => screen?.register(encoding, instanceId), [screen, encoding, instanceId])
  return (
    <Card className="p-5" data-testid="chart-frame" data-encoding={encoding}>
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h2 className="font-serif text-base text-ink">{title}</h2>
          {subtitle && <p className="mt-0.5 text-xs text-ink-soft">{subtitle}</p>}
        </div>
        {action}
      </div>
      {children}
      {footnote && <p className="mt-3 text-xs text-ink-faint">{footnote}</p>}
    </Card>
  )
}

export function ChartTable({ caption, columns, rows }: {
  caption: string
  columns: string[]
  rows: (string | number)[][]
}) {
  return (

    <div className="sr-only">
      <table>
        <caption>{caption}</caption>
        <thead>
          <tr>{columns.map((c) => <th key={c} scope="col">{c}</th>)}</tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i}>{r.map((cell, j) => <td key={j}>{cell}</td>)}</tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
