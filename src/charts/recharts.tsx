import {
  Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Legend, Line, LineChart, Pie, PieChart,
  ResponsiveContainer, Scatter, ScatterChart, Tooltip, XAxis, YAxis, ZAxis,
} from 'recharts'
import type { ReactNode } from 'react'
import { useFormat } from '@/i18n/LocaleProvider'
import { SERIES_OTHER, TOKENS, seriesColour } from '@/design/tokens'
import { ChartTable } from './ChartFrame'

export { seriesColour }

const AXIS = { fontSize: 11, fill: TOKENS.inkFaint }
const GRID = { stroke: TOKENS.border, strokeDasharray: '2 4' }

function TooltipCard({ active, payload, label, format }: {
  active?: boolean
  payload?: { name?: string; value?: number; color?: string }[]
  label?: string | number
  format: (v: number) => string
}) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-md border border-line bg-panel px-3 py-2 text-xs shadow-lift">
      {label !== undefined && <div className="mb-1 font-medium text-ink">{label}</div>}
      {payload.map((p, i) => (
        <div key={i} className="flex items-center gap-2 text-ink-soft">
          <span aria-hidden className="h-2 w-2 rounded-full" style={{ background: p.color }} />
          <span>{p.name}</span>
          <span className="ml-auto font-medium text-ink">{format(p.value ?? 0)}</span>
        </div>
      ))}
    </div>
  )
}

/* ------------------------------------------------------------- LineTrend */

export function LineTrend({ data, xKey, yKey, name, height = 220, valueFormat }: {
  data: Record<string, string | number>[]
  xKey: string
  yKey: string
  name: string
  height?: number
  valueFormat?: (v: number) => string
}) {
  const f = useFormat()
  const fmt = valueFormat ?? f.tick
  return (
    <>
      <ResponsiveContainer width="100%" height={height}>
        <LineChart data={data} margin={{ left: -18, right: 8, top: 8 }}>
          <CartesianGrid {...GRID} vertical={false} />
          <XAxis dataKey={xKey} tick={AXIS} tickLine={false} axisLine={{ stroke: TOKENS.border }} />
          <YAxis tick={AXIS} tickLine={false} axisLine={false} tickFormatter={f.tick} />
          <Tooltip content={<TooltipCard format={fmt} />} />
          {/* A single series needs no legend — the chart title names it. */}
          <Line type="monotone" dataKey={yKey} name={name} stroke={seriesColour(0)} strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
        </LineChart>
      </ResponsiveContainer>
      <ChartTable caption={name} columns={[xKey, name]} rows={data.map((d) => [String(d[xKey]), fmt(Number(d[yKey]))])} />
    </>
  )
}

/* ----------------------------------------------------------- StackedArea */

export function StackedArea({ data, xKey, seriesKeys, height = 260, asPercent }: {
  data: Record<string, string | number>[]
  xKey: string
  seriesKeys: string[]
  height?: number
  asPercent?: boolean
}) {
  const f = useFormat()
  const fmt = asPercent ? (v: number) => f.percent(v, 0) : f.tick
  return (
    <>
      <ResponsiveContainer width="100%" height={height}>
        <AreaChart data={data} margin={{ left: -18, right: 8, top: 8 }}>
          <CartesianGrid {...GRID} vertical={false} />
          <XAxis dataKey={xKey} tick={AXIS} tickLine={false} axisLine={{ stroke: TOKENS.border }} />
          <YAxis tick={AXIS} tickLine={false} axisLine={false} tickFormatter={fmt} />
          <Tooltip content={<TooltipCard format={fmt} />} />
          <Legend wrapperStyle={{ fontSize: 11, color: TOKENS.inkSoft }} />
          {seriesKeys.map((k, i) => (
            <Area
              key={k} type="monotone" dataKey={k} name={k} stackId="1"
              stroke={seriesColour(i)} fill={seriesColour(i)} fillOpacity={0.85}
              // A 2px surface gap keeps stacked bands legible where two hues meet.
              strokeWidth={2} strokeLinejoin="round"
            />
          ))}
        </AreaChart>
      </ResponsiveContainer>
      <ChartTable
        caption="Category demand share"
        columns={[xKey, ...seriesKeys]}
        rows={data.map((d) => [String(d[xKey]), ...seriesKeys.map((k) => fmt(Number(d[k])))])}
      />
    </>
  )
}

/* ----------------------------------------------------------- GroupedBar */

