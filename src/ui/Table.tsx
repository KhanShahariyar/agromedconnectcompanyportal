import type { ReactNode } from 'react'
import { useT, useFormat } from '@/i18n/LocaleProvider'
import { Button } from './primitives'

export interface Column<T> {
  key: string
  header: string
  render: (row: T) => ReactNode
  align?: 'left' | 'right'
  width?: string
}

export function Table<T>({ columns, rows, rowKey, onRowClick }: {
  columns: Column<T>[]
  rows: T[]
  rowKey: (row: T) => string
  onRowClick?: (row: T) => void
}) {
  return (
    <div className="overflow-x-auto rounded-card border border-line bg-panel">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="bg-sunken text-left">
            {columns.map((c) => (
              <th
                key={c.key}
                scope="col"
                style={c.width ? { width: c.width } : undefined}
                className={`px-4 py-2.5 text-xs font-medium text-ink-soft ${c.align === 'right' ? 'text-right' : ''}`}
              >
                {c.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr
              key={rowKey(row)}
              onClick={onRowClick ? () => onRowClick(row) : undefined}
              className={`border-t border-line ${onRowClick ? 'cursor-pointer hover:bg-base' : ''}`}
            >
              {columns.map((c) => (
                <td key={c.key} className={`px-4 py-3 text-ink ${c.align === 'right' ? 'text-right' : ''}`}>
                  {c.render(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export function Pagination({ page, pageSize, total, onChange }: {
  page: number
  pageSize: number
  total: number
  onChange: (page: number) => void
}) {
  const t = useT()
  const f = useFormat()
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1
  const to = Math.min(page * pageSize, total)
  const lastPage = Math.max(1, Math.ceil(total / pageSize))

  return (
    <div data-testid="pagination" className="mt-3 flex items-center justify-between gap-3">
      <span className="text-xs text-ink-soft">
        {t('paging.showing', { from: f.number(from), to: f.number(to), total: f.number(total) })}
      </span>
      <div className="flex gap-2">
        <Button size="sm" variant="secondary" disabled={page <= 1} onClick={() => onChange(page - 1)}>‹</Button>
        <Button size="sm" variant="secondary" disabled={page >= lastPage} onClick={() => onChange(page + 1)}>›</Button>
      </div>
    </div>
  )
}
