import React from 'react'
import {
  MessageCircleQuestion,
  ShoppingCart,
  TrendingUp,
  AlertTriangle,
  Star,
  Wallet,
  Calendar,
  ShieldCheck,
} from 'lucide-react'
import { PageHeader, Card } from '../components/ui'
import { notifications } from '../data/mockData'

const iconMap = {
  request: { icon: MessageCircleQuestion, tone: 'text-clay-600 bg-clay-50' },
  order: { icon: ShoppingCart, tone: 'text-moss-600 bg-moss-50' },
  demand: { icon: TrendingUp, tone: 'text-wheat-600 bg-wheat-50' },
  stock: { icon: AlertTriangle, tone: 'text-rust-500 bg-rust-100' },
  review: { icon: Star, tone: 'text-wheat-600 bg-wheat-50' },
  payment: { icon: Wallet, tone: 'text-moss-600 bg-moss-50' },
  booking: { icon: Calendar, tone: 'text-clay-600 bg-clay-50' },
  verification: { icon: ShieldCheck, tone: 'text-moss-600 bg-moss-50' },
}

export default function Notifications() {
  return (
    <div>
      <PageHeader
        eyebrow="Stay informed"
        title="Notifications"
        description="Everything that needs your attention across requests, orders, demand and payments."
      />

      <Card className="divide-y divide-line">
        {notifications.map((n) => {
          const cfg = iconMap[n.type] || iconMap.order
          const Icon = cfg.icon
          return (
            <div key={n.id} className={`flex items-start gap-3 p-4 ${n.unread ? 'bg-moss-50/30' : ''}`}>
              <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${cfg.tone}`}>
                <Icon size={16} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-medium text-ink">{n.title}</span>
                  <span className="text-xs text-ink-faint shrink-0">{n.time}</span>
                </div>
                <p className="text-sm text-ink-soft mt-0.5">{n.text}</p>
              </div>
              {n.unread && <div className="w-2 h-2 rounded-full bg-rust-500 mt-2 shrink-0" />}
            </div>
          )
        })}
      </Card>
    </div>
  )
}
