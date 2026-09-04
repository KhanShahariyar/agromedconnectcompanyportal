import React from 'react'
import { PageHeader, Card, SectionLabel, Button } from '../components/ui'

const toggles = [
  { label: 'New farmer requests', desc: 'Get notified when a farmer submits a request.' },
  { label: 'High product demand', desc: 'Alert when demand rises sharply for your products.' },
  { label: 'Low stock', desc: 'Alert when a product falls below its reorder threshold.' },
  { label: 'New reviews', desc: 'Get notified when a customer or farmer leaves a review.' },
]

function Toggle({ defaultOn = true }) {
  const [on, setOn] = React.useState(defaultOn)
  return (
    <button
      onClick={() => setOn(!on)}
      className={`w-10 h-6 rounded-full transition-colors relative shrink-0 ${on ? 'bg-moss-600' : 'bg-line'}`}
    >
      <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-transform ${on ? 'translate-x-[18px]' : 'translate-x-0.5'}`} />
    </button>
  )
}

export default function Settings() {
  return (
    <div>
      <PageHeader eyebrow="Preferences" title="Settings" description="Manage account, notification and business preferences." />

      <Card className="p-5 mb-5">
        <SectionLabel>Business preferences</SectionLabel>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="text-xs text-ink-faint">Company name</label>
            <input defaultValue="Bengal AgroCare Ltd." className="w-full mt-1 border border-line rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-moss-300" />
          </div>
          <div>
            <label className="text-xs text-ink-faint">Contact email</label>
            <input defaultValue="contact@bengalagrocare.com" className="w-full mt-1 border border-line rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-moss-300" />
          </div>
        </div>
        <Button className="mt-4">Save changes</Button>
      </Card>

      <Card className="p-5">
        <SectionLabel>Notification preferences</SectionLabel>
        <div className="divide-y divide-line">
          {toggles.map((t) => (
            <div key={t.label} className="flex items-center justify-between py-3">
              <div>
                <div className="text-sm text-ink font-medium">{t.label}</div>
                <div className="text-xs text-ink-faint">{t.desc}</div>
              </div>
              <Toggle />
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}
