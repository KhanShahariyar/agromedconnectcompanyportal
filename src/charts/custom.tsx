import { useFormat } from '@/i18n/LocaleProvider'
import { SERIES, SERIES_OTHER, STATUS, TOKENS, seriesColour } from '@/design/tokens'
import { ChartTable } from './ChartFrame'

/* --------------------------------------------------------------- Bullet */

/**
 * Actual against a threshold. Chosen over a bar because the question is not
 * "how much stock" but "is it below the reorder point" — a comparison a bar
 * cannot make without the reader doing arithmetic.
 */
export function Bullet({ rows, caption }: {
  rows: { label: string; value: number; target: number; unit?: string | null }[]
  caption: string
}) {
  const f = useFormat()
  const max = Math.max(...rows.map((r) => Math.max(r.value, r.target)), 1)
  return (
    <>
      <ul className="space-y-3">
        {rows.map((r) => {
          const short = r.value < r.target
          return (
            <li key={r.label}>
              <div className="mb-1 flex items-baseline justify-between gap-3 text-xs">
                <span className="truncate text-ink">{r.label}</span>
                <span className={short ? 'font-medium text-danger' : 'text-ink-soft'}>
                  {f.number(r.value)}{r.unit ? ` ${r.unit}` : ''}
                  <span className="text-ink-faint"> / {f.number(r.target)}</span>
                </span>
              </div>
              <div className="relative h-3 rounded-sm bg-sunken">
                <div
                  className="h-3 rounded-sm"
                  style={{ width: `${(r.value / max) * 100}%`, background: short ? STATUS.danger : seriesColour(0) }}
                />
                {/* The threshold is a tick, not a second bar — one measure, one mark. */}
                <span
                  aria-hidden
                  className="absolute top-[-3px] h-[18px] w-0.5"
                  style={{ left: `${(r.target / max) * 100}%`, background: TOKENS.ink }}
                />
              </div>
            </li>
          )
        })}
      </ul>
      <ChartTable
        caption={caption}
        columns={['Item', 'On hand', 'Reorder point', 'Below point']}
        rows={rows.map((r) => [r.label, f.number(r.value), f.number(r.target), r.value < r.target ? 'yes' : 'no'])}
      />
    </>
  )
}

/* --------------------------------------------------------------- Funnel */

/** Stage-to-stage drop-off. The width carries the count; the label carries the loss. */
export function Funnel({ stages, onSelect }: {
  stages: { key: string; label: string; count: number }[]
  onSelect?: (key: string) => void
}) {
  const f = useFormat()
  const top = stages[0]?.count ?? 1
  return (
    <>
      <ul className="space-y-2">
        {stages.map((s, i) => {
          const prev = stages[i - 1]?.count
          const dropped = prev !== undefined ? prev - s.count : null
          return (
            <li key={s.key}>
              <button
                type="button"
                onClick={onSelect ? () => onSelect(s.key) : undefined}
                disabled={!onSelect}
                className="block w-full text-left disabled:cursor-default"
              >
                <div className="mb-1 flex items-baseline justify-between text-xs">
                  <span className="text-ink">{s.label}</span>
                  <span className="text-ink-soft">
                    {f.number(s.count)}
                    {dropped !== null && dropped > 0 && (
                      <span className="ml-2 text-ink-faint">−{f.number(dropped)}</span>
                    )}
                  </span>
                </div>
                <div
                  className="h-7 rounded-sm transition-opacity hover:opacity-90"
                  style={{ width: `${Math.max(6, (s.count / top) * 100)}%`, background: seriesColour(0), opacity: 1 - i * 0.13 }}
                />
              </button>
            </li>
          )
        })}
      </ul>
      <ChartTable caption="Order pipeline" columns={['Stage', 'Orders']} rows={stages.map((s) => [s.label, f.number(s.count)])} />
    </>
  )
}

/* ------------------------------------------------------------- Dumbbell */

/**
 * My price against the market's min–median–max. A range plot rather than bars
 * because the question is positional: am I inside the market, and where.
 */
