import React from 'react'
import { PageHeader, Card, Badge, Table, Tr, Td } from '../components/ui'
import { orders } from '../data/mockData'

const stages = ['Placed', 'Confirmed', 'Processing', 'Shipped', 'Delivered']

export default function Orders() {
  return (
    <div>
      <PageHeader
        eyebrow="Fulfillment"
        title="Orders"
        description="Track every order from placement to delivery and keep farmers informed."
      />

      <div className="flex items-center gap-1.5 mb-5 overflow-x-auto pb-1">
        {stages.map((s, i) => (
          <React.Fragment key={s}>
            <span className="text-xs font-medium text-ink-soft bg-ink/[0.04] border border-line rounded-full px-3 py-1.5 whitespace-nowrap">
              {s}
            </span>
            {i < stages.length - 1 && <span className="text-ink-faint text-xs">→</span>}
          </React.Fragment>
        ))}
      </div>

      <Card className="overflow-hidden">
        <Table columns={['Order', 'Customer', 'Product(s)', 'Amount', 'Payment', 'Delivery', 'Status', 'Date']}>
          {orders.map((o) => (
            <Tr key={o.id}>
              <Td className="font-medium">{o.id}</Td>
              <Td>{o.customer}</Td>
              <Td className="text-ink-soft">{o.products}</Td>
              <Td>৳{o.amount.toLocaleString()}</Td>
              <Td><Badge tone={o.payment}>{o.payment}</Badge></Td>
              <Td className="text-ink-soft">{o.delivery}</Td>
              <Td><Badge tone={o.status}>{o.status}</Badge></Td>
              <Td className="text-ink-faint">{o.date}</Td>
            </Tr>
          ))}
        </Table>
      </Card>
    </div>
  )
}
