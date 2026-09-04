import React from 'react'
import { NavLink } from 'react-router-dom'
import {
  LayoutGrid,
  Sprout,
  Package,
  ShoppingCart,
  MessageCircleQuestion,
  Wrench,
  LineChart,
  Boxes,
  Megaphone,
  Star,
  Wallet,
  BarChart3,
  Bell,
  Building2,
  ShieldCheck,
  Users,
  Settings,
  LifeBuoy,
  Mail,
  X,
} from 'lucide-react'
import { company } from '../data/mockData'

const mainNav = [
  { to: '/', label: 'Dashboard', icon: LayoutGrid, end: true },
  { to: '/opportunities', label: 'Farmer Opportunities', icon: Sprout },
  { to: '/products', label: 'Products', icon: Package },
  { to: '/orders', label: 'Orders', icon: ShoppingCart },
  { to: '/requests', label: 'Farmer Requests', icon: MessageCircleQuestion },
  { to: '/services', label: 'Agricultural Services', icon: Wrench },
  { to: '/market-insights', label: 'Market Insights', icon: LineChart },
  { to: '/inventory', label: 'Inventory', icon: Boxes },
  { to: '/promotions', label: 'Promotions', icon: Megaphone },
  { to: '/reviews', label: 'Reviews & Trust', icon: Star },
  { to: '/payments', label: 'Payments', icon: Wallet },
  { to: '/analytics', label: 'Business Analytics', icon: BarChart3 },
  { to: '/notifications', label: 'Notifications', icon: Bell },
]

const companyNav = [
  { to: '/company-profile', label: 'Company Profile', icon: Building2 },
  { to: '/verification', label: 'Verification', icon: ShieldCheck },
  { to: '/team', label: 'Team', icon: Users },
  { to: '/settings', label: 'Settings', icon: Settings },
]

const supportNav = [
  { to: '/help', label: 'Help Center', icon: LifeBuoy },
  { to: '/contact-support', label: 'Contact Support', icon: Mail },
]

function NavGroup({ items, heading }) {
  return (
    <div className="mb-5">
      {heading && (
        <div className="px-3 text-[11px] font-medium text-ink-faint mb-1.5">{heading}</div>
      )}
      <nav className="space-y-0.5">
        {items.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `flex items-center gap-2.5 px-3 py-2 rounded-md text-sm transition-colors ${
                isActive
                  ? 'bg-moss-600 text-white font-medium'
                  : 'text-ink-soft hover:bg-moss-50 hover:text-ink'
              }`
            }
          >
            <Icon size={16} strokeWidth={2} />
            <span className="truncate">{label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  )
}

export default function Sidebar({ open, onClose }) {
  return (
    <>
      {open && (
        <div
          className="fixed inset-0 bg-ink/30 z-30 lg:hidden"
          onClick={onClose}
        />
      )}
      <aside
        className={`fixed lg:sticky top-0 h-screen w-[248px] shrink-0 bg-panel border-r border-line z-40 transform transition-transform lg:translate-x-0 flex flex-col ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between px-4 h-16 border-b border-line shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-md bg-moss-600 flex items-center justify-center text-white text-xs font-serif">
              AC
            </div>
            <span className="font-serif text-[15px] text-ink">AgroMED Connect</span>
          </div>
          <button className="lg:hidden text-ink-soft" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-2.5 pt-4">
          <NavGroup items={mainNav} />
          <NavGroup items={companyNav} heading="Company" />
          <NavGroup items={supportNav} heading="Support" />
        </div>

        <div className="p-3 border-t border-line shrink-0">
          <div className="flex items-center gap-2.5 px-2 py-2">
            <div className="w-8 h-8 rounded-full bg-clay-500 text-white flex items-center justify-center text-xs font-medium shrink-0">
              {company.logoInitials}
            </div>
            <div className="min-w-0">
              <div className="text-sm text-ink font-medium truncate">{company.name}</div>
              <div className="text-xs text-moss-600 flex items-center gap-1">
                <ShieldCheck size={12} /> Verified Company
              </div>
            </div>
          </div>
        </div>
      </aside>
    </>
  )
}
