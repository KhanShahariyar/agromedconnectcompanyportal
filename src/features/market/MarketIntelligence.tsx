import { useState } from 'react'
import { useData } from '@/data/DataProvider'
import { useQuery } from '@/data/useQuery'
import { useFormat, useT } from '@/i18n/LocaleProvider'
import { AsyncBoundary, PageHeader, Tabs } from '@/ui'
import { ChartFrame, ChartScreen, DemandMap, Dumbbell, PriceScatter, StackedArea } from '@/charts'

type Window = '3m' | '6m' | '12m'

export function MarketIntelligence() {
  const t = useT()
  const f = useFormat()
  const api = useData()
  const [win, setWin] = useState<Window>('12m')
  const mi = useQuery(['market', win], (signal) => api.withSignal(signal).getMarketIntelligence(win))

  return (
    <div>
      <PageHeader
        title={t('market.title')}
        description={t('market.subtitle')}
        actions={
          <Tabs
            active={win}
            onChange={setWin}
            tabs={[
              { key: '3m', label: t('market.window.3m') },
              { key: '6m', label: t('market.window.6m') },
              { key: '12m', label: t('market.window.12m') },
            ]}
          />
        }
      />

      <AsyncBoundary query={mi}>
        {(d) => {
          const categories = [...new Set(d.demandTrend.map((p) => p.categoryName))]
          const byMonth = new Map<string, Record<string, string | number>>()
          for (const p of d.demandTrend) {
            const row = byMonth.get(p.month) ?? { month: p.month }
            row[p.categoryName] = p.shareOfMarket
            byMonth.set(p.month, row)
          }

          return (
            <>
              {
}
              <p data-testid="generated-at" className="mb-4 text-xs text-ink-faint">
                {t('market.updated', { when: f.dateTime(d.generatedAt) })}
              </p>

              <ChartScreen>
                <div className="grid gap-5 lg:grid-cols-2">
                  <div className="lg:col-span-2">
                    <ChartFrame title={t('market.demand')} subtitle={t('market.demand.sub')} encoding="stacked-area">
                      <StackedArea data={[...byMonth.values()]} xKey="month" seriesKeys={categories} asPercent />
                    </ChartFrame>
                  </div>

                  <ChartFrame title={t('market.price')} subtitle={t('market.price.sub')} encoding="dumbbell">
                    <Dumbbell
                      absentLabel={t('market.price.absent')}
                      rows={d.priceBenchmarks.map((b) => ({
                        label: b.categoryName,
                        min: b.marketMin.amountMinor,
                        median: b.marketMedian.amountMinor,
                        max: b.marketMax.amountMinor,
                        mine: b.myMedian?.amountMinor ?? null,
                        sampleSize: b.sampleSize,
                      }))}
                    />
                  </ChartFrame>

                  <ChartFrame title={t('market.region')} subtitle={t('market.region.sub')} encoding="choropleth">
                    <DemandMap cells={d.regionalDemand} />
                  </ChartFrame>

                  <div className="lg:col-span-2">
                    <ChartFrame title={t('market.position')} subtitle={t('market.position.sub')} encoding="scatter">
                      <PriceScatter
                        xFormat={(v) => f.number(v / 100)}
                        points={d.pricePositions.map((p) => ({
                          x: p.unitPriceMinor,
                          y: p.unitsSold,
                          label: p.listingName ?? p.categoryName,
                          isMine: p.isMine,
                        }))}
                      />
                    </ChartFrame>
                  </div>
                </div>
              </ChartScreen>
            </>
          )
        }}
      </AsyncBoundary>
    </div>
  )
}
