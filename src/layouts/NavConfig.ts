import {
  LayoutGrid, LineChart, Package, Wrench, Boxes, ShoppingCart, Tags, Star, Wallet,
  BarChart3, MessageSquare, Bell, Building2, ShieldCheck, Users, Settings, LifeBuoy,
  Mail, Layers, Truck, History,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import type { TranslationKey } from '@/i18n/dictionary'
import type { Action } from '@/access/can'

export interface NavItem {
  to: string
  labelKey: TranslationKey
  icon: LucideIcon
  /** When set, the link is hidden unless the role permits the action. */
  action?: Action
  end?: boolean
}

/**
 * C11 — Farmer Opportunities, Farmer Request Center and Promotions are absent
 * by design. Promotions is superseded by Discounts.
 */
export const COMPANY_NAV: NavItem[] = [
  { to: '/', labelKey: 'nav.dashboard', icon: LayoutGrid, end: true },
  { to: '/market', labelKey: 'nav.market', icon: LineChart },
  { to: '/products', labelKey: 'nav.products', icon: Package, action: 'catalog.read' },
  { to: '/services', labelKey: 'nav.services', icon: Wrench, action: 'catalog.read' },
  { to: '/solutions', labelKey: 'nav.solutions', icon: Layers, action: 'catalog.read' },
  { to: '/inventory', labelKey: 'nav.inventory', icon: Boxes, action: 'catalog.read' },
  { to: '/orders', labelKey: 'nav.orders', icon: ShoppingCart, action: 'order.read' },
  { to: '/discounts', labelKey: 'nav.discounts', icon: Tags, action: 'discount.manage' },
  { to: '/reviews', labelKey: 'nav.reviews', icon: Star, action: 'order.read' },
  { to: '/payments', labelKey: 'nav.payments', icon: Wallet, action: 'payout.request' },
  { to: '/reports', labelKey: 'nav.reports', icon: BarChart3, action: 'report.read' },
  { to: '/notifications', labelKey: 'nav.notifications', icon: Bell },
]

export const COMPANY_NAV_ACCOUNT: NavItem[] = [
  { to: '/profile', labelKey: 'nav.profile', icon: Building2 },
  { to: '/verification', labelKey: 'nav.verification', icon: ShieldCheck, action: 'certificate.read' },
  { to: '/team', labelKey: 'nav.team', icon: Users, action: 'member.read' },
  { to: '/settings', labelKey: 'nav.settings', icon: Settings },
]

export const COMPANY_NAV_SUPPORT: NavItem[] = [
  { to: '/feedback', labelKey: 'nav.feedback', icon: MessageSquare },
  { to: '/help', labelKey: 'nav.help', icon: LifeBuoy },
  { to: '/support', labelKey: 'nav.support', icon: Mail },
]

export const DELIVERY_NAV: NavItem[] = [
  { to: '/deliveries', labelKey: 'nav.deliveries', icon: Truck, end: true },
  { to: '/deliveries/history', labelKey: 'nav.history', icon: History },
]
