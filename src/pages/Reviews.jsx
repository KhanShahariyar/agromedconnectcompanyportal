import React from 'react'
import { Star, ShieldCheck } from 'lucide-react'
import { PageHeader, Card, Badge, Button, ProgressBar, SectionLabel } from '../components/ui'
import { reviews, trustFactors, company } from '../data/mockData'

export default function Reviews() {
  return (
    <div>
      <PageHeader
        eyebrow="Reputation"
        title="Reviews & trust"
        description="What farmers and customers say about your products and services — and how it shapes your trust score."
      />

      <div className="grid lg:grid-cols-3 gap-5 mb-6">
        <Card className="p-6 flex flex-col items-center justify-center text-center">
          <div className="flex items-center gap-1.5 text-moss-600 mb-2">
            <ShieldCheck size={16} />
            <span className="text-xs font-medium">Trust score</span>
          </div>
          <div className="font-serif text-5xl text-ink">{company.trustScore}</div>
          <div className="text-xs text-ink-faint mt-1">out of 100</div>
        </Card>

        <Card className="p-6 lg:col-span-2">
          <SectionLabel>Trust factors</SectionLabel>
          <div className="space-y-3">
            {trustFactors.map((f) => (
              <div key={f.label}>
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="text-ink-soft">{f.label}</span>
                  <span className="text-ink-faint text-xs">{f.score}%</span>
                </div>
                <ProgressBar value={f.score} tone="moss" />
              </div>
            ))}
          </div>
        </Card>
      </div>

      <SectionLabel>Customer & farmer reviews</SectionLabel>
      <div className="space-y-3">
        {reviews.map((r) => (
          <Card key={r.id} className="p-4">
            <div className="flex items-start justify-between mb-2">
              <div>
                <div className="text-sm font-medium text-ink">{r.farmer}</div>
                <div className="text-xs text-ink-faint">{r.product} · {r.date}</div>
              </div>
              <div className="flex items-center gap-0.5">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} size={13} className={i < r.rating ? 'fill-wheat-500 text-wheat-500' : 'text-line'} />
                ))}
              </div>
            </div>
            <p className="text-sm text-ink-soft mb-3">{r.text}</p>
            <div className="flex items-center gap-2">
              {r.replied ? (
                <Badge tone="active">Replied</Badge>
              ) : (
                <Button size="sm" variant="secondary">Reply</Button>
              )}
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}
