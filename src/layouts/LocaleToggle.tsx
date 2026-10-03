import { useLocale, useT } from '@/i18n/LocaleProvider'

export function LocaleToggle({ className = '' }: { className?: string }) {
  const { locale, setLocale } = useLocale()
  const t = useT()
  return (
    <button
      type="button"
      onClick={() => setLocale(locale === 'en-US' ? 'bn-BD' : 'en-US')}
      className={`min-h-touch rounded-md border border-line px-3 text-sm text-ink-soft hover:text-ink ${className}`}
    >
      {t('locale.toggle')}
    </button>
  )
}
