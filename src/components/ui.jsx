import React from 'react'
import { ArrowUpRight, ArrowRight } from 'lucide-react'

export function Card({ children, className = '', ...props }) {
  return (
    <div
      className={`bg-panel border border-line rounded-card shadow-card ${className}`}
      {...props}
    >
      {children}
    </div>
  )
}

export function PageHeader({ eyebrow, title, description, actions }) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between mb-6">
      <div>
        {eyebrow && (
          <div className="text-xs font-medium text-moss-600 mb-1.5">{eyebrow}</div>
        )}
        <h1 className="font-serif text-[26px] leading-tight text-ink">{title}</h1>
        {description && (
          <p className="text-ink-soft text-sm mt-1.5 max-w-xl">{description}</p>
        )}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  )
}

const badgeTones = {
  high: 'bg-wheat-50 text-wheat-600 border-wheat-100',
  medium: 'bg-clay-50 text-clay-600 border-clay-100',
  low: 'bg-moss-50 text-moss-600 border-moss-100',
  open: 'bg-rust-100 text-rust-600 border-rust-100',
  'in-progress': 'bg-wheat-50 text-wheat-600 border-wheat-100',
  resolved: 'bg-moss-50 text-moss-600 border-moss-100',
  active: 'bg-moss-50 text-moss-600 border-moss-100',
  draft: 'bg-ink/5 text-ink-soft border-line',
  ended: 'bg-ink/5 text-ink-faint border-line',
  Paid: 'bg-moss-50 text-moss-600 border-moss-100',
  Pending: 'bg-wheat-50 text-wheat-600 border-wheat-100',
  Refunded: 'bg-rust-100 text-rust-600 border-rust-100',
  Placed: 'bg-ink/5 text-ink-soft border-line',
  Confirmed: 'bg-wheat-50 text-wheat-600 border-wheat-100',
  Processing: 'bg-clay-50 text-clay-600 border-clay-100',
  Shipped: 'bg-moss-100 text-moss-700 border-moss-100',
  Delivered: 'bg-moss-50 text-moss-600 border-moss-100',
  neutral: 'bg-ink/5 text-ink-soft border-line',
}

export function Badge({ tone = 'neutral', children }) {
  const cls = badgeTones[tone] || badgeTones.neutral
  return (
    <span
      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border ${cls}`}
    >
      {children}
    </span>
  )
}

export function Button({ children, variant = 'primary', size = 'md', className = '', ...props }) {
  const sizes = {
    sm: 'text-xs px-3 py-1.5',
    md: 'text-sm px-4 py-2',
  }
  const variants = {
    primary: 'bg-moss-600 text-white hover:bg-moss-700 border border-moss-600',
    secondary: 'bg-panel text-ink border border-line hover:border-ink/30',
    ghost: 'bg-transparent text-ink-soft hover:text-ink border border-transparent',
    clay: 'bg-clay-500 text-white hover:bg-clay-600 border border-clay-500',
  }
  return (
    <button
      className={`inline-flex items-center justify-center gap-1.5 rounded-md font-medium transition-colors duration-150 whitespace-nowrap ${sizes[size]} ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}

export function LinkButton({ children, className = '', ...props }) {
  return (
    <button
      className={`inline-flex items-center gap-1 text-sm font-medium text-moss-600 hover:text-moss-700 transition-colors ${className}`}
      {...props}
    >
      {children}
      <ArrowRight size={14} />
    </button>
  )
}

export function StatCard({ label, value, delta, trend, mono = false }) {
  return (
    <Card className="p-5">
      <div className="text-xs text-ink-faint font-medium mb-2">{label}</div>
      <div className={`font-serif text-[26px] text-ink leading-none ${mono ? 'font-mono text-2xl' : ''}`}>
        {value}
      </div>
      {delta && (
        <div
          className={`inline-flex items-center gap-1 text-xs font-medium mt-2 ${
            trend === 'up' ? 'text-moss-600' : trend === 'down' ? 'text-rust-500' : 'text-ink-faint'
          }`}
        >
          {trend === 'up' && <ArrowUpRight size={13} />}
          {delta}
        </div>
      )}
    </Card>
  )
}

export function EmptyState({ icon, title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-16 px-6">
      {icon && <div className="text-3xl mb-3">{icon}</div>}
      <div className="font-serif text-lg text-ink mb-1">{title}</div>
      {description && <p className="text-sm text-ink-soft max-w-sm mb-4">{description}</p>}
      {action}
    </div>
  )
}

export function SectionLabel({ children }) {
  return <div className="text-xs font-medium text-ink-faint mb-3">{children}</div>
}

export function Table({ columns, children }) {
  return (
    <div className="scroll-x">
      <table className="w-full text-sm min-w-[720px]">
        <thead>
          <tr className="border-b border-line text-left">
            {columns.map((c) => (
              <th key={c} className="py-3 px-4 font-medium text-ink-faint text-xs first:pl-5 last:pr-5">
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  )
}

export function Tr({ children }) {
  return <tr className="border-b border-line/70 last:border-0 hover:bg-moss-50/40 transition-colors">{children}</tr>
}

export function Td({ children, className = '' }) {
  return <td className={`py-3.5 px-4 text-ink first:pl-5 last:pr-5 align-middle ${className}`}>{children}</td>
}

export function ProgressBar({ value, tone = 'moss' }) {
  const tones = {
    moss: 'bg-moss-500',
    clay: 'bg-clay-500',
    wheat: 'bg-wheat-500',
  }
  return (
    <div className="w-full h-1.5 bg-line rounded-full overflow-hidden">
      <div className={`h-full rounded-full ${tones[tone]}`} style={{ width: `${value}%` }} />
    </div>
  )
}
