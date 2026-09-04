import React from 'react'
import { Mail, Phone, MessageCircle } from 'lucide-react'
import { PageHeader, Card, Button } from '../components/ui'

export default function ContactSupport() {
  return (
    <div>
      <PageHeader eyebrow="We're here to help" title="Contact support" description="Reach the AgroMED Connect partner support team." />
      <div className="grid sm:grid-cols-3 gap-4 max-w-3xl">
        <Card className="p-5 text-center">
          <Mail size={20} className="mx-auto mb-2 text-moss-600" />
          <div className="text-sm font-medium text-ink">Email</div>
          <div className="text-xs text-ink-faint mt-1">partners@agromedconnect.com</div>
        </Card>
        <Card className="p-5 text-center">
          <Phone size={20} className="mx-auto mb-2 text-moss-600" />
          <div className="text-sm font-medium text-ink">Phone</div>
          <div className="text-xs text-ink-faint mt-1">16247 (9am–8pm, everyday)</div>
        </Card>
        <Card className="p-5 text-center">
          <MessageCircle size={20} className="mx-auto mb-2 text-moss-600" />
          <div className="text-sm font-medium text-ink">Live chat</div>
          <Button size="sm" className="mt-2">Start chat</Button>
        </Card>
      </div>
    </div>
  )
}
