import { useState } from 'react'
import { useData } from '@/data/DataProvider'
import { useQuery } from '@/data/useQuery'
import { useFormat, useT } from '@/i18n/LocaleProvider'
import { AsyncBoundary, Badge, Button, Card, PageHeader, SectionLabel } from '@/ui'
import type { TranslationKey } from '@/i18n/dictionary'
import { CertificateDocument } from './CertificateDocument'

const DOC_LABEL: Record<string, TranslationKey> = {
  trade_licence: 'verify.doc.trade_licence',
  bin: 'verify.doc.bin',
  tin: 'verify.doc.tin',
  nid: 'verify.doc.nid',
}

export function Verification() {
  const t = useT()
  const f = useFormat()
  const api = useData()
  const [nonce, setNonce] = useState(0)
  const q = useQuery(['dossier', nonce], () => api.getVerificationDossier())

  return (
    <AsyncBoundary query={q}>
      {(d) => {
        const pending = d.organisationStatus === 'pending'
        const rejected = d.organisationStatus === 'rejected'
        const soon = d.certificates.filter((c) => {
          if (!c.expiresOn) return false
          const days = (new Date(c.expiresOn).getTime() - Date.now()) / 864e5
          return days > 0 && days <= 30
        })

        return (
          <div>
            <PageHeader
              title={t('verify.title')}
              description={t('verify.subtitle')}
              actions={
                <Button
                  disabled={d.outstanding.length > 0 || pending}
                  onClick={async () => { await api.submitDossierForReview(); setNonce((n) => n + 1) }}
                >
                  {t('verify.submit')}
                </Button>
              }
            />

            {pending && (
              <div role="status" className="mb-5 rounded-card border border-info/40 bg-info/10 p-4">
                <div className="font-medium text-ink">{t('verify.inProgress')}</div>
                <p className="mt-1 text-sm text-ink-soft">{t('verify.inProgress.body')}</p>
              </div>
            )}

            {rejected && (
              <div role="alert" className="mb-5 rounded-card border border-danger/40 bg-danger/10 p-4">
                <div className="font-medium text-ink">{t('verify.rejected')}</div>
                <p className="mt-1 text-sm text-ink-soft">{d.rejectionReason ?? t('verify.resubmit')}</p>
              </div>
            )}

            <div className="grid gap-5 lg:grid-cols-3">
              <div className="space-y-5 lg:col-span-2">
                {d.outstanding.length > 0 && (
                  <Card className="border-warning/40 bg-warning/10 p-5">
                    <SectionLabel>{t('verify.outstanding')}</SectionLabel>
                    <ul data-testid="outstanding" className="space-y-1.5 text-sm text-ink-soft">
                      {d.outstanding.map((o) => (
                        <li key={o}>{DOC_LABEL[o] ? t(DOC_LABEL[o]!) : o}</li>
                      ))}
                    </ul>
                  </Card>
                )}

                <Card className="p-5">
                  <SectionLabel>{t('verify.title')}</SectionLabel>
                  <ul className="divide-y divide-line">
                    {d.certificates.map((c) => (
                      <li key={c.id} className="flex flex-wrap items-center gap-2 py-3 text-sm">
                        <span className="text-ink">{c.certificateType.replace(/_/g, ' ')}</span>
                        <span className="font-mono text-xs text-ink-faint">{c.certificateNumber}</span>
                        <Badge tone={c.status === 'verified' ? 'success' : c.status === 'rejected' ? 'danger' : 'warning'}>
                          {c.status}
                        </Badge>
                        {c.expiresOn && <span className="text-xs text-ink-faint">{f.date(c.expiresOn, 'short')}</span>}
                        <CertificateDocument
                          certificateId={c.id}
                          documentUrl={c.documentUrl}
                          onUploaded={() => q.reload?.()}
                        />
                      </li>
                    ))}
                  </ul>
                  {soon.length > 0 && (
                    <p className="mt-3 text-xs text-warning">
                      {t('verify.expiring', { n: f.number(30) })}
                    </p>
                  )}
                </Card>

                <Card className="p-5">
                  <SectionLabel>{t('verify.doc.nid')}</SectionLabel>
                  <ul className="divide-y divide-line">
                    {d.identityDocuments.map((doc) => (
                      <li key={doc.id} data-testid={doc.kind} className="flex items-center gap-3 py-3 text-sm">
                        <span className="text-ink">{t(DOC_LABEL[doc.kind] ?? 'verify.doc.nid')}</span>
                        { }
                        <span className="font-mono text-ink-soft">{doc.maskedNumber}</span>
                        <Badge tone={doc.status === 'verified' ? 'success' : 'warning'}>{doc.status}</Badge>
                      </li>
                    ))}
                  </ul>
                  <p className="mt-3 text-xs text-ink-faint">{t('verify.pii')}</p>
                </Card>
              </div>

              <Card className="p-5">
                <SectionLabel>{t('verify.timeline')}</SectionLabel>
                <ol className="space-y-3">
                  {d.timeline.map((e) => (
                    <li key={e.id} className="text-sm">
                      <div className="text-ink">{e.toStatus}</div>
                      <div className="text-xs text-ink-faint">{f.dateTime(e.occurredAt)} · {e.decidedBy}</div>
                    </li>
                  ))}
                </ol>
              </Card>
            </div>
          </div>
        )
      }}
    </AsyncBoundary>
  )
}
