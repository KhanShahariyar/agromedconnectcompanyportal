import { useState } from 'react'
import { useData } from '@/data/DataProvider'
import { useQuery } from '@/data/useQuery'
import { useFormat, useT } from '@/i18n/LocaleProvider'
import { AsyncBoundary, Badge, PageHeader, Pagination, SearchInput, Table } from '@/ui'
import type { Column } from '@/ui'
import { ChartFrame, ChartScreen } from '@/charts/ChartFrame'
import { Bullet } from '@/charts/custom'
import type { StockRow } from '@/data/contracts'

export function Inventory() {
  const t = useT()
  const f = useFormat()
  const api = useData()
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const q = useQuery(['stock', search, page], () => api.listStock({ search, page, pageSize: 10 }))

  const columns: Column<StockRow>[] = [
    { key: 'name', header: t('col.name'), render: (s) => s.name },
    { key: 'sku', header: t('col.sku'), render: (s) => <span className="font-mono text-xs text-ink-faint">{s.sku}</span> },
    { key: 'onHand', header: t('col.stock'), align: 'right', render: (s) => (
      <span className={s.onHand < s.reorderPoint ? 'font-medium text-danger' : ''}>
        {f.number(s.onHand)} {s.unitCode}
      </span>
    ) },
    { key: 'reorder', header: t('inventory.below'), align: 'right', render: (s) =>
      s.onHand < s.reorderPoint ? <Badge tone="danger">{t('common.yes')}</Badge> : <span className="text-ink-faint">{t('common.no')}</span> },
  ]

  return (
    <div>
      <PageHeader title={t('inventory.title')} description={t('inventory.subtitle')} />

      {/* One chart, one encoding — the question is "is it below the line", which
          a bar cannot answer without the reader doing arithmetic (C5). */}
      <ChartScreen>
        <div className="mb-6">
          <ChartFrame title={t('inventory.chart')} encoding="bullet">
            <AsyncBoundary query={q}>
              {(p) => (
                <Bullet
                  caption={t('inventory.chart')}
                  rows={p.items.map((s) => ({ label: s.name, value: s.onHand, target: s.reorderPoint, unit: s.unitCode }))}
                />
              )}
            </AsyncBoundary>
          </ChartFrame>
        </div>
      </ChartScreen>

      <div className="mb-4">
        <SearchInput value={search} onChange={(v) => { setSearch(v); setPage(1) }} />
      </div>

      <AsyncBoundary query={q}>
        {(p) => (
          <>
            <Table columns={columns} rows={p.items} rowKey={(s) => s.listingId} />
            <Pagination page={p.page} pageSize={p.pageSize} total={p.total} onChange={setPage} />
          </>
        )}
      </AsyncBoundary>
    </div>
  )
}
