import { useEffect, useState } from 'react'
import { useData } from '@/data/DataProvider'
import { useLocale } from '@/i18n/LocaleProvider'
import { Select } from '@/ui'
import type { Category, Uuid } from '@/data/contracts'

/**
 * A filter, not a picker. Where CategoryPicker makes a seller choose a leaf to
 * save on a listing, this narrows a list and every tier is a valid stopping
 * point: choosing only a division means "all of mine under Animal".
 *
 * It reports the deepest tier chosen, because the API matches the whole subtree
 * beneath whatever id it is given — so one value expresses all three cases.
 *
 * The request behind it is org-scoped (OpenAsync), not the public read, so a
 * seller sees their own drafts here. That is the point of the screen.
 */
export function CategoryDrilldown({
  value,
  onChange,
  kind,
}: {
  value: Uuid | null
  onChange: (categoryId: Uuid | null) => void
  /** Only divisions that take this kind of listing are worth offering. */
  kind: 'product' | 'service'
}) {
  const api = useData()
  // Category names are translated server-side, so a language switch has to
  // refetch them — the adapter's identity does not change when the locale does.
  const { locale } = useLocale()

  const [divisions, setDivisions] = useState<Category[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [subcategories, setSubcategories] = useState<Category[]>([])

  const [divisionId, setDivisionId] = useState<Uuid | ''>('')
  const [categoryId, setCategoryId] = useState<Uuid | ''>('')
  const [subcategoryId, setSubcategoryId] = useState<Uuid | ''>('')

  const [loading, setLoading] = useState<'divisions' | 'categories' | 'subcategories' | null>(null)

  useEffect(() => {
    let live = true
    setLoading('divisions')
    api.listCategories({ level: 1 })
      .then((rows) => { if (live) setDivisions(rows) })
      .catch(() => { if (live) setDivisions([]) })
      .finally(() => { if (live) setLoading(null) })
    return () => { live = false }
  }, [api, locale])

  useEffect(() => {
    if (!divisionId) { setCategories([]); return }
    let live = true
    setLoading('categories')
    api.listCategories({ parentId: divisionId })
      .then((rows) => { if (live) setCategories(rows) })
      .catch(() => { if (live) setCategories([]) })
      .finally(() => { if (live) setLoading(null) })
    return () => { live = false }
  }, [api, divisionId, locale])

  useEffect(() => {
    if (!categoryId) { setSubcategories([]); return }
    let live = true
    setLoading('subcategories')
    api.listCategories({ parentId: categoryId })
      .then((rows) => { if (live) setSubcategories(rows) })
      .catch(() => { if (live) setSubcategories([]) })
      .finally(() => { if (live) setLoading(null) })
    return () => { live = false }
  }, [api, categoryId, locale])

  // Whatever is deepest is what filters; clearing a tier falls back to the one above.
  function apply(d: Uuid | '', c: Uuid | '', s: Uuid | '') {
    setDivisionId(d); setCategoryId(c); setSubcategoryId(s)
    onChange((s || c || d) || null)
  }

  const clearable = Boolean(divisionId || categoryId || subcategoryId)

  return (
    <div className="flex flex-wrap items-end gap-3">
      <label className="flex flex-col gap-1 text-xs text-muted">
        Division
        <Select
          aria-label="Filter by division"
          value={divisionId}
          onChange={(e) => apply(e.target.value as Uuid | '', '', '')}
        >
          <option value="">All divisions</option>
          {divisions
            .filter((d) => d.listingKind === kind || d.listingKind === 'both')
            .map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
        </Select>
      </label>

      <label className="flex flex-col gap-1 text-xs text-muted">
        Category
        <Select
          aria-label="Filter by category"
          value={categoryId}
          disabled={!divisionId || loading === 'categories'}
          onChange={(e) => apply(divisionId, e.target.value as Uuid | '', '')}
        >
          <option value="">
            {!divisionId
              ? 'Pick a division first'
              : loading === 'categories'
                ? 'Loading…'
                : categories.length === 0
                  ? 'Nothing below this one'
                  : 'All categories'}
          </option>
          {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </Select>
      </label>

      <label className="flex flex-col gap-1 text-xs text-muted">
        Subcategory
        <Select
          aria-label="Filter by subcategory"
          value={subcategoryId}
          disabled={!categoryId || loading === 'subcategories'}
          onChange={(e) => apply(divisionId, categoryId, e.target.value as Uuid | '')}
        >
          <option value="">
            {!categoryId
              ? 'Pick a category first'
              : loading === 'subcategories'
                ? 'Loading…'
                : subcategories.length === 0 ? 'No subcategories here' : 'All subcategories'}
          </option>
          {subcategories.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </Select>
      </label>

      {clearable && (
        <button
          type="button"
          onClick={() => apply('', '', '')}
          className="pb-2 text-xs font-semibold text-primary underline"
        >
          Clear
        </button>
      )}
    </div>
  )
}
