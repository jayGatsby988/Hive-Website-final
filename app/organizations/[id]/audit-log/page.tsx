'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { useOrganization } from '@/contexts/OrganizationContext'
import { auditLogService } from '@/lib/services'
import HiveCard from '@/components/common/HiveCard'
import HiveButton from '@/components/common/HiveButton'
import HiveInput from '@/components/common/HiveInput'
import { 
  RefreshCw, 
  Search, 
  Filter, 
  Calendar,
  User,
  FileText,
  Clock,
  ChevronDown,
  ChevronUp,
  Download
} from 'lucide-react'

interface AuditLog {
  id: string
  organization_id: string
  user_id: string
  user_name: string
  user_email: string
  action: string
  entity_type: string
  entity_id: string
  entity_name: string
  details: any
  timestamp: string
  created_at: string
}

const ACTION_COLORS: Record<string, string> = {
  EVENT_CREATED: 'bg-green-100 text-green-800 border-green-300',
  EVENT_UPDATED: 'bg-blue-100 text-blue-800 border-blue-300',
  EVENT_DELETED: 'bg-red-100 text-red-800 border-red-300',
  EVENT_STARTED: 'bg-emerald-100 text-emerald-800 border-emerald-300',
  EVENT_ENDED: 'bg-gray-100 text-gray-800 border-gray-300',
  EVENT_SIGNUP: 'bg-purple-100 text-purple-800 border-purple-300',
  EVENT_CHECKIN: 'bg-teal-100 text-teal-800 border-teal-300',
  EVENT_CHECKOUT: 'bg-indigo-100 text-indigo-800 border-indigo-300',
  MEMBER_JOINED: 'bg-green-100 text-green-800 border-green-300',
  MEMBER_ROLE_CHANGED: 'bg-orange-100 text-orange-800 border-orange-300',
  ROLE_ASSIGNED: 'bg-purple-100 text-purple-800 border-purple-300',
}

const ACTION_LABELS: Record<string, string> = {
  EVENT_CREATED: 'Event Created',
  EVENT_UPDATED: 'Event Updated',
  EVENT_DELETED: 'Event Deleted',
  EVENT_STARTED: 'Event Got Started',
  EVENT_ENDED: 'Event Ended',
  EVENT_SIGNUP: 'Event Signup',
  EVENT_CHECKIN: 'Checked In',
  EVENT_CHECKOUT: 'Checked Out',
  MEMBER_JOINED: 'Member Joined',
  MEMBER_ROLE_CHANGED: 'Role Changed',
  ROLE_ASSIGNED: 'Role Assigned',
}

