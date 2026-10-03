import { useEffect, useState } from 'react'
import { useData } from '@/data/DataProvider'
import { useLocale } from '@/i18n/LocaleProvider'
import { Field, Select } from '@/ui'
import type { Category, Uuid } from '@/data/contracts'

/**
 * Division -> Category -> Subcategory, one select per level.
 *
 * Every option is fetched from /api/v1/categories. Nothing about the tree is
 * hard-coded here, so a subcategory a superadmin adds in the console appears in
 * this form without a release. That is also why the three selects are driven by
 * one generic `tier` fetch rather than three bespoke ones.
 *
 * Only the subcategory is submitted. The API rejects a listing attached to a
 * division or a category (and catalog.TR_listing_leaf_category rejects it in
 * the database), so the upper two selects exist to narrow the third, not to be
 * saved.
 *
 * When editing a listing that already has a subcategory, the chain is
 * rehydrated from /breadcrumb -- the form is given one id and has to work out
 * which division and category it sits under.
 */
export function CategoryPicker({
  value,
  onChange,
  error,
  disabled,
  kind,
}: {
  value: Uuid | null
  onChange: (categoryId: Uuid | null) => void
  error?: string
  disabled?: boolean
  /** Which listing kind is being created. Decides how deep the picker goes. */
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

  const [hydrated, setHydrated] = useState(false)

  // Divisions this kind of listing may actually be filed under. A category
  // declares listing_kind, and the database enforces it, so offering a seller
  // a division their listing cannot go in would only produce a rejected save.
  const usable = divisions.filter(
    (d) => d.listingKind === kind || d.listingKind === 'both')

  // Services have no sub-breakdown: they attach straight to a service division,
  // which is a leaf. So there is nothing to cascade into and the two lower
  // selects would be permanently empty. One select, and it writes the value
  // the form submits.
  const terminal = kind === 'service'

  // The divisions never depend on anything else, so they load once.
  useEffect(() => {
    let live = true
    api.listCategories({ level: 1 })
      .then((rows) => { if (live) setDivisions(rows) })
      .catch(() => { if (live) setDivisions([]) })
    return () => { live = false }
  }, [api, locale])

  // Editing an existing listing: walk the chain back up from the leaf so the
  // upper selects show where it actually sits.
  useEffect(() => {
    if (hydrated || !value) return
    let live = true
    api.getCategoryBreadcrumb(value)
      .then((chain) => {
        if (!live || chain.length === 0) return
        setDivisionId(chain[0].id)
        if (chain.length > 1) setCategoryId(chain[1].id)
        setHydrated(true)
      })
      .catch(() => { if (live) setHydrated(true) })
    return () => { live = false }
  }, [api, value, hydrated, locale])

  useEffect(() => {
    if (!divisionId) { setCategories([]); return }
    let live = true
    api.listCategories({ parentId: divisionId })
      .then((rows) => { if (live) setCategories(rows) })
      .catch(() => { if (live) setCategories([]) })
    return () => { live = false }
  }, [api, divisionId, locale])

  useEffect(() => {
    if (!categoryId) { setSubcategories([]); return }
    let live = true
    api.listCategories({ parentId: categoryId })
      .then((rows) => { if (live) setSubcategories(rows) })
      .catch(() => { if (live) setSubcategories([]) })
    return () => { live = false }
  }, [api, categoryId, locale])

  // Changing a level above invalidates everything below it, including the saved
  // value -- otherwise the form would submit a subcategory from a division the
  // seller has just navigated away from.
  function pickDivision(next: string) {
    setDivisionId(next)
    setCategoryId('')
    onChange(null)
    setHydrated(true)
  }

  function pickCategory(next: string) {
    setCategoryId(next)
    onChange(null)
  }

  if (terminal) {
    return (
      <Field label="Service category" required error={error} htmlFor="cat-division">
        <Select
          id="cat-division"
          value={value ?? ''}
          disabled={disabled}
          onChange={(e) => onChange((e.target.value as Uuid) || null)}
        >
          <option value="">
            {divisions.length === 0 ? 'Loading…' : 'Select a category'}
          </option>
          {usable.map((d) => (
            <option key={d.id} value={d.id}>{d.name}</option>
          ))}
        </Select>
      </Field>
    )
  }

  return (
    <div className="grid gap-4 sm:grid-cols-3">
      <Field label="Division" required htmlFor="cat-division">
        <Select
          id="cat-division"
          value={divisionId}
          disabled={disabled}
          onChange={(e) => pickDivision(e.target.value)}
        >
          <option value="">Select a division</option>
          {usable.map((d) => (
            <option key={d.id} value={d.id}>{d.name}</option>
          ))}
        </Select>
      </Field>

      <Field label="Category" required htmlFor="cat-category">
        <Select
          id="cat-category"
          value={categoryId}
          disabled={disabled || !divisionId}
          onChange={(e) => pickCategory(e.target.value)}
        >
          <option value="">{divisionId ? 'Select a category' : 'Pick a division first'}</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </Select>
      </Field>

      <Field label="Subcategory" required error={error} htmlFor="cat-subcategory">
        <Select
          id="cat-subcategory"
          value={value ?? ''}
          disabled={disabled || !categoryId}
          onChange={(e) => onChange(e.target.value || null)}
        >
          <option value="">{categoryId ? 'Select a subcategory' : 'Pick a category first'}</option>
          {subcategories.map((s) => (
            <option key={s.id} value={s.id}>{s.name}</option>
          ))}
        </Select>
      </Field>
    </div>
  )
}
