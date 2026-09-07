import { MapContainer, Marker, TileLayer } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import { useT } from '@/i18n/LocaleProvider'
import type { GeoPoint } from '@/data/contracts'

/**
 * Directions always open Google Maps, whoever is looking — the courier, the
 * company, or support. It is what people on this market actually navigate with,
 * and it works from a coordinate or from a written address, so the link is
 * useful even for the orders that have no pin yet.
 *
 * The map tiles stay OpenStreetMap: they need no API key, and embedding Google's
 * map would. Displaying OSM and navigating with Google is a deliberate split.
 */
export function googleMapsDirections(location: GeoPoint, address: string): string {
  const destination = location.precision === 'exact' && location.lat !== null && location.lng !== null
    ? `${location.lat},${location.lng}`
    : address
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(destination)}`
}

export function DeliveryLocation({ location, address, geographyName, phone, height = 220 }: {
  location: GeoPoint
  address: string
  geographyName?: string | null
  phone?: string | null
  height?: number
}) {
  const t = useT()
  const hasPin = location.precision === 'exact' && location.lat !== null && location.lng !== null

  return (
    <div className="space-y-3">
      {hasPin ? (
        <div data-testid="delivery-map" className="overflow-hidden rounded-card border border-line" style={{ height }}>
          <MapContainer center={[location.lat!, location.lng!]} zoom={14} scrollWheelZoom={false}
                        style={{ height: '100%', width: '100%' }}>
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <Marker position={[location.lat!, location.lng!]} />
          </MapContainer>
        </div>
      ) : (
        /* No pin was captured. Saying so beats centring a map on a district and
           letting someone drive to the middle of it. */
        <div data-testid="no-map-notice" className="rounded-card border border-line bg-sunken p-4 text-sm text-ink-soft">
          {t('delivery.noMap')}
        </div>
      )}

      <div>
        <div data-testid="delivery-address" className="text-base text-ink">{address}</div>
        {geographyName && <div className="mt-0.5 text-sm text-ink-faint">{geographyName}</div>}
      </div>

      <div className="flex flex-wrap gap-2">
        {phone && (
          <a href={`tel:${phone}`}
             className="inline-flex min-h-touch flex-1 items-center justify-center rounded-md border border-line bg-panel px-4 text-sm text-ink">
            {t('delivery.call')}
          </a>
        )}
        <a
          data-testid="directions-link"
          href={googleMapsDirections(location, address)}
          target="_blank"
          rel="noreferrer"
          className="inline-flex min-h-touch flex-1 items-center justify-center rounded-md border border-line bg-panel px-4 text-sm text-ink"
        >
          {t('delivery.directions')}
        </a>
      </div>
    </div>
  )
}
