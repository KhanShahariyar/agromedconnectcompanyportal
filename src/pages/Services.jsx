import React from 'react'
import { Plus, Star, MapPin, Users, Calendar } from 'lucide-react'
import { PageHeader, Card, Button } from '../components/ui'
import { services } from '../data/mockData'

export default function Services() {
  return (
    <div>
      <PageHeader
        eyebrow="Beyond products"
        title="Agricultural services"
        description="Offer expertise and on-ground support — consultation, diagnostics, inspections and training."
        actions={<Button><Plus size={15} /> Create service</Button>}
      />

      <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
        {services.map((s) => (
          <Card key={s.id} className="p-5 flex flex-col">
            <div className="font-serif text-lg text-ink mb-1">{s.name}</div>
            <p className="text-sm text-ink-soft mb-4 flex-1">{s.description}</p>

            <div className="space-y-1.5 text-xs text-ink-faint mb-4">
              <div className="flex items-center gap-1.5"><MapPin size={12} /> {s.area}</div>
              <div className="flex items-center gap-1.5"><Calendar size={12} /> {s.capacity}</div>
              <div className="flex items-center gap-1.5"><Users size={12} /> {s.served} farmers served</div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-line">
              <div>
                <div className="text-sm font-medium text-ink">{s.price}</div>
                <div className="text-xs text-wheat-600 flex items-center gap-1">
                  <Star size={11} className="fill-wheat-500 text-wheat-500" /> {s.rating}
                </div>
              </div>
              <Button size="sm" variant="secondary">Manage</Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}
