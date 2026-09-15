import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useData } from '@/data/DataProvider'
import { useQuery } from '@/data/useQuery'
import { useT } from '@/i18n/LocaleProvider'
import { AsyncBoundary, Button, Card, Field, Input, PageHeader, Select } from '@/ui'
import { Gate } from '@/access/Gate'
import { CategoryPicker } from './CategoryPicker'
import { ListingImages } from './ListingImages'
import type { ApiProblem, Listing } from '@/data/contracts'

interface Draft {
  sku: string
  name: string
  brand: string
  categoryId: string | null
  priceMajor: string
  packSize: string
  unitCode: string
  isRestricted: boolean
  formulation: string
  activeIngredientCode: string
  concentration: string
  concentrationBasis: 'percent' | 'g_per_litre' | 'g_per_kg'
  activeIngredientGramsPerPack: string
  clearComposition: boolean
}

const UNITS = ['kg', 'g', 'l', 'ml', 'pc']

function draftFrom(l: Listing | undefined, kind: 'product' | 'service'): Draft {
  return {
    sku: l?.sku ?? '',
    name: l?.name ?? '',
    brand: l?.brand ?? '',
    // No default. The taxonomy is admin-managed data, so there is no category
    // this file is entitled to assume exists -- the two ids that used to be
    // defaulted here ('cat-service', 'cat-fertiliser') now point at retired
    // categories. The seller picks one, and the form will not submit without it.
    categoryId: l?.categoryId ?? null,
    priceMajor: l ? String(l.price.amountMinor / 100) : '',
    packSize: l?.packSize != null ? String(l.packSize) : '',
    unitCode: l?.unitCode ?? 'kg',
    isRestricted: l?.isRestricted ?? false,
    formulation: '',
    activeIngredientCode: '',
    concentration: '',
    concentrationBasis: 'percent',
    activeIngredientGramsPerPack: '',
    clearComposition: false,
  }
}

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
  // The listing as the server last returned it, so an upload can update the
  // gallery in place instead of forcing a page reload.
  const [saved, setSaved] = useState<Listing | null>(null)
  const [busy, setBusy] = useState(false)

  const value = draft ?? draftFrom(existing.data, kind)
  const set = <K extends keyof Draft>(k: K, v: Draft[K]) => setDraft({ ...value, [k]: v })

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    const next: Record<string, string> = {}
    if (!value.sku.trim()) next.sku = t('validation.required')
    if (!value.name.trim()) next.name = t('validation.required')
    if (!value.categoryId) next.categoryId = t('validation.required')
    const price = Number(value.priceMajor)
    if (!value.priceMajor.trim() || Number.isNaN(price) || price <= 0) next.priceMajor = t('validation.amount')
    const hasComposition = value.activeIngredientCode.trim() || value.concentration.trim() || value.activeIngredientGramsPerPack.trim()
    if (hasComposition && (!value.activeIngredientCode.trim() || Number(value.concentration) <= 0 || Number(value.activeIngredientGramsPerPack) <= 0)) {
      next.composition = 'Provide an ingredient, concentration and total grams per sellable pack.'
    }
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
        categoryId: value.categoryId!,

        priceMinor: Math.round(price * 100),
        packSize: value.packSize ? Number(value.packSize) : null,
        unitCode: kind === 'product' ? value.unitCode : null,
        isRestricted: value.isRestricted,
        formulation: kind === 'product' ? value.formulation.trim() || null : null,

        composition: kind !== 'product' ? undefined : hasComposition ? [{
          activeIngredientCode: value.activeIngredientCode.trim(),
          concentration: Number(value.concentration),
          concentrationBasis: value.concentrationBasis,
          activeIngredientGramsPerPack: Number(value.activeIngredientGramsPerPack),
        }] : (isNew || value.clearComposition) ? [] : undefined,
      })
      navigate(`${base}/${saved.id}`)
    } catch (err) {
      const problem = err as ApiProblem
      // The API rejects a product attached to anything but a level-3
      // subcategory (CompanyCatalogueService, and catalog.TR_listing_leaf_category
      // behind it). That is a fault in one field, so it belongs on that field --
      // a form-level alert makes the seller hunt for what to change.
      if (problem.code === 'category_not_a_subcategory' || problem.code === 'category_invalid') {
        setErrors({ categoryId: problem.detail ?? 'Pick a subcategory.' })
        setFailure(null)
      } else {
        setFailure(problem)
      }
    } finally {
      setBusy(false)
    }
  }

  const title = isNew
    ? t(kind === 'product' ? 'editor.newProduct' : 'editor.newService')
    : t(kind === 'product' ? 'editor.editProduct' : 'editor.editService')

  const body = (
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

              <ListingImages
                listingId={isNew ? null : (id ?? null)}
                media={(saved ?? existing.data)?.media ?? []}
                onChanged={setSaved}
                label={kind === 'product' ? 'Product photographs' : 'Service photographs'}
              />

              <CategoryPicker
                kind={kind}
                value={value.categoryId}
                onChange={(id) => set('categoryId', id)}
                error={errors.categoryId}
                disabled={busy}
              />

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
                <>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Formulation" htmlFor="formulation">
                    <Input id="formulation" value={value.formulation} onChange={(e) => set('formulation', e.target.value)} placeholder="e.g. tablet, EC, WP" />
                  </Field>
                  <Field label="Active ingredient" error={errors.composition} htmlFor="ingredient">
                    <Input id="ingredient" value={value.activeIngredientCode} onChange={(e) => set('activeIngredientCode', e.target.value)} placeholder="e.g. azoxystrobin" />
                  </Field>
                </div>
                <div className="grid gap-4 sm:grid-cols-3">
                  <Field label="Strength / concentration" htmlFor="concentration">
                    <Input id="concentration" inputMode="decimal" value={value.concentration} onChange={(e) => set('concentration', e.target.value)} />
                  </Field>
                  <Field label="Basis" htmlFor="concentrationBasis">
                    <Select id="concentrationBasis" value={value.concentrationBasis} onChange={(e) => set('concentrationBasis', e.target.value as Draft['concentrationBasis'])}>
                      <option value="percent">percent</option><option value="g_per_litre">g per litre</option><option value="g_per_kg">g per kg</option>
                    </Select>
                  </Field>
                  <Field label="Total active ingredient (g)" htmlFor="grams">
                    <Input id="grams" inputMode="decimal" value={value.activeIngredientGramsPerPack} onChange={(e) => set('activeIngredientGramsPerPack', e.target.value)} />
                  </Field>
                </div>
                <p className="-mt-2 text-xs text-ink-faint">Use the amount in the full sellable pack, including tablets or capsules. This powers price-per-gram and exact equivalence comparison.</p>
                {!isNew && <label className="flex items-center gap-2 text-sm text-ink-faint">
                  <input type="checkbox" checked={value.clearComposition} onChange={(e) => set('clearComposition', e.target.checked)} />
                  Remove the declared active ingredient from this product
                </label>}
                <label className="flex items-start gap-2 text-sm text-ink">
                  <input type="checkbox" className="mt-1" checked={value.isRestricted}
                         onChange={(e) => set('isRestricted', e.target.checked)} />
                  <span>
                    {t('editor.restricted')}
                    <span className="mt-0.5 block text-xs text-ink-faint">{t('editor.restrictedHint')}</span>
                  </span>
                </label>
                </>
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
  )

  if (isNew) return body
  return <AsyncBoundary query={existing}>{() => body}</AsyncBoundary>
}
