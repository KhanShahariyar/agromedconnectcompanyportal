import React from 'react'
import { PageHeader, Card, StatCard, Badge, Table, Tr, Td } from '../components/ui'
import { transactions } from '../data/mockData'

export default function Payments() {
  return (
    <div>
      <PageHeader
        eyebrow="Finance"
        title="Payments"
        description="Track revenue, balance and transaction history across all payment methods."
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <StatCard label="Total revenue" value="৳342,800" trend="up" delta="+18.4%" />
        <StatCard label="Available balance" value="৳86,240" />
        <StatCard label="Pending payments" value="৳9,530" />
        <StatCard label="Refunds" value="৳540" />
      </div>

      <Card className="overflow-hidden">
        <Table columns={['Transaction ID', 'Order ID', 'Amount', 'Method', 'Status', 'Date']}>
          {transactions.map((t) => (
            <Tr key={t.id}>
              <Td className="font-medium">{t.id}</Td>
              <Td className="text-ink-soft">{t.order}</Td>
              <Td>৳{t.amount.toLocaleString()}</Td>
              <Td className="text-ink-soft">{t.method}</Td>
              <Td>
                <Badge tone={t.status === 'Completed' ? 'active' : t.status === 'Pending' ? 'medium' : 'open'}>
                  {t.status}
                </Badge>
              </Td>
              <Td className="text-ink-faint">{t.date}</Td>
            </Tr>
          ))}
        </Table>
      </Card>
    </div>
  )
}