export function Dumbbell({ rows, absentLabel }: {
  rows: { label: string; min: number; median: number; max: number; mine: number | null; sampleSize: number }[]
  absentLabel: string
}) {
  const f = useFormat()
  const lo = Math.min(...rows.map((r) => r.min))
  const hi = Math.max(...rows.map((r) => r.max))
  const pos = (v: number) => ((v - lo) / Math.max(1, hi - lo)) * 100

  return (
    <>
      <ul className="space-y-4">
        {rows.map((r) => (
          <li key={r.label}>
            <div className="mb-1.5 flex items-baseline justify-between text-xs">
              <span className="text-ink">{r.label}</span>
              <span className="text-ink-faint">n={f.number(r.sampleSize)}</span>
            </div>
            <div className="relative h-4">
              <span aria-hidden className="absolute top-1.5 h-1 rounded-full bg-sunken" style={{ left: `${pos(r.min)}%`, width: `${pos(r.max) - pos(r.min)}%` }} />
              <span aria-hidden className="absolute top-0.5 h-3 w-0.5" style={{ left: `${pos(r.median)}%`, background: TOKENS.inkFaint }} />
              {r.mine !== null && (
                <span
                  aria-hidden
                  className="absolute top-0 h-4 w-4 -translate-x-1/2 rounded-full border-2"
                  style={{ left: `${pos(r.mine)}%`, background: seriesColour(0), borderColor: TOKENS.panel }}
                />
              )}
            </div>
            <div className="mt-1 text-xs text-ink-soft">
              {r.mine === null
                ? <span className="text-ink-faint">{absentLabel}</span>
                : <>Mine {f.number(r.mine / 100)} · market median {f.number(r.median / 100)}</>}
            </div>
          </li>
        ))}
      </ul>
      <ChartTable
        caption="Price benchmark"
        columns={['Category', 'Market min', 'Market median', 'Market max', 'My median']}
        rows={rows.map((r) => [r.label, f.number(r.min / 100), f.number(r.median / 100), f.number(r.max / 100), r.mine === null ? absentLabel : f.number(r.mine / 100)])}
      />
    </>
  )
}

/* ------------------------------------------------------------ Waterfall */

/** List price → discount → commission → net. Makes a margin-erasing discount visible before saving. */
export function Waterfall({ steps, caption }: {
  steps: { label: string; delta: number; isTotal?: boolean }[]
  caption: string
}) {
  const f = useFormat()
  let running = 0
  const bars = steps.map((s) => {
    const from = s.isTotal ? 0 : running
    const to = s.isTotal ? s.delta : running + s.delta
    running = s.isTotal ? s.delta : to
    return { ...s, from, to }
  })
  const max = Math.max(...bars.map((b) => Math.max(b.from, b.to)), 1)

  return (
    <>
      <ul className="space-y-2">
        {bars.map((b) => {
          const lo = Math.min(b.from, b.to)
          const hi = Math.max(b.from, b.to)
          const colour = b.isTotal ? seriesColour(0) : b.delta < 0 ? STATUS.warning : seriesColour(1)
          return (
            <li key={b.label}>
              <div className="mb-1 flex items-baseline justify-between text-xs">
                <span className="text-ink">{b.label}</span>
                <span className="text-ink-soft">{f.number(b.delta / 100)}</span>
              </div>
              <div className="relative h-6 rounded-sm bg-sunken/50">
                <span
                  className="absolute top-0 h-6 rounded-sm"
                  style={{ left: `${(lo / max) * 100}%`, width: `${Math.max(1, ((hi - lo) / max) * 100)}%`, background: colour }}
                />
              </div>
            </li>
          )
        })}
      </ul>
      <ChartTable caption={caption} columns={['Step', 'Amount']} rows={steps.map((s) => [s.label, f.number(s.delta / 100)])} />
    </>
  )
}

/* -------------------------------------------------------- GanttTimeline */

/**
 * The highest-value chart in the portal.
 *
 * pricing.offer allows two discounts to cover the same listing over the same
 * dates. A list of discounts hides that; a timeline makes an accidental overlap
 * something you see rather than something a customer reports.
 */
