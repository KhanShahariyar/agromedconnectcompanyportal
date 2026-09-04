import React from 'react'
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
} from 'recharts'
import { TrendingUp, MapPin } from 'lucide-react'
import { PageHeader, Card, Badge, SectionLabel, ProgressBar } from '../components/ui'
import { regionalDemand, cropTrends, farmerProblems, seasonalOpportunities, opportunities } from '../data/mockData'

const moss = '#5C7239'
const clay = '#B8752F'
const wheat = '#C79B2E'

function ChartTooltip({ active, payload, label, suffix = '' }) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-panel border border-line rounded-md px-3 py-2 text-xs shadow-card">
      <div className="font-medium text-ink">{label}</div>
      <div className="text-ink-soft">{payload[0].value}{suffix}</div>
    </div>
  )
}

export default function MarketInsights() {
  return (
    <div>
      <PageHeader
        eyebrow="Agricultural market insights"
        title="Market intelligence"
        description="Platform-wide signals on demand, regional buying patterns and recurring farmer problems — used to guide what you stock, price and promote."
      />

      <div className="grid lg:grid-cols-2 gap-5 mb-5">
        <Card className="p-5">
          <SectionLabel>Rising demand</SectionLabel>
          <div className="space-y-3">
            {opportunities.slice(0, 4).map((op) => (
              <div key={op.id} className="flex items-center gap-3">
                <span className="text-lg w-7">{op.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-ink font-medium truncate">{op.title}</span>
                    <span className="text-xs text-moss-600 font-medium flex items-center gap-1">
                      <TrendingUp size={12} /> +{op.demandChange}%
                    </span>
                  </div>
                  <ProgressBar value={op.demandChange * 2.6} tone={op.level === 'high' ? 'wheat' : 'moss'} />
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-5">
          <SectionLabel>Regional demand</SectionLabel>
          <div style={{ width: '100%', height: 220 }}>
            <ResponsiveContainer>
              <BarChart data={regionalDemand} margin={{ left: -20, right: 8, top: 8 }}>
                <CartesianGrid vertical={false} stroke="#E4E0D3" />
                <XAxis dataKey="region" tick={{ fontSize: 11, fill: '#8B8778' }} axisLine={{ stroke: '#E4E0D3' }} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#8B8778' }} axisLine={false} tickLine={false} />
                <Tooltip content={<ChartTooltip />} cursor={{ fill: 'rgba(92,114,57,0.06)' }} />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  {regionalDemand.map((_, i) => (
                    <Cell key={i} fill={i === 0 ? moss : '#9AAE79'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="flex items-center gap-1 text-xs text-ink-faint mt-1">
            <MapPin size={11} /> Relative search &amp; order activity by district (last 30 days)
          </div>
        </Card>
      </div>

      <div className="grid lg:grid-cols-3 gap-5 mb-5">
        <Card className="p-5 lg:col-span-1">
          <SectionLabel>Crop trends</SectionLabel>
          <div className="space-y-3">
            {cropTrends.map((c) => (
              <div key={c.crop}>
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="text-ink">{c.crop}</span>
                  <span className="text-ink-faint text-xs">+{c.growth}%</span>
                </div>
                <ProgressBar value={c.growth * 3} tone="clay" />
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-5 lg:col-span-2">
          <SectionLabel>Most frequently reported farmer problems</SectionLabel>
          <div className="space-y-2.5">
            {farmerProblems.map((p, i) => (
              <div key={p.problem} className="flex items-center gap-3">
                <span className="text-xs text-ink-faint w-4">{i + 1}</span>
                <span className="text-sm text-ink flex-1">{p.problem}</span>
                <Badge tone={i < 2 ? 'high' : 'medium'}>{p.count} reports</Badge>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <SectionLabel>Seasonal opportunities</SectionLabel>
      <div className="grid md:grid-cols-2 gap-4">
        {seasonalOpportunities.map((s) => (
          <Card key={s.title} className="p-5">
            <div className="flex items-center justify-between mb-1">
              <div className="font-serif text-lg text-ink">{s.title}</div>
              <Badge tone="high">{s.window}</Badge>
            </div>
            <div className="text-xs text-ink-faint mb-3">High demand expected for</div>
            <div className="flex flex-wrap gap-1.5 mb-4">
              {s.items.map((it) => (
                <span key={it} className="text-xs bg-moss-50 border border-moss-100 text-moss-600 rounded-full px-2.5 py-1">
                  {it}
                </span>
              ))}
            </div>
            <div className="bg-wheat-50 border border-wheat-100 rounded-md p-3 text-sm text-ink-soft">
              "{s.recommendation}"
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}
