import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AuthShell } from '@/layouts/AuthShell'
import { Button, Field, Input } from '@/ui'
import { useT } from '@/i18n/LocaleProvider'
import { useSession } from '@/auth/SessionProvider'
import { consumeReturnTo } from '@/auth/guards'
import { validatePhoneOrEmail, validatePassword, normalisePhone } from './validation'
import type { ApiProblem } from '@/data/contracts'

export function Login() {
  const t = useT()
  const navigate = useNavigate()
  const { signIn, loading } = useSession()
  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')
  const [errors, setErrors] = useState<{ identifier?: string; password?: string }>({})
  const [failure, setFailure] = useState<ApiProblem | null>(null)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    const idErr = validatePhoneOrEmail(identifier)
    const pwErr = validatePassword(password)
    setErrors({ identifier: idErr ? t(idErr) : undefined, password: pwErr ? t(pwErr) : undefined })
    if (idErr || pwErr) return

    setFailure(null)
    try {
      await signIn(normalisePhone(identifier), password)
      navigate(consumeReturnTo(), { replace: true })
    } catch (err) {
      setFailure(err as ApiProblem)
    }
  }

  return (
    <AuthShell
      title={t('auth.login.title')}
      subtitle={t('auth.login.subtitle')}
      footer={<>{t('auth.noAccount')} <Link to="/register" className="text-primary underline">{t('auth.register')}</Link></>}
    >
      <form onSubmit={submit} className="space-y-4" noValidate>
        <Field label={t('auth.identifier')} required error={errors.identifier} htmlFor="identifier">
          <Input id="identifier" name="identifier" autoComplete="username" value={identifier}
                 onChange={(e) => setIdentifier(e.target.value)} />
        </Field>

        <Field label={t('auth.password')} required error={errors.password} htmlFor="password">
          <Input id="password" name="password" type="password" autoComplete="current-password"
                 value={password} onChange={(e) => setPassword(e.target.value)} />
        </Field>

        {/* The API's problem detail is shown verbatim — a generic "login failed"
            hides the difference between a wrong password and a locked account. */}
        {failure && (
          <p role="alert" className="text-sm text-danger">{failure.detail ?? failure.title}</p>
        )}

        <Button type="submit" loading={loading} className="w-full">{t('action.signIn')}</Button>

        <div className="text-center">
          <Link to="/forgot-password" className="text-sm text-ink-soft underline">{t('auth.forgot')}</Link>
        </div>
      </form>
    </AuthShell>
  )
}
