'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { useAuth } from '@/contexts/AuthContext'
import { useOrganization } from '@/contexts/OrganizationContext'
import { ProtectedRoute } from '@/components/common/ProtectedRoute'
import { organizationService, eventService, userService } from '@/lib/services'
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  Calendar, 
  Award,
  Clock,
  Target,
  Activity,
  PieChart,
  LineChart,
  Download,
  Filter,
  RefreshCw,
  Eye,
  EyeOff,
  Zap,
  Star,
  AlertCircle,
  CheckCircle,
  XCircle
} from 'lucide-react'
import HiveCard from '@/components/common/HiveCard'
import HiveButton from '@/components/common/HiveButton'

interface AnalyticsData {
  overview: {
    totalMembers: number
    activeEvents: number
    completedEvents: number
    totalVolunteerHours: number
    averageParticipation: number
    memberGrowth: number
    eventGrowth: number
  }
  memberStats: {
    newMembers: number
    activeMembers: number
    inactiveMembers: number
    topVolunteers: Array<{
      id: string
      name: string
      hours: number
      events: number
    }>
  }
  eventStats: {
    upcomingEvents: number
    ongoingEvents: number
    completedEvents: number
    cancelledEvents: number
    averageAttendance: number
    popularCategories: Array<{
      category: string
      count: number
      percentage: number
    }>
  }
  engagement: {
    registrationRate: number
    attendanceRate: number
    retentionRate: number
    satisfactionScore: number
  }
  trends: {
    monthlyMembers: Array<{ month: string; count: number }>
    monthlyEvents: Array<{ month: string; count: number }>
    monthlyHours: Array<{ month: string; hours: number }>
  }
}

interface TimeRange {
  label: string
  value: string
  days: number
}

const TIME_RANGES: TimeRange[] = [
  { label: 'Last 7 days', value: '7d', days: 7 },
  { label: 'Last 30 days', value: '30d', days: 30 },
  { label: 'Last 3 months', value: '3m', days: 90 },
  { label: 'Last 6 months', value: '6m', days: 180 },
  { label: 'Last year', value: '1y', days: 365 },
]

