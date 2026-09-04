import React from 'react'
import { Plus, Check, Users } from 'lucide-react'
import { PageHeader, Card, Badge, Button } from '../components/ui'
import { solutions } from '../data/mockData'

export default function SolutionCenter() {
  return (
    <div>
      <PageHeader
        eyebrow="Complete offerings"
        title="Solution center"
        description="Combine products, services and expert guidance into one purchasable solution for farmers."
        actions={
          <Button>
            <Plus size={15} /> Create agricultural solution
          </Button>
        }
      />

      <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
        {solutions.map((s) => (
          <Card key={s.id} className="p-5 flex flex-col">
            <div className="flex items-start justify-between mb-2">
              <Badge tone={s.status}>{s.status}</Badge>
              <span className="text-xs text-ink-faint">{s.id}</span>
            </div>
            <div className="font-serif text-lg text-ink mb-1 leading-snug">{s.title}</div>
            <div className="text-xs text-ink-faint mb-4">Target: {s.target}</div>

            <div className="space-y-1.5 mb-4 flex-1">
              {s.includes.map((item) => (
                <div key={item} className="flex items-start gap-2 text-sm text-ink-soft">
                  <Check size={14} className="text-moss-600 mt-0.5 shrink-0" />
                  <span>{item}</span>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-line">
              <div>
                <div className="font-serif text-xl text-ink">৳{s.price.toLocaleString()}</div>
                {s.farmersEnrolled > 0 && (
                  <div className="text-xs text-ink-faint flex items-center gap-1 mt-0.5">
                    <Users size={11} /> {s.farmersEnrolled} farmers enrolled
                  </div>
                )}
              </div>
              <Button size="sm" variant="secondary">Manage</Button>
            </div>
          </Card>
        ))}

        <button className="border border-dashed border-line rounded-card p-5 flex flex-col items-center justify-center text-center min-h-[280px] text-ink-faint hover:border-moss-400 hover:text-moss-600 transition-colors">
          <Plus size={22} className="mb-2" />
          <div className="text-sm font-medium">Build a new solution</div>
          <p className="text-xs mt-1 max-w-[220px]">Bundle a product, a service and guidance for a specific farmer problem.</p>
        </button>
      </div>
    </div>
  )
}
