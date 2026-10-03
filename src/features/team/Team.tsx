import { useState } from 'react'
import { useData } from '@/data/DataProvider'
import { useQuery } from '@/data/useQuery'
import { useT } from '@/i18n/LocaleProvider'
import { AsyncBoundary, Badge, Button, Field, Input, Modal, PageHeader, Pagination, SearchInput, Select, Table } from '@/ui'
import type { Column } from '@/ui'
import { Gate } from '@/access/Gate'
import { PORTAL_ROLES } from '@/data/contracts'
import type { ApiProblem, InvitationIssued, Member, PortalRole } from '@/data/contracts'

export function Team() {
  const t = useT()
  const api = useData()
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [nonce, setNonce] = useState(0)
  const [failure, setFailure] = useState<ApiProblem | null>(null)
  const [inviting, setInviting] = useState(false)
  const [identifier, setIdentifier] = useState('')
  const [role, setRole] = useState<PortalRole>('manager')
  const [sending, setSending] = useState(false)
  const [issued, setIssued] = useState<InvitationIssued | null>(null)
  const q = useQuery(['members', search, page, nonce], (signal) => api.withSignal(signal).listMembers({ search, page, pageSize: 10 }))

  function openInvite() {
    setFailure(null)
    setIssued(null)
    setIdentifier('')
    setRole('manager')
    setInviting(true)
  }

  async function invite() {
    setFailure(null)
    setSending(true)
    try {

      setIssued(await api.inviteMember(identifier.trim(), role))
      setNonce((n) => n + 1)
    } catch (e) {
      setFailure(e as ApiProblem)
    } finally {
      setSending(false)
    }
  }

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
        actions={<Gate action="member.invite"><Button onClick={openInvite}>{t('team.invite')}</Button></Gate>}
      />
      {
}
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

      <Modal
        open={inviting}
        title={t('team.invite')}
        onClose={() => setInviting(false)}
        footer={issued
          ? <Button onClick={() => setInviting(false)}>{t('action.done')}</Button>
          : (
            <>
              <Button variant="secondary" onClick={() => setInviting(false)}>{t('action.cancel')}</Button>
              <Button loading={sending} disabled={identifier.trim().length === 0} onClick={invite}>
                {t('team.invite.send')}
              </Button>
            </>
          )}
      >
        {issued ? (
          <div className="space-y-2">
            <p>{t('team.invite.issued')}</p>
            <code
              data-testid="invitation-link"
              className="block break-all rounded-input border border-line bg-canvas p-2 font-mono text-xs text-ink"
            >
              {`${window.location.origin}/accept-invitation?token=${issued.token}`}
            </code>
            <p className="text-xs text-ink-faint">{t('team.invite.once')}</p>
          </div>
        ) : (
          <div className="space-y-4">
            <Field label={t('team.invite.identifier')} htmlFor="invite-identifier" required>
              <Input
                id="invite-identifier"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="name@example.com"
              />
            </Field>
            <Field label={t('team.invite.role')} htmlFor="invite-role" required>
              <Select id="invite-role" value={role} onChange={(e) => setRole(e.target.value as PortalRole)}>
                {PORTAL_ROLES.map((r) => <option key={r} value={r}>{t(`role.${r}` as never)}</option>)}
              </Select>
            </Field>
          </div>
        )}
      </Modal>
    </div>
  )
}

export type { PortalRole }
