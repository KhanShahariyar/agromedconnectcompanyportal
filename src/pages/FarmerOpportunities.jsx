import React, { useState } from 'react'
import { TrendingUp, MapPin, Users } from 'lucide-react'
import { PageHeader, Card, Badge, Button } from '../components/ui'
import { opportunities } from '../data/mockData'

const levels = [
  { key: 'all', label: 'All' },
  { key: 'high', label: 'High demand' },
  { key: 'medium', label: 'Rising' },
]

export default function FarmerOpportunities() {
  const [filter, setFilter] = useState('all')
  const list = filter === 'all' ? opportunities : opportunities.filter((o) => o.level === filter)

  return (
    <div>
      <PageHeader
        eyebrow="Demand discovery"
        title="Farmer opportunities"
        description="Real, aggregated demand from farmer searches, requests and browsing activity — respond before competitors do."
      />

      <div className="flex items-center gap-2 mb-5">
        {levels.map((l) => (
          <button
            key={l.key}
            onClick={() => setFilter(l.key)}
            className={`text-xs font-medium px-3 py-1.5 rounded-full border transition-colors ${
              filter === l.key
                ? 'bg-moss-600 text-white border-moss-600'
                : 'bg-panel text-ink-soft border-line hover:border-ink/30'
            }`}
          >
            {l.label}
          </button>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {list.map((op) => (
          <Card key={op.id} className="p-5 flex flex-col">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-md bg-moss-50 flex items-center justify-center text-xl shrink-0">
                  {op.icon}
                </div>
                <div>
                  <div className="text-sm font-semibold text-ink">{op.title}</div>
                  <div className="text-xs text-ink-faint">{op.crop} · {op.id}</div>
                </div>
              </div>
              <Badge tone={op.level}>
                <TrendingUp size={11} /> +{op.demandChange}%
              </Badge>
            </div>

            <p className="text-sm text-ink-soft mb-4 flex-1">{op.need}</p>

            <div className="flex items-center gap-4 text-xs text-ink-faint mb-4">
              <span className="flex items-center gap-1"><MapPin size={12} /> {op.location}</span>
              <span className="flex items-center gap-1"><Users size={12} /> {op.interestedFarmers} farmers interested</span>
            </div>

            <div className="mb-4">
              <div className="text-xs font-medium text-ink-faint mb-1.5">Suggested from your catalog</div>
              <div className="flex flex-wrap gap-1.5">
                {op.suggested.map((s) => (
                  <span key={s} className="text-xs bg-ink/[0.04] border border-line rounded-full px-2.5 py-1 text-ink-soft">
                    {s}
                  </span>
                ))}
              </div>
            </div>

            <div className="flex flex-wrap gap-2 pt-3 border-t border-line">
              <Button size="sm">View opportunity</Button>
              <Button size="sm" variant="secondary">Offer solution</Button>
              <Button size="sm" variant="ghost">Create promotion</Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}
