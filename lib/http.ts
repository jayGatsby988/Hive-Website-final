const apiBase = (process.env.NEXT_PUBLIC_API_BASE || '').replace(/\/+$/, '')
const bearer = process.env.NEXT_PUBLIC_BEARER?.trim()

if (!apiBase) {
  // eslint-disable-next-line no-console
  console.warn(
    'NEXT_PUBLIC_API_BASE is not set. Static pages that rely on the public API will fail to load data at runtime.'
  )
}

export type QueryValue = string | number | undefined | null

export function buildUrl(
  path: string,
  query?: Record<string, QueryValue | QueryValue[]>
): string {
  const normalizedPath = path.startsWith('/')
    ? path.substring(1)
    : path
  const baseUrl = apiBase
    ? `${apiBase}/${normalizedPath}`
    : normalizedPath
  const origin =
    typeof window !== 'undefined' ? window.location.origin : 'http://localhost'
  const url = new URL(baseUrl, apiBase || origin)

  if (query) {
    Object.entries(query).forEach(([key, value]) => {
      if (value == null) return
      if (Array.isArray(value)) {
        value.forEach((item) => {
          if (item != null) {
            url.searchParams.append(key, String(item))
          }
        })
      } else if (value !== '') {
        url.searchParams.set(key, String(value))
      }
    })
  }

  return url.toString()
}

export async function httpGet<T>(
  pathOrUrl: string,
  query?: Record<string, QueryValue | QueryValue[]>
): Promise<T> {
  const isAbsolute = /^https?:\/\//i.test(pathOrUrl)
  const url = isAbsolute ? pathOrUrl : buildUrl(pathOrUrl, query)

  const headers: Record<string, string> = {
    Accept: 'application/json',
  }

  if (bearer) {
    headers.Authorization = `Bearer ${bearer}`
  }

  const response = await fetch(url, {
    method: 'GET',
    cache: 'no-store',
    headers,
  })

  if (!response.ok) {
    const message = await response.text().catch(() => '')
    throw new Error(
      message || `Request failed (${response.status} ${response.statusText})`
    )
  }

  return (await response.json()) as T
}

export async function httpPost<T>(
  path: string,
  body: unknown,
  query?: Record<string, QueryValue | QueryValue[]>
): Promise<T> {
  const url = buildUrl(path, query)
  const headers: Record<string, string> = {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  }

  if (bearer) {
    headers.Authorization = `Bearer ${bearer}`
  }

  const response = await fetch(url, {
    method: 'POST',
    cache: 'no-store',
    headers,
    body: JSON.stringify(body ?? {}),
  })

  if (!response.ok) {
    const message = await response.text().catch(() => '')
    throw new Error(
      message || `Request failed (${response.status} ${response.statusText})`
    )
  }

  if (response.status === 204) {
    return {} as T
  }

  return (await response.json()) as T
}

export function exportToCsv(
  filename: string,
  rows: Array<Record<string, unknown>>,
  headers?: string[]
) {
  if (!rows.length) return

  const headerKeys = headers && headers.length ? headers : Object.keys(rows[0])

  const csv = [
    headerKeys.join(','),
    ...rows.map((row) =>
      headerKeys
        .map((key) => {
          const value = row[key]
          if (value == null) return '""'
          const stringValue =
            typeof value === 'string'
              ? value
              : JSON.stringify(value, null, 2)
          return `"${stringValue.replace(/"/g, '""')}"`
        })
        .join(',')
    ),
  ].join('\n')

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}

