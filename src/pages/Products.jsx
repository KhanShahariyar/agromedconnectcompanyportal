import React from 'react'
import { Plus, Star } from 'lucide-react'
import { PageHeader, Card, Badge, Button, Table, Tr, Td } from '../components/ui'
import { products } from '../data/mockData'

export default function Products() {
  return (
    <div>
      <PageHeader
        eyebrow="Catalog"
        title="Products"
        description="Manage listings, pricing, stock and performance for everything you sell on AgroMED Connect."
        actions={<Button><Plus size={15} /> Add product</Button>}
      />

      <Card className="overflow-hidden">
        <Table columns={['Product', 'Category', 'Price', 'Stock', 'Views', 'Orders', 'Revenue', 'Rating', 'Demand']}>
          {products.map((p) => (
            <Tr key={p.id}>
              <Td>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-md bg-moss-50 flex items-center justify-center text-base shrink-0">
                    {p.image}
                  </div>
                  <div>
                    <div className="font-medium text-sm">{p.name}</div>
                    <div className="text-xs text-ink-faint">{p.id}</div>
                  </div>
                </div>
              </Td>
              <Td className="text-ink-soft">{p.category}</Td>
              <Td>৳{p.price.toLocaleString()}</Td>
              <Td>
                <span className={p.stock <= 15 ? 'text-rust-500 font-medium' : ''}>{p.stock}</span>
              </Td>
              <Td className="text-ink-soft">{p.views.toLocaleString()}</Td>
              <Td className="text-ink-soft">{p.orders}</Td>
              <Td>৳{p.revenue.toLocaleString()}</Td>
              <Td>
                <span className="flex items-center gap-1"><Star size={12} className="text-wheat-500 fill-wheat-500" /> {p.rating}</span>
              </Td>
              <Td><Badge tone={p.demand}>{p.demand}</Badge></Td>
            </Tr>
          ))}
        </Table>
      </Card>
    </div>
  )
}
