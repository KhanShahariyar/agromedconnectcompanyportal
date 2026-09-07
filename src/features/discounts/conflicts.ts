import type { Discount, DiscountConflict } from '@/data/contracts'

/**
 * Discount conflict resolution.
 *
 * `pricing.offer` permits two offers to cover the same listing over the same
 * dates, with `is_stackable`, `stack_group` and `stack_priority` deciding what
 * actually happens at checkout. Most of those combinations are intentional; one
 * is not, and it is the one worth blocking:
 *
 *   - both stackable in the same group  -> they stack. Fine.
 *   - different priorities              -> the higher priority wins. Fine.
 *   - equal priorities, neither stacks  -> nothing decides. Ambiguous.
 *
 * The third case is a coin flip at checkout, so it is reported as `ambiguous`
 * and the editor refuses to save until a human settles it.
 *
 * Pure and synchronous by design: this is the rule Phase 2 must reimplement
 * server-side, and a pure function is the clearest possible specification of it.
 */

/** Listings a category contains, so category-scoped offers can be compared. */
export type CategoryMembers = Record<string, string[]>

const LIVE_STATUSES = new Set<Discount['status']>(['draft', 'pending_approval', 'active', 'paused'])

function listingsOf(d: Discount, categories: CategoryMembers): string[] {
  return d.scope.kind === 'listing' ? d.scope.listingIds : (categories[d.scope.categoryId] ?? [])
}

/** Inclusive overlap of two half-open windows; `null` end means open-ended. */
function overlap(
  aFrom: string, aTo: string | null, bFrom: string, bTo: string | null,
): { from: string; to: string | null } | null {
  const from = aFrom > bFrom ? aFrom : bFrom
  if (aTo === null && bTo === null) return { from, to: null }
  const to = aTo === null ? bTo : bTo === null ? aTo : aTo < bTo ? aTo : bTo
  if (to !== null && to <= from) return null
  return { from, to }
}

export function detectConflicts(
  draft: Discount,
  existing: Discount[],
  categories: CategoryMembers = {},
): DiscountConflict[] {
  const draftListings = new Set(listingsOf(draft, categories))
  const conflicts: DiscountConflict[] = []

  for (const other of existing) {
    if (other.id === draft.id) continue
    if (!LIVE_STATUSES.has(other.status)) continue

    const shared = listingsOf(other, categories).filter((id) => draftListings.has(id))
    if (shared.length === 0) continue

    const window = overlap(draft.startsAt, draft.endsAt, other.startsAt, other.endsAt)
    if (!window) continue

    const bothStack =
      draft.isStackable && other.isStackable &&
      draft.stackGroup !== null && draft.stackGroup === other.stackGroup

    let resolution: DiscountConflict['resolution']
    let winningDiscountId: string | null

    if (bothStack) {
      resolution = 'stacked'
      winningDiscountId = null
    } else if (draft.stackPriority !== other.stackPriority) {
      resolution = 'highest_priority_wins'
      winningDiscountId = draft.stackPriority > other.stackPriority ? draft.id : other.id
    } else {
      resolution = 'ambiguous'
      winningDiscountId = null
    }

    for (const listingId of shared) {
      conflicts.push({
        listingId,
        listingName: listingId,
        discountIds: [draft.id, other.id],
        overlapFrom: window.from,
        overlapTo: window.to,
        resolution,
        winningDiscountId,
      })
    }
  }

  return conflicts
}

/** Only ambiguity blocks a save; stacking and priority are warnings. */
export function blockingConflicts(conflicts: DiscountConflict[]): DiscountConflict[] {
  return conflicts.filter((c) => c.resolution === 'ambiguous')
}
