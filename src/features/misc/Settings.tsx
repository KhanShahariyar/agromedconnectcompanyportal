import { useState } from 'react'
import { useData } from '@/data/DataProvider'
import { useQuery } from '@/data/useQuery'
import { useT } from '@/i18n/LocaleProvider'
import { AsyncBoundary, Button, Card, Modal, PageHeader, SectionLabel } from '@/ui'

export function Settings() {
  const t = useT()
  const api = useData()
  const [confirmDelete, setConfirmDelete] = useState(false)
  const q = useQuery(['organisation'], (signal) => api.withSignal(signal).getOrganisation())

  return (
    <div>
      <PageHeader title={t('settings.title')} description={t('settings.subtitle')} />
      <AsyncBoundary query={q}>
        {() => (
          <div className="grid gap-5 lg:grid-cols-2">
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
              {
}
              {t('settings.deleteCompany.confirm')}
            </Modal>
          </div>
        )}
      </AsyncBoundary>
    </div>
  )
}
