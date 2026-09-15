import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useData } from '@/data/DataProvider'
import { useQuery } from '@/data/useQuery'
import { useT } from '@/i18n/LocaleProvider'
import { AsyncBoundary, Button, Card, Field, Input, PageHeader, Select } from '@/ui'
import { Gate } from '@/access/Gate'
import { blockingConflicts } from './conflicts'
import type { ApiProblem, Discount, DiscountConflict, SaveDiscountInput } from '@/data/contracts'

const today = () => new Date().toISOString().slice(0, 10)

interface Draft {
  code: string
  name: string
  basis: 'percentage' | 'fixed'
  percent: string
  amountMajor: string
  scopeKind: 'listing' | 'category'
  listingId: string
  categoryId: string
  startsAt: string
  endsAt: string
  isStackable: boolean
  stackPriority: string
  stackGroup: string
}

function draftFrom(d: Discount | undefined): Draft {
  return {
    code: d?.code ?? '',
    name: d?.name ?? '',
    basis: d?.basis ?? 'percentage',
    percent: d?.discountPercent != null ? String(d.discountPercent) : '10',
    amountMajor: d?.discountAmount ? String(d.discountAmount.amountMinor / 100) : '',
    scopeKind: d?.scope.kind ?? 'listing',
    listingId: d?.scope.kind === 'listing' ? (d.scope.listingIds[0] ?? '') : '',
    categoryId: d?.scope.kind === 'category' ? d.scope.categoryId : '',
    startsAt: d?.startsAt.slice(0, 10) ?? today(),
    endsAt: d?.endsAt?.slice(0, 10) ?? '',
    isStackable: d?.isStackable ?? false,
    stackPriority: String(d?.stackPriority ?? 5),
    stackGroup: d?.stackGroup ?? '',
  }
}

