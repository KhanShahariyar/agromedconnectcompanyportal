import { useMemo, useState } from 'react'
import { useData } from '@/data/DataProvider'
import { useQuery } from '@/data/useQuery'
import { useFormat, useT } from '@/i18n/LocaleProvider'
import { AsyncBoundary, Badge, Button, Card, PageHeader, SectionLabel, Table } from '@/ui'
import type { Column } from '@/ui'
import { ChartFrame, ChartScreen } from '@/charts/ChartFrame'
import { GanttTimeline, Waterfall } from '@/charts/custom'
import { Gate } from '@/access/Gate'
import { detectConflicts } from './conflicts'
import type { Discount, Listing } from '@/data/contracts'

const TONE: Record<string, 'success' | 'warning' | 'neutral'> = {
  active: 'success', draft: 'neutral', pending_approval: 'warning',
  paused: 'neutral', expired: 'neutral', cancelled: 'neutral',
}

export function Discounts() {
  const t = useT()
  const f = useFormat()
  const api = useData()
  const [selected, setSelected] = useState<string | null>(null)

  const discounts = useQuery(['discounts'], () => api.listDiscounts({ page: 1, pageSize: 50 }))
  const listings = useQuery(['listings', 'all'], () => api.listListings({ page: 1, pageSize: 100 }))
  const margin = useQuery(['margin', selected], () =>
    api.getMarginBreakdown(listings.data?.items[0]?.id ?? 'lst-01', selected))

  const { rows, conflicts } = useMemo(() => {
    const ds = discounts.data?.items ?? []
    const ls: Listing[] = listings.data?.items ?? []
    const categories: Record<string, string[]> = {}
    for (const l of ls) (categories[l.categoryId] ??= []).push(l.id)

    const all = ds.flatMap((d) => detectConflicts(d, ds, categories))
    const conflicted = new Set(all.flatMap((c) => c.discountIds))
    const nameOf = (id: string) => ls.find((l) => l.id === id)?.name ?? id

    const listingIds = (d: Discount) =>
      d.scope.kind === 'listing' ? d.scope.listingIds : (categories[d.scope.categoryId] ?? [])

    const byListing = new Map<string, { id: string; label: string; start: string; end: string | null; conflict?: boolean }[]>()
    for (const d of ds) {
      if (d.status === 'expired' || d.status === 'cancelled') continue
      for (const lid of listingIds(d)) {
        const bars = byListing.get(lid) ?? []
        bars.push({ id: d.id, label: d.name, start: d.startsAt, end: d.endsAt, conflict: conflicted.has(d.id) })
        byListing.set(lid, bars)
      }
    }

    return {
      conflicts: all,
      rows: [...byListing].slice(0, 10).map(([lid, bars]) => ({ id: lid, label: nameOf(lid), bars })),
    }
  }, [discounts.data, listings.data])

  const columns: Column<Discount>[] = [
    { key: 'name', header: t('col.name'), render: (d) => (
      <div><div className="text-ink">{d.name}</div><div className="font-mono text-xs text-ink-faint">{d.code}</div></div>
    ) },
    { key: 'value', header: t('discount.basis'), render: (d) =>
      d.basis === 'percentage' ? f.percent((d.discountPercent ?? 0) / 100, 0) : d.discountAmount ? f.money(d.discountAmount) : '—' },
    { key: 'window', header: t('discount.starts'), render: (d) =>
      `${f.date(d.startsAt, 'short')} – ${d.endsAt ? f.date(d.endsAt, 'short') : '…'}` },
    { key: 'status', header: t('col.status'), render: (d) => <Badge tone={TONE[d.status] ?? 'neutral'}>{d.status}</Badge> },
  ]

  const now = new Date()
  const from = new Date(now.getTime() - 30 * 864e5).toISOString()
  const to = new Date(now.getTime() + 60 * 864e5).toISOString()

  return (
    <div>
      <PageHeader
        title={t('discounts.title')}
        description={t('discounts.subtitle')}
        actions={<Gate action="discount.manage"><Button>{t('discounts.new')}</Button></Gate>}
      />

      {/* Two charts, two encodings: when discounts collide, and what they cost (C5). */}
      <ChartScreen>
        <div className="mb-6 grid gap-5 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <ChartFrame title={t('discounts.timeline')} subtitle={t('discounts.timeline.sub')} encoding="gantt">
              <AsyncBoundary query={discounts}>
                {() => <GanttTimeline rows={rows} from={from} to={to} onSelect={setSelected} />}
              </AsyncBoundary>
            </ChartFrame>
          </div>

          <ChartFrame title={t('discounts.margin')} subtitle={t('discounts.margin.sub')} encoding="waterfall">
            <AsyncBoundary query={margin}>
              {(m) => (
                <Waterfall
                  caption={t('discounts.margin')}
                  steps={[
                    { label: t('waterfall.list'), delta: m.listPrice.amountMinor, isTotal: true },
                    { label: t('waterfall.discount'), delta: -m.discount.amountMinor },
                    { label: t('waterfall.commission'), delta: -m.commission.amountMinor },
                    { label: t('waterfall.net'), delta: m.net.amountMinor, isTotal: true },
                  ]}
                />
              )}
            </AsyncBoundary>
          </ChartFrame>
        </div>
      </ChartScreen>

      {conflicts.length > 0 && (
        <Card className="mb-6 border-warning/40 bg-warning/10 p-5">
          <SectionLabel>{t('discounts.timeline.sub')}</SectionLabel>
          <ul className="space-y-1.5 text-sm text-ink-soft">
            {conflicts.slice(0, 5).map((c, i) => (
              <li key={i} role={c.resolution === 'ambiguous' ? 'alert' : undefined}>
                <span className="text-ink">{c.listingName}</span>{' — '}
                {t(`discount.conflict.${c.resolution === 'ambiguous' ? 'ambiguous' : c.resolution === 'stacked' ? 'stacked' : 'priority'}` as never)}
              </li>
            ))}
          </ul>
        </Card>
      )}

      <AsyncBoundary query={discounts}>
        {(p) => <Table columns={columns} rows={p.items} rowKey={(d) => d.id} onRowClick={(d) => setSelected(d.id)} />}
      </AsyncBoundary>
    </div>
  )
}
