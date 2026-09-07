import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { MapContainer, Marker, TileLayer } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import { useData } from '@/data/DataProvider'
import { useQuery } from '@/data/useQuery'
import { useFormat, useT } from '@/i18n/LocaleProvider'
import { AsyncBoundary, Badge, Button, Card, Field, Input, Modal, SectionLabel } from '@/ui'
import { Gate } from '@/access/Gate'

export function DeliveryDetail() {
  const t = useT()
  const f = useFormat()
  const api = useData()
  const navigate = useNavigate()
  const { id = '' } = useParams()
  const [confirming, setConfirming] = useState(false)
  const [receivedBy, setReceivedBy] = useState('')
  const q = useQuery(['assignment', id], () => api.getAssignment(id))

  return (
    <AsyncBoundary query={q}>
      {(a) => {
        const hasPin = a.location.precision === 'exact' && a.location.lat !== null && a.location.lng !== null
        return (
          <div className="space-y-4 pb-28">
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs text-ink-faint">{a.orderNumber}</span>
              <Badge tone={a.status === 'delivered' ? 'success' : 'info'}>{t(`assign.${a.status}` as never)}</Badge>
            </div>

            {hasPin ? (
              <div data-testid="delivery-map" className="overflow-hidden rounded-card border border-line" style={{ height: 220 }}>
                <MapContainer center={[a.location.lat!, a.location.lng!]} zoom={14} style={{ height: '100%', width: '100%' }}>
                  <TileLayer
                    attribution='&copy; OpenStreetMap contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />
                  <Marker position={[a.location.lat!, a.location.lng!]} />
                </MapContainer>
              </div>
            ) : (
              /* R1 — the normal case until the farmer app captures coordinates.
                 A map centred on a district and called a delivery address is a
                 lie the courier would act on. */
              <div data-testid="no-map-notice" className="rounded-card border border-line bg-sunken p-4 text-sm text-ink-soft">
                {t('delivery.noMap')}
              </div>
            )}

            <Card className="p-4">
              <div data-testid="delivery-address" className="text-base text-ink">{a.deliveryAddress}</div>
              <div className="mt-0.5 text-sm text-ink-faint">{a.geographyName}</div>
              <div className="mt-3 flex gap-2">
                {a.buyerPhone && (
                  <a href={`tel:${a.buyerPhone}`} className="inline-flex min-h-touch flex-1 items-center justify-center rounded-md border border-line bg-panel px-4 text-sm text-ink">
                    {t('delivery.call')}
                  </a>
                )}
                {hasPin && (
                  <a
                    href={`https://www.openstreetmap.org/?mlat=${a.location.lat}&mlon=${a.location.lng}#map=16/${a.location.lat}/${a.location.lng}`}
                    target="_blank" rel="noreferrer"
                    className="inline-flex min-h-touch flex-1 items-center justify-center rounded-md border border-line bg-panel px-4 text-sm text-ink"
                  >
                    {t('delivery.directions')}
                  </a>
                )}
              </div>
            </Card>

            {a.hasRestrictedItems && (
              <div role="alert" className="rounded-card border border-warning/40 bg-warning/10 p-4 text-sm text-ink">
                {t('delivery.restricted')}
              </div>
            )}

            <Card className="p-4">
              <SectionLabel>{t('delivery.runSheet')}</SectionLabel>
              <ul className="divide-y divide-line">
                {a.lines.map((l) => (
                  <li key={l.id} data-testid="run-sheet-row" className="py-3">
                    <div className="flex items-baseline gap-2">
                      <span className="font-mono text-xs text-ink-faint">{l.skuSnapshot}</span>
                      {l.isRestricted && <Badge tone="warning">{t('product.restricted')}</Badge>}
                    </div>
                    <div className="text-base text-ink">{l.nameSnapshot}</div>
                    <div className="text-sm text-ink-soft">
                      {f.number(l.quantity)} {l.unitCode ?? ''}
                      {l.packSize ? ` · ${f.number(l.packSize)} ${l.unitCode ?? ''} pack` : ''}
                    </div>
                  </li>
                ))}
              </ul>
              {a.totalWeightGrams && (
                <div className="mt-3 text-sm text-ink-soft">
                  {t('delivery.weight')}: {f.number(a.totalWeightGrams / 1000)} kg
                </div>
              )}
            </Card>

            {a.status !== 'delivered' && (
              <div className="fixed inset-x-0 bottom-16 z-20 border-t border-line bg-panel p-3">
                <Gate action="order.handover">
                  <Button className="w-full" onClick={() => setConfirming(true)}>{t('delivery.confirm')}</Button>
                </Gate>
              </div>
            )}

            <Modal
              open={confirming}
              title={t('delivery.confirm')}
              onClose={() => setConfirming(false)}
              footer={
                <>
                  <Button variant="secondary" onClick={() => setConfirming(false)}>{t('action.cancel')}</Button>
                  <Button
                    disabled={!receivedBy.trim()}
                    onClick={async () => {
                      await api.confirmHandover(a.shipmentId, { receivedByName: receivedBy })
                      navigate('/deliveries')
                    }}
                  >
                    {t('delivery.confirm')}
                  </Button>
                </>
              }
            >
              <p className="mb-3">{t('delivery.confirm.warning')}</p>
              <Field label={t('delivery.receivedBy')} required htmlFor="receivedBy">
                <Input id="receivedBy" value={receivedBy} onChange={(e) => setReceivedBy(e.target.value)} />
              </Field>
            </Modal>
          </div>
        )
      }}
    </AsyncBoundary>
  )
}
