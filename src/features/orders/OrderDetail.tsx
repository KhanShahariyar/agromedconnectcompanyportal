import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { useData } from '@/data/DataProvider'
import { useQuery } from '@/data/useQuery'
import { useFormat, useT } from '@/i18n/LocaleProvider'
import { AsyncBoundary, Badge, Button, Card, PageHeader, SectionLabel, Stepper, Table } from '@/ui'
import type { Column } from '@/ui'
import { Gate } from '@/access/Gate'
import { currentIndex, isAwaitingPlatform, mayChoosePath, stepsFor } from './machine'
import type { DeliveryMode, OrderLine, OrderDetail as Detail } from '@/data/contracts'

export function OrderDetail({ deliveryMode }: { deliveryMode: DeliveryMode }) {
  const t = useT()
  const f = useFormat()
  const api = useData()
  const { id = '' } = useParams()
  const [nonce, setNonce] = useState(0)
  const q = useQuery(['order', id, nonce], () => api.getOrder(id))

  const lineColumns: Column<OrderLine>[] = [
    { key: 'sku', header: t('col.sku'), render: (l) => <span className="font-mono text-xs text-ink-faint">{l.skuSnapshot}</span> },
    { key: 'name', header: t('col.name'), render: (l) => (
      <span>
        {l.nameSnapshot}
        {l.isRestricted && <Badge tone="warning">{t('product.restricted')}</Badge>}
      </span>
    ) },
    { key: 'qty', header: t('col.qty'), align: 'right', render: (l) => `${f.number(l.quantity)} ${l.unitCode ?? ''}` },
    { key: 'total', header: t('col.total'), align: 'right', render: (l) => f.money(l.lineTotal) },
  ]

  return (
    <AsyncBoundary query={q}>
      {(o: Detail) => {
        const steps = stepsFor(o.deliveryType)
        const idx = currentIndex(o)
        const next = o.availableTransitions[0]
        const awaiting = isAwaitingPlatform(o)

        return (
          <div>
            <PageHeader
              eyebrow={o.orderNumber}
              title={o.buyerName}
              description={o.deliveryAddress ?? undefined}
              actions={
                next ? (
                  <Gate action={next === 'assigned' ? 'order.assign' : 'order.fulfil'}>
                    <Button onClick={async () => { await api.advanceOrder(o.id, next); setNonce((n) => n + 1) }}>
                      {t(`order.advance.${next}` as never)}
                    </Button>
                  </Gate>
                ) : undefined
              }
            />

            <div className="grid gap-5 lg:grid-cols-3">
              <div className="space-y-5 lg:col-span-2">
                <Card className="p-5">
                  <SectionLabel>{t('order.lines')}</SectionLabel>
                  <Table columns={lineColumns} rows={o.lines} rowKey={(l) => l.id} />
                  <dl className="mt-4 space-y-1 text-sm">
                    <div className="flex justify-between"><dt className="text-ink-soft">{t('waterfall.list')}</dt><dd>{f.money(o.subtotal)}</dd></div>
                    <div className="flex justify-between"><dt className="text-ink-soft">{t('waterfall.commission')}</dt><dd>−{f.money(o.commissionTotal)}</dd></div>
                    <div className="flex justify-between font-medium"><dt>{t('waterfall.net')}</dt><dd>{f.money(o.sellerNet)}</dd></div>
                  </dl>
                </Card>

                <Card className="p-5">
                  <SectionLabel>{t('order.history')}</SectionLabel>
                  <ol className="space-y-2">
                    {o.history.map((h) => (
                      <li key={h.id} data-testid="history-row" className="flex flex-wrap gap-2 text-sm">
                        <span className="text-ink">{h.toStatus}</span>
                        <span className="text-ink-faint">{h.changedBy}</span>
                        <span className="ml-auto text-ink-soft">{f.dateTime(h.occurredAt)}</span>
                      </li>
                    ))}
                  </ol>
                </Card>
              </div>

              <Card className="p-5">
                <SectionLabel>{t('order.deliveryPath')}</SectionLabel>
                <p className="mb-4 text-sm text-ink">
                  {t(`order.path.${o.deliveryType === 'partner' ? 'partner' : 'own'}` as never)}
                </p>

                {/* Only when the platform assigned "both" is this a choice (C14). */}
                {mayChoosePath(deliveryMode, o) && (
                  <fieldset className="mb-4" role="group" aria-label={t('order.deliveryPath')}>
                    <label className="mb-1 flex items-center gap-2 text-sm">
                      <input type="radio" name="path" defaultChecked={o.deliveryType !== 'partner'} /> {t('order.path.own')}
                    </label>
                    <label className="flex items-center gap-2 text-sm">
                      <input type="radio" name="path" defaultChecked={o.deliveryType === 'partner'} /> {t('order.path.partner')}
                    </label>
                  </fieldset>
                )}

                <Stepper
                  currentIndex={idx}
                  pendingNote={awaiting ? t('order.awaitingPlatform') : undefined}
                  steps={steps.map((s) => {
                    const entry = o.history.find((h) => h.toStatus === s)
                    return { key: s, label: t(`step.${s}` as never), at: entry?.occurredAt, actor: entry?.changedBy }
                  })}
                />
              </Card>
            </div>
          </div>
        )
      }}
    </AsyncBoundary>
  )
}
