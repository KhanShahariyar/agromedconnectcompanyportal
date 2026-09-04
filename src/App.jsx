import React, { useState } from 'react'
import { Routes, Route } from 'react-router-dom'
import Sidebar from './components/Sidebar'
import Topbar from './components/Topbar'

import Dashboard from './pages/Dashboard'
import FarmerOpportunities from './pages/FarmerOpportunities'
import FarmerRequests from './pages/FarmerRequests'
import SolutionCenter from './pages/SolutionCenter'
import Products from './pages/Products'
import Orders from './pages/Orders'
import Services from './pages/Services'
import MarketInsights from './pages/MarketInsights'
import Inventory from './pages/Inventory'
import Promotions from './pages/Promotions'
import Reviews from './pages/Reviews'
import Payments from './pages/Payments'
import Analytics from './pages/Analytics'
import Notifications from './pages/Notifications'
import CompanyProfile from './pages/CompanyProfile'
import Verification from './pages/Verification'
import Team from './pages/Team'
import Settings from './pages/Settings'
import HelpCenter from './pages/HelpCenter'
import ContactSupport from './pages/ContactSupport'

export default function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="min-h-screen flex bg-paper">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex-1 min-w-0 flex flex-col">
        <Topbar onMenuClick={() => setSidebarOpen(true)} />
        <main className="flex-1 px-4 sm:px-6 py-6 max-w-[1400px] w-full mx-auto">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/opportunities" element={<FarmerOpportunities />} />
            <Route path="/requests" element={<FarmerRequests />} />
            <Route path="/solutions" element={<SolutionCenter />} />
            <Route path="/products" element={<Products />} />
            <Route path="/orders" element={<Orders />} />
            <Route path="/services" element={<Services />} />
            <Route path="/market-insights" element={<MarketInsights />} />
            <Route path="/inventory" element={<Inventory />} />
            <Route path="/promotions" element={<Promotions />} />
            <Route path="/reviews" element={<Reviews />} />
            <Route path="/payments" element={<Payments />} />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/notifications" element={<Notifications />} />
            <Route path="/company-profile" element={<CompanyProfile />} />
            <Route path="/verification" element={<Verification />} />
            <Route path="/team" element={<Team />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/help" element={<HelpCenter />} />
            <Route path="/contact-support" element={<ContactSupport />} />
          </Routes>
        </main>
      </div>
    </div>
  )
}
