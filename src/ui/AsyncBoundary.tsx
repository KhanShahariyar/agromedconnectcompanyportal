import type { ReactNode } from 'react'
import { useT } from '@/i18n/LocaleProvider'
import type { QueryResult } from '@/data/useQuery'
import { Button, Card } from './primitives'

export function Skeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div data-testid="skeleton" role="status" aria-busy="true" className="space-y-2">
      <span className="sr-only">Loading</span>
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="h-10 animate-pulse rounded-md bg-sunken" />
      ))}
    </div>
  )
}

export function EmptyState({ title, body, action }: { title?: string; body?: string; action?: ReactNode }) {
  const t = useT()
  return (
    <Card className="p-10 text-center">
      <div className="font-serif text-lg text-ink">{title ?? t('state.empty.title')}</div>
      <p className="mx-auto mt-1 max-w-sm text-sm text-ink-soft">{body ?? t('state.empty.body')}</p>
      {action && <div className="mt-4">{action}</div>}
    </Card>
  )
}

export function ErrorState({ detail, onRetry }: { detail?: string; onRetry: () => void }) {
  const t = useT()
  return (
    <Card className="p-10 text-center">
      <div role="alert" className="font-serif text-lg text-danger">{t('state.error.title')}</div>
      {detail && <p className="mx-auto mt-1 max-w-sm text-sm text-ink-soft">{detail}</p>}
      <Button variant="secondary" className="mt-4" onClick={onRetry}>{t('state.error.retry')}</Button>
    </Card>
  )
}

function isEmpty(data: unknown): boolean {
  if (Array.isArray(data)) return data.length === 0
  if (data && typeof data === 'object' && 'items' in data) {
    return Array.isArray((data as { items: unknown[] }).items) && (data as { items: unknown[] }).items.length === 0
  }
  return false
}

export function AsyncBoundary<T>({ query, empty, children }: {
  query: QueryResult<T>
  empty?: ReactNode
  children: (data: T) => ReactNode
}) {
  if (query.error) return <ErrorState detail={query.error.detail} onRetry={query.refetch} />
  if (query.data === undefined) return query.loading ? <Skeleton /> : <EmptyState />
  if (isEmpty(query.data)) return <>{empty ?? <EmptyState />}</>
  return <>{children(query.data)}</>
}
