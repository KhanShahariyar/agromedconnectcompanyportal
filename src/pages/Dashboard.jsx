import React from 'react'
import { Link } from 'react-router-dom'
import { Plus, Sprout, Sparkles, ArrowRight } from 'lucide-react'
import { Card, Button, Badge, LinkButton, StatCard, SectionLabel } from '../components/ui'
import {
  company,
  kpis,
  opportunities,
  farmerRequests,
  insights,
  seasonalOpportunities,
} from '../data/mockData'

const demandTone = { high: 'high', medium: 'medium', low: 'low' }

export default function Dashboard() {
  const openRequests = farmerRequests.filter((r) => r.status !== 'resolved').slice(0, 4)

  return (
    <div>
      <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4 mb-8">
        <div>
          <h1 className="font-serif text-[28px] text-ink">
            Good morning, {company.name.split(' ')[0]} {company.name.split(' ')[1]} 🌱
          </h1>
          <p className="text-ink-soft text-sm mt-1.5 max-w-lg">
            Grow your business while creating better opportunities for farmers.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary">
            <Plus size={15} /> Add Product
          </Button>
          <Button variant="secondary">
            <Plus size={15} /> Create Service
          </Button>
          <Link to="/opportunities">
            <Button>
              <Sprout size={15} /> View Farmer Opportunities
            </Button>
          </Link>
        </div>
      </div>

      <SectionLabel>Business overview</SectionLabel>
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3 mb-8">
        {kpis.map((k) => (
          <StatCard key={k.label} {...k} />
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-5">
        {/* Farmer opportunities preview */}
        <Card className="lg:col-span-2 p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="font-serif text-lg text-ink">Farmer opportunities</div>
              <p className="text-xs text-ink-soft mt-0.5">Real demand detected from farmer activity this week.</p>
            </div>
            <Link to="/opportunities">
              <LinkButton>View all</LinkButton>
            </Link>
          </div>
          <div className="space-y-3">
            {opportunities.slice(0, 3).map((op) => (
              <div
                key={op.id}
                className="flex items-center gap-3 border border-line rounded-md p-3 hover:border-moss-300 transition-colors"
              >
                <div className="w-9 h-9 rounded-md bg-moss-50 flex items-center justify-center text-lg shrink-0">
                  {op.icon}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-medium text-ink">{op.title}</span>
                    <Badge tone={demandTone[op.level]}>+{op.demandChange}% demand</Badge>
                  </div>
                  <div className="text-xs text-ink-soft mt-0.5">
                    {op.location} · {op.interestedFarmers} farmers interested
                  </div>
                </div>
                <Link to="/opportunities" className="shrink-0">
                  <Button size="sm" variant="secondary">
                    Respond
                  </Button>
                </Link>
              </div>
            ))}
          </div>
        </Card>

        {/* Smart recommendations */}
        <Card className="p-5">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles size={16} className="text-wheat-500" />
            <div className="font-serif text-lg text-ink">Business insights</div>
          </div>
          <div className="space-y-3">
            {insights.slice(0, 4).map((tip, i) => (
              <div key={i} className="text-sm text-ink-soft leading-snug border-b border-line/70 last:border-0 pb-3 last:pb-0">
                {tip}
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div className="grid lg:grid-cols-3 gap-5 mt-5">
        {/* Farmer requests preview */}
        <Card className="lg:col-span-2 p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="font-serif text-lg text-ink">Farmer requests</div>
              <p className="text-xs text-ink-soft mt-0.5">Direct problems submitted by farmers on the platform.</p>
            </div>
            <Link to="/requests">
              <LinkButton>Open request center</LinkButton>
            </Link>
          </div>
          <div className="space-y-3">
            {openRequests.map((r) => (
              <div key={r.id} className="flex items-start gap-3 border border-line rounded-md p-3">
                <div className="w-9 h-9 rounded-full bg-clay-50 text-clay-600 flex items-center justify-center text-xs font-medium shrink-0">
                  {r.farmer.split(' ').map((n) => n[0]).slice(0, 2).join('')}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-medium text-ink">{r.farmer}</span>
                    <span className="text-xs text-ink-faint">· {r.crop} · {r.location}</span>
                  </div>
                  <p className="text-xs text-ink-soft mt-0.5 line-clamp-1">{r.problem}</p>
                </div>
                <Badge tone={r.status}>{r.status.replace('-', ' ')}</Badge>
              </div>
            ))}
          </div>
        </Card>

        {/* Seasonal opportunity */}
        <Card className="p-5">
          <div className="font-serif text-lg text-ink mb-4">Seasonal opportunity</div>
          {seasonalOpportunities.slice(0, 1).map((s) => (
            <div key={s.title}>
              <div className="text-sm font-medium text-ink">{s.title}</div>
              <div className="text-xs text-ink-faint mb-3">{s.window}</div>
              <div className="flex flex-wrap gap-1.5 mb-3">
                {s.items.map((it) => (
                  <Badge key={it} tone="high">{it}</Badge>
                ))}
              </div>
              <div className="bg-wheat-50 border border-wheat-100 rounded-md p-3 text-sm text-ink-soft">
                {s.recommendation}
              </div>
              <Link to="/market-insights">
                <LinkButton className="mt-3">See full market insights</LinkButton>
              </Link>
            </div>
          ))}
        </Card>
      </div>
    </div>
  )
}
