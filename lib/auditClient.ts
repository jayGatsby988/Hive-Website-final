export interface AuditLogItem {
  id: string
  ts: string
  actor?: string
  action?: string
  resource?: string
  metadata?: unknown
  [key: string]: unknown
}

export interface AuditLogResponse {
  items: AuditLogItem[]
  nextCursor: string | null
}

export interface AuditLogRequestParams {
  org: string
  limit?: number
  cursor?: string | null
  from?: string
  to?: string
  action?: string
  actor?: string
}

const API_BASE =
  process.env.NEXT_PUBLIC_AUDIT_API_BASE ??
  process.env.NEXT_PUBLIC_AUDIT_API ??
  ''

const TOKEN = process.env.NEXT_PUBLIC_AUDIT_READ_TOKEN?.trim()

export function buildAuditUrl({
  org,
  limit,
  cursor,
  from,
  to,
  action,
  actor,
}: AuditLogRequestParams): string {
  if (!API_BASE) {
    throw new Error(
      'NEXT_PUBLIC_AUDIT_API_BASE is not configured. Please set it to the audit API endpoint.'
    )
  }

  const url = new URL(API_BASE)
  url.searchParams.set('org', org)

  if (typeof limit === 'number') {
    url.searchParams.set('limit', String(limit))
  }

  if (cursor) {
    url.searchParams.set('cursor', cursor)
  }

  if (from) {
    url.searchParams.set('from', from)
  }

  if (to) {
    url.searchParams.set('to', to)
  }

  if (action) {
    url.searchParams.set('action', action)
  }

  if (actor) {
    url.searchParams.set('actor', actor)
  }

  return url.toString()
}

export async function fetchAuditLogs(
  params: AuditLogRequestParams
): Promise<AuditLogResponse> {
  if (!params.org) {
    return { items: [], nextCursor: null }
  }

  const url = buildAuditUrl(params)
  const headers: HeadersInit = {
    Accept: 'application/json',
  }

  if (TOKEN) {
    headers.Authorization = `Bearer ${TOKEN}`
  }

  const response = await fetch(url, {
    method: 'GET',
    cache: 'no-store',
    mode: 'cors',
    headers,
  })

  if (!response.ok) {
    const text = await response.text().catch(() => '')
    throw new Error(
      text || `Failed to load audit logs (${response.status} ${response.statusText})`
    )
  }

  const json = (await response.json().catch(() => ({}))) as {
    items?: unknown
    nextCursor?: unknown
  }

  const items = Array.isArray(json.items) ? (json.items as AuditLogItem[]) : []
  const nextCursor =
    typeof json.nextCursor === 'string' && json.nextCursor.length > 0
      ? json.nextCursor
      : null

  return { items, nextCursor }
}

