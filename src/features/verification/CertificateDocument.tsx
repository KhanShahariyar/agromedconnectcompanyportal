import { useRef, useState } from 'react'
import { useData } from '@/data/DataProvider'
import type { ApiProblem, Certificate, Uuid } from '@/data/contracts'

const API = import.meta.env.VITE_API_URL ?? 'http://localhost:5270'

/**
 * The licence document itself, attached to a certificate.
 *
 * A certificate row could always record a licence number and dates, and the API
 * could always serve a document — but nothing could put one there, so a
 * reviewer opening the verification queue had a number to check against
 * nothing. This is the missing half.
 */
export function CertificateDocument({
  certificateId,
  documentUrl,
  onUploaded,
}: {
  certificateId: Uuid
  documentUrl: string | null
  onUploaded: (updated: Certificate) => void
}) {
  const api = useData()
  const inputRef = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState(false)
  const [failure, setFailure] = useState<string | null>(null)
  const [url, setUrl] = useState(documentUrl)

  async function accept(file: File | undefined) {
    if (!file) return
    if (file.size > 8 * 1024 * 1024) { setFailure('Keep the file under 8 MB.'); return }
    setBusy(true)
    setFailure(null)
    try {
      const updated = await api.uploadCertificateDocument(certificateId, file)
      setUrl(updated.documentUrl ?? `/api/v1/certificates/${certificateId}/document`)
      onUploaded(updated)
    } catch (err) {
      setFailure((err as ApiProblem).detail ?? 'That file could not be uploaded.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <span className="ml-auto flex items-center gap-2">
      {url && (
        <a
          href={url.startsWith('http') ? url : `${API}${url}`}
          target="_blank"
          rel="noreferrer"
          className="text-xs font-semibold text-primary underline"
        >View</a>
      )}
      <button
        type="button"
        disabled={busy}
        onClick={() => inputRef.current?.click()}
        className="rounded-lg border border-line px-2.5 py-1 text-xs font-semibold text-ink hover:bg-surface-muted disabled:opacity-50"
      >
        {busy ? 'Uploading…' : url ? 'Replace' : 'Upload licence'}
      </button>
      {failure && <span className="text-xs text-danger">{failure}</span>}
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,application/pdf"
        className="hidden"
        onChange={(e) => { void accept(e.target.files?.[0]); e.target.value = '' }}
      />
    </span>
  )
}