export function GanttTimeline({ rows, from, to, onSelect }: {
  rows: { id: string; label: string; bars: { id: string; label: string; start: string; end: string | null; conflict?: boolean }[] }[]
  from: string
  to: string
  onSelect?: (barId: string) => void
}) {
  const f = useFormat()
  const t0 = new Date(from).getTime()
  const t1 = new Date(to).getTime()
  const span = Math.max(1, t1 - t0)
  const pct = (iso: string | null, fallback: number) =>
    ((iso ? new Date(iso).getTime() : fallback) - t0) / span * 100

  return (
    <>
      <div className="mb-2 flex justify-between text-xs text-ink-faint">
        <span>{f.date(from, 'short')}</span>
        <span>{f.date(to, 'short')}</span>
      </div>
      <ul className="space-y-2">
        {rows.map((r) => (
          <li key={r.id} className="grid grid-cols-[9rem_1fr] items-center gap-3">
            <span className="truncate text-xs text-ink" title={r.label}>{r.label}</span>
            <div className="relative h-7 rounded-sm bg-sunken/60">
              {r.bars.map((b, i) => {
                const left = Math.max(0, pct(b.start, t0))
                const right = Math.min(100, pct(b.end, t1))
                return (
                  <button
                    key={b.id}
                    type="button"
                    onClick={onSelect ? () => onSelect(b.id) : undefined}
                    title={`${b.label} · ${f.date(b.start, 'short')} – ${b.end ? f.date(b.end, 'short') : '…'}`}
                    className="absolute rounded-sm border-2 text-[10px] leading-none text-panel"
                    style={{
                      left: `${left}%`,
                      width: `${Math.max(2, right - left)}%`,
                      top: `${2 + i * 12}px`,
                      height: '11px',
                      background: b.conflict ? STATUS.warning : seriesColour(i),
                      borderColor: TOKENS.panel,
                      // A conflicting window is hatched as well as coloured, so
                      // the clash survives greyscale and colour-blind vision.
                      backgroundImage: b.conflict
                        ? 'repeating-linear-gradient(45deg, rgba(255,255,255,.55) 0 3px, transparent 3px 6px)'
                        : undefined,
                    }}
                  />
                )
              })}
            </div>
          </li>
        ))}
      </ul>
      <ChartTable
        caption="Discount windows"
        columns={['Product', 'Discount', 'Starts', 'Ends', 'Overlapping']}
        rows={rows.flatMap((r) => r.bars.map((b) => [r.label, b.label, b.start, b.end ?? '—', b.conflict ? 'yes' : 'no']))}
      />
    </>
  )
}

/* -------------------------------------------------------- CohortHeatmap */

export function CohortHeatmap({ cohorts, caption }: {
  cohorts: { cohortMonth: string; cells: { monthsSince: number; rate: number; buyers: number }[] }[]
  caption: string
}) {
  const f = useFormat()
  const width = Math.max(...cohorts.map((c) => c.cells.length), 1)
  return (
    <>
      <div className="overflow-x-auto">
        <table className="border-separate border-spacing-0.5 text-xs">
          <thead>
            <tr>
              <th scope="col" className="px-2 py-1 text-left font-medium text-ink-faint">Cohort</th>
              {Array.from({ length: width }, (_, i) => (
                <th key={i} scope="col" className="px-2 py-1 font-medium text-ink-faint">+{i}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {cohorts.map((c) => (
              <tr key={c.cohortMonth}>
                <th scope="row" className="whitespace-nowrap px-2 py-1 text-left font-normal text-ink-soft">{c.cohortMonth}</th>
                {Array.from({ length: width }, (_, i) => {
                  const cell = c.cells.find((x) => x.monthsSince === i)
                  if (!cell) return <td key={i} />
                  return (
                    <td
                      key={i}
                      // Sequential: one hue, light to dark. Never a rainbow.
                      style={{ background: seriesColour(0), opacity: 0.15 + cell.rate * 0.85 }}
                      className="rounded-sm px-2 py-1 text-center text-ink"
                      // A 100% cell of one buyer is noise, so the count travels with the rate.
                      title={`${f.percent(cell.rate, 0)} of ${f.number(cell.buyers)} buyers`}
                    >
                      <span className="mix-blend-luminosity">{f.percent(cell.rate, 0)}</span>
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <ChartTable
        caption={caption}
        columns={['Cohort', 'Months since', 'Repeat rate', 'Buyers']}
        rows={cohorts.flatMap((c) => c.cells.map((x) => [c.cohortMonth, x.monthsSince, f.percent(x.rate, 0), f.number(x.buyers)]))}
      />
    </>
  )
}

export { SERIES, SERIES_OTHER }
