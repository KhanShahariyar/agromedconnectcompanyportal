import React from 'react'
import { AlertTriangle } from 'lucide-react'
import { PageHeader, Card, Badge, Table, Tr, Td, StatCard } from '../components/ui'
import { inventory, lowStock } from '../data/mockData'

export default function Inventory() {
  const stockValue = inventory.reduce((s, p) => s + p.stockValue, 0)
  const fastMoving = inventory.filter((p) => p.turnover === 'Fast-moving').length
  const slowMoving = inventory.filter((p) => p.turnover === 'Slow-moving').length

  return (
    <div>
      <PageHeader
        eyebrow="Stock, with judgment"
        title="Inventory intelligence"
        description="More than stock counts — recommendations on what to restock, and what's sitting idle."
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <StatCard label="Stock value" value={`৳${stockValue.toLocaleString()}`} />
        <StatCard label="Fast-moving products" value={fastMoving} trend="up" />
        <StatCard label="Slow-moving products" value={slowMoving} />
        <StatCard label="Low stock alerts" value={lowStock.length} trend={lowStock.length > 0 ? 'down' : 'flat'} />
      </div>

      <Card className="p-5 mb-6">
        <div className="text-xs font-medium text-ink-faint mb-3">Low stock — action recommended</div>
        <div className="space-y-3">
          {lowStock.map((p) => (
            <div key={p.id} className="flex items-start gap-3 border border-clay-100 bg-clay-50/40 rounded-md p-3">
              <AlertTriangle size={16} className="text-clay-600 mt-0.5 shrink-0" />
              <div className="min-w-0">
                <div className="text-sm font-medium text-ink">{p.name}</div>
                <div className="text-xs text-ink-faint mb-1">{p.stock} units remaining</div>
                <p className="text-xs text-ink-soft">
                  Recommendation: demand for this category is rising in your service area — consider restocking within 2 weeks.
                </p>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Card className="overflow-hidden">
        <Table columns={['Product', 'Stock', 'Stock value', 'Turnover', 'Demand']}>
          {inventory.map((p) => (
            <Tr key={p.id}>
              <Td>
                <div className="flex items-center gap-3">
                  <span className="text-base">{p.image}</span>
                  <span className="font-medium">{p.name}</span>
                </div>
              </Td>
              <Td className={p.stock <= 15 ? 'text-rust-500 font-medium' : ''}>{p.stock}</Td>
              <Td>৳{p.stockValue.toLocaleString()}</Td>
              <Td>
                <Badge tone={p.turnover === 'Fast-moving' ? 'high' : p.turnover === 'Slow-moving' ? 'neutral' : 'medium'}>
                  {p.turnover}
                </Badge>
              </Td>
              <Td><Badge tone={p.demand}>{p.demand}</Badge></Td>
            </Tr>
          ))}
        </Table>
      </Card>
    </div>
  )
}
