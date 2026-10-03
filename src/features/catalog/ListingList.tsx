import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useData } from '@/data/DataProvider'
import { useQuery } from '@/data/useQuery'
import { useFormat, useT } from '@/i18n/LocaleProvider'
import { AsyncBoundary, Badge, Button, PageHeader, Pagination, SearchInput, Table } from '@/ui'
import type { Column } from '@/ui'
import { Gate } from '@/access/Gate'
import type { Listing, ListingStatus } from '@/data/contracts'
import { CategoryDrilldown } from './CategoryDrilldown'

const STATUS_TONE: Record<ListingStatus, 'success' | 'warning' | 'neutral'> = {
  active: 'success',
  pending_review: 'warning',
  draft: 'neutral',
  paused: 'neutral',
  withdrawn: 'neutral',
}

export function ListingList({ kind }: { kind: 'product' | 'service' }) {
  const t = useT()
  const f = useFormat()
  const api = useData()
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  // Any tier: the API matches the subtree beneath whatever is chosen, so this
  // one value covers "all of Animal" and "just Cattle Medicine" alike.
  const [categoryId, setCategoryId] = useState<Uuid | null>(null)

  const q = useQuery(['listings', kind, search, page, categoryId ?? ''], (signal) =>
    api.withSignal(signal).listListings({ kind, search, page, pageSize: 10, categoryId: categoryId ?? undefined }))

  const columns: Column<Listing>[] = [
    { key: 'name', header: t('col.name'), render: (l) => (
      <div>
        <div className="text-ink">{l.name}</div>
        {l.isRestricted && <span className="text-xs text-warning">{t('product.restricted')}</span>}
      </div>
    ) },
    { key: 'sku', header: t('col.sku'), render: (l) => <span className="font-mono text-xs text-ink-faint">{l.sku}</span> },
    { key: 'category', header: t('col.category'), render: (l) => l.categoryName },
    { key: 'price', header: t('col.price'), align: 'right', render: (l) => f.money(l.price) },
    { key: 'status', header: t('col.status'), render: (l) => (
      <Badge tone={STATUS_TONE[l.status]}>{t(`status.${l.status}` as never)}</Badge>
    ) },
  ]

  return (
    <div>
      <PageHeader
        title={t(kind === 'product' ? 'products.title' : 'services.title')}
        description={t(kind === 'product' ? 'products.subtitle' : 'services.subtitle')}
        actions={
          <Gate action={kind === 'product' ? 'product.create' : 'service.create'}>
            <Button onClick={() => navigate(`/${kind === 'product' ? 'products' : 'services'}/new`)}>
              {t(kind === 'product' ? 'products.new' : 'services.new')}
            </Button>
          </Gate>
        }
      />

      <div className="mb-4 space-y-3">
        <SearchInput value={search} onChange={(v) => { setSearch(v); setPage(1) }} />
        <CategoryDrilldown
          kind={kind}
          value={categoryId}
          onChange={(id) => { setCategoryId(id); setPage(1) }}
        />
      </div>

      <AsyncBoundary query={q}>
        {(pageData) => (
          <>
            <Table
              columns={columns}
              rows={pageData.items}
              rowKey={(l) => l.id}
              onRowClick={(l) => navigate(`/${kind === 'product' ? 'products' : 'services'}/${l.id}`)}
            />
            <Pagination page={pageData.page} pageSize={pageData.pageSize} total={pageData.total} onChange={setPage} />
          </>
        )}
      </AsyncBoundary>
    </div>
  )
}