export function DiscountEditor() {
  const t = useT()
  const api = useData()
  const navigate = useNavigate()
  const { id } = useParams()
  const isNew = !id || id === 'new'

  const listings = useQuery(['listings', 'for-discount'], () => api.listListings({ page: 1, pageSize: 100 }))
  const allDiscounts = useQuery(['discounts', 'all'], () => api.listDiscounts({ page: 1, pageSize: 100 }))
  const existing = useQuery(['discount', id ?? 'new'], async () => {
    if (isNew) return undefined
    const page = await api.listDiscounts({ page: 1, pageSize: 100 })
    return page.items.find((d) => d.id === id)
  })

  const [draft, setDraft] = useState<Draft | null>(null)
  const [conflicts, setConflicts] = useState<DiscountConflict[] | null>(null)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [failure, setFailure] = useState<ApiProblem | null>(null)
  const [busy, setBusy] = useState(false)

  const value = draft ?? draftFrom(existing.data)
  const set = <K extends keyof Draft>(k: K, v: Draft[K]) => setDraft({ ...value, [k]: v })

  const categories = useMemo(() => {
    const seen = new Map<string, string>()
    for (const l of listings.data?.items ?? []) seen.set(l.categoryId, l.categoryName)
    return [...seen]
  }, [listings.data])

  const input: SaveDiscountInput = useMemo(() => ({
    id: isNew ? undefined : id,
    code: value.code.trim() || 'DRAFT',
    name: value.name.trim() || 'Draft discount',
    basis: value.basis,
    discountPercent: value.basis === 'percentage' ? Number(value.percent) : null,
    discountAmountMinor: value.basis === 'fixed' ? Math.round(Number(value.amountMajor) * 100) : null,
    scope: value.scopeKind === 'listing'
      ? { kind: 'listing', listingIds: value.listingId ? [value.listingId] : [] }
      : { kind: 'category', categoryId: value.categoryId },
    startsAt: new Date(value.startsAt).toISOString(),
    endsAt: value.endsAt ? new Date(value.endsAt).toISOString() : null,
    isStackable: value.isStackable,
    stackPriority: Number(value.stackPriority) || 0,
    stackGroup: value.stackGroup.trim() || null,
  }), [value, id, isNew])

  useEffect(() => {
    let cancelled = false
    const timer = setTimeout(() => {
      api.detectDiscountConflicts(input).then(
        (c) => { if (!cancelled) setConflicts(c) },
        () => { if (!cancelled) setConflicts([]) },
      )
    }, 250)
    return () => { cancelled = true; clearTimeout(timer) }
  }, [api, input])

  const blocking = blockingConflicts(conflicts ?? [])

  const nameOfOther = (c: DiscountConflict) => {
    const otherId = c.discountIds.find((x) => x !== (id ?? 'draft')) ?? c.discountIds[0]
    return allDiscounts.data?.items.find((d) => d.id === otherId)?.name ?? otherId ?? ''
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    const next: Record<string, string> = {}
    if (!value.code.trim()) next.code = t('validation.required')
    if (!value.name.trim()) next.name = t('validation.required')
    if (value.basis === 'percentage') {
      const p = Number(value.percent)
      if (Number.isNaN(p) || p <= 0 || p > 100) next.percent = t('validation.percent')
    } else {
      const a = Number(value.amountMajor)
      if (Number.isNaN(a) || a <= 0) next.amountMajor = t('validation.amount')
    }
    if (value.endsAt && value.endsAt <= value.startsAt) next.endsAt = t('validation.dates')
    setErrors(next)
    if (Object.keys(next).length || blocking.length) return

    setBusy(true)
    try {
      await api.saveDiscount(input)
      navigate('/discounts')
    } catch (err) {
      setFailure(err as ApiProblem)
    } finally {
      setBusy(false)
    }
  }

  return (
    <AsyncBoundary query={listings}>
      {() => (
        <div>
          <PageHeader title={isNew ? t('editor.newDiscount') : t('editor.editDiscount')} />
          <Card className="max-w-2xl p-5">
            <form onSubmit={submit} className="space-y-4" noValidate>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label={t('col.name')} required error={errors.name} htmlFor="dname">
                  <Input id="dname" value={value.name} onChange={(e) => set('name', e.target.value)} />
                </Field>
                <Field label={t('editor.code')} required error={errors.code} htmlFor="dcode">
                  <Input id="dcode" value={value.code} onChange={(e) => set('code', e.target.value.toUpperCase())} />
                </Field>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <Field label={t('discount.basis')} htmlFor="basis">
                  <Select id="basis" value={value.basis} onChange={(e) => set('basis', e.target.value as Draft['basis'])}>
                    <option value="percentage">{t('discount.percentage')}</option>
                    <option value="fixed">{t('discount.fixed')}</option>
                  </Select>
                </Field>
                {value.basis === 'percentage' ? (
                  <Field label={t('discount.percent')} required error={errors.percent} htmlFor="pct">
                    <Input id="pct" inputMode="decimal" value={value.percent} onChange={(e) => set('percent', e.target.value)} />
                  </Field>
                ) : (
                  <Field label={t('discount.amount')} required error={errors.amountMajor} htmlFor="amt">
                    <Input id="amt" inputMode="decimal" value={value.amountMajor} onChange={(e) => set('amountMajor', e.target.value)} />
                  </Field>
                )}
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <Field label={t('editor.scope')} htmlFor="scope">
                  <Select id="scope" value={value.scopeKind} onChange={(e) => set('scopeKind', e.target.value as Draft['scopeKind'])}>
                    <option value="listing">{t('editor.scope.listing')}</option>
                    <option value="category">{t('editor.scope.category')}</option>
                  </Select>
                </Field>
                {value.scopeKind === 'listing' ? (
                  <Field label={t('nav.products')} htmlFor="lst">
                    <Select id="lst" value={value.listingId} onChange={(e) => set('listingId', e.target.value)}>
                      <option value="">—</option>
                      {(listings.data?.items ?? []).map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
                    </Select>
                  </Field>
                ) : (
                  <Field label={t('col.category')} htmlFor="cat">
                    <Select id="cat" value={value.categoryId} onChange={(e) => set('categoryId', e.target.value)}>
                      <option value="">—</option>
                      {categories.map(([cid, label]) => <option key={cid} value={cid}>{label}</option>)}
                    </Select>
                  </Field>
                )}
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <Field label={t('discount.starts')} htmlFor="from">
                  <Input id="from" type="date" value={value.startsAt} onChange={(e) => set('startsAt', e.target.value)} />
                </Field>
                <Field label={t('discount.ends')} error={errors.endsAt} htmlFor="to">
                  <Input id="to" type="date" value={value.endsAt} onChange={(e) => set('endsAt', e.target.value)} />
                </Field>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="flex items-center gap-2 text-sm text-ink">
                  <input type="checkbox" checked={value.isStackable} onChange={(e) => set('isStackable', e.target.checked)} />
                  {t('discount.stackable')}
                </label>
                <Field label={t('discount.priority')} htmlFor="prio">
                  <Input id="prio" inputMode="numeric" value={value.stackPriority} onChange={(e) => set('stackPriority', e.target.value)} />
                </Field>
              </div>

              <div data-testid="conflict-panel" aria-live="polite">
                {conflicts === null && <p className="text-sm text-ink-faint">{t('editor.checkConflicts')}</p>}
                {conflicts?.length === 0 && <p className="text-sm text-success">{t('editor.noConflicts')}</p>}
                {conflicts && conflicts.length > 0 && (
                  <ul className="space-y-1.5 rounded-card border border-warning/40 bg-warning/10 p-3 text-sm">
                    {conflicts.map((c, i) => (
                      <li key={i} role={c.resolution === 'ambiguous' ? 'alert' : undefined} className="text-ink-soft">
                        {

}
                        <span className="text-ink">{t('editor.clashesWith', { name: nameOfOther(c) })}</span>
                        {' — '}
                        {t(`discount.conflict.${c.resolution === 'ambiguous' ? 'ambiguous' : c.resolution === 'stacked' ? 'stacked' : 'priority'}` as never)}
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {failure && <p role="alert" className="text-sm text-danger">{failure.detail ?? failure.title}</p>}

              <div className="flex items-center gap-2">
                <Gate action="discount.manage">
                  {
}
                  <Button type="submit" loading={busy} disabled={blocking.length > 0}>{t('action.save')}</Button>
                </Gate>
                <Button type="button" variant="secondary" onClick={() => navigate('/discounts')}>{t('action.cancel')}</Button>
                {blocking.length > 0 && <span className="text-xs text-danger">{t('editor.blocked')}</span>}
              </div>
            </form>
          </Card>
        </div>
      )}
    </AsyncBoundary>
  )
}
