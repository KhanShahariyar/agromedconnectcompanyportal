import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { AuthShell } from '@/layouts/AuthShell'
import { Button, Field, Input } from '@/ui'
import { useT } from '@/i18n/LocaleProvider'
import { useData } from '@/data/DataProvider'
import { validatePassword } from './validation'
import type { ApiProblem } from '@/data/contracts'

export function ResetPassword() {
  const t = useT()
  const api = useData()
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [errors, setErrors] = useState<{ password?: string; confirm?: string }>({})
  const [failure, setFailure] = useState<ApiProblem | null>(null)
  const [busy, setBusy] = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    const pwErr = validatePassword(password)
    const matchErr = password !== confirm ? 'validation.passwordMatch' as const : null
    setErrors({ password: pwErr ? t(pwErr) : undefined, confirm: matchErr ? t(matchErr) : undefined })
    if (pwErr || matchErr) return
    setBusy(true)
    try {
      await api.resetPassword(params.get('token') ?? '', password)
      navigate('/login', { replace: true })
    } catch (err) {
      setFailure(err as ApiProblem)
    } finally {
      setBusy(false)
    }
  }

  return (
    <AuthShell
      title={t('auth.reset.title')}
      footer={<Link to="/login" className="text-primary underline">{t('auth.backToLogin')}</Link>}
    >
      <form onSubmit={submit} className="space-y-4" noValidate>
        <Field label={t('auth.newPassword')} required error={errors.password} htmlFor="password">
          <Input id="password" type="password" autoComplete="new-password" value={password}
                 onChange={(e) => setPassword(e.target.value)} />
        </Field>
        <Field label={t('auth.confirmPassword')} required error={errors.confirm} htmlFor="confirm">
          <Input id="confirm" type="password" autoComplete="new-password" value={confirm}
                 onChange={(e) => setConfirm(e.target.value)} />
        </Field>
        {failure && <p role="alert" className="text-sm text-danger">{failure.detail ?? failure.title}</p>}
        <Button type="submit" loading={busy} className="w-full">{t('auth.reset.submit')}</Button>
      </form>
    </AuthShell>
  )
}
