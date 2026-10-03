import { useEffect, useState } from 'react'
import { useData } from '@/data/DataProvider'
import { useQuery } from '@/data/useQuery'
import { useFormat, useT } from '@/i18n/LocaleProvider'
import {
  AsyncBoundary, Badge, Button, Card, Field, PageHeader, Pagination, Select,
  SectionLabel, Table, Textarea, Input,
} from '@/ui'
import type { Column } from '@/ui'
import { Gate } from '@/access/Gate'
import { onPushMessage } from '@/push/push'
import type { AppNotification, Payout, Review } from '@/data/contracts'

export function Reviews() {
  const t = useT()
  const f = useFormat()
  const api = useData()
  const [page, setPage] = useState(1)
  const [nonce, setNonce] = useState(0)
  const [draft, setDraft] = useState<Record<string, string>>({})
  const q = useQuery(['reviews', page, nonce], (signal) => api.withSignal(signal).listReviews({ page, pageSize: 10 }))

  return (
    <div>
      <PageHeader title={t('reviews.title')} description={t('reviews.subtitle')} />
      <AsyncBoundary query={q}>
        {(p) => (
          <>
            <ul className="space-y-4">
              {p.items.map((r: Review) => (
                <li key={r.id}>
                  <Card className="p-5">
                    <div className="flex items-baseline gap-2">
                      <span className="text-ink">{r.listingName}</span>
                      <Badge tone={r.rating >= 4 ? 'success' : r.rating >= 3 ? 'warning' : 'danger'}>
                        {f.number(r.rating)} / {f.number(5)}
                      </Badge>
                      <span className="ml-auto text-xs text-ink-faint">{f.date(r.createdAt, 'short')}</span>
                    </div>
                    <p className="mt-2 text-sm text-ink-soft">{r.body}</p>
                    {r.response ? (
                      <p className="mt-3 rounded-md bg-sunken p-3 text-sm text-ink">
                        <span className="mr-2 text-xs text-ink-faint">{t('reviews.responded')}</span>
                        {r.response.body}
                      </p>
                    ) : (
                      <div className="mt-3 space-y-2">
                        <Textarea
                          aria-label={t('reviews.respond')}
                          value={draft[r.id] ?? ''}
                          onChange={(e) => setDraft((d) => ({ ...d, [r.id]: e.target.value }))}
                        />
                        <Gate action="review.respond">
                          <Button
                            size="sm"
                            disabled={!draft[r.id]?.trim()}
                            onClick={async () => { await api.respondToReview(r.id, draft[r.id] ?? ''); setNonce((n) => n + 1) }}
                          >
                            {t('reviews.respond')}
                          </Button>
                        </Gate>
                      </div>
                    )}
                  </Card>
                </li>
              ))}
            </ul>
            <Pagination page={p.page} pageSize={p.pageSize} total={p.total} onChange={setPage} />
          </>
        )}
      </AsyncBoundary>
    </div>
  )
}

export function Payments() {
  const t = useT()
  const f = useFormat()
  const api = useData()
  const [page, setPage] = useState(1)
  const q = useQuery(['payouts', page], (signal) => api.withSignal(signal).listPayouts({ page, pageSize: 10 }))

  const columns: Column<Payout>[] = [
    { key: 'ref', header: t('col.order'), render: (p) => <span className="font-mono text-xs">{p.reference}</span> },
    { key: 'amount', header: t('col.total'), align: 'right', render: (p) => f.money(p.amount) },
    { key: 'status', header: t('col.status'), render: (p) => <Badge tone={p.status === 'paid' ? 'success' : 'warning'}>{p.status}</Badge> },
    { key: 'deductions', header: t('payments.deductions'), render: (p) =>

      p.deductions.length === 0 ? <span className="text-ink-faint">{t('common.none')}</span> : (
        <ul className="text-xs text-ink-soft">
          {p.deductions.map((d) => <li key={d.label}>{d.label} −{f.money(d.amount)}</li>)}
        </ul>
      ) },
    { key: 'requested', header: t('col.placed'), render: (p) => f.date(p.requestedAt, 'short') },
  ]

  return (
    <div>
      <PageHeader
        title={t('payments.title')}
        description={t('payments.subtitle')}
        actions={<Gate action="payout.request"><Button>{t('payments.request')}</Button></Gate>}
      />
      <AsyncBoundary query={q}>
        {(p) => (
          <>
            <Table columns={columns} rows={p.items} rowKey={(x) => x.id} />
            <Pagination page={p.page} pageSize={p.pageSize} total={p.total} onChange={setPage} />
          </>
        )}
      </AsyncBoundary>
    </div>
  )
}

export function Notifications() {
  const t = useT()
  const f = useFormat()
  const api = useData()
  const [page, setPage] = useState(1)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const q = useQuery(['notifications', page], (signal) => api.withSignal(signal).listNotifications({ page, pageSize: 20 }))

  const refetch = q.refetch
  useEffect(() => onPushMessage(() => { refetch() }), [refetch])

  const markRead = async (id?: string) => {
    setBusy(true); setError('')
    try { await api.markNotificationsRead(id); setPage(1); q.refetch() }
    catch { setError(t('notifications.deleteError')) }
    finally { setBusy(false) }
  }

  return (
    <div>
      <PageHeader title={t('notifications.title')} />
      <Button disabled={busy} onClick={() => markRead()}>{t('notifications.markAll')}</Button>
      {error && <p role="alert">{error}</p>}
      <AsyncBoundary query={q}>
        {(p) => (
          <ul className="space-y-2">
            {p.items.map((n: AppNotification) => (
              <li key={n.id}>
                <Card className="p-4 border-primary/30">
                  <div className="flex items-baseline gap-2">
                    <span className="text-ink">{n.title}</span>
                    <span className="ml-auto text-xs text-ink-faint">{f.dateTime(n.createdAt)}</span>
                  </div>
                  <p className="mt-1 text-sm text-ink-soft">{n.body}</p>
                  <small>{n.sender}</small>
                  <Button disabled={busy} onClick={() => markRead(n.id)}>{t('notifications.markOne')}</Button>
                </Card>
              </li>
            ))}
          </ul>
        )}
      </AsyncBoundary>
      <Button disabled={page === 1 || busy} onClick={() => setPage(page - 1)}>←</Button>
      <Button disabled={(q.data?.items.length ?? 0) < 20 || busy} onClick={() => setPage(page + 1)}>→</Button>
    </div>
  )
}

