import { useState } from 'react'
import { useData } from '@/data/DataProvider'
import { useQuery } from '@/data/useQuery'
import { useT } from '@/i18n/LocaleProvider'
import { AsyncBoundary, Badge, Button, PageHeader, Pagination, SearchInput, Table } from '@/ui'
import type { Column } from '@/ui'
import { Gate } from '@/access/Gate'
import type { ApiProblem, Member, PortalRole } from '@/data/contracts'

export function Team() {
  const t = useT()
  const api = useData()
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [nonce, setNonce] = useState(0)
  const [failure, setFailure] = useState<ApiProblem | null>(null)
  const q = useQuery(['members', search, page, nonce], () => api.listMembers({ search, page, pageSize: 10 }))

  async function remove(m: Member) {
    setFailure(null)
    try {
      await api.removeMember(m.membershipId)
      setNonce((n) => n + 1)
    } catch (e) {
      setFailure(e as ApiProblem)
    }
  }

  const columns: Column<Member>[] = [
    { key: 'name', header: t('col.name'), render: (m) => (
      <div><div className="text-ink">{m.user.fullName}</div><div className="text-xs text-ink-faint">{m.user.phoneE164}</div></div>
    ) },
    { key: 'role', header: t('team.title'), render: (m) => (
      <div>
        <Badge tone="primary">{t(`role.${m.role}` as never)}</Badge>
        <p className="mt-1 max-w-xs text-xs text-ink-faint">{t(`role.${m.role}.summary` as never)}</p>
      </div>
    ) },
    { key: 'overrides', header: t('team.overrides'), render: (m) =>
      m.overrides.length === 0 ? <span className="text-ink-faint">{t('common.none')}</span> : (
        <ul className="space-y-0.5 text-xs">
          {m.overrides.map((o) => (
            <li key={o.permission} data-testid={`override-${o.permission}`}>
              <span className="font-mono text-ink-soft">{o.permission}</span>{' '}
              <span className={o.effect === 'deny' ? 'text-danger' : 'text-success'}>
                {t(o.effect === 'deny' ? 'team.override.denied' : 'team.override.granted')}
              </span>
            </li>
          ))}
        </ul>
      ) },
    { key: 'actions', header: '', align: 'right', render: (m) => (
      <Gate action="member.remove">
        <Button size="sm" variant="secondary" onClick={() => remove(m)}>{t('team.remove')}</Button>
      </Gate>
    ) },
  ]

  return (
    <div>
      <PageHeader
        title={t('team.title')}
        description={t('team.subtitle')}
        actions={<Gate action="member.invite"><Button>{t('team.invite')}</Button></Gate>}
      />
      {/* Prevents a company locking itself out of its own account — far cheaper
          to prevent than to repair through support. */}
      {failure && <p role="alert" className="mb-4 text-sm text-danger">{failure.code === 'last_admin' ? t('team.lastAdmin') : failure.title}</p>}

      <div className="mb-4"><SearchInput value={search} onChange={(v) => { setSearch(v); setPage(1) }} /></div>

      <AsyncBoundary query={q}>
        {(p) => (
          <>
            <Table columns={columns} rows={p.items} rowKey={(m) => m.membershipId} />
            <Pagination page={p.page} pageSize={p.pageSize} total={p.total} onChange={setPage} />
          </>
        )}
      </AsyncBoundary>
    </div>
  )
}

export type { PortalRole }
