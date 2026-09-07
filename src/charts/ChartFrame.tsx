import { createContext, useContext, useEffect, useId, useMemo, useRef } from 'react'
import type { ReactNode } from 'react'
import { Card } from '@/ui/primitives'

export type Encoding =
  | 'line' | 'funnel' | 'bullet' | 'stacked-area' | 'dumbbell' | 'scatter'
  | 'gantt' | 'waterfall' | 'grouped-bar' | 'heatmap' | 'donut' | 'choropleth'

const ScreenCtx = createContext<{
  register: (encoding: Encoding, instanceId: string) => () => void
} | null>(null)

/**
 * Enforces C5 — one encoding per screen — while the screen is being built.
 *
 * The rule exists because the portal this replaces broke it: the old Analytics
 * page drew an AreaChart and a LineChart side by side, both plotting value over
 * time. Two pictures, one insight.
 *
 * Registration happens in an effect, not during render. Two earlier attempts
 * did it in render — first with a Set reset in ChartScreen's body, then with
 * per-instance ids — and both passed their tests and then failed in the real
 * app, because render may run any number of times per commit and StrictMode
 * guarantees it does. An effect runs once per commit and has cleanup, which is
 * exactly the lifecycle this bookkeeping needs.
 *
 * It reports rather than throws: a repeated encoding is a design mistake worth
 * shouting about in development, not a reason to white out a company's
 * dashboard in production. The hard gate is the audit test that sweeps every
 * screen.
 */
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
    /*
     * The wrapper carries `sr-only`, not the table.
     *
     * Tailwind's sr-only clamps height to 1px, but table layout ignores a height
     * clamp and sizes to its content — so classing the table directly left it
     * occupying real space. On Market Intelligence that was 674px of invisible
     * table and a page that scrolled far past its content. A block wrapper
     * respects the clamp; the table inside is free to be whatever height it likes.
     */
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
