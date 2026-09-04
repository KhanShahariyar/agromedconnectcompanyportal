import React from 'react'
import { Menu, Search, Bell } from 'lucide-react'
import { Link } from 'react-router-dom'
import { notifications } from '../data/mockData'

export default function Topbar({ onMenuClick }) {
  const unread = notifications.filter((n) => n.unread).length
  return (
    <header className="sticky top-0 z-20 h-16 border-b border-line bg-paper/90 backdrop-blur flex items-center gap-3 px-4 sm:px-6">
      <button className="lg:hidden text-ink-soft" onClick={onMenuClick}>
        <Menu size={20} />
      </button>

      <div className="flex-1 max-w-md relative hidden sm:block">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint" />
        <input
          type="text"
          placeholder="Search products, orders, farmer requests…"
          className="w-full bg-panel border border-line rounded-md pl-9 pr-3 py-2 text-sm placeholder:text-ink-faint focus:outline-none focus:ring-2 focus:ring-moss-300"
        />
      </div>

      <div className="flex-1 sm:hidden" />

      <Link
        to="/notifications"
        className="relative w-9 h-9 flex items-center justify-center rounded-md hover:bg-moss-50 text-ink-soft"
      >
        <Bell size={18} />
        {unread > 0 && (
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rust-500" />
        )}
      </Link>
    </header>
  )
}
