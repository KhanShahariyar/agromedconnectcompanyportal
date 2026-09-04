import React from 'react'
import { Plus } from 'lucide-react'
import { PageHeader, Card, Badge, Button, Table, Tr, Td } from '../components/ui'
import { team } from '../data/mockData'

export default function Team() {
  return (
    <div>
      <PageHeader
        eyebrow="People"
        title="Company team"
        description="Add employees and set role-based permissions for what they can see and do."
        actions={<Button><Plus size={15} /> Invite team member</Button>}
      />

      <Card className="overflow-hidden">
        <Table columns={['Name', 'Role', 'Email', 'Status', '']}>
          {team.map((t) => (
            <Tr key={t.id}>
              <Td className="font-medium">{t.name}</Td>
              <Td className="text-ink-soft">{t.role}</Td>
              <Td className="text-ink-soft">{t.email}</Td>
              <Td><Badge tone={t.status === 'active' ? 'active' : 'medium'}>{t.status}</Badge></Td>
              <Td>
                <Button size="sm" variant="ghost">Manage</Button>
              </Td>
            </Tr>
          ))}
        </Table>
      </Card>
    </div>
  )
}
