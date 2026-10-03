import { useState } from 'react'
import { useData } from '@/data/DataProvider'
import { useQuery } from '@/data/useQuery'
import { useFormat, useT } from '@/i18n/LocaleProvider'
import { AsyncBoundary, Button, PageHeader, Tabs } from '@/ui'
import { ChartFrame, ChartScreen, CohortHeatmap, Donut, GroupedBar } from '@/charts'

type Window = '3m' | '6m' | '12m'

export function Reports() {
  const t = useT()
  const f = useFormat()
  const api = useData()
  const [win, setWin] = useState<Window>('6m')
  const q = useQuery(['performance', win], (signal) => api.withSignal(signal).getPerformanceReport(win))

  return (
    <div>
      <PageHeader
        title={t('reports.title')}
        description={t('reports.subtitle')}
        actions={
          <>
            <Tabs active={win} onChange={setWin} tabs={[
              { key: '3m', label: t('market.window.3m') },
              { key: '6m', label: t('market.window.6m') },
              { key: '12m', label: t('market.window.12m') },
            ]} />
            <Button variant="secondary">{t('reports.export')}</Button>
          </>
        }
      />

      <AsyncBoundary query={q}>
        {(r) => {
          const categories = [...new Set(r.revenueByCategory.map((x) => x.categoryName))]
          const byMonth = new Map<string, Record<string, string | number>>()
          for (const row of r.revenueByCategory) {
            const m = byMonth.get(row.month) ?? { month: row.month }
            m[row.categoryName] = row.revenueMinor / 100
            byMonth.set(row.month, m)
          }
          const cohorts = [...new Set(r.repeatCohorts.map((c) => c.cohortMonth))].map((cohortMonth) => ({
            cohortMonth,
            cells: r.repeatCohorts.filter((c) => c.cohortMonth === cohortMonth)
              .map((c) => ({ monthsSince: c.monthsSince, rate: c.repeatRate, buyers: c.buyers })),
          }))

          return (
            <ChartScreen>
              <div className="grid gap-5 lg:grid-cols-3">
                <div className="lg:col-span-2">
                  <ChartFrame title={t('reports.revenue')} subtitle={t('reports.revenue.sub')} encoding="grouped-bar">
                    <GroupedBar data={[...byMonth.values()]} xKey="month" seriesKeys={categories} />
                  </ChartFrame>
                </div>

                <ChartFrame title={t('reports.delivery')} subtitle={t('reports.delivery.sub')} encoding="donut">
                  <Donut slices={r.deliveryMix.map((d) => ({
                    label: t(`order.path.${d.deliveryType}` as never),
                    value: d.orderCount,
                  }))} />
                </ChartFrame>

                <div className="lg:col-span-3">
                  <ChartFrame title={t('reports.cohort')} subtitle={t('reports.cohort.sub')} encoding="heatmap">
                    <CohortHeatmap cohorts={cohorts} caption={t('reports.cohort')} />
                  </ChartFrame>
                </div>
              </div>
              <p className="mt-3 text-xs text-ink-faint">
                {t('dash.kpi.revenue')}: {f.money(r.totals.revenue)} · {f.number(r.totals.orders)}
              </p>
            </ChartScreen>
          )
        }}
      </AsyncBoundary>
    </div>
  )
}
