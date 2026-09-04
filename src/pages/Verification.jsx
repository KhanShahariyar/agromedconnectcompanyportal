import React from 'react'
import { ShieldCheck, CheckCircle2 } from 'lucide-react'
import { PageHeader, Card, SectionLabel, ProgressBar } from '../components/ui'
import { company, trustFactors } from '../data/mockData'

const checks = [
  { label: 'Company verified', done: true },
  { label: 'Business information verified', done: true },
  { label: 'Product information verified', done: true },
  { label: 'Tax / trade license verified', done: true },
  { label: 'Bank account verified', done: false },
]

export default function Verification() {
  return (
    <div>
      <PageHeader
        eyebrow="Trust center"
        title="Verification"
        description="Verification builds farmer confidence and unlocks higher placement in search and opportunities."
      />

      <div className="grid lg:grid-cols-3 gap-5">
        <Card className="p-6 text-center">
          <ShieldCheck size={28} className="text-moss-600 mx-auto mb-2" />
          <div className="font-serif text-5xl text-ink">{company.trustScore}</div>
          <div className="text-xs text-ink-faint mt-1">Trust score / 100</div>
        </Card>

        <Card className="p-5 lg:col-span-2">
          <SectionLabel>Verification checklist</SectionLabel>
          <div className="space-y-2.5">
            {checks.map((c) => (
              <div key={c.label} className="flex items-center gap-2.5">
                <CheckCircle2 size={16} className={c.done ? 'text-moss-600' : 'text-line'} />
                <span className={`text-sm ${c.done ? 'text-ink' : 'text-ink-faint'}`}>{c.label}</span>
                {!c.done && <span className="text-xs text-clay-600 ml-auto">Action needed</span>}
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Card className="p-5 mt-5">
        <SectionLabel>What builds your trust score</SectionLabel>
        <div className="grid sm:grid-cols-2 gap-x-8 gap-y-3">
          {trustFactors.map((f) => (
            <div key={f.label}>
              <div className="flex items-center justify-between text-sm mb-1">
                <span className="text-ink-soft">{f.label}</span>
                <span className="text-ink-faint text-xs">{f.score}%</span>
              </div>
              <ProgressBar value={f.score} />
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}
