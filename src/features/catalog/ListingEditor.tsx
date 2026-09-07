import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useData } from '@/data/DataProvider'
import { useQuery } from '@/data/useQuery'
import { useT } from '@/i18n/LocaleProvider'
import { AsyncBoundary, Button, Card, Field, Input, PageHeader, Select } from '@/ui'
import { Gate } from '@/access/Gate'
import type { ApiProblem, Listing } from '@/data/contracts'

interface Draft {
  sku: string
  name: string
  brand: string
  categoryId: string
  priceMajor: string
  packSize: string
  unitCode: string
  isRestricted: boolean
}

const UNITS = ['kg', 'g', 'l', 'ml', 'pc']

function draftFrom(l: Listing | undefined, kind: 'product' | 'service'): Draft {
  return {
    sku: l?.sku ?? '',
    name: l?.name ?? '',
    brand: l?.brand ?? '',
    categoryId: l?.categoryId ?? (kind === 'service' ? 'cat-service' : 'cat-fertiliser'),
    priceMajor: l ? String(l.price.amountMinor / 100) : '',
    packSize: l?.packSize != null ? String(l.packSize) : '',
    unitCode: l?.unitCode ?? 'kg',
    isRestricted: l?.isRestricted ?? false,
  }
}

/**
 * Create and edit a listing. Deliberately saves as a draft and never publishes:
 * going live is the publish gate's decision, and it needs certificates and
 * images this form does not collect.
 */
export function ListingEditor({ kind }: { kind: 'product' | 'service' }) {
  const t = useT()
  const api = useData()
  const navigate = useNavigate()
  const { id } = useParams()
  const isNew = !id || id === 'new'
  const base = kind === 'product' ? '/products' : '/services'

  const existing = useQuery(['listing', id ?? 'new'], async () =>
    isNew ? undefined : api.getListing(id!))

  const [draft, setDraft] = useState<Draft | null>(null)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [failure, setFailure] = useState<ApiProblem | null>(null)
  const [busy, setBusy] = useState(false)

  const value = draft ?? draftFrom(existing.data, kind)
  const set = <K extends keyof Draft>(k: K, v: Draft[K]) => setDraft({ ...value, [k]: v })

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    const next: Record<string, string> = {}
    if (!value.sku.trim()) next.sku = t('validation.required')
    if (!value.name.trim()) next.name = t('validation.required')
    const price = Number(value.priceMajor)
    if (!value.priceMajor.trim() || Number.isNaN(price) || price <= 0) next.priceMajor = t('validation.amount')
    setErrors(next)
    if (Object.keys(next).length) return

    setBusy(true)
    try {
      const saved = await api.saveListing({
        id: isNew ? undefined : id,
        kind,
        sku: value.sku.trim(),
        name: value.name.trim(),
        brand: value.brand.trim() || null,
        categoryId: value.categoryId,
        // Money crosses the wire in minor units; the form collects major.
        priceMinor: Math.round(price * 100),
        packSize: value.packSize ? Number(value.packSize) : null,
        unitCode: kind === 'product' ? value.unitCode : null,
        isRestricted: value.isRestricted,
      })
      navigate(`${base}/${saved.id}`)
    } catch (err) {
      setFailure(err as ApiProblem)
    } finally {
      setBusy(false)
    }
  }

  const title = isNew
    ? t(kind === 'product' ? 'editor.newProduct' : 'editor.newService')
    : t(kind === 'product' ? 'editor.editProduct' : 'editor.editService')

  return (
    <AsyncBoundary query={isNew ? { loading: false, data: undefined, refetch: () => {} } : existing}>
      {() => (
        <div>
          <PageHeader title={title} />
          <Card className="max-w-2xl p-5">
            <form onSubmit={submit} className="space-y-4" noValidate>
              <Field label={t('editor.name')} required error={errors.name} htmlFor="name">
                <Input id="name" value={value.name} onChange={(e) => set('name', e.target.value)} />
              </Field>

              <div className="grid gap-4 sm:grid-cols-2">
                <Field label={t('editor.sku')} required error={errors.sku} htmlFor="sku">
                  <Input id="sku" value={value.sku} onChange={(e) => set('sku', e.target.value)} />
                </Field>
                <Field label={t('editor.brand')} htmlFor="brand">
                  <Input id="brand" value={value.brand} onChange={(e) => set('brand', e.target.value)} />
                </Field>
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <Field label={t('editor.price')} required error={errors.priceMajor} htmlFor="price">
                  <Input id="price" inputMode="decimal" value={value.priceMajor}
                         onChange={(e) => set('priceMajor', e.target.value)} />
                </Field>
                {kind === 'product' && (
                  <>
                    <Field label={t('editor.packSize')} htmlFor="pack">
                      <Input id="pack" inputMode="decimal" value={value.packSize}
                             onChange={(e) => set('packSize', e.target.value)} />
                    </Field>
                    <Field label={t('editor.unit')} htmlFor="unit">
                      <Select id="unit" value={value.unitCode} onChange={(e) => set('unitCode', e.target.value)}>
                        {UNITS.map((u) => <option key={u} value={u}>{u}</option>)}
                      </Select>
                    </Field>
                  </>
                )}
              </div>

              {kind === 'product' && (
                <label className="flex items-start gap-2 text-sm text-ink">
                  <input type="checkbox" className="mt-1" checked={value.isRestricted}
                         onChange={(e) => set('isRestricted', e.target.checked)} />
                  <span>
                    {t('editor.restricted')}
                    <span className="mt-0.5 block text-xs text-ink-faint">{t('editor.restrictedHint')}</span>
                  </span>
                </label>
              )}

              {failure && <p role="alert" className="text-sm text-danger">{failure.detail ?? failure.title}</p>}

              <div className="flex gap-2">
                <Gate action={kind === 'product' ? 'product.create' : 'service.create'}>
                  <Button type="submit" loading={busy}>{t('editor.saveDraft')}</Button>
                </Gate>
                <Button type="button" variant="secondary" onClick={() => navigate(base)}>{t('action.cancel')}</Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </AsyncBoundary>
  )
}
