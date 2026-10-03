import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { AuthShell } from '@/layouts/AuthShell'
import { Button, Field, Input } from '@/ui'
import { useT } from '@/i18n/LocaleProvider'
import { useData } from '@/data/DataProvider'
import { useSession } from '@/auth/SessionProvider'
import { validatePassword } from './validation'
import type { ApiProblem } from '@/data/contracts'

export function AcceptInvitation() {
  const t = useT()
  const api = useData()
  const navigate = useNavigate()
  const { setSession } = useSession()
  const [params] = useSearchParams()
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string>()
  const [failure, setFailure] = useState<ApiProblem | null>(null)
  const [busy, setBusy] = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    const err = validatePassword(password)
    setError(err ? t(err) : undefined)
    if (err) return
    setBusy(true)
    try {
      setSession(await api.acceptInvitation(params.get('token') ?? '', password))
      navigate('/', { replace: true })
    } catch (e2) {
      setFailure(e2 as ApiProblem)
    } finally {
      setBusy(false)
    }
  }

  return (
    <AuthShell title={t('auth.invite.title')} subtitle={t('auth.invite.subtitle')}>
      <form onSubmit={submit} className="space-y-4" noValidate>
        <Field label={t('auth.newPassword')} required error={error} htmlFor="password">
          <Input id="password" type="password" autoComplete="new-password" value={password}
                 onChange={(e) => setPassword(e.target.value)} />
        </Field>
        {failure && <p role="alert" className="text-sm text-danger">{failure.detail ?? failure.title}</p>}
        <Button type="submit" loading={busy} className="w-full">{t('action.save')}</Button>
      </form>
    </AuthShell>
  )
}
