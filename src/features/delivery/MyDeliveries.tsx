import { Link } from 'react-router-dom'
import { useData } from '@/data/DataProvider'
import { useQuery } from '@/data/useQuery'
import { useFormat, useT } from '@/i18n/LocaleProvider'
import { AsyncBoundary, Badge, Card, EmptyState } from '@/ui'

export function MyDeliveries({ status = 'active' }: { status?: 'active' | 'completed' }) {
  const t = useT()
  const f = useFormat()
  const api = useData()
  const q = useQuery(['assignments', status], () => api.listMyAssignments(status))

  return (
    <div>
      <h1 className="mb-4 font-serif text-xl text-ink">
        {t(status === 'active' ? 'delivery.title' : 'delivery.history')}
      </h1>
      <AsyncBoundary query={q} empty={<EmptyState body={t('delivery.none')} />}>
        {(list) => (
          <ul className="space-y-3">
            {list.map((a) => (
              <li key={a.shipmentId}>
                {/* 44px minimum touch target — read on a phone, at a gate (C12). */}
                <Link to={`/deliveries/${a.shipmentId}`} className="block min-h-touch">
                  <Card className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="font-mono text-xs text-ink-faint">{a.orderNumber}</div>
                        <div className="truncate text-base font-medium text-ink">{a.buyerName}</div>
                        <div className="mt-0.5 truncate text-sm text-ink-soft">{a.deliveryAddress}</div>
                      </div>
                      {a.hasRestrictedItems && <Badge tone="warning">{t('product.restricted')}</Badge>}
                    </div>
                    <div className="mt-2 text-xs text-ink-faint">
                      {f.number(a.lines.length)} · {a.totalWeightGrams ? `${f.number(a.totalWeightGrams / 1000)} kg` : ''}
                    </div>
                  </Card>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </AsyncBoundary>
    </div>
  )
}
