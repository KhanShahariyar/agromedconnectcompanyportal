import React from 'react'
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  LineChart,
  Line,
} from 'recharts'
import { Download, FileText } from 'lucide-react'
import { PageHeader, Card, Button, StatCard, SectionLabel } from '../components/ui'
import { revenueTrend } from '../data/mockData'

function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-panel border border-line rounded-md px-3 py-2 text-xs shadow-card">
      <div className="font-medium text-ink mb-0.5">{label}</div>
      {payload.map((p) => (
        <div key={p.dataKey} className="text-ink-soft">
          {p.name}: {p.dataKey === 'revenue' ? `৳${p.value.toLocaleString()}` : p.value}
        </div>
      ))}
    </div>
  )
}

export default function Analytics() {
  return (
    <div>
      <PageHeader
        eyebrow="Performance"
        title="Business analytics"
        description="A complete view of how your company is performing on AgroMED Connect."
        actions={
          <>
            <Button variant="secondary"><FileText size={15} /> Export PDF</Button>
            <Button variant="secondary"><Download size={15} /> Export CSV</Button>
          </>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <StatCard label="Revenue" value="৳342,800" trend="up" delta="+18.4%" />
        <StatCard label="Avg. order value" value="৳2,678" trend="up" delta="+4.1%" />
        <StatCard label="Conversion rate" value="6.4%" trend="up" delta="+0.6pt" />
        <StatCard label="Repeat customers" value="41%" trend="up" delta="+3pt" />
      </div>

      <Card className="p-5 mb-5">
        <SectionLabel>Revenue trend</SectionLabel>
        <div style={{ width: '100%', height: 260 }}>
          <ResponsiveContainer>
            <AreaChart data={revenueTrend} margin={{ left: -10, right: 10, top: 8 }}>
              <defs>
                <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#5C7239" stopOpacity={0.25} />
                  <stop offset="100%" stopColor="#5C7239" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} stroke="#E4E0D3" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#8B8778' }} axisLine={{ stroke: '#E4E0D3' }} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#8B8778' }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v / 1000}k`} />
              <Tooltip content={<ChartTooltip />} />
              <Area type="monotone" dataKey="revenue" name="Revenue" stroke="#5C7239" strokeWidth={2} fill="url(#rev)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <div className="grid lg:grid-cols-2 gap-5">
        <Card className="p-5">
          <SectionLabel>Order trend</SectionLabel>
          <div style={{ width: '100%', height: 200 }}>
            <ResponsiveContainer>
              <LineChart data={revenueTrend} margin={{ left: -20, right: 10, top: 8 }}>
                <CartesianGrid vertical={false} stroke="#E4E0D3" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#8B8778' }} axisLine={{ stroke: '#E4E0D3' }} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#8B8778' }} axisLine={false} tickLine={false} />
                <Tooltip content={<ChartTooltip />} />
                <Line type="monotone" dataKey="orders" name="Orders" stroke="#B8752F" strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-5">
          <SectionLabel>What's driving growth</SectionLabel>
          <div className="space-y-3 text-sm text-ink-soft">
            <p>Rice seed and fertilizer categories account for the largest share of this month's revenue growth, aligned with the approaching Aman season.</p>
            <p>Farmer requests converted to paid consultations or product recommendations at a 38% rate — up from 31% last month.</p>
            <p>Khulna and Rajshahi remain your strongest regions by order volume and repeat purchase rate.</p>
          </div>
        </Card>
      </div>
    </div>
  )
}
