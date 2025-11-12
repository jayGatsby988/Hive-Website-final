'use client'

import React, { useCallback, useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import {
  AuditLogItem,
  fetchAuditLogs,
  AuditLogRequestParams,
} from '@/lib/auditClient'

type FilterState = {
  org: string
  from: string
  to: string
  action: string
  actor: string
}

const DEFAULT_LIMIT = 25
const SKELETON_ROWS = 6

type SearchParamReader = {
  get(name: string): string | null
}

const readFiltersFromParams = (params: SearchParamReader): FilterState => ({
  org: params.get('org') ?? '',
  from: params.get('from') ?? '',
  to: params.get('to') ?? '',
  action: params.get('action') ?? '',
  actor: params.get('actor') ?? '',
})

const formatTimestamp = (isoString: string) => {
  if (!isoString) return '—'
  const date = new Date(isoString)
  if (Number.isNaN(date.getTime())) {
    return isoString
  }

  return date.toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
}

const stringifyMetadata = (metadata: unknown) => {
  if (metadata == null) return '—'
  if (typeof metadata === 'string') {
    return metadata
  }
  try {
    return JSON.stringify(metadata, null, 2)
  } catch {
    return String(metadata)
  }
}

const AuditLogPage: React.FC = () => {
  const searchParams = useSearchParams()

  const initialFiltersRef = useRef<FilterState | null>(null)
  if (!initialFiltersRef.current) {
    initialFiltersRef.current = readFiltersFromParams(searchParams)
  }
  const initialFilters = initialFiltersRef.current as FilterState

  const [filters, setFilters] = useState<FilterState>(initialFilters)
  const [formState, setFormState] = useState<FilterState>(initialFilters)
  const [autoRefresh, setAutoRefresh] = useState<boolean>(
    searchParams.get('autoRefresh') === 'true'
  )

  const [items, setItems] = useState<AuditLogItem[]>([])
  const [nextCursor, setNextCursor] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isFetchingMore, setIsFetchingMore] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set())

  const lastAppliedFilters = useRef<FilterState>(initialFilters)

  const syncUrl = useCallback((nextFilters: FilterState, auto: boolean) => {
    if (typeof window === 'undefined') return

    const params = new URLSearchParams()
    if (nextFilters.org) params.set('org', nextFilters.org)
    if (nextFilters.from) params.set('from', nextFilters.from)
    if (nextFilters.to) params.set('to', nextFilters.to)
    if (nextFilters.action) params.set('action', nextFilters.action)
    if (nextFilters.actor) params.set('actor', nextFilters.actor)
    if (auto) params.set('autoRefresh', 'true')

    const query = params.toString()
    const path = query ? `/audit-log/?${query}` : '/audit-log/'
    window.history.replaceState(null, '', path)
  }, [])

  const loadLogs = useCallback(
    async ({
      append = false,
      cursor = null,
      silent = false,
    }: {
      append?: boolean
      cursor?: string | null
      silent?: boolean
    } = {}) => {
      if (!filters.org) {
        setItems([])
        setNextCursor(null)
        return
      }

      const request: AuditLogRequestParams = {
        org: filters.org,
        limit: DEFAULT_LIMIT,
        cursor,
        from: filters.from || undefined,
        to: filters.to || undefined,
        action: filters.action || undefined,
        actor: filters.actor || undefined,
      }

      try {
        if (append) {
          setIsFetchingMore(true)
        } else if (!silent) {
          setIsLoading(true)
        }
        setError(null)

        const response = await fetchAuditLogs(request)

        setItems((prev) =>
          append ? [...prev, ...response.items] : response.items
        )
        setNextCursor(response.nextCursor)
      } catch (err) {
        const message =
          err instanceof Error ? err.message : 'Failed to load audit logs.'
        setError(message)
        if (!append) {
          setItems([])
          setNextCursor(null)
        }
      } finally {
        if (append) {
          setIsFetchingMore(false)
        } else if (!silent) {
          setIsLoading(false)
        }
      }
    },
    [filters]
  )

  useEffect(() => {
    syncUrl(filters, autoRefresh)
  }, [filters, autoRefresh, syncUrl])

  useEffect(() => {
    loadLogs()
  }, [loadLogs])

  useEffect(() => {
    if (!autoRefresh || !filters.org) return

    const interval = setInterval(() => {
      loadLogs({ append: false, cursor: null, silent: true })
    }, 15000)

    return () => clearInterval(interval)
  }, [autoRefresh, filters.org, loadLogs])

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const trimmed: FilterState = {
      org: formState.org.trim(),
      from: formState.from,
      to: formState.to,
      action: formState.action.trim(),
      actor: formState.actor.trim(),
    }

    if (JSON.stringify(trimmed) === JSON.stringify(lastAppliedFilters.current)) {
      return
    }

    lastAppliedFilters.current = trimmed
    setExpandedRows(new Set())
    setFilters(trimmed)
  }

  const handleReset = () => {
    const cleared: FilterState = {
      org: '',
      from: '',
      to: '',
      action: '',
      actor: '',
    }
    lastAppliedFilters.current = cleared
    setFormState(cleared)
    setExpandedRows(new Set())
    setFilters(cleared)
  }

  const toggleRow = (id: string) => {
    setExpandedRows((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  const handleExportCsv = () => {
    if (!items.length) return
    const header = ['Time', 'Actor', 'Action', 'Resource', 'Metadata']
    const rows = items.map((item) => [
      formatTimestamp(item.ts),
      item.actor ?? '',
      item.action ?? '',
      item.resource ?? '',
      stringifyMetadata(item.metadata).replace(/"/g, '""'),
    ])

    const csv = [header, ...rows]
      .map((cols) => cols.map((col) => `"${col}"`).join(','))
      .join('\n')

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `audit-log-${filters.org || 'all'}.csv`
    link.click()
    URL.revokeObjectURL(url)
  }

  const renderSkeleton = () => (
    <tbody>
      {Array.from({ length: SKELETON_ROWS }).map((_, index) => (
        <tr key={index} className="animate-pulse border-b border-gray-100">
          <td className="px-4 py-3">
            <div className="h-4 w-24 rounded bg-gray-200" />
          </td>
          <td className="px-4 py-3">
            <div className="h-4 w-20 rounded bg-gray-200" />
          </td>
          <td className="px-4 py-3">
            <div className="h-4 w-16 rounded bg-gray-200" />
          </td>
          <td className="px-4 py-3">
            <div className="h-4 w-28 rounded bg-gray-200" />
          </td>
          <td className="px-4 py-3">
            <div className="h-4 w-32 rounded bg-gray-200" />
          </td>
        </tr>
      ))}
    </tbody>
  )

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-6xl px-4 py-10">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Audit Log</h1>
          <p className="mt-2 text-sm text-gray-600">
            View audit entries fetched directly from the audit API endpoint.
            Provide an organization ID to begin.
          </p>
        </header>

        <section className="mb-6 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <form
            onSubmit={handleSubmit}
            className="flex flex-wrap items-end gap-4"
          >
            <div className="flex flex-1 min-w-[200px] flex-col">
              <label
                htmlFor="org"
                className="text-sm font-semibold text-gray-700"
              >
                Organization
              </label>
              <input
                id="org"
                type="text"
                required
                placeholder="org-123"
                value={formState.org}
                onChange={(event) =>
                  setFormState((prev) => ({
                    ...prev,
                    org: event.target.value,
                  }))
                }
                className="mt-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-yellow-500 focus:outline-none focus:ring-2 focus:ring-yellow-200"
              />
            </div>

            <div className="flex min-w-[160px] flex-col">
              <label
                htmlFor="from"
                className="text-sm font-semibold text-gray-700"
              >
                From
              </label>
              <input
                id="from"
                type="datetime-local"
                value={formState.from}
                onChange={(event) =>
                  setFormState((prev) => ({
                    ...prev,
                    from: event.target.value,
                  }))
                }
                className="mt-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-yellow-500 focus:outline-none focus:ring-2 focus:ring-yellow-200"
              />
            </div>

            <div className="flex min-w-[160px] flex-col">
              <label htmlFor="to" className="text-sm font-semibold text-gray-700">
                To
              </label>
              <input
                id="to"
                type="datetime-local"
                value={formState.to}
                onChange={(event) =>
                  setFormState((prev) => ({
                    ...prev,
                    to: event.target.value,
                  }))
                }
                className="mt-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-yellow-500 focus:outline-none focus:ring-2 focus:ring-yellow-200"
              />
            </div>

            <div className="flex min-w-[160px] flex-col">
              <label
                htmlFor="action"
                className="text-sm font-semibold text-gray-700"
              >
                Action
              </label>
              <input
                id="action"
                type="text"
                value={formState.action}
                onChange={(event) =>
                  setFormState((prev) => ({
                    ...prev,
                    action: event.target.value,
                  }))
                }
                className="mt-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-yellow-500 focus:outline-none focus:ring-2 focus:ring-yellow-200"
              />
            </div>

            <div className="flex min-w-[160px] flex-col">
              <label
                htmlFor="actor"
                className="text-sm font-semibold text-gray-700"
              >
                Actor
              </label>
              <input
                id="actor"
                type="text"
                value={formState.actor}
                onChange={(event) =>
                  setFormState((prev) => ({
                    ...prev,
                    actor: event.target.value,
                  }))
                }
                className="mt-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-yellow-500 focus:outline-none focus:ring-2 focus:ring-yellow-200"
              />
            </div>

            <div className="flex items-center gap-3">
              <button
                type="submit"
                className="inline-flex items-center rounded-lg bg-yellow-500 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-yellow-600 focus:outline-none focus:ring-2 focus:ring-yellow-300"
              >
                Apply filters
              </button>
              <button
                type="button"
                onClick={handleReset}
                className="inline-flex items-center rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-200"
              >
                Reset
              </button>
            </div>
          </form>

          <div className="mt-6 flex flex-wrap items-center gap-4 border-t border-gray-200 pt-4">
            <label className="inline-flex items-center gap-2 text-sm font-medium text-gray-700">
              <input
                type="checkbox"
                checked={autoRefresh}
                onChange={(event) => setAutoRefresh(event.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-yellow-500 focus:ring-yellow-400"
              />
              Auto refresh every 15s
            </label>

            <button
              type="button"
              onClick={() => loadLogs({ append: false, cursor: null })}
              className="inline-flex items-center rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 transition hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-200"
            >
              Refresh now
            </button>

            <button
              type="button"
              onClick={handleExportCsv}
              disabled={!items.length}
              className="inline-flex items-center rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 transition hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-200 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Export CSV
            </button>
          </div>
        </section>

        {error && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            <div className="flex items-center justify-between">
              <span>{error}</span>
              <button
                type="button"
                onClick={() => loadLogs()}
                className="rounded border border-red-300 px-3 py-1 text-xs font-semibold text-red-700 transition hover:bg-red-100"
              >
                Retry
              </button>
            </div>
          </div>
        )}

        <section className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 text-left text-sm text-gray-700">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 font-semibold uppercase tracking-wide text-xs text-gray-500">
                    Time
                  </th>
                  <th className="px-4 py-3 font-semibold uppercase tracking-wide text-xs text-gray-500">
                    Actor
                  </th>
                  <th className="px-4 py-3 font-semibold uppercase tracking-wide text-xs text-gray-500">
                    Action
                  </th>
                  <th className="px-4 py-3 font-semibold uppercase tracking-wide text-xs text-gray-500">
                    Resource
                  </th>
                  <th className="px-4 py-3 font-semibold uppercase tracking-wide text-xs text-gray-500">
                    Metadata
                  </th>
                </tr>
              </thead>
              {isLoading ? (
                renderSkeleton()
              ) : (
                <tbody className="divide-y divide-gray-100">
                  {items.map((item, index) => {
                    const rowId = item.id || `${item.ts}-${index}`
                    const metadata = stringifyMetadata(item.metadata)
                    const isExpanded = expandedRows.has(rowId)

                    return (
                      <tr key={rowId} className="align-top">
                        <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-800">
                          {formatTimestamp(item.ts)}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-800">
                          {item.actor || '—'}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-800">
                          {item.action || '—'}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-800">
                          {item.resource || '—'}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-800">
                          <button
                            type="button"
                            onClick={() => toggleRow(rowId)}
                            className="mb-2 inline-flex items-center rounded border border-gray-300 px-3 py-1 text-xs font-semibold text-gray-700 transition hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-200"
                          >
                            {isExpanded ? 'Hide details' : 'View details'}
                          </button>
                          {isExpanded && (
                            <pre className="overflow-x-auto rounded bg-gray-900 px-3 py-2 text-xs text-gray-100">
                              {metadata}
                            </pre>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                  {!items.length && (
                    <tr>
                      <td
                        colSpan={5}
                        className="px-4 py-10 text-center text-sm text-gray-500"
                      >
                        No audit entries found.
                      </td>
                    </tr>
                  )}
                </tbody>
              )}
            </table>
          </div>

          <div className="flex items-center justify-between border-t border-gray-200 bg-gray-50 px-4 py-3">
            <span className="text-xs text-gray-500">
              Showing {items.length} entr{items.length === 1 ? 'y' : 'ies'}
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => loadLogs()}
                className="inline-flex items-center rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-semibold text-gray-700 transition hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-200"
              >
                Refresh
              </button>
              {nextCursor && (
                <button
                  type="button"
                  onClick={() =>
                    loadLogs({
                      append: true,
                      cursor: nextCursor,
                      silent: true,
                    })
                  }
                  disabled={isFetchingMore}
                  className="inline-flex items-center rounded-lg bg-yellow-500 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-yellow-600 focus:outline-none focus:ring-2 focus:ring-yellow-300 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isFetchingMore ? 'Loading…' : 'Load more'}
                </button>
              )}
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}

export default AuditLogPage

