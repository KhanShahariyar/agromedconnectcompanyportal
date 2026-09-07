import { useFormat } from '@/i18n/LocaleProvider'

export interface Step {
  key: string
  label: string
  at?: string | null
  actor?: string | null
}

/**
 * Renders a fulfilment machine as steps with a timestamp and actor each.
 *
 * `pendingNote` says who the system is waiting on when the next step is not the
 * viewer's to take — spec 8.1 requires that a company cannot mark a partner
 * delivery complete, so the screen must explain the wait rather than show a
 * dead control.
 */
export function Stepper({ steps, currentIndex, pendingNote }: {
  steps: Step[]
  currentIndex: number
  pendingNote?: string
}) {
  const f = useFormat()
  return (
    <ol className="space-y-0">
      {steps.map((s, i) => {
        const done = i <= currentIndex
        const isCurrent = i === currentIndex
        return (
          <li key={s.key} className="flex gap-3">
            <div className="flex flex-col items-center">
              <span
                aria-hidden
                className={`mt-1 h-3 w-3 shrink-0 rounded-full border-2 ${done ? 'border-primary bg-primary' : 'border-line bg-panel'}`}
              />
              {i < steps.length - 1 && (
                <span aria-hidden className={`w-0.5 flex-1 ${i < currentIndex ? 'bg-primary' : 'bg-line'}`} />
              )}
            </div>
            <div className="pb-5">
              <div className={`text-sm ${done ? 'font-medium text-ink' : 'text-ink-faint'}`}>
                {s.label}
                {isCurrent && <span className="sr-only"> (current step)</span>}
              </div>
              {s.at && (
                <div className="mt-0.5 text-xs text-ink-soft">
                  {f.dateTime(s.at)}
                  {s.actor ? ` · ${s.actor}` : ''}
                </div>
              )}
              {isCurrent && pendingNote && (
                <div data-testid="awaiting-platform" className="mt-1 text-xs text-info">{pendingNote}</div>
              )}
            </div>
          </li>
        )
      })}
    </ol>
  )
}