export function Feedback() {
  const t = useT()
  const api = useData()
  const [form, setForm] = useState({ category: 'bug' as const, subject: '', body: '' })
  const [sent, setSent] = useState(false)

  return (
    <div>
      <PageHeader title={t('feedback.title')} description={t('feedback.subtitle')} />
      <Card className="max-w-xl p-5">
        {sent ? (
          <p role="status" className="text-sm text-ink">{t('feedback.sent')}</p>
        ) : (
          <form
            className="space-y-4"
            onSubmit={async (e) => { e.preventDefault(); await api.submitFeedback(form); setSent(true) }}
          >
            <Field label={t('feedback.category')} htmlFor="cat">
              <Select id="cat" value={form.category} onChange={(e) => setForm((s) => ({ ...s, category: e.target.value as typeof form.category }))}>
                <option value="bug">{t('feedback.cat.bug')}</option>
                <option value="feature">{t('feedback.cat.feature')}</option>
                <option value="billing">{t('feedback.cat.billing')}</option>
                <option value="other">{t('feedback.cat.other')}</option>
              </Select>
            </Field>
            <Field label={t('feedback.subject')} required htmlFor="subject">
              <Input id="subject" value={form.subject} onChange={(e) => setForm((s) => ({ ...s, subject: e.target.value }))} />
            </Field>
            <Field label={t('feedback.body')} required htmlFor="body">
              <Textarea id="body" value={form.body} onChange={(e) => setForm((s) => ({ ...s, body: e.target.value }))} />
            </Field>
            <Button type="submit" disabled={!form.subject.trim() || !form.body.trim()}>{t('feedback.submit')}</Button>
          </form>
        )}
      </Card>
    </div>
  )
}

export function SolutionCenter() {
  const t = useT()
  const f = useFormat()
  const api = useData()
  const q = useQuery(['solutions'], (signal) => api.withSignal(signal).listSolutions())

  return (
    <div>
      <PageHeader title={t('solutions.title')} description={t('solutions.subtitle')} />
      <AsyncBoundary query={q}>
        {(list) => (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {list.map((s) => (
              <Card key={s.id} className="flex flex-col p-5">
                <Badge tone={s.status === 'active' ? 'success' : 'neutral'}>{s.status}</Badge>
                <div className="mt-2 font-serif text-lg text-ink">{s.title}</div>
                <div className="text-xs text-ink-faint">{s.target}</div>
                <ul className="mt-3 flex-1 space-y-1 text-sm text-ink-soft">
                  {s.includes.map((i) => <li key={i}>· {i}</li>)}
                </ul>
                <div className="mt-4 border-t border-line pt-3 font-serif text-xl text-ink">{f.money(s.price)}</div>
              </Card>
            ))}
          </div>
        )}
      </AsyncBoundary>
    </div>
  )
}

export function CompanyProfile() {
  const t = useT()
  const api = useData()
  const q = useQuery(['organisation'], (signal) => api.withSignal(signal).getOrganisation())
  return (
    <div>
      <PageHeader title={t('profile.title')} description={t('profile.subtitle')} />
      <AsyncBoundary query={q}>
        {(org) => (
          <Card className="max-w-2xl p-5">
            <dl className="grid grid-cols-2 gap-4 text-sm">
              <div><dt className="text-ink-faint">{t('auth.legalName')}</dt><dd className="text-ink">{org.legalName}</dd></div>
              <div><dt className="text-ink-faint">{t('auth.kind')}</dt><dd className="text-ink">{org.kind}</dd></div>
              <div><dt className="text-ink-faint">{t('verify.doc.trade_licence')}</dt><dd className="text-ink">{org.tradeLicenceNo ?? '—'}</dd></div>
              <div><dt className="text-ink-faint">{t('verify.doc.bin')}</dt><dd className="text-ink">{org.binNumber ?? '—'}</dd></div>
              <div><dt className="text-ink-faint">{t('auth.contactPhone')}</dt><dd className="text-ink">{org.contactPhone ?? '—'}</dd></div>
              <div><dt className="text-ink-faint">{t('auth.contactEmail')}</dt><dd className="text-ink">{org.contactEmail ?? '—'}</dd></div>
            </dl>
          </Card>
        )}
      </AsyncBoundary>
    </div>
  )
}

export function HelpCenter() {
  const t = useT()
  return (
    <div>
      <PageHeader title={t('help.title')} />
      <Card className="max-w-2xl p-5 text-sm text-ink-soft">{t('state.empty.body')}</Card>
    </div>
  )
}

export function ContactSupport() {
  const t = useT()
  return (
    <div>
      <PageHeader title={t('support.title')} />
      <Card className="max-w-2xl p-5 text-sm text-ink-soft">
        <SectionLabel>{t('support.title')}</SectionLabel>
        support@agromedconnect.com.bd
      </Card>
    </div>
  )
}
