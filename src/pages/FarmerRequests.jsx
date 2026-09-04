import React, { useState } from 'react'
import { ImageIcon, MapPin, Wheat, Clock } from 'lucide-react'
import { PageHeader, Card, Badge, Button } from '../components/ui'
import { farmerRequests } from '../data/mockData'

const tabs = [
  { key: 'all', label: 'All' },
  { key: 'open', label: 'Open' },
  { key: 'in-progress', label: 'In progress' },
  { key: 'resolved', label: 'Resolved' },
]

export default function FarmerRequests() {
  const [tab, setTab] = useState('all')
  const [activeId, setActiveId] = useState(farmerRequests[0].id)

  const list = tab === 'all' ? farmerRequests : farmerRequests.filter((r) => r.status === tab)
  const active = farmerRequests.find((r) => r.id === activeId) || list[0]

  return (
    <div>
      <PageHeader
        eyebrow="Direct farmer contact"
        title="Farmer request center"
        description="Farmers send their problems directly to your company. Respond, recommend, or schedule support."
      />

      <div className="flex items-center gap-2 mb-5">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`text-xs font-medium px-3 py-1.5 rounded-full border transition-colors ${
              tab === t.key
                ? 'bg-moss-600 text-white border-moss-600'
                : 'bg-panel text-ink-soft border-line hover:border-ink/30'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="grid lg:grid-cols-5 gap-5">
        <div className="lg:col-span-2 space-y-2.5">
          {list.map((r) => (
            <button
              key={r.id}
              onClick={() => setActiveId(r.id)}
              className={`w-full text-left border rounded-card p-4 transition-colors ${
                active?.id === r.id ? 'border-moss-500 bg-moss-50/50' : 'border-line bg-panel hover:border-ink/20'
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-sm font-medium text-ink">{r.farmer}</span>
                <Badge tone={r.status}>{r.status.replace('-', ' ')}</Badge>
              </div>
              <div className="text-xs text-ink-faint mb-1.5 flex items-center gap-2">
                <span className="flex items-center gap-1"><Wheat size={11} /> {r.crop}</span>
                <span className="flex items-center gap-1"><MapPin size={11} /> {r.location}</span>
              </div>
              <p className="text-xs text-ink-soft line-clamp-2">{r.problem}</p>
              <div className="text-[11px] text-ink-faint mt-2 flex items-center gap-1">
                <Clock size={10} /> {r.submitted}
                {r.hasImages && (
                  <span className="ml-2 flex items-center gap-1"><ImageIcon size={10} /> Photos attached</span>
                )}
              </div>
            </button>
          ))}
        </div>

        <Card className="lg:col-span-3 p-6 h-fit lg:sticky lg:top-20">
          {active ? (
            <>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <div className="text-xs text-ink-faint mb-1">Farmer Request #{active.id.replace('FR-', '')}</div>
                  <div className="font-serif text-lg text-ink">{active.farmer}</div>
                  <div className="text-xs text-ink-soft flex items-center gap-2 mt-1">
                    <span className="flex items-center gap-1"><MapPin size={12} /> {active.location}</span>
                    <span className="flex items-center gap-1"><Wheat size={12} /> {active.crop}</span>
                  </div>
                </div>
                <Badge tone={active.priority === 'high' ? 'open' : 'medium'}>
                  {active.priority} priority
                </Badge>
              </div>

              <div className="bg-ink/[0.03] border border-line rounded-md p-4 mb-4">
                <div className="text-xs font-medium text-ink-faint mb-1.5">Problem</div>
                <p className="text-sm text-ink">"{active.problem}"</p>
              </div>

              {active.hasImages && (
                <div className="mb-4">
                  <div className="text-xs font-medium text-ink-faint mb-2">Attachments</div>
                  <div className="flex gap-2">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="w-16 h-16 rounded-md bg-moss-50 border border-line flex items-center justify-center text-ink-faint">
                        <ImageIcon size={18} />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="mb-5">
                <div className="text-xs font-medium text-ink-faint mb-2">Interaction history</div>
                <div className="space-y-2">
                  {active.history.map((h, i) => (
                    <div key={i} className="text-xs text-ink-soft flex gap-2">
                      <span className="text-ink-faint shrink-0 w-16">{h.at}</span>
                      <span>{h.text}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex flex-wrap gap-2 pt-4 border-t border-line">
                <Button size="sm">Respond</Button>
                <Button size="sm" variant="secondary">Recommend product</Button>
                <Button size="sm" variant="secondary">Offer consultation</Button>
                <Button size="sm" variant="secondary">Schedule visit</Button>
                <Button size="sm" variant="secondary">Offer service</Button>
                <Button size="sm" variant="ghost">Mark resolved</Button>
              </div>
            </>
          ) : (
            <div className="text-sm text-ink-soft">Select a request to view details.</div>
          )}
        </Card>
      </div>
    </div>
  )
}
