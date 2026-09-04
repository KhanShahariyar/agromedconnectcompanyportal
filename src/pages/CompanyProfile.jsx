import React from 'react'
import { ShieldCheck, MapPin, Globe, Phone, Star, Users } from 'lucide-react'
import { PageHeader, Card, Badge, Button, SectionLabel } from '../components/ui'
import { company, products, services, reviews } from '../data/mockData'

export default function CompanyProfile() {
  return (
    <div>
      <PageHeader eyebrow="Public profile" title="Company profile" description="How farmers and buyers see your company on AgroMED Connect." actions={<Button variant="secondary">Edit profile</Button>} />

      <Card className="p-6 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="w-16 h-16 rounded-md bg-clay-500 text-white flex items-center justify-center text-xl font-serif shrink-0">
            {company.logoInitials}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="font-serif text-xl text-ink">{company.name}</h2>
              <Badge tone="active"><ShieldCheck size={11} /> Verified Company</Badge>
            </div>
            <div className="text-sm text-ink-soft mt-1">{company.category} · Serving farmers since {company.since}</div>
            <div className="flex flex-wrap gap-4 text-xs text-ink-faint mt-2">
              <span className="flex items-center gap-1"><MapPin size={12} /> {company.address}</span>
              <span className="flex items-center gap-1"><Globe size={12} /> bengalagrocare.com</span>
              <span className="flex items-center gap-1"><Phone size={12} /> +880 1XXX-XXXXXX</span>
            </div>
          </div>
          <div className="flex gap-6 sm:border-l sm:border-line sm:pl-6">
            <div className="text-center">
              <div className="font-serif text-xl text-ink">486</div>
              <div className="text-xs text-ink-faint">Farmers served</div>
            </div>
            <div className="text-center">
              <div className="font-serif text-xl text-ink flex items-center gap-1 justify-center">4.7 <Star size={14} className="fill-wheat-500 text-wheat-500" /></div>
              <div className="text-xs text-ink-faint">Rating</div>
            </div>
          </div>
        </div>
        <p className="text-sm text-ink-soft mt-5 max-w-2xl">
          Bengal AgroCare supplies certified seed, fertilizer and crop-protection products across southern and
          northwestern Bangladesh, paired with on-ground agricultural consultation and diagnostic services for
          smallholder farmers.
        </p>
      </Card>

      <div className="grid lg:grid-cols-3 gap-5 mb-6">
        <Card className="p-5">
          <SectionLabel>Service areas</SectionLabel>
          <div className="flex flex-wrap gap-1.5">
            {['Khulna', 'Rajshahi', 'Jashore', 'Barishal', 'Faridpur', 'Bogura'].map((a) => (
              <span key={a} className="text-xs bg-ink/[0.04] border border-line rounded-full px-2.5 py-1 text-ink-soft">{a}</span>
            ))}
          </div>
        </Card>
        <Card className="p-5">
          <SectionLabel>Business registration</SectionLabel>
          <div className="text-sm text-ink-soft space-y-1.5">
            <div>Trade license: TRAD/DHK/2016/00842</div>
            <div>TIN: 481-XXX-XXXX</div>
            <div>Established: {company.since}</div>
          </div>
        </Card>
        <Card className="p-5 flex items-center gap-3">
          <Users size={22} className="text-moss-600" />
          <div>
            <div className="font-serif text-lg text-ink">{products.length + services.length} listings</div>
            <div className="text-xs text-ink-faint">{products.length} products · {services.length} services</div>
          </div>
        </Card>
      </div>

      <SectionLabel>Recent reviews</SectionLabel>
      <div className="grid md:grid-cols-2 gap-3">
        {reviews.slice(0, 2).map((r) => (
          <Card key={r.id} className="p-4">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-sm font-medium text-ink">{r.farmer}</span>
              <div className="flex items-center gap-0.5">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} size={12} className={i < r.rating ? 'fill-wheat-500 text-wheat-500' : 'text-line'} />
                ))}
              </div>
            </div>
            <p className="text-sm text-ink-soft">{r.text}</p>
          </Card>
        ))}
      </div>
    </div>
  )
}
