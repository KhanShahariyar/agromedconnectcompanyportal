import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useData } from '@/data/DataProvider'
import { useQuery } from '@/data/useQuery'
import { useFormat, useT } from '@/i18n/LocaleProvider'
import { AsyncBoundary, Badge, Button, Card, Modal, PageHeader } from '@/ui'
import { Gate } from '@/access/Gate'
import { PublishGate } from './PublishGate'

export function ListingDetail({ kind }: { kind: 'product' | 'service' }) {
  const t = useT()
  const f = useFormat()
  const api = useData()
  const navigate = useNavigate()
  const { id = '' } = useParams()
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [nonce, setNonce] = useState(0)

  const listing = useQuery(['listing', id, nonce], (signal) => api.withSignal(signal).getListing(id))
  const readiness = useQuery(['readiness', id, nonce], (signal) => api.withSignal(signal).getPublishReadiness(id))

  return (
    <AsyncBoundary query={listing}>
      {(l) => (
        <div>
          <PageHeader
            eyebrow={l.categoryName}
            title={l.name}
            description={l.sku}
            actions={
              <>
                <Gate action="product.publish">
                  <Button
                    disabled={!readiness.data?.canPublish || l.status === 'active'}
                    onClick={async () => { await api.publishListing(l.id); setNonce((n) => n + 1) }}
                  >
                    {t('product.publish')}
                  </Button>
                </Gate>
                <Gate action="product.create">
                  <Button variant="secondary" onClick={() => navigate(`${kind === 'product' ? '/products' : '/services'}/${l.id}/edit`)}>
                    {t(kind === 'product' ? 'editor.editProduct' : 'editor.editService')}
                  </Button>
                </Gate>
                <Gate action="product.delete">
                  <Button variant="secondary" onClick={() => setConfirmDelete(true)}>{t('product.delete')}</Button>
                </Gate>
              </>
            }
          />

          <div className="grid gap-5 lg:grid-cols-3">
            <div className="space-y-5 lg:col-span-2">
              {readiness.data && <PublishGate readiness={readiness.data} />}

              <Card className="p-5">
                <dl className="grid grid-cols-2 gap-4 text-sm">
                  <div><dt className="text-ink-faint">{t('col.status')}</dt>
                    <dd className="mt-0.5"><Badge tone={l.status === 'active' ? 'success' : 'neutral'}>{t(`status.${l.status}` as never)}</Badge></dd></div>
                  <div><dt className="text-ink-faint">{t('col.price')}</dt>
                    <dd className="mt-0.5 text-ink">{f.money(l.price)}</dd></div>
                  {l.packSize && (
                    <div><dt className="text-ink-faint">Pack</dt>
                      <dd className="mt-0.5 text-ink">{f.number(l.packSize)} {l.unitCode}</dd></div>
                  )}
                  {l.grossWeightGrams && (
                    <div><dt className="text-ink-faint">{t('delivery.weight')}</dt>
                      <dd className="mt-0.5 text-ink">{f.number(l.grossWeightGrams / 1000)} kg</dd></div>
                  )}
                </dl>
              </Card>
            </div>

            <Card className="p-5">
              <div className="mb-2 text-sm font-medium text-ink">Images</div>
              {
}
              <p className="mb-3 text-xs text-ink-faint">{t('product.image.rule')}</p>
              {l.media.map((m) => (
                <div key={m.id} className="mb-3">
                  <div className="flex h-28 items-center justify-center rounded-md border border-line bg-sunken text-xs text-ink-faint">
                    {m.url.split('/').pop()}
                  </div>
                  {m.reviewStatus === 'flagged' && (
                    <p data-testid="image-flag" className="mt-1 text-xs text-warning">
                      {t('product.image.flagged')}
                    </p>
                  )}
                </div>
              ))}
              {l.media.length === 0 && (
                <p className="text-sm text-ink-soft">{t('product.blocked.no_primary_image')}</p>
              )}
            </Card>
          </div>

          <Modal
            open={confirmDelete}
            title={t('product.delete')}
            onClose={() => setConfirmDelete(false)}
            footer={
              <>
                <Button variant="secondary" onClick={() => setConfirmDelete(false)}>{t('action.cancel')}</Button>
                <Button
                  variant="danger"
                  onClick={async () => {
                    await api.deleteListing(l.id)
                    navigate(kind === 'product' ? '/products' : '/services')
                  }}
                >
                  {t('product.delete')}
                </Button>
              </>
            }
          >
            { }
            {t('product.delete.confirm')}
          </Modal>
        </div>
      )}
    </AsyncBoundary>
  )
}
