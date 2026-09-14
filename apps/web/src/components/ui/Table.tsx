import { type ReactNode } from 'react'
import clsx from 'clsx'
import { Spinner } from './Spinner'
import { EmptyState } from './EmptyState'

export interface TableColumn<T = Record<string, unknown>> {
  key: string
  header: string
  render?: (value: unknown, row: T) => ReactNode
}

interface TableProps<T extends Record<string, unknown>> {
  columns: TableColumn<T>[]
  data: T[]
  loading?: boolean
  emptyText?: string
  renderRow?: (row: T, rowIdx: number) => ReactNode
}

export function Table<T extends Record<string, unknown>>({
  columns,
  data,
  loading = false,
  emptyText = 'Nenhum registro encontrado.',
  renderRow,
}: TableProps<T>) {
  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Spinner />
      </div>
    )
  }

  if (data.length === 0) {
    return <EmptyState title={emptyText} />
  }

  return (
    <div className="overflow-x-auto rounded-md border border-gray-200">
      <table className="min-w-full divide-y divide-gray-200 text-sm">
        <thead className="bg-gray-50">
          <tr>
            {columns.map((col) => (
              <th
                key={col.key}
                className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap"
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 bg-white">
          {data.map((row, rowIdx) => renderRow ? renderRow(row, rowIdx) : (
            <tr
              key={rowIdx}
              className={clsx(rowIdx % 2 === 1 && 'bg-gray-50')}
            >
              {columns.map((col) => (
                <td key={col.key} className="px-4 py-3 text-gray-700">
                  {col.render
                    ? col.render(row[col.key], row)
                    : String(row[col.key] ?? '')}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
