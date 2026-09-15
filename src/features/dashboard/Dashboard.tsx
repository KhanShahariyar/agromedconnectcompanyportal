import { Link } from 'react-router-dom'
import { useMemo } from 'react'
import { useData } from '@/data/DataProvider'
import { useQuery } from '@/data/useQuery'
import { useFormat, useT } from '@/i18n/LocaleProvider'
import { AsyncBoundary, Card, PageHeader, SectionLabel, StatTile } from '@/ui'
import { ChartFrame, ChartScreen, Bullet, Funnel, LineTrend } from '@/charts'
import type { OrderStatus } from '@/data/contracts'

const HONORIFICS = new Set(['md.', 'md', 'mst.', 'mst', 'mr.', 'mr', 'mrs.', 'mrs', 'ms.', 'ms', 'dr.', 'dr'])

export function givenName(fullName: string): string {
  const parts = fullName.trim().split(/\s+/).filter((p) => !HONORIFICS.has(p.toLowerCase()))
  return parts[0] ?? fullName
}

const PIPELINE: OrderStatus[] = ['confirmed', 'processing', 'shipped', 'delivered']

export function Dashboard({ userName }: { userName: string }) {
  const t = useT()
  const f = useFormat()
  const api = useData()

  const report = useQuery(['report', '12m'], () => api.getPerformanceReport('12m'))
  const orders = useQuery(['orders', 'dashboard'], () => api.listOrders({ page: 1, pageSize: 100 }))
  const listings = useQuery(['listings', 'active'], () => api.listListings({ page: 1, pageSize: 1, status: 'active' }))

  const pipeline = useMemo(() => {
    const items = orders.data?.items ?? []
    return PIPELINE.map((s) => ({
      key: s,
      label: t(`order.status.${s}` as never),
      count: items.filter((o) => o.status === s).length,
    }))
  }, [orders.data, t])

  const awaiting = (orders.data?.items ?? []).filter(
    (o) => o.status === 'confirmed' || o.status === 'processing',
  )

  return (
    <div>
      <PageHeader
        title={t('dash.greeting', { name: givenName(userName) })}
        description={t('dash.subtitle')}
      />

      <SectionLabel>{t('dash.overview')}</SectionLabel>
      <div className="mb-8 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile
          label={t('dash.kpi.revenue')}
          value={report.data ? f.money(report.data.totals.revenue) : '—'}
        />
        <StatTile label={t('dash.kpi.awaiting')} value={f.number(awaiting.length)} />
        <StatTile label={t('dash.kpi.listings')} value={listings.data ? f.number(listings.data.total) : '—'} />
        <StatTile
          label={t('dash.kpi.fulfilment')}
          value={report.data ? t('dash.days', { n: f.number(report.data.totals.averageFulfilmentDays) }) : '—'}
        />
      </div>

      { }
      <ChartScreen>
        <div className="grid gap-5 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <ChartFrame title={t('dash.chart.revenue')} subtitle={t('dash.chart.revenue.sub')} encoding="line">
              <AsyncBoundary query={report}>
                {(r) => {
                  const byMonth = new Map<string, number>()
                  for (const row of r.revenueByCategory) {
                    byMonth.set(row.month, (byMonth.get(row.month) ?? 0) + row.revenueMinor / 100)
                  }
                  const data = [...byMonth].map(([month, revenue]) => ({ month, revenue }))
                  return <LineTrend data={data} xKey="month" yKey="revenue" name={t('dash.kpi.revenue')} />
                }}
              </AsyncBoundary>
            </ChartFrame>
          </div>

          <ChartFrame title={t('dash.chart.pipeline')} subtitle={t('dash.chart.pipeline.sub')} encoding="funnel">
            <AsyncBoundary query={orders}>
              {() => <Funnel stages={pipeline} />}
            </AsyncBoundary>
          </ChartFrame>

          <div className="lg:col-span-3">
            <ChartFrame title={t('dash.chart.sla')} subtitle={t('dash.chart.sla.sub')} encoding="bullet">
              <AsyncBoundary query={report}>
                {(r) => (
                  <Bullet
                    lowerIsBetter
                    caption={t('dash.chart.sla')}
                    rows={[{
                      label: t('dash.kpi.fulfilment'),
                      value: r.totals.averageFulfilmentDays,
                      target: r.totals.slaTargetDays,
                    }]}
                  />
                )}
              </AsyncBoundary>
            </ChartFrame>
          </div>
        </div>
      </ChartScreen>

      <SectionLabel>{t('dash.attention')}</SectionLabel>
      <Card className="divide-y divide-line">
        {awaiting.length === 0 && <div className="p-5 text-sm text-ink-soft">{t('dash.attention.empty')}</div>}
        {awaiting.slice(0, 6).map((o) => (
          <Link key={o.id} to={`/orders/${o.id}`} className="flex items-center gap-3 p-4 hover:bg-base">
            <span className="font-mono text-xs text-ink-faint">{o.orderNumber}</span>
            <span className="truncate text-sm text-ink">{o.buyerName}</span>
            <span className="ml-auto text-sm text-ink-soft">{f.money(o.grandTotal)}</span>
          </Link>
        ))}
      </Card>
    </div>
  )
}