export function GroupedBar({ data, xKey, seriesKeys, height = 260, valueFormat }: {
  data: Record<string, string | number>[]
  xKey: string
  seriesKeys: string[]
  height?: number
  valueFormat?: (v: number) => string
}) {
  const f = useFormat()
  const fmt = valueFormat ?? f.tick
  return (
    <>
      <ResponsiveContainer width="100%" height={height}>
        <BarChart data={data} margin={{ left: -18, right: 8, top: 8 }} barGap={2}>
          <CartesianGrid {...GRID} vertical={false} />
          <XAxis dataKey={xKey} tick={AXIS} tickLine={false} axisLine={{ stroke: TOKENS.border }} />
          <YAxis tick={AXIS} tickLine={false} axisLine={false} tickFormatter={f.tick} />
          <Tooltip content={<TooltipCard format={fmt} />} cursor={{ fill: TOKENS.sunken, fillOpacity: 0.5 }} />
          <Legend wrapperStyle={{ fontSize: 11, color: TOKENS.inkSoft }} />
          {seriesKeys.map((k, i) => (
            <Bar key={k} dataKey={k} name={k} fill={seriesColour(i)} radius={[4, 4, 0, 0]} />
          ))}
        </BarChart>
      </ResponsiveContainer>
      <ChartTable
        caption="Revenue by category"
        columns={[xKey, ...seriesKeys]}
        rows={data.map((d) => [String(d[xKey]), ...seriesKeys.map((k) => fmt(Number(d[k])))])}
      />
    </>
  )
}

/* -------------------------------------------------------------- Scatter */

export function PriceScatter({ points, height = 300, xFormat }: {
  points: { x: number; y: number; label: string; isMine: boolean }[]
  height?: number
  xFormat?: (v: number) => string
}) {
  const f = useFormat()
  const fmtX = xFormat ?? f.tick
  const mine = points.filter((p) => p.isMine)
  const market = points.filter((p) => !p.isMine)
  return (
    <>
      <ResponsiveContainer width="100%" height={height}>
        <ScatterChart margin={{ left: -8, right: 12, top: 8, bottom: 8 }}>
          <CartesianGrid {...GRID} />
          <XAxis type="number" dataKey="x" name="Unit price" tick={AXIS} tickLine={false} axisLine={{ stroke: TOKENS.border }} tickFormatter={fmtX} />
          <YAxis type="number" dataKey="y" name="Units sold" tick={AXIS} tickLine={false} axisLine={false} tickFormatter={f.tick} />
          <ZAxis range={[70, 70]} />
          <Tooltip content={<TooltipCard format={f.tick} />} cursor={{ strokeDasharray: '3 3' }} />
          <Legend wrapperStyle={{ fontSize: 11, color: TOKENS.inkSoft }} />
          {/* The market cloud is recessive; my listings carry the ring so they
              are findable without relying on hue alone. */}
          <Scatter name="Market" data={market} fill={SERIES_OTHER} fillOpacity={0.55} />
          <Scatter name="My listings" data={mine} fill={seriesColour(0)} stroke={TOKENS.panel} strokeWidth={2} />
        </ScatterChart>
      </ResponsiveContainer>
      <ChartTable
        caption="Price position against the market"
        columns={['Listing', 'Unit price', 'Units sold', 'Mine']}
        rows={points.map((p) => [p.label, fmtX(p.x), f.number(p.y), p.isMine ? 'yes' : 'no'])}
      />
    </>
  )
}

/* ---------------------------------------------------------------- Donut */

export function Donut({ slices, height = 220, footnote }: {
  slices: { label: string; value: number }[]
  height?: number
  footnote?: ReactNode
}) {
  const f = useFormat()
  const total = slices.reduce((s, x) => s + x.value, 0)
  return (
    <>
      <ResponsiveContainer width="100%" height={height}>
        <PieChart>
          <Pie data={slices} dataKey="value" nameKey="label" innerRadius="58%" outerRadius="82%" paddingAngle={2} stroke={TOKENS.panel} strokeWidth={2}>
            {slices.map((s, i) => <Cell key={s.label} fill={seriesColour(i)} />)}
          </Pie>
          <Tooltip content={<TooltipCard format={f.number} />} />
          <Legend wrapperStyle={{ fontSize: 11, color: TOKENS.inkSoft }} />
        </PieChart>
      </ResponsiveContainer>
      {/* Counts as well as shares — a percentage alone hides a tiny sample. */}
      <ul className="mt-2 space-y-1 text-xs text-ink-soft">
        {slices.map((s, i) => (
          <li key={s.label} className="flex items-center gap-2">
            <span aria-hidden className="h-2 w-2 rounded-full" style={{ background: seriesColour(i) }} />
            <span>{s.label}</span>
            <span className="ml-auto text-ink">
              {f.number(s.value)} · {f.percent(total ? s.value / total : 0, 0)}
            </span>
          </li>
        ))}
      </ul>
      {footnote}
    </>
  )
}
