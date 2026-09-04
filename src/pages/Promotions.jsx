import React from 'react'
import { Plus, MapPin, Target } from 'lucide-react'
import { PageHeader, Card, Badge, Button } from '../components/ui'
import { promotions } from '../data/mockData'

export default function Promotions() {
  return (
    <div>
      <PageHeader
        eyebrow="Targeted campaigns"
        title="Promotions"
        description="Create offers targeted to specific crops, farmer segments and regions."
        actions={<Button><Plus size={15} /> Create promotion</Button>}
      />

      <div className="grid md:grid-cols-2 gap-4">
        {promotions.map((p) => (
          <Card key={p.id} className="p-5">
            <div className="flex items-start justify-between mb-3">
              <div>
                <div className="font-serif text-lg text-ink">{p.title}</div>
                <div className="text-xs text-ink-faint">{p.product}</div>
              </div>
              <Badge tone={p.status === 'active' ? 'active' : 'ended'}>{p.status}</Badge>
            </div>

            <div className="flex items-center gap-2 mb-4">
              <span className="text-sm font-semibold text-clay-600 bg-clay-50 border border-clay-100 rounded-full px-2.5 py-1">
                {p.discount}
              </span>
              <span className="text-xs text-ink-faint flex items-center gap-1"><Target size={11} /> {p.target}</span>
              <span className="text-xs text-ink-faint flex items-center gap-1"><MapPin size={11} /> {p.location}</span>
            </div>

            <div className="grid grid-cols-4 gap-2 pt-4 border-t border-line text-center">
              <div>
                <div className="text-sm font-medium text-ink">{p.reach.toLocaleString()}</div>
                <div className="text-[11px] text-ink-faint">Reach</div>
              </div>
              <div>
                <div className="text-sm font-medium text-ink">{p.views.toLocaleString()}</div>
                <div className="text-[11px] text-ink-faint">Views</div>
              </div>
              <div>
                <div className="text-sm font-medium text-ink">{p.orders}</div>
                <div className="text-[11px] text-ink-faint">Orders</div>
              </div>
              <div>
                <div className="text-sm font-medium text-ink">{p.conversion}</div>
                <div className="text-[11px] text-ink-faint">Conv.</div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}