export default function AdminAnalytics() {
  const { user } = useAuth()
  const { selectedOrg, isAdmin } = useOrganization()
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [timeRange, setTimeRange] = useState<TimeRange>(TIME_RANGES[1]) // 30 days default
  const [viewMode, setViewMode] = useState<'overview' | 'detailed'>('overview')

  const loadAnalytics = useCallback(async () => {
    if (!selectedOrg) return

    try {
      setLoading(true)
      
      const endDate = new Date()
      const startDate = new Date()
      startDate.setDate(startDate.getDate() - timeRange.days)

      // Load comprehensive analytics data
      const [
        members,
        events,
        volunteerHours
      ] = await Promise.all([
        organizationService.getMembers(selectedOrg.id),
        eventService.getByOrganization(selectedOrg.id),
        userService.getVolunteerHours(selectedOrg.id)
      ])

      // Get event attendees for attendance calculations
      const eventAttendees = await Promise.all(
        events.map(event => 
          eventService.getAttendees(event.id).then(attendees => ({
            eventId: event.id,
            attendees: attendees.length
          }))
        )
      )

      // Calculate overview stats
      const totalVolunteerHours = volunteerHours.reduce((sum, hours) => sum + hours.hours, 0)
      const activeEvents = events.filter(e => e.status === 'published' || e.status === 'in_progress')
      const completedEvents = events.filter(e => e.status === 'completed')
      const upcomingEvents = events.filter(e => e.status === 'published')

      // Calculate member growth
      const recentMembers = members.filter(m => {
        const joinDate = new Date(m.joined_at)
        return joinDate >= startDate
      }).length

      const memberGrowth = members.length > 0 ? 
        Math.round((recentMembers / members.length) * 100) : 0

      // Calculate event growth
      const recentEvents = events.filter(e => {
        const eventDate = new Date(e.created_at)
        return eventDate >= startDate
      }).length

      const eventGrowth = events.length > 0 ? 
        Math.round((recentEvents / events.length) * 100) : 0

      // Calculate average participation
      const totalAttendees = eventAttendees.reduce((sum, ea) => sum + ea.attendees, 0)
      const averageParticipation = events.length > 0 ? 
        Math.round(totalAttendees / events.length) : 0

      // Top volunteers
      const volunteerStats = volunteerHours.reduce((acc, hours) => {
        const existing = acc.find(v => v.user_id === hours.user_id)
        if (existing) {
          existing.hours += hours.hours
          existing.events += 1
        } else {
          acc.push({
            user_id: hours.user_id,
            hours: hours.hours,
            events: 1
          })
        }
        return acc
      }, [] as Array<{ user_id: string; hours: number; events: number }>)

      const topVolunteers = await Promise.all(
        volunteerStats
          .sort((a, b) => b.hours - a.hours)
          .slice(0, 5)
          .map(async (volunteer) => {
            const userData = await userService.getById(volunteer.user_id)
            return {
              id: volunteer.user_id,
              name: userData?.name || 'Unknown',
              hours: volunteer.hours,
              events: volunteer.events
            }
          })
      )

      // Event categories (using event_type instead of category)
      const categoryCounts = events.reduce((acc, event) => {
        const category = (event as any).category || event.event_type || 'Other'
        acc[category] = (acc[category] || 0) + 1
        return acc
      }, {} as Record<string, number>)

      const popularCategories = Object.entries(categoryCounts)
        .map(([category, count]) => ({
          category,
          count,
          percentage: Math.round((count / events.length) * 100)
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5)

      // Engagement metrics
      const registrationRate = events.length > 0 ? 
        Math.round((totalAttendees / (events.length * 50)) * 100) : 0 // Assuming 50 max attendees average
      
      const attendanceRate = completedEvents.length > 0 ? 
        Math.round((totalAttendees / completedEvents.length) * 100) : 0

      const retentionRate = members.length > 0 ? 
        Math.round((members.filter(m => m.is_active).length / members.length) * 100) : 0

      // Generate trend data (simplified - in production, you'd query historical data)
      const monthlyMembers = Array.from({ length: 6 }, (_, i) => {
        const date = new Date()
        date.setMonth(date.getMonth() - (5 - i))
        return {
          month: date.toLocaleDateString('en-US', { month: 'short' }),
          count: Math.floor(Math.random() * 10) + 5 // Mock data
        }
      })

      const monthlyEvents = Array.from({ length: 6 }, (_, i) => {
        const date = new Date()
        date.setMonth(date.getMonth() - (5 - i))
        return {
          month: date.toLocaleDateString('en-US', { month: 'short' }),
          count: Math.floor(Math.random() * 5) + 2 // Mock data
        }
      })

      const monthlyHours = Array.from({ length: 6 }, (_, i) => {
        const date = new Date()
        date.setMonth(date.getMonth() - (5 - i))
        return {
          month: date.toLocaleDateString('en-US', { month: 'short' }),
          hours: Math.floor(Math.random() * 100) + 50 // Mock data
        }
      })

      setAnalyticsData({
        overview: {
          totalMembers: members.length,
          activeEvents: activeEvents.length,
          completedEvents: completedEvents.length,
          totalVolunteerHours,
          averageParticipation,
          memberGrowth,
          eventGrowth
        },
        memberStats: {
          newMembers: recentMembers,
          activeMembers: members.filter(m => m.is_active).length,
          inactiveMembers: members.filter(m => !m.is_active).length,
          topVolunteers
        },
        eventStats: {
          upcomingEvents: upcomingEvents.length,
          ongoingEvents: events.filter(e => e.status === 'in_progress').length,
          completedEvents: completedEvents.length,
          cancelledEvents: events.filter(e => e.status === 'cancelled').length,
          averageAttendance: averageParticipation,
          popularCategories
        },
        engagement: {
          registrationRate,
          attendanceRate,
          retentionRate,
          satisfactionScore: 85 // Mock data
        },
        trends: {
          monthlyMembers,
          monthlyEvents,
          monthlyHours
        }
      })

    } catch (error) {
      console.error('Error loading analytics:', error)
    } finally {
      setLoading(false)
    }
  }, [selectedOrg, timeRange])

  useEffect(() => {
    if (selectedOrg && isAdmin) {
      loadAnalytics()
  }
  }, [selectedOrg, isAdmin, loadAnalytics])

  const exportAnalytics = () => {
    if (!analyticsData) return

    const csvData = [
      ['Metric', 'Value'],
      ['Total Members', analyticsData.overview.totalMembers],
      ['Active Events', analyticsData.overview.activeEvents],
      ['Completed Events', analyticsData.overview.completedEvents],
      ['Total Volunteer Hours', analyticsData.overview.totalVolunteerHours],
      ['Average Participation', analyticsData.overview.averageParticipation],
      ['Member Growth (%)', analyticsData.overview.memberGrowth],
      ['Event Growth (%)', analyticsData.overview.eventGrowth],
      ['Registration Rate (%)', analyticsData.engagement.registrationRate],
      ['Attendance Rate (%)', analyticsData.engagement.attendanceRate],
      ['Retention Rate (%)', analyticsData.engagement.retentionRate],
    ]

    const csv = csvData.map(row => row.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `analytics-${selectedOrg?.name}-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  if (!isAdmin) {
    return (
      <ProtectedRoute requireAdmin={true}>
        <div>Access denied</div>
      </ProtectedRoute>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 font-semibold">Loading analytics...</p>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Analytics Dashboard
              </h1>
              <p className="text-gray-600 mt-2">
                Insights for {selectedOrg?.name} organization
              </p>
            </div>
            <div className="flex items-center gap-3">
              <select
                value={timeRange.value}
                onChange={(e) => {
                  const range = TIME_RANGES.find(r => r.value === e.target.value)
                  if (range) setTimeRange(range)
                }}
                className="px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {TIME_RANGES.map(range => (
                  <option key={range.value} value={range.value}>
                    {range.label}
                  </option>
                ))}
              </select>
              <HiveButton
                variant="secondary"
                onClick={() => setViewMode(viewMode === 'overview' ? 'detailed' : 'overview')}
                className="flex items-center gap-2"
              >
                {viewMode === 'overview' ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                {viewMode === 'overview' ? 'Detailed View' : 'Overview'}
              </HiveButton>
              <HiveButton
                variant="secondary"
                onClick={exportAnalytics}
                className="flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                Export
              </HiveButton>
              <HiveButton
                variant="primary"
                onClick={loadAnalytics}
                className="flex items-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Refresh
              </HiveButton>
            </div>
          </div>
        </motion.div>

        {analyticsData && (
          <>
            {/* Overview Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <HiveCard className="relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-blue-500/20 to-blue-600/20 rounded-full -translate-y-10 translate-x-10"></div>
                  <div className="relative">
                    <div className="flex items-center justify-between mb-4">
                      <div className="p-3 bg-blue-100 rounded-xl">
                        <Users className="w-6 h-6 text-blue-600" />
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-gray-900">{analyticsData.overview.totalMembers}</p>
                        <p className="text-sm text-gray-600">Total Members</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <TrendingUp className="w-4 h-4 text-green-600" />
                      <span className="text-green-600 font-semibold">+{analyticsData.overview.memberGrowth}%</span>
                      <span className="text-gray-500">growth</span>
                    </div>
                  </div>
                </HiveCard>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <HiveCard className="relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-purple-500/20 to-purple-600/20 rounded-full -translate-y-10 translate-x-10"></div>
                  <div className="relative">
                    <div className="flex items-center justify-between mb-4">
                      <div className="p-3 bg-purple-100 rounded-xl">
                        <Calendar className="w-6 h-6 text-purple-600" />
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-gray-900">{analyticsData.overview.activeEvents}</p>
                        <p className="text-sm text-gray-600">Active Events</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Activity className="w-4 h-4 text-purple-600" />
                      <span className="text-purple-600 font-semibold">{analyticsData.overview.completedEvents}</span>
                      <span className="text-gray-500">completed</span>
                </div>
                </div>
              </HiveCard>
            </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <HiveCard className="relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-green-500/20 to-green-600/20 rounded-full -translate-y-10 translate-x-10"></div>
                  <div className="relative">
                    <div className="flex items-center justify-between mb-4">
                      <div className="p-3 bg-green-100 rounded-xl">
                        <Award className="w-6 h-6 text-green-600" />
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-gray-900">{analyticsData.overview.totalVolunteerHours}</p>
                        <p className="text-sm text-gray-600">Volunteer Hours</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Target className="w-4 h-4 text-green-600" />
                      <span className="text-green-600 font-semibold">{analyticsData.overview.averageParticipation}</span>
                      <span className="text-gray-500">avg attendance</span>
        </div>
                  </div>
                </HiveCard>
              </motion.div>

                    <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                <HiveCard className="relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-orange-500/20 to-orange-600/20 rounded-full -translate-y-10 translate-x-10"></div>
                  <div className="relative">
                    <div className="flex items-center justify-between mb-4">
                      <div className="p-3 bg-orange-100 rounded-xl">
                        <BarChart3 className="w-6 h-6 text-orange-600" />
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-gray-900">{analyticsData.engagement.retentionRate}%</p>
                        <p className="text-sm text-gray-600">Retention Rate</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Star className="w-4 h-4 text-orange-600" />
                      <span className="text-orange-600 font-semibold">{analyticsData.engagement.satisfactionScore}%</span>
                      <span className="text-gray-500">satisfaction</span>
                    </div>
                  </div>
                </HiveCard>
              </motion.div>
            </div>

            {/* Detailed Analytics */}
            {viewMode === 'detailed' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                {/* Top Volunteers */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                >
                  <HiveCard>
                    <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                      <Award className="w-5 h-5 text-yellow-600" />
                      Top Volunteers
                    </h3>
                    <div className="space-y-4">
                      {analyticsData.memberStats.topVolunteers.map((volunteer, index) => (
                        <div key={volunteer.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                              {index + 1}
                            </div>
                            <div>
                              <p className="font-semibold text-gray-900">{volunteer.name}</p>
                              <p className="text-sm text-gray-600">{volunteer.events} events</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-gray-900">{volunteer.hours}h</p>
                            <p className="text-xs text-gray-500">volunteered</p>
                  </div>
                </div>
              ))}
            </div>
          </HiveCard>
                </motion.div>

                {/* Event Categories */}
                    <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 }}
                >
                  <HiveCard>
                    <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                      <PieChart className="w-5 h-5 text-purple-600" />
                      Event Categories
                    </h3>
                    <div className="space-y-4">
                      {analyticsData.eventStats.popularCategories.map((category, index) => (
                        <div key={category.category} className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-4 h-4 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full"></div>
                            <span className="font-semibold text-gray-900 capitalize">{category.category}</span>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-gray-900">{category.count}</p>
                            <p className="text-xs text-gray-500">{category.percentage}%</p>
                  </div>
                </div>
              ))}
            </div>
          </HiveCard>
                </motion.div>
              </div>
            )}

            {/* Engagement Metrics */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
            >
              <HiveCard>
                <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                  <Target className="w-5 h-5 text-blue-600" />
                  Engagement Metrics
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <div className="text-center">
                    <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                      <Users className="w-8 h-8 text-blue-600" />
                    </div>
                    <p className="text-2xl font-bold text-gray-900">{analyticsData.engagement.registrationRate}%</p>
                    <p className="text-sm text-gray-600">Registration Rate</p>
                  </div>
                  <div className="text-center">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                      <CheckCircle className="w-8 h-8 text-green-600" />
                    </div>
                    <p className="text-2xl font-bold text-gray-900">{analyticsData.engagement.attendanceRate}%</p>
                    <p className="text-sm text-gray-600">Attendance Rate</p>
                  </div>
                  <div className="text-center">
                    <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                      <Activity className="w-8 h-8 text-purple-600" />
                    </div>
                    <p className="text-2xl font-bold text-gray-900">{analyticsData.engagement.retentionRate}%</p>
                    <p className="text-sm text-gray-600">Retention Rate</p>
                  </div>
                  <div className="text-center">
                    <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-3">
                      <Star className="w-8 h-8 text-orange-600" />
                    </div>
                    <p className="text-2xl font-bold text-gray-900">{analyticsData.engagement.satisfactionScore}%</p>
                    <p className="text-sm text-gray-600">Satisfaction Score</p>
                  </div>
        </div>
              </HiveCard>
      </motion.div>
          </>
        )}
      </div>
    </div>
  )
}