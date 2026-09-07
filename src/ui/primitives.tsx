import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from 'react'
import { useT } from '@/i18n/LocaleProvider'

/* ------------------------------------------------------------------ Card */

export function Card({ children, className = '', ...rest }: { children: ReactNode; className?: string }) {
  return (
    <div className={`bg-panel border border-line rounded-card shadow-card ${className}`} {...rest}>
      {children}
    </div>
  )
}

export function PageHeader({ eyebrow, title, description, actions }: {
  eyebrow?: string
  title: string
  description?: string
  actions?: ReactNode
}) {
  return (
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        {eyebrow && <div className="mb-1.5 text-xs font-medium text-primary">{eyebrow}</div>}
        <h1 className="font-serif text-[26px] leading-tight text-ink">{title}</h1>
        {description && <p className="mt-1.5 max-w-xl text-sm text-ink-soft">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  )
}

export function SectionLabel({ children }: { children: ReactNode }) {
  return <div className="mb-2 text-[11px] font-medium uppercase tracking-wide text-ink-faint">{children}</div>
}

/* ---------------------------------------------------------------- Button */

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  size?: 'sm' | 'md'
  loading?: boolean
}

const BUTTON_SIZES = { sm: 'text-xs px-3 py-1.5', md: 'text-sm px-4 py-2' }
const BUTTON_VARIANTS = {
  // Never place <Logo/> inside a primary button — the mark's mid-green fights
  // #004B23 (C13).
  primary: 'bg-primary text-panel border border-primary hover:bg-primary-hover',
  secondary: 'bg-panel text-ink border border-line hover:border-ink-faint',
  ghost: 'bg-transparent text-ink-soft border border-transparent hover:text-ink',
  danger: 'bg-danger text-panel border border-danger hover:opacity-90',
}

export function Button({ children, variant = 'primary', size = 'md', loading, className = '', disabled, ...rest }: ButtonProps) {
  return (
    <button
      className={`inline-flex min-h-touch items-center justify-center gap-1.5 whitespace-nowrap rounded-md font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${BUTTON_SIZES[size]} ${BUTTON_VARIANTS[variant]} ${className}`}
      disabled={disabled || loading}
      {...rest}
    >
      {loading && <span className="h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" />}
      {children}
    </button>
  )
}

/* ----------------------------------------------------------------- Badge */

const BADGE_TONES: Record<string, string> = {
  neutral: 'bg-sunken text-ink-soft border-line',
  success: 'bg-panel text-success border-success/40',
  warning: 'bg-panel text-warning border-warning/40',
  danger: 'bg-panel text-danger border-danger/40',
  info: 'bg-panel text-info border-info/40',
  primary: 'bg-panel text-primary border-primary/30',
}

export function Badge({ tone = 'neutral', children }: { tone?: keyof typeof BADGE_TONES; children: ReactNode }) {
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-medium ${BADGE_TONES[tone] ?? BADGE_TONES.neutral}`}>
      {children}
    </span>
  )
}

/* ----------------------------------------------------------------- Forms */

export function Field({ label, error, hint, required, htmlFor, children }: {
  label: string
  error?: string | null
  hint?: string
  required?: boolean
  htmlFor?: string
  children: ReactNode
}) {
  return (
    <label className="block" htmlFor={htmlFor}>
      <span className="mb-1 block text-sm font-medium text-ink">
        {label}
        {required && <span className="ml-0.5 text-danger">*</span>}
      </span>
      {children}
      {hint && !error && <span className="mt-1 block text-xs text-ink-faint">{hint}</span>}
      {error && <span role="alert" className="mt-1 block text-xs text-danger">{error}</span>}
    </label>
  )
}

const CONTROL = 'w-full rounded-md border border-line bg-panel px-3 py-2 text-sm text-ink placeholder:text-ink-faint focus:border-primary focus:outline-none focus:ring-2 focus:ring-accent'

export function Input(props: InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={`${CONTROL} ${props.className ?? ''}`} />
}

export function Select(props: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className={`${CONTROL} ${props.className ?? ''}`} />
}

export function Textarea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className={`${CONTROL} min-h-[96px] ${props.className ?? ''}`} />
}

export function SearchInput({ value, onChange, placeholder }: {
  value: string
  onChange: (v: string) => void
  placeholder?: string
}) {
  const t = useT()
  return (
    <input
      type="search"
      role="searchbox"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder ?? t('action.search')}
      aria-label={t('action.search')}
      className={`${CONTROL} max-w-sm`}
    />
  )
}

/* ------------------------------------------------------------- StatTile */

/** The tile never formats — the caller passes an already-formatted string, so
 *  locale handling stays in one place. */
export function StatTile({ label, value, delta, tone = 'neutral' }: {
  label: string
  value: string
  delta?: string
  tone?: keyof typeof BADGE_TONES
}) {
  return (
    <Card className="p-4">
      <div className="text-xs text-ink-faint">{label}</div>
      <div className="mt-1 font-serif text-xl text-ink">{value}</div>
      {delta && <div className="mt-1"><Badge tone={tone}>{delta}</Badge></div>}
    </Card>
  )
}