export default function AuditLogPage() {
  const params = useParams()
  const { user } = useAuth()
  const { selectedOrg, isAdmin } = useOrganization()
  const orgId = params?.id as string

  const [logs, setLogs] = useState<AuditLog[]>([])
  const [filteredLogs, setFilteredLogs] = useState<AuditLog[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedAction, setSelectedAction] = useState<string>('all')
  const [expandedLog, setExpandedLog] = useState<string | null>(null)
  const [dateFilter, setDateFilter] = useState<'all' | 'today' | 'week' | 'month'>('all')

  useEffect(() => {
    if (orgId && user && isAdmin) {
      loadLogs()
    }
  }, [orgId, user, isAdmin])

  useEffect(() => {
    filterLogs()
  }, [logs, searchTerm, selectedAction, dateFilter])

  const loadLogs = async () => {
    try {
      setLoading(true)
      const data = await auditLogService.getOrganizationLogs(orgId, 500)
      setLogs(data)
    } catch (error) {
      console.error('Error loading audit logs:', error)
    } finally {
      setLoading(false)
    }
  }

  const filterLogs = () => {
    let filtered = [...logs]

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(log => 
        log.user_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.entity_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.action?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.user_email?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Filter by action
    if (selectedAction !== 'all') {
      filtered = filtered.filter(log => log.action === selectedAction)
    }

    // Filter by date
    if (dateFilter !== 'all') {
      const now = new Date()
      const filterDate = new Date()
      
      if (dateFilter === 'today') {
        filterDate.setHours(0, 0, 0, 0)
      } else if (dateFilter === 'week') {
        filterDate.setDate(now.getDate() - 7)
      } else if (dateFilter === 'month') {
        filterDate.setDate(now.getDate() - 30)
      }

      filtered = filtered.filter(log => new Date(log.timestamp) >= filterDate)
    }

    setFilteredLogs(filtered)
  }

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp)
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    })
  }

  const getEffectiveAction = (log: AuditLog): string => {
    // Check if status changed to 'in_progress' in EVENT_UPDATED logs
    if (log.action === 'EVENT_UPDATED' && log.details?.changes?.status) {
      const statusChange = log.details.changes.status
      if (statusChange.new === 'in_progress' && statusChange.old !== 'in_progress') {
        return 'EVENT_STARTED'
      }
      // Check if status changed to 'completed' in EVENT_UPDATED logs
      if (statusChange.new === 'completed' && statusChange.old !== 'completed') {
        return 'EVENT_ENDED'
      }
    }
    return log.action
  }

  const getActionDescription = (log: AuditLog) => {
    const actionLabel = ACTION_LABELS[log.action] || log.action
    const userName = log.user_name || 'Unknown User'
    const entityName = log.entity_name || 'Unknown'
    const adminName = log.details?.admin || userName

    // Check if status changed to 'in_progress' in EVENT_UPDATED logs
    if (log.action === 'EVENT_UPDATED' && log.details?.changes?.status) {
      const statusChange = log.details.changes.status
      if (statusChange.new === 'in_progress' && statusChange.old !== 'in_progress') {
        return `${adminName} got started event "${entityName}"`
      }
      // Check if status changed to 'completed' in EVENT_UPDATED logs
      if (statusChange.new === 'completed' && statusChange.old !== 'completed') {
        return `${adminName} ended event "${entityName}"`
      }
    }

    switch (log.action) {
      case 'EVENT_CREATED':
        return `${userName} created event "${entityName}"`
      case 'EVENT_UPDATED':
        return `${adminName} updated event "${entityName}"`
      case 'EVENT_DELETED':
        return `${userName} deleted event "${entityName}"`
      case 'EVENT_STARTED':
        return `${adminName} got started event "${entityName}"`
      case 'EVENT_ENDED':
        return `${adminName} ended event "${entityName}"`
      case 'EVENT_SIGNUP':
        return `${userName} signed up for "${entityName}"`
      case 'EVENT_CHECKIN':
        return `${userName} checked in to "${entityName}"`
      case 'EVENT_CHECKOUT':
        return `${userName} checked out from "${entityName}"`
      case 'MEMBER_JOINED':
        return `${userName} joined the organization`
      case 'MEMBER_ROLE_CHANGED':
        return `${userName}'s role was changed`
      case 'ROLE_ASSIGNED':
        return `${userName} was assigned a new role`
      default:
        return `${userName} performed ${actionLabel} on ${entityName}`
    }
  }

  const exportToCSV = () => {
    const headers = ['Timestamp', 'User', 'Email', 'Action', 'Entity', 'Details']
    const rows = filteredLogs.map(log => [
      formatTimestamp(log.timestamp),
      log.user_name,
      log.user_email || '',
      log.action,
      log.entity_name || '',
      JSON.stringify(log.details || {})
    ])

    const csv = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n')

    const blob = new Blob([csv], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `audit-log-${new Date().toISOString()}.csv`
    a.click()
  }

  const uniqueActions = Array.from(new Set(logs.map(log => log.action)))

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <HiveCard className="p-8 text-center">
          <h2 className="text-xl font-semibold mb-2">Access Denied</h2>
          <p className="text-gray-600">Only administrators can view audit logs.</p>
        </HiveCard>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold">Audit Log</h1>
          <p className="text-gray-600 mt-2">
            Complete history of all actions in {selectedOrg?.name}
          </p>
        </div>
        <div className="flex gap-2">
          <HiveButton
            variant="outline"
            onClick={exportToCSV}
            disabled={filteredLogs.length === 0}
          >
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </HiveButton>
          <HiveButton
            variant="outline"
            onClick={loadLogs}
            disabled={loading}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </HiveButton>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <HiveCard className="p-4">
          <div className="text-sm text-gray-600">Total Logs</div>
          <div className="text-2xl font-bold">{logs.length}</div>
        </HiveCard>
        <HiveCard className="p-4">
          <div className="text-sm text-gray-600">Filtered Logs</div>
          <div className="text-2xl font-bold">{filteredLogs.length}</div>
        </HiveCard>
        <HiveCard className="p-4">
          <div className="text-sm text-gray-600">Unique Users</div>
          <div className="text-2xl font-bold">
            {new Set(logs.map(log => log.user_id)).size}
          </div>
        </HiveCard>
        <HiveCard className="p-4">
          <div className="text-sm text-gray-600">Action Types</div>
          <div className="text-2xl font-bold">{uniqueActions.length}</div>
        </HiveCard>
      </div>

      {/* Filters */}
      <HiveCard className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Search */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium mb-2">
              <Search className="w-4 h-4 inline mr-1" />
              Search
            </label>
            <HiveInput
              type="text"
              placeholder="Search by user, action, or entity..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Action Filter */}
          <div>
            <label className="block text-sm font-medium mb-2">
              <Filter className="w-4 h-4 inline mr-1" />
              Action Type
            </label>
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400"
              value={selectedAction}
              onChange={(e) => setSelectedAction(e.target.value)}
            >
              <option value="all">All Actions</option>
              {uniqueActions.map(action => (
                <option key={action} value={action}>
                  {ACTION_LABELS[action] || action}
                </option>
              ))}
            </select>
          </div>

          {/* Date Filter */}
          <div>
            <label className="block text-sm font-medium mb-2">
              <Calendar className="w-4 h-4 inline mr-1" />
              Time Period
            </label>
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value as any)}
            >
              <option value="all">All Time</option>
              <option value="today">Today</option>
              <option value="week">Last 7 Days</option>
              <option value="month">Last 30 Days</option>
            </select>
          </div>
        </div>
      </HiveCard>

      {/* Logs List */}
      <HiveCard className="p-6">
        {loading ? (
          <div className="text-center py-12">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-yellow-500" />
            <p className="text-gray-600">Loading audit logs...</p>
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="w-12 h-12 mx-auto mb-4 text-gray-400" />
            <p className="text-gray-600">No logs found matching your filters.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {filteredLogs.map((log) => (
              <div
                key={log.id}
                className="border border-gray-200 rounded-lg hover:border-gray-300 transition-colors"
              >
                {/* Log Header */}
                <div
                  className="p-4 cursor-pointer flex items-start justify-between"
                  onClick={() => setExpandedLog(expandedLog === log.id ? null : log.id)}
                >
                  <div className="flex-1 flex items-start gap-4">
                    {/* Timestamp */}
                    <div className="flex items-center text-sm text-gray-500 min-w-[180px]">
                      <Clock className="w-4 h-4 mr-2" />
                      {formatTimestamp(log.timestamp)}
                    </div>

                    {/* Action Badge */}
                    <div className="min-w-[120px]">
                      {(() => {
                        const effectiveAction = getEffectiveAction(log)
                        return (
                          <span className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium border ${ACTION_COLORS[effectiveAction] || 'bg-gray-100 text-gray-800 border-gray-300'}`}>
                            {ACTION_LABELS[effectiveAction] || effectiveAction}
                          </span>
                        )
                      })()}
                    </div>

                    {/* Description */}
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">
                        {getActionDescription(log)}
                      </p>
                      {log.user_email && (
                        <p className="text-xs text-gray-500 mt-1">
                          {log.user_email}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Expand Icon */}
                  <button className="ml-4 text-gray-400 hover:text-gray-600">
                    {expandedLog === log.id ? (
                      <ChevronUp className="w-5 h-5" />
                    ) : (
                      <ChevronDown className="w-5 h-5" />
                    )}
                  </button>
                </div>

                {/* Expanded Details */}
                {expandedLog === log.id && (
                  <div className="px-4 pb-4 border-t border-gray-200 bg-gray-50">
                    <div className="mt-3 space-y-2 text-sm">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <span className="font-medium text-gray-700">User ID:</span>
                          <span className="ml-2 text-gray-600">{log.user_id}</span>
                        </div>
                        <div>
                          <span className="font-medium text-gray-700">Entity Type:</span>
                          <span className="ml-2 text-gray-600">{log.entity_type}</span>
                        </div>
                        {log.entity_id && (
                          <div>
                            <span className="font-medium text-gray-700">Entity ID:</span>
                            <span className="ml-2 text-gray-600">{log.entity_id}</span>
                          </div>
                        )}
                        <div>
                          <span className="font-medium text-gray-700">Log ID:</span>
                          <span className="ml-2 text-gray-600 text-xs">{log.id}</span>
                        </div>
                      </div>
                      {log.details && Object.keys(log.details).length > 0 && (
                        <div className="mt-3">
                          <span className="font-medium text-gray-700">Details:</span>
                          <pre className="mt-1 p-2 bg-white border border-gray-200 rounded text-xs overflow-x-auto">
                            {JSON.stringify(log.details, null, 2)}
                          </pre>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </HiveCard>
    </div>
  )
}

