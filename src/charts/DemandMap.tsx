import { MapContainer, TileLayer, CircleMarker, Tooltip as LeafletTooltip } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import { useFormat } from '@/i18n/LocaleProvider'
import { SERIES_OTHER, TOKENS, seriesColour } from '@/design/tokens'
import { ChartTable } from './ChartFrame'

export interface DemandCell {
  geographyId: string
  districtName: string
  lat: number
  lng: number
  orderCount: number
  competitorCount: number
  isDisclosable: boolean
}

export function DemandMap({ cells, height = 340 }: { cells: DemandCell[]; height?: number }) {
  const f = useFormat()
  const max = Math.max(...cells.map((c) => c.orderCount), 1)

  return (
    <>
      <div style={{ height }} className="overflow-hidden rounded-card border border-line">
        <MapContainer center={[23.8103, 90.4125]} zoom={6} scrollWheelZoom={false} style={{ height: '100%', width: '100%' }}>
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {cells.map((c) => (
            <CircleMarker
              key={c.geographyId}
              center={[c.lat, c.lng]}
              radius={8 + (c.orderCount / max) * 18}
              pathOptions={{
                color: TOKENS.panel,
                weight: 2,
                fillColor: c.isDisclosable ? seriesColour(0) : SERIES_OTHER,
                fillOpacity: c.isDisclosable ? 0.3 + (c.orderCount / max) * 0.55 : 0.25,
              }}
            >
              <LeafletTooltip>
                <strong>{c.districtName}</strong>
                <br />
                {f.number(c.orderCount)} orders
                <br />
                {c.isDisclosable
                  ? `${f.number(c.competitorCount)} sellers active`
                  : 'Too few sellers to report'}
              </LeafletTooltip>
            </CircleMarker>
          ))}
        </MapContainer>
      </div>
      <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-ink-soft">
        {cells.map((c) => (
          <li
            key={c.geographyId}
            data-testid={c.isDisclosable ? 'region-cell' : 'region-suppressed'}
            aria-label={c.isDisclosable
              ? `${c.districtName}: ${c.orderCount} orders, ${c.competitorCount} sellers`
              : `${c.districtName}: too few sellers to report`}
          >
            <span
              aria-hidden
              className="mr-1 inline-block h-2 w-2 rounded-full align-middle"
              style={{ background: c.isDisclosable ? seriesColour(0) : SERIES_OTHER }}
            />
            {c.districtName} {f.number(c.orderCount)}
          </li>
        ))}
      </ul>
      <ChartTable
        caption="Regional demand"
        columns={['District', 'Orders', 'Sellers active']}
        rows={cells.map((c) => [c.districtName, f.number(c.orderCount), c.isDisclosable ? f.number(c.competitorCount) : 'not reported'])}
      />
    </>
  )
}
