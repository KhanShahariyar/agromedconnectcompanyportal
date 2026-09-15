import { Suspense, lazy } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { useSession } from '@/auth/SessionProvider'
import { RequireAuth, RequireCompanyRole } from '@/auth/guards'
import { AccessProvider } from '@/access/Gate'
import { ROLE_PERMISSIONS } from '@/access/can'
import { CompanyShell } from '@/layouts/CompanyShell'
import { DeliveryShell } from '@/layouts/DeliveryShell'
import { useT } from '@/i18n/LocaleProvider'
import { Card, Skeleton } from '@/ui'
import { PushBridge } from '@/push/PushBridge'

import { Login } from '@/features/auth/Login'
import { RegisterCompany } from '@/features/auth/RegisterCompany'
import { ForgotPassword } from '@/features/auth/ForgotPassword'
import { ResetPassword } from '@/features/auth/ResetPassword'
import { AcceptInvitation } from '@/features/auth/AcceptInvitation'

import { ListingList } from '@/features/catalog/ListingList'
import { ListingDetail } from '@/features/catalog/ListingDetail'
import { ListingEditor } from '@/features/catalog/ListingEditor'
import { OrderList } from '@/features/orders/OrderList'
import { OrderDetail } from '@/features/orders/OrderDetail'
import { Verification } from '@/features/verification/Verification'
import { Team } from '@/features/team/Team'
import { Settings } from '@/features/misc/Settings'
import {
  CompanyProfile, ContactSupport, Feedback, HelpCenter, Notifications,
  Payments, Reviews, SolutionCenter,
} from '@/features/misc/Simple'
import { MyDeliveries } from '@/features/delivery/MyDeliveries'

const Dashboard = lazy(() => import('@/features/dashboard/Dashboard').then((m) => ({ default: m.Dashboard })))
const MarketIntelligence = lazy(() => import('@/features/market/MarketIntelligence').then((m) => ({ default: m.MarketIntelligence })))
const Inventory = lazy(() => import('@/features/inventory/Inventory').then((m) => ({ default: m.Inventory })))
const DiscountEditor = lazy(() => import('@/features/discounts/DiscountEditor').then((m) => ({ default: m.DiscountEditor })))
const Discounts = lazy(() => import('@/features/discounts/Discounts').then((m) => ({ default: m.Discounts })))
const Reports = lazy(() => import('@/features/reports/Reports').then((m) => ({ default: m.Reports })))
const DeliveryDetail = lazy(() => import('@/features/delivery/DeliveryDetail').then((m) => ({ default: m.DeliveryDetail })))

function NotFound() {
  const t = useT()
  return (
    <Card className="mx-auto mt-16 max-w-md p-8 text-center">
      <p className="text-ink">{t('state.empty.title')}</p>
      <a href="/" className="mt-3 inline-block text-primary underline">{t('nav.dashboard')}</a>
    </Card>
  )
}

function Shell() {
  const { session, signOut } = useSession()
  if (!session) return null

  const access = {
    permissions: ROLE_PERMISSIONS[session.role],
    verificationStatus: session.organisation.verificationStatus,
    isBlacklisted: session.organisation.isBlacklisted,
  }

  if (session.role === 'delivery_man') {
    return (
      <AccessProvider value={access}>
        <DeliveryShell userName={session.user.fullName} onSignOut={signOut}>
          <Suspense fallback={<Skeleton />}>
          <Routes>
            <Route path="/deliveries" element={<MyDeliveries status="active" />} />
            <Route path="/deliveries/history" element={<MyDeliveries status="completed" />} />
            <Route path="/deliveries/:id" element={<DeliveryDetail />} />
            <Route path="*" element={<Navigate to="/deliveries" replace />} />
          </Routes>
          </Suspense>
        </DeliveryShell>
      </AccessProvider>
    )
  }

  return (
    <AccessProvider value={access}>
      <CompanyShell
        organisationName={session.organisation.legalName}
        userName={session.user.fullName}
        verificationStatus={session.organisation.verificationStatus}
        onSignOut={signOut}
      >
        <PushBridge />
        <RequireCompanyRole>
          <Suspense fallback={<Skeleton rows={6} />}>
          <Routes>
            <Route path="/" element={<Dashboard userName={session.user.fullName} />} />
            <Route path="/market" element={<MarketIntelligence />} />
            <Route path="/products" element={<ListingList kind="product" />} />
            <Route path="/products/new" element={<ListingEditor kind="product" />} />
            <Route path="/products/:id/edit" element={<ListingEditor kind="product" />} />
            <Route path="/products/:id" element={<ListingDetail kind="product" />} />
            <Route path="/services" element={<ListingList kind="service" />} />
            <Route path="/services/new" element={<ListingEditor kind="service" />} />
            <Route path="/services/:id/edit" element={<ListingEditor kind="service" />} />
            <Route path="/services/:id" element={<ListingDetail kind="service" />} />
            <Route path="/solutions" element={<SolutionCenter />} />
            <Route path="/inventory" element={<Inventory />} />
            <Route path="/orders" element={<OrderList />} />
            <Route path="/orders/:id" element={<OrderDetail />} />
            <Route path="/discounts" element={<Discounts />} />
            <Route path="/discounts/new" element={<DiscountEditor />} />
            <Route path="/discounts/:id/edit" element={<DiscountEditor />} />
            <Route path="/reviews" element={<Reviews />} />
            <Route path="/payments" element={<Payments />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/notifications" element={<Notifications />} />
            <Route path="/profile" element={<CompanyProfile />} />
            <Route path="/verification" element={<Verification />} />
            <Route path="/team" element={<Team />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/feedback" element={<Feedback />} />
            <Route path="/help" element={<HelpCenter />} />
            <Route path="/support" element={<ContactSupport />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
          </Suspense>
        </RequireCompanyRole>
      </CompanyShell>
    </AccessProvider>
  )
}

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<RegisterCompany />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/accept-invitation" element={<AcceptInvitation />} />
      <Route path="/*" element={<RequireAuth><Shell /></RequireAuth>} />
    </Routes>
  )
}
