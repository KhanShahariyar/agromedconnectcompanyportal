import { useState } from 'react'
import { useData } from '@/data/DataProvider'
import { useQuery } from '@/data/useQuery'
import { useFormat, useT } from '@/i18n/LocaleProvider'
import { AsyncBoundary, Button, Card, Modal, PageHeader, SectionLabel } from '@/ui'
import type { TranslationKey } from '@/i18n/dictionary'

const MODE_LABEL: Record<string, TranslationKey> = {
  own: 'settings.deliveryMode.own',
  partner: 'settings.deliveryMode.partner',
  both: 'settings.deliveryMode.both',
}

export function Settings() {
  const t = useT()
  const f = useFormat()
  const api = useData()
  const [confirmDelete, setConfirmDelete] = useState(false)
  const q = useQuery(['organisation'], () => api.getOrganisation())

  return (
    <div>
      <PageHeader title={t('settings.title')} description={t('settings.subtitle')} />
      <AsyncBoundary query={q}>
        {(org) => (
          <div className="grid gap-5 lg:grid-cols-2">
            <Card className="p-5">
              <SectionLabel>{t('settings.deliveryMode')}</SectionLabel>
              {/*
                C14 — the platform assigns this. Rendered as text, never as a
                radio group, select or switch: a control the company can never
                earn is noise, and worse, an implied promise.
              */}
              <p data-testid="delivery-mode" className="text-sm text-ink">
                {t(MODE_LABEL[org.deliveryMode] ?? 'settings.deliveryMode.partner')}
                <span className="mt-1 block text-xs text-ink-faint">
                  {t('settings.deliveryMode.assigned', {
                    date: org.deliveryModeAssignedAt ? f.date(org.deliveryModeAssignedAt, 'medium') : '—',
                  })}
                </span>
              </p>
            </Card>

            <Card className="p-5">
              <SectionLabel>{t('settings.deleteCompany')}</SectionLabel>
              <Button variant="danger" onClick={() => setConfirmDelete(true)}>{t('settings.deleteCompany')}</Button>
            </Card>

            <Modal
              open={confirmDelete}
              title={t('settings.deleteCompany')}
              onClose={() => setConfirmDelete(false)}
              footer={
                <>
                  <Button variant="secondary" onClick={() => setConfirmDelete(false)}>{t('action.cancel')}</Button>
                  <Button variant="danger" onClick={() => setConfirmDelete(false)}>{t('settings.deleteCompany')}</Button>
                </>
              }
            >
              {/* privacy.usp_execute_erasure overwrites personal data but retains
                  the transactional record — promising total erasure would be false. */}
              {t('settings.deleteCompany.confirm')}
            </Modal>
          </div>
        )}
      </AsyncBoundary>
    </div>
  )
}
