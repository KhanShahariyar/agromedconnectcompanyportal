import { useFormat } from '@/i18n/LocaleProvider'
import { SERIES, SERIES_OTHER, STATUS, TOKENS, seriesColour } from '@/design/tokens'
import { ChartTable } from './ChartFrame'

/* --------------------------------------------------------------- Bullet */

/**
 * Actual against a threshold. Chosen over a bar because the question is not
 * "how much stock" but "is it below the reorder point" — a comparison a bar
 * cannot make without the reader doing arithmetic.
 */
export function Bullet({ rows, caption, lowerIsBetter = false }: {
  rows: { label: string; value: number; target: number; unit?: string | null }[]
  caption: string
  /**
   * Whether falling below the threshold is the good outcome. Stock below its
   * reorder point is a problem; fulfilment days below target is the goal. The
   * same mark means opposite things, so the caller must say which.
   */
  lowerIsBetter?: boolean
}) {
  const f = useFormat()
  const max = Math.max(...rows.map((r) => Math.max(r.value, r.target)), 1)
  return (
    <>
      <ul className="space-y-3">
        {rows.map((r, index) => {
          const short = lowerIsBetter ? r.value > r.target : r.value < r.target
          return (
            // Keyed by position as well as label: two rows can legitimately
            // share a name, and React silently drops the second if they collide.
            <li key={`${r.label}-${index}`}>
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
        columns={['Item', 'Value', 'Target', 'Off target']}
        rows={rows.map((r) => [
          r.label, f.number(r.value), f.number(r.target),
          (lowerIsBetter ? r.value > r.target : r.value < r.target) ? 'yes' : 'no',
        ])}
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

  /*
   * Each row is scaled to its own market range, not to a scale shared across
   * categories. Shared, a category spanning 400-1000 collapsed into a sliver
   * beside one spanning 2000-8000, and "where do I sit in this category" — the
   * only question this chart answers — became unreadable. Cross-category price
   * comparison is not the job here; the numbers under each row carry it.
   */
  const posIn = (r: { min: number; max: number }, v: number) =>
    ((v - r.min) / Math.max(1, r.max - r.min)) * 100

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
              <span aria-hidden className="absolute inset-x-0 top-1.5 h-1 rounded-full bg-sunken" />
              <span aria-hidden className="absolute top-0.5 h-3 w-0.5" style={{ left: `${posIn(r, r.median)}%`, background: TOKENS.inkFaint }} />
              {r.mine !== null && (
                <span
                  aria-hidden
                  className="absolute top-0 h-4 w-4 -translate-x-1/2 rounded-full border-2"
                  style={{ left: `${posIn(r, r.mine)}%`, background: seriesColour(0), borderColor: TOKENS.panel }}
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
export function Waterfall({ steps, caption, format }: {
  steps: { label: string; delta: number; isTotal?: boolean }[]
  caption: string
  /** Minor units in, display string out. A bare number here reads as a count. */
  format?: (minor: number) => string
}) {
  const f = useFormat()
  const fmt = format ?? ((minor: number) => f.number(minor / 100))
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
                <span className="text-ink-soft">{fmt(b.delta)}</span>
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
      <ChartTable caption={caption} columns={['Step', 'Amount']} rows={steps.map((s) => [s.label, fmt(s.delta)])} />
    </>
  )
}

/* -------------------------------------------------------- GanttTimeline */

export interface DiscountBar {
  id: string
  label: string
  start: string
  end: string | null
  conflict?: boolean
}

export interface DiscountRow {
  id: string
  label: string
  bars: DiscountBar[]
}

/**
 * The highest-value chart in the portal.
 *
 * pricing.offer lets two discounts cover the same product over the same dates.
 * A list hides that; a timeline makes an accidental overlap something you see.
 *
 * An earlier version stacked the bars inside a single 28px row, which read as a
 * broken progress bar rather than a schedule. Each discount now gets its own
 * labelled line under its product, so an overlap is visible as two bars sitting
 * above one another, with the shared span shaded and named.
 */
export function GanttTimeline({ rows, from, to, onSelect }: {
  rows: DiscountRow[]
  from: string
  to: string
  onSelect?: (barId: string) => void
}) {
  const f = useFormat()
  const t0 = new Date(from).getTime()
  const t1 = new Date(to).getTime()
  const span = Math.max(1, t1 - t0)
  const pct = (ms: number) => ((ms - t0) / span) * 100
  const clamp = (v: number) => Math.min(100, Math.max(0, v))

  const now = Date.now()
  const nowPct = now >= t0 && now <= t1 ? pct(now) : null

  // Month boundaries give the eye something to measure against.
  const ticks: { at: number; label: string }[] = []
  const cursor = new Date(t0)
  cursor.setDate(1)
  cursor.setHours(0, 0, 0, 0)
  while (cursor.getTime() <= t1) {
    if (cursor.getTime() >= t0) ticks.push({ at: pct(cursor.getTime()), label: f.date(cursor.toISOString(), 'short') })
    cursor.setMonth(cursor.getMonth() + 1)
  }

  /** Where two or more bars in a row cover the same days. */
  function overlapsFor(bars: DiscountBar[]): { left: number; width: number }[] {
    const spans = bars.map((b) => ({
      s: new Date(b.start).getTime(),
      e: b.end ? new Date(b.end).getTime() : t1,
    }))
    const out: { left: number; width: number }[] = []
    for (let i = 0; i < spans.length; i++) {
      for (let j = i + 1; j < spans.length; j++) {
        const s = Math.max(spans[i]!.s, spans[j]!.s)
        const e = Math.min(spans[i]!.e, spans[j]!.e)
        if (e > s) out.push({ left: clamp(pct(s)), width: Math.max(1, clamp(pct(e)) - clamp(pct(s))) })
      }
    }
    return out
  }

  return (
    <>
      <div className="relative mb-2 h-4">
        {ticks.map((tick) => (
          <span key={tick.label} className="absolute -translate-x-1/2 text-[10px] text-ink-faint"
                style={{ left: `${tick.at}%` }}>
            {tick.label}
          </span>
        ))}
      </div>

      <ul className="space-y-4">
        {rows.map((r) => {
          const overlaps = overlapsFor(r.bars)
          return (
            <li key={r.id}>
              <div className="mb-1 flex items-center gap-2">
                <span className="text-xs font-medium text-ink">{r.label}</span>
                {overlaps.length > 0 && (
                  <span className="rounded-full border border-warning/50 px-1.5 py-0.5 text-[10px] text-warning">
                    {r.bars.length} overlap
                  </span>
                )}
              </div>

              <div className="relative">
                {/* Month gridlines behind everything. */}
                {ticks.map((tick) => (
                  <span key={`g-${tick.label}`} aria-hidden className="absolute top-0 h-full w-px bg-line"
                        style={{ left: `${tick.at}%` }} />
                ))}
                {/* The shared span, named by the badge above. */}
                {overlaps.map((o, i) => (
                  <span key={`o-${i}`} aria-hidden className="absolute top-0 h-full rounded-sm bg-warning/15"
                        style={{ left: `${o.left}%`, width: `${o.width}%` }} />
                ))}
                {nowPct !== null && (
                  <span aria-hidden className="absolute top-0 h-full w-0.5 bg-ink/40" style={{ left: `${nowPct}%` }} />
                )}

                <div className="relative space-y-1.5 py-1">
                  {r.bars.map((b, i) => {
                    const left = clamp(pct(new Date(b.start).getTime()))
                    const right = clamp(pct(b.end ? new Date(b.end).getTime() : t1))
                    const width = Math.max(3, right - left)
                    return (
                      <div key={b.id} className="relative h-6">
                        <button
                          type="button"
                          onClick={onSelect ? () => onSelect(b.id) : undefined}
                          title={`${b.label} · ${f.date(b.start, 'short')} – ${b.end ? f.date(b.end, 'short') : '…'}`}
                          className="absolute inset-y-0 flex items-center overflow-hidden rounded-md px-2 text-[11px] font-medium text-panel"
                          style={{
                            left: `${left}%`,
                            width: `${width}%`,
                            background: b.conflict ? STATUS.warning : seriesColour(i),
                          }}
                        >
                          <span className="truncate">{b.label}</span>
                        </button>
                      </div>
                    )
                  })}
                </div>
              </div>
            </li>
          )
        })}
      </ul>

      <div className="mt-3 flex flex-wrap items-center gap-4 text-[11px] text-ink-faint">
        <span className="flex items-center gap-1.5">
          <span aria-hidden className="h-2 w-4 rounded-sm" style={{ background: seriesColour(0) }} /> Scheduled
        </span>
        <span className="flex items-center gap-1.5">
          <span aria-hidden className="h-2 w-4 rounded-sm" style={{ background: STATUS.warning }} /> Competing
        </span>
        <span className="flex items-center gap-1.5">
          <span aria-hidden className="h-2 w-4 rounded-sm bg-warning/15" /> Overlapping days
        </span>
        <span className="flex items-center gap-1.5">
          <span aria-hidden className="h-3 w-0.5 bg-ink/40" /> Today
        </span>
      </div>

      <ChartTable
        caption="Discount windows"
        columns={['Product', 'Discount', 'Starts', 'Ends', 'Competing']}
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
