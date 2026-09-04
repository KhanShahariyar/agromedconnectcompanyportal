import React from 'react'
import { PageHeader, Card } from '../components/ui'

const topics = [
  { q: 'How do farmer opportunities get generated?', a: 'We aggregate anonymized farmer searches, requests and browsing activity by crop and region, then surface patterns as opportunities.' },
  { q: 'How is my trust score calculated?', a: 'It combines profile completeness, response rate, product quality, reviews, farmer satisfaction and order completion.' },
  { q: 'Can I bundle products and services together?', a: 'Yes — use the Solution Center to combine products, services and guidance into one purchasable package.' },
  { q: 'How do payouts work?', a: 'Payments are settled to your linked bank account on a rolling basis once an order is marked delivered.' },
]

export default function HelpCenter() {
  return (
    <div>
      <PageHeader eyebrow="Support" title="Help center" description="Answers to common questions about running your company on AgroMED Connect." />
      <div className="space-y-3 max-w-2xl">
        {topics.map((t) => (
          <Card key={t.q} className="p-4">
            <div className="text-sm font-medium text-ink mb-1">{t.q}</div>
            <p className="text-sm text-ink-soft">{t.a}</p>
          </Card>
        ))}
      </div>
    </div>
  )
}
