'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { buildUrl, exportToCsv, httpGet } from '@/lib/http'

type TaskItem = {
  id: string
  org: string
  title?: string
  status?: string
  assignee?: string
  due?: string
  metadata?: Record<string, unknown>
  [key: string]: unknown
}

type PageResult = {
  items: TaskItem[]
  nextCursor?: string | null
}

export default function TasksPage() {
  const searchParams = useSearchParams()
  const router = useRouter()

  const org = searchParams.get('org') ?? ''
  const status = searchParams.get('status') ?? ''
  const assignee = searchParams.get('assignee') ?? ''

  const [items, setItems] = useState<TaskItem[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [nextCursor, setNextCursor] = useState<string | null>(null)
  const [cursor, setCursor] = useState<string | undefined>(undefined)
  const [refreshKey, setRefreshKey] = useState(0)
  const [isAppending, setIsAppending] = useState(false)

  const url = useMemo(() => {
    if (!org) return null
    const query: Record<string, string> = { org }
    if (status) query.status = status
    if (assignee) query.assignee = assignee
    if (cursor) query.cursor = cursor
    return buildUrl('/tasks', query)
  }, [org, status, assignee, cursor])

  useEffect(() => {
    setItems([])
    setCursor(undefined)
    setNextCursor(null)
    setIsAppending(false)
  }, [org, status, assignee])

  useEffect(() => {
    let cancelled = false

    async function run() {
      if (!url) {
        setItems([])
        setNextCursor(null)
        return
      }

      try {
        setLoading(true)
        setError(null)
        const response = await httpGet<PageResult>(url)
        if (cancelled) return

        setItems((prev) =>
          isAppending ? [...prev, ...response.items] : response.items
        )
        setNextCursor(response.nextCursor ?? null)
      } catch (err) {
        if (cancelled) return
        const message =
          err instanceof Error ? err.message : 'Failed to load tasks.'
        setError(message)
        if (!isAppending) {
          setItems([])
          setNextCursor(null)
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
          setIsAppending(false)
        }
      }
    }

    run()
    return () => {
      cancelled = true
    }
  }, [url, refreshKey])

  const updateQuery = (next: Record<string, string | undefined>) => {
    const params = new URLSearchParams(searchParams.toString())
    Object.entries(next).forEach(([key, value]) => {
      if (!value) {
        params.delete(key)
      } else {
        params.set(key, value)
      }
    })
    const query = params.toString()
    router.replace(query ? `/tasks/?${query}` : '/tasks/')
  }

  const loadMore = () => {
    if (!nextCursor) return
    setIsAppending(true)
    setCursor(nextCursor)
  }

  const handleExport = () => {
    if (!items.length) return
    exportToCsv(
      `tasks-${org || 'all'}.csv`,
      items.map((item) => ({
        id: item.id,
        title: item.title,
        status: item.status,
        assignee: item.assignee,
        due: item.due,
      }))
    )
  }

  return (
    <main className="mx-auto max-w-6xl space-y-6 px-4 py-10">
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold text-gray-900">Tasks</h1>
        <p className="text-sm text-gray-600">
          Track organization tasks and assignments via the public API.
        </p>
      </header>

      <section className="flex flex-wrap items-end gap-4 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex min-w-[200px] flex-col">
          <label htmlFor="org-input" className="text-sm font-semibold text-gray-700">
            Organization ID
          </label>
          <input
            id="org-input"
            type="text"
            value={org}
            onChange={(event) =>
              updateQuery({ org: event.target.value.trim() || undefined })
            }
            placeholder="org-123"
            className="mt-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-yellow-500 focus:outline-none focus:ring-2 focus:ring-yellow-200"
          />
        </div>
        <div className="flex min-w-[180px] flex-col">
          <label htmlFor="status-input" className="text-sm font-semibold text-gray-700">
            Status
          </label>
          <input
            id="status-input"
            type="text"
            value={status}
            onChange={(event) =>
              updateQuery({ status: event.target.value.trim() || undefined })
            }
            placeholder="open"
            className="mt-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-yellow-500 focus:outline-none focus:ring-2 focus:ring-yellow-200"
          />
        </div>
        <div className="flex min-w-[200px] flex-col">
          <label htmlFor="assignee-input" className="text-sm font-semibold text-gray-700">
            Assignee
          </label>
          <input
            id="assignee-input"
            type="text"
            value={assignee}
            onChange={(event) =>
              updateQuery({ assignee: event.target.value.trim() || undefined })
            }
            placeholder="user-789"
            className="mt-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-yellow-500 focus:outline-none focus:ring-2 focus:ring-yellow-200"
          />
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => updateQuery({ status: undefined, assignee: undefined })}
            className="inline-flex items-center rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-200"
          >
            Clear filters
          </button>
          <button
            type="button"
            onClick={() => {
              setIsAppending(false)
              setCursor(undefined)
              setRefreshKey((key) => key + 1)
            }}
            className="inline-flex items-center rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-200"
          >
            Refresh
          </button>
          <button
            type="button"
            onClick={handleExport}
            disabled={!items.length}
            className="inline-flex items-center rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-200 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Export CSV
          </button>
        </div>
      </section>

      {!org && (
        <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 p-8 text-center text-sm text-gray-500">
          Provide an organization ID to load tasks.
        </div>
      )}

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      <section className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 text-left text-sm text-gray-700">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 font-semibold uppercase tracking-wide text-xs text-gray-500">
                  Title
                </th>
                <th className="px-4 py-3 font-semibold uppercase tracking-wide text-xs text-gray-500">
                  Status
                </th>
                <th className="px-4 py-3 font-semibold uppercase tracking-wide text-xs text-gray-500">
                  Assignee
                </th>
                <th className="px-4 py-3 font-semibold uppercase tracking-wide text-xs text-gray-500">
                  Due
                </th>
                <th className="px-4 py-3 font-semibold uppercase tracking-wide text-xs text-gray-500">
                  Metadata
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading && items.length === 0 && (
                <tr>
                  <td
                    colSpan={5}
                    className="px-4 py-6 text-center text-sm text-gray-500"
                  >
                    Loading tasks…
                  </td>
                </tr>
              )}
              {!loading && items.length === 0 && (
                <tr>
                  <td
                    colSpan={5}
                    className="px-4 py-6 text-center text-sm text-gray-500"
                  >
                    No tasks found.
                  </td>
                </tr>
              )}
              {items.map((item) => (
                <tr key={item.id}>
                  <td className="px-4 py-3 text-sm text-gray-800">
                    {item.title || '—'}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-800">
                    {item.status || '—'}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-800">
                    {item.assignee || '—'}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-800">
                    {item.due ? new Date(item.due).toLocaleDateString() : '—'}
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-800">
                    <details>
                      <summary className="cursor-pointer text-yellow-600">
                        View
                      </summary>
                      <pre className="mt-1 max-h-48 overflow-auto rounded bg-gray-900 px-3 py-2 text-xs text-gray-50">
                        {JSON.stringify(item.metadata ?? {}, null, 2)}
                      </pre>
                    </details>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between border-t border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-600">
          <span>
            Showing {items.length} task{items.length === 1 ? '' : 's'}
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setIsAppending(false)
                setCursor(undefined)
                setRefreshKey((key) => key + 1)
              }}
              className="inline-flex items-center rounded border border-gray-300 px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-200"
            >
              Refresh
            </button>
            {nextCursor && (
              <button
                type="button"
                onClick={loadMore}
                disabled={loading}
                className="inline-flex items-center rounded bg-yellow-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-yellow-600 focus:outline-none focus:ring-2 focus:ring-yellow-300 disabled:opacity-60"
              >
                {loading && isAppending ? 'Loading…' : 'Load more'}
              </button>
            )}
          </div>
        </div>
      </section>
    </main>
  )
}

