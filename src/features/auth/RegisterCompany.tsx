import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AuthShell } from '@/layouts/AuthShell'
import { Button, Field, Input, Select } from '@/ui'
import { useT } from '@/i18n/LocaleProvider'
import { useData } from '@/data/DataProvider'
import { useSession } from '@/auth/SessionProvider'
import { validatePassword, validatePhoneOrEmail, validateRequired, normalisePhone } from './validation'
import type { ApiProblem, OrgKind } from '@/data/contracts'

export function RegisterCompany() {
  const t = useT()
  const api = useData()
  const navigate = useNavigate()
  const { setSession } = useSession()
  const [form, setForm] = useState({
    legalName: '', kind: 'manufacturer' as OrgKind, contactEmail: '',
    contactPhone: '', adminFullName: '', password: '',
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [failure, setFailure] = useState<ApiProblem | null>(null)
  const [busy, setBusy] = useState(false)
  const set = (k: keyof typeof form) => (e: { target: { value: string } }) =>
    setForm((f) => ({ ...f, [k]: e.target.value }))

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    const next: Record<string, string> = {}
    const checks: [string, ReturnType<typeof validateRequired>][] = [
      ['legalName', validateRequired(form.legalName)],
      ['adminFullName', validateRequired(form.adminFullName)],
      ['contactEmail', validatePhoneOrEmail(form.contactEmail)],
      ['contactPhone', validatePhoneOrEmail(form.contactPhone)],
      ['password', validatePassword(form.password)],
    ]
    for (const [k, err] of checks) if (err) next[k] = t(err)
    setErrors(next)
    if (Object.keys(next).length) return

    setBusy(true)
    try {
      setSession(await api.register({ ...form, contactPhone: normalisePhone(form.contactPhone) }))
      // Registration ends on the verification checklist, not the dashboard —
      // there is nothing useful to do until documents are submitted.
      navigate('/verification', { replace: true })
    } catch (err) {
      setFailure(err as ApiProblem)
    } finally {
      setBusy(false)
    }
  }

  return (
    <AuthShell
      title={t('auth.register.title')}
      subtitle={t('auth.register.subtitle')}
      footer={<>{t('auth.haveAccount')} <Link to="/login" className="text-primary underline">{t('action.signIn')}</Link></>}
    >
      <form onSubmit={submit} className="space-y-4" noValidate>
        <Field label={t('auth.legalName')} required error={errors.legalName} htmlFor="legalName">
          <Input id="legalName" value={form.legalName} onChange={set('legalName')} />
        </Field>
        <Field label={t('auth.kind')} required htmlFor="kind">
          <Select id="kind" value={form.kind} onChange={set('kind')}>
            <option value="manufacturer">{t('auth.kind.manufacturer')}</option>
            <option value="importer_supplier">{t('auth.kind.importer')}</option>
          </Select>
        </Field>
        <Field label={t('auth.contactEmail')} required error={errors.contactEmail} htmlFor="contactEmail">
          <Input id="contactEmail" type="email" value={form.contactEmail} onChange={set('contactEmail')} />
        </Field>
        <Field label={t('auth.contactPhone')} required error={errors.contactPhone} htmlFor="contactPhone">
          <Input id="contactPhone" value={form.contactPhone} onChange={set('contactPhone')} />
        </Field>
        <Field label={t('auth.adminName')} required error={errors.adminFullName} htmlFor="adminFullName">
          <Input id="adminFullName" value={form.adminFullName} onChange={set('adminFullName')} />
        </Field>
        <Field label={t('auth.password')} required error={errors.password} htmlFor="password">
          <Input id="password" type="password" autoComplete="new-password" value={form.password} onChange={set('password')} />
        </Field>
        {failure && <p role="alert" className="text-sm text-danger">{failure.detail ?? failure.title}</p>}
        <Button type="submit" loading={busy} className="w-full">{t('auth.register')}</Button>
      </form>
    </AuthShell>
  )
}
