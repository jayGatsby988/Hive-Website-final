'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { buildUrl, httpGet } from '@/lib/http'

type OrganizationMetrics = Record<string, unknown>

type OrganizationDetail = {
  id: string
  name?: string
  description?: string
  createdAt?: string
  updatedAt?: string
  address?: string
  membersCount?: number
  eventsCount?: number
  stats?: OrganizationMetrics
  metadata?: OrganizationMetrics
  [key: string]: unknown
}

export default function OrganizationPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const org = searchParams.get('org') ?? ''

  const [detail, setDetail] = useState<OrganizationDetail | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const url = useMemo(() => {
    if (!org) return null
    return buildUrl('/organizations/detail', { org })
  }, [org])

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
        const result = await httpGet<OrganizationDetail>(url)
        if (!cancelled) {
          setDetail(result)
        }
      } catch (err) {
        if (!cancelled) {
          const message =
            err instanceof Error ? err.message : 'Failed to load organization'
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
    router.replace(query ? `/organization/?${query}` : '/organization/')
  }

  return (
    <main className="mx-auto max-w-5xl space-y-6 px-4 py-10">
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold text-gray-900">
          Organization Overview
        </h1>
        <p className="text-sm text-gray-600">
          Provide an organization identifier to view its public details fetched
          from <code className="rounded bg-gray-100 px-1 py-0.5 text-xs">NEXT_PUBLIC_API_BASE</code>.
        </p>
      </header>

      <section className="flex flex-wrap items-end gap-4 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex min-w-[220px] flex-col">
          <label
            htmlFor="org-input"
            className="text-sm font-semibold text-gray-700"
          >
            Organization ID
          </label>
          <input
            id="org-input"
            type="text"
            placeholder="org-123"
            value={org}
            onChange={(event) => updateQuery({ org: event.target.value.trim() })}
            className="mt-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-yellow-500 focus:outline-none focus:ring-2 focus:ring-yellow-200"
          />
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <span className="inline-flex h-2 w-2 rounded-full bg-yellow-500" />
          Client-side only: all data is requested in the browser at runtime.
        </div>
      </section>

      {loading && (
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <div className="animate-pulse space-y-4">
            <div className="h-5 w-1/4 rounded bg-gray-200" />
            <div className="h-4 w-1/3 rounded bg-gray-200" />
            <div className="h-24 rounded bg-gray-100" />
          </div>
        </div>
      )}

      {error && !loading && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {!org && !loading && (
        <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 p-8 text-center text-sm text-gray-500">
          Enter an organization ID above to fetch data.
        </div>
      )}

      {detail && !loading && !error && (
        <section className="space-y-6 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <div>
            <h2 className="text-2xl font-semibold text-gray-900">
              {detail.name || detail.id}
            </h2>
            {detail.description && (
              <p className="mt-2 text-sm text-gray-600">{detail.description}</p>
            )}
          </div>

          <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {detail.address && (
              <div className="rounded-lg border border-gray-100 bg-gray-50 p-4">
                <dt className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Address
                </dt>
                <dd className="mt-1 text-sm text-gray-800">{detail.address}</dd>
              </div>
            )}
            {detail.membersCount != null && (
              <div className="rounded-lg border border-gray-100 bg-gray-50 p-4">
                <dt className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Members
                </dt>
                <dd className="mt-1 text-2xl font-semibold text-gray-900">
                  {detail.membersCount}
                </dd>
              </div>
            )}
            {detail.eventsCount != null && (
              <div className="rounded-lg border border-gray-100 bg-gray-50 p-4">
                <dt className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Events
                </dt>
                <dd className="mt-1 text-2xl font-semibold text-gray-900">
                  {detail.eventsCount}
                </dd>
              </div>
            )}
            {detail.createdAt && (
              <div className="rounded-lg border border-gray-100 bg-gray-50 p-4">
                <dt className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Created
                </dt>
                <dd className="mt-1 text-sm text-gray-800">
                  {new Date(detail.createdAt).toLocaleString()}
                </dd>
              </div>
            )}
            {detail.updatedAt && (
              <div className="rounded-lg border border-gray-100 bg-gray-50 p-4">
                <dt className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Updated
                </dt>
                <dd className="mt-1 text-sm text-gray-800">
                  {new Date(detail.updatedAt).toLocaleString()}
                </dd>
              </div>
            )}
          </dl>

          {detail.stats && (
            <div>
              <h3 className="text-sm font-semibold text-gray-700">Stats</h3>
              <pre className="mt-2 max-h-64 overflow-auto rounded-lg bg-gray-900 px-3 py-2 text-xs text-gray-50">
                {JSON.stringify(detail.stats, null, 2)}
              </pre>
            </div>
          )}

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


