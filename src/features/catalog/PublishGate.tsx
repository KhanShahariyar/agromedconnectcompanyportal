import { Link } from 'react-router-dom'
import { useT } from '@/i18n/LocaleProvider'
import type { PublishBlocker, PublishReadiness } from '@/data/contracts'

/** Where the fix for each blocker lives. A disabled button with no route out
 *  is the most common way a compliance rule reads as a bug. */
const FIX_ROUTE: Partial<Record<PublishBlocker, string>> = {
  missing_certificate: '/verification',
  certificate_not_verified: '/verification',
  certificate_expired: '/verification',
  organisation_unverified: '/verification',
  no_stock: '/inventory',
}

export function PublishGate({ readiness }: { readiness: PublishReadiness }) {
  const t = useT()
  if (readiness.canPublish) return null

  return (
    <div data-testid="publish-blockers" className="rounded-card border border-warning/40 bg-warning/10 p-4">
      <div className="mb-2 text-sm font-medium text-ink">{t('product.blockers')}</div>
      <ul className="space-y-1.5">
        {readiness.blockers.map((b) => (
          <li key={b} className="flex items-start gap-2 text-sm text-ink-soft">
            <span aria-hidden className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-warning" />
            <span>
              {t(`product.blocked.${b}` as never)}
              {FIX_ROUTE[b] && (
                <>
                  {' '}
                  <Link to={FIX_ROUTE[b]!} className="text-primary underline">{t('common.viewAll')}</Link>
                </>
              )}
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}
