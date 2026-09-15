import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useData } from '@/data/DataProvider'
import { useQuery } from '@/data/useQuery'
import { useFormat, useT } from '@/i18n/LocaleProvider'
import { AsyncBoundary, Badge, PageHeader, Pagination, SearchInput, Table } from '@/ui'
import type { Column } from '@/ui'
import type { OrderStatus, OrderSummary } from '@/data/contracts'

const TONE: Partial<Record<OrderStatus, 'success' | 'warning' | 'danger' | 'info' | 'neutral'>> = {
  confirmed: 'info', processing: 'warning', shipped: 'info',
  delivered: 'success', completed: 'success', cancelled: 'neutral',
  refunded: 'neutral', disputed: 'danger',
}

export function OrderList() {
  const t = useT()
  const f = useFormat()
  const api = useData()
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const q = useQuery(['orders', search, page], () => api.listOrders({ search, page, pageSize: 10 }))

  const columns: Column<OrderSummary>[] = [
    { key: 'number', header: t('col.order'), render: (o) => <span className="font-mono text-xs text-ink">{o.orderNumber}</span> },
    { key: 'buyer', header: t('col.buyer'), render: (o) => o.buyerName },
    { key: 'placed', header: t('col.placed'), render: (o) => f.date(o.placedAt, 'short') },
    { key: 'delivery', header: t('col.delivery'), render: (o) => t(`order.path.${o.deliveryType === 'partner' ? 'partner' : 'own'}` as never) },
    { key: 'status', header: t('col.status'), render: (o) => <Badge tone={TONE[o.status] ?? 'neutral'}>{t(`order.status.${o.status}` as never)}</Badge> },
    { key: 'total', header: t('col.total'), align: 'right', render: (o) => f.money(o.grandTotal) },
  ]

  return (
    <div>
      <PageHeader title={t('orders.title')} description={t('orders.subtitle')} />
      { }
      <div className="mb-4">
        <SearchInput value={search} onChange={(v) => { setSearch(v); setPage(1) }} />
      </div>
      <AsyncBoundary query={q}>
        {(p) => (
          <>
            <Table columns={columns} rows={p.items} rowKey={(o) => o.id} onRowClick={(o) => navigate(`/orders/${o.id}`)} />
            <Pagination page={p.page} pageSize={p.pageSize} total={p.total} onChange={setPage} />
          </>
        )}
      </AsyncBoundary>
    </div>
  )
}
