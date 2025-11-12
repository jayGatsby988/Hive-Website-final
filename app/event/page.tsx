'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { buildUrl, httpGet } from '@/lib/http'

type EventDetail = {
  id: string
  org: string
  name?: string
  ts?: string
  description?: string
  status?: string
  location?: string
  capacity?: number
  actor?: string
  metadata?: Record<string, unknown>
  [key: string]: unknown
}

export default function EventDetailPage() {
  const searchParams = useSearchParams()
  const router = useRouter()

  const org = searchParams.get('org') ?? ''
  const eventId = searchParams.get('event') ?? ''

  const [detail, setDetail] = useState<EventDetail | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const url = useMemo(() => {
    if (!org || !eventId) return null
    return buildUrl('/events/detail', { org, event: eventId })
  }, [org, eventId])

  useEffect(() => {
    let cancelled = false

    async function load() {
      if (!url) {
        setDetail(null)
        return
      }

      try {
        setLoading(true)
        setError(null)
        const result = await httpGet<EventDetail>(url)
        if (!cancelled) {
          setDetail(result)
        }
      } catch (err) {
        if (!cancelled) {
          const message =
            err instanceof Error ? err.message : 'Failed to load event.'
          setError(message)
          setDetail(null)
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [url])

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
    router.replace(query ? `/event/?${query}` : '/event/')
  }

  return (
    <main className="mx-auto max-w-4xl space-y-6 px-4 py-10">
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold text-gray-900">Event detail</h1>
        <p className="text-sm text-gray-600">
          Load a single event by providing both{' '}
          <code className="rounded bg-gray-100 px-1 py-0.5 text-xs">org</code>{' '}
          and{' '}
          <code className="rounded bg-gray-100 px-1 py-0.5 text-xs">
            event
          </code>{' '}
          query parameters.
        </p>
      </header>

      <section className="flex flex-wrap items-end gap-4 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex min-w-[200px] flex-col">
          <label
            htmlFor="org-input"
            className="text-sm font-semibold text-gray-700"
          >
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
        <div className="flex min-w-[200px] flex-col">
          <label
            htmlFor="event-input"
            className="text-sm font-semibold text-gray-700"
          >
            Event ID
          </label>
          <input
            id="event-input"
            type="text"
            value={eventId}
            onChange={(event) =>
              updateQuery({ event: event.target.value.trim() || undefined })
            }
            placeholder="event-456"
            className="mt-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-yellow-500 focus:outline-none focus:ring-2 focus:ring-yellow-200"
          />
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <span className="inline-flex h-2 w-2 rounded-full bg-yellow-500" />
          All requests happen in the browser—ensure the API supports CORS.
        </div>
      </section>

      {loading && (
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <div className="animate-pulse space-y-4">
            <div className="h-5 w-1/3 rounded bg-gray-200" />
            <div className="h-32 rounded bg-gray-100" />
          </div>
        </div>
      )}

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {(!org || !eventId) && !loading && (
        <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 p-8 text-center text-sm text-gray-500">
          Enter both an organization ID and an event ID to load data.
        </div>
      )}

      {detail && !loading && !error && (
        <section className="space-y-4 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <div>
            <h2 className="text-2xl font-semibold text-gray-900">
              {detail.name || detail.id}
            </h2>
            <p className="mt-1 text-sm text-gray-500">Org: {detail.org}</p>
            {detail.ts && (
              <p className="mt-1 text-sm text-gray-500">
                Scheduled:{' '}
                {new Date(detail.ts).toLocaleString(undefined, {
                  dateStyle: 'medium',
                  timeStyle: 'short',
                })}
              </p>
            )}
          </div>

          {detail.description && (
            <p className="rounded-lg border border-gray-100 bg-gray-50 p-4 text-sm text-gray-800">
              {detail.description}
            </p>
          )}

          <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {detail.status && (
              <div className="rounded-lg border border-gray-100 bg-gray-50 p-4">
                <dt className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Status
                </dt>
                <dd className="mt-1 text-sm text-gray-800">{detail.status}</dd>
              </div>
            )}
            {detail.location && (
              <div className="rounded-lg border border-gray-100 bg-gray-50 p-4">
                <dt className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Location
                </dt>
                <dd className="mt-1 text-sm text-gray-800">
                  {detail.location}
                </dd>
              </div>
            )}
            {detail.capacity != null && (
              <div className="rounded-lg border border-gray-100 bg-gray-50 p-4">
                <dt className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Capacity
                </dt>
                <dd className="mt-1 text-sm text-gray-800">
                  {detail.capacity}
                </dd>
              </div>
            )}
            {detail.actor && (
              <div className="rounded-lg border border-gray-100 bg-gray-50 p-4">
                <dt className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Actor
                </dt>
                <dd className="mt-1 text-sm text-gray-800">{detail.actor}</dd>
              </div>
            )}
          </dl>

          {detail.metadata && (
            <div>
              <h3 className="text-sm font-semibold text-gray-700">Metadata</h3>
              <pre className="mt-2 max-h-64 overflow-auto rounded-lg bg-gray-900 px-3 py-2 text-xs text-gray-50">
                {JSON.stringify(detail.metadata, null, 2)}
              </pre>
            </div>
          )}
        </section>
      )}
    </main>
  )
}


