import { useRef, useState } from 'react'
import { useData } from '@/data/DataProvider'
import { Button, Field } from '@/ui'
import type { ApiProblem, Listing, MediaItem, Uuid } from '@/data/contracts'

const API = import.meta.env.VITE_API_URL ?? 'http://localhost:5270'

/** The API returns media paths relative to its own origin. */
const src = (m: MediaItem) => (m.url.startsWith('http') ? m.url : `${API}${m.url}`)

/**
 * Photographs for a listing.
 *
 * A farmer deciding between two similar-looking bottles is buying partly on the
 * picture, so a listing without one is a listing that does not sell. The upload
 * is addressed to a listing id, which a product being created does not have
 * yet — so on a new product this explains that rather than pretending to work.
 */
export function ListingImages({
  listingId,
  media,
  onChanged,
  label,
}: {
  listingId: Uuid | null
  media: MediaItem[]
  onChanged: (updated: Listing) => void
  label: string
}) {
  const api = useData()
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)
  const [busy, setBusy] = useState(false)
  const [failure, setFailure] = useState<string | null>(null)

  if (!listingId) {
    return (
      <Field label={label}>
        <p className="rounded-lg border border-dashed border-line px-3 py-4 text-xs text-muted">
          Save the product first, then add photographs to it.
        </p>
      </Field>
    )
  }

  async function accept(file: File | undefined) {
    if (!file) return
    if (!file.type.startsWith('image/')) { setFailure('That file is not an image.'); return }
    if (file.size > 8 * 1024 * 1024) { setFailure('An image must be 8 MB or smaller.'); return }
    setBusy(true)
    setFailure(null)
    try {
      onChanged(await api.uploadListingImage(listingId!, file))
    } catch (err) {
      setFailure((err as ApiProblem).detail ?? 'That image could not be uploaded.')
    } finally {
      setBusy(false)
    }
  }

  async function remove(mediaId: Uuid) {
    setBusy(true)
    try {
      onChanged(await api.deleteListingImage(listingId!, mediaId))
    } catch (err) {
      setFailure((err as ApiProblem).detail ?? 'That image could not be removed.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <Field label={label} error={failure ?? undefined}>
      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => { e.preventDefault(); setDragging(false); void accept(e.dataTransfer.files?.[0]) }}
        className={`rounded-lg border border-dashed px-3 py-3 transition ${
          dragging ? 'border-primary bg-primary/5' : 'border-line'}`}
      >
        {media.length > 0 && (
          <div className="mb-3 flex flex-wrap gap-2">
            {media.map((m) => (
              <figure key={m.id} className="relative">
                <img src={src(m)} alt="" className="h-20 w-20 rounded-md object-cover" />
                {m.isPrimary && (
                  <figcaption className="absolute left-1 top-1 rounded bg-black/60 px-1 text-[10px] text-white">
                    cover
                  </figcaption>
                )}
                <button
                  type="button"
                  aria-label="Remove image"
                  disabled={busy}
                  onClick={() => remove(m.id)}
                  className="absolute -right-1.5 -top-1.5 h-5 w-5 rounded-full bg-danger text-xs leading-none text-white disabled:opacity-50"
                >×</button>
              </figure>
            ))}
          </div>
        )}

        <div className="flex items-center justify-between gap-3">
          <p className="text-xs text-muted">
            {media.length === 0 ? 'Drop a photograph here' : 'Drop another to add it'} · PNG or JPEG, up to 8 MB
          </p>
          <Button type="button" variant="secondary" disabled={busy} onClick={() => inputRef.current?.click()}>
            {busy ? 'Uploading…' : 'Browse'}
          </Button>
        </div>

        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => { void accept(e.target.files?.[0]); e.target.value = '' }}
        />
      </div>
    </Field>
  )
}
