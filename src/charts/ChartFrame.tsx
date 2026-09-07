import { createContext, useContext, useRef } from 'react'
import type { ReactNode } from 'react'
import { Card } from '@/ui/primitives'

export type Encoding =
  | 'line' | 'funnel' | 'bullet' | 'stacked-area' | 'dumbbell' | 'scatter'
  | 'gantt' | 'waterfall' | 'grouped-bar' | 'heatmap' | 'donut' | 'choropleth'

const ScreenCtx = createContext<{ claim: (e: Encoding) => void } | null>(null)

/**
 * Enforces C5 — one encoding per screen — at render time rather than in review.
 *
 * The rule exists because the portal it replaces broke it: the old Analytics
 * page drew an AreaChart and a LineChart side by side, both plotting value over
 * time. Two pictures, one insight. Throwing here makes that impossible to ship.
 */
export function ChartScreen({ children }: { children: ReactNode }) {
  const seen = useRef(new Set<Encoding>())
  seen.current = new Set()
  const claim = (e: Encoding) => {
    if (seen.current.has(e)) {
      throw new Error(
        `duplicate chart encoding "${e}" on one screen — each chart must show a different kind of insight`,
      )
    }
    seen.current.add(e)
  }
  return <ScreenCtx.Provider value={{ claim }}>{children}</ScreenCtx.Provider>
}

export function ChartFrame({ title, subtitle, encoding, footnote, action, children }: {
  title: string
  subtitle?: string
  encoding: Encoding
  footnote?: string
  action?: ReactNode
  children: ReactNode
}) {
  useContext(ScreenCtx)?.claim(encoding)
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

/**
 * The same numbers as a table, visually hidden.
 *
 * A chart nobody can read with a screen reader is a chart half the audience
 * cannot use, and it is also the relief the colour validator requires where
 * adjacent series sit in the 6-8 CVD band.
 */
export function ChartTable({ caption, columns, rows }: {
  caption: string
  columns: string[]
  rows: (string | number)[][]
}) {
  return (
    <table className="sr-only">
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
  )
}
