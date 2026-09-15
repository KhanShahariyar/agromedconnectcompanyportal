import { useState } from 'react'
import { Link } from 'react-router-dom'
import { AuthShell } from '@/layouts/AuthShell'
import { Button, Field, Input } from '@/ui'
import { useT } from '@/i18n/LocaleProvider'
import { useData } from '@/data/DataProvider'
import { validatePhoneOrEmail, normalisePhone } from './validation'

export function ForgotPassword() {
  const t = useT()
  const api = useData()
  const [identifier, setIdentifier] = useState('')
  const [error, setError] = useState<string>()
  const [sent, setSent] = useState(false)
  const [busy, setBusy] = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    const err = validatePhoneOrEmail(identifier)
    setError(err ? t(err) : undefined)
    if (err) return
    setBusy(true)
    try {
      await api.forgotPassword(normalisePhone(identifier))
    } finally {
      setBusy(false)

      setSent(true)
    }
  }

  return (
    <AuthShell
      title={t('auth.forgot.title')}
      subtitle={t('auth.forgot.subtitle')}
      footer={<Link to="/login" className="text-primary underline">{t('auth.backToLogin')}</Link>}
    >
      {sent ? (
        <p className="text-sm text-ink-soft">{t('auth.forgot.sent')}</p>
      ) : (
        <form onSubmit={submit} className="space-y-4" noValidate>
          <Field label={t('auth.identifier')} required error={error} htmlFor="identifier">
            <Input id="identifier" value={identifier} onChange={(e) => setIdentifier(e.target.value)} />
          </Field>
          <Button type="submit" loading={busy} className="w-full">{t('auth.forgot.submit')}</Button>
        </form>
      )}
    </AuthShell>
  )
}
