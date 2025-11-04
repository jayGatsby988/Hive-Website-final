'use client'

import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useAuth } from '@/contexts/AuthContext'
import { useOrganization } from '@/contexts/OrganizationContext'
import { ProtectedRoute, usePermissions } from '@/components/common/ProtectedRoute'
import { organizationService, eventService, userService } from '@/lib/services'
import { 
  Users, 
  Calendar, 
  BarChart3, 
  Settings, 
  Plus, 
  TrendingUp,
  Clock,
  Award,
  Activity,
  Target,
  Zap,
  Shield,
  Star,
  AlertCircle,
  CheckCircle,
  XCircle
} from 'lucide-react'
import HiveCard from '@/components/common/HiveCard'
import HiveButton from '@/components/common/HiveButton'

interface AdminStats {
  totalMembers: number
  activeEvents: number
  completedEvents: number
  totalVolunteerHours: number
  upcomingEvents: number
  recentRegistrations: number
  memberGrowth: number
  eventParticipation: number
}

interface RecentActivity {
  id: string
  type: 'event_created' | 'member_joined' | 'event_completed' | 'hours_logged'
  title: string
  description: string
  timestamp: string
  user?: string
}

export default function AdminDashboard() {
  const { user } = useAuth()
  const { selectedOrg, userRole } = useOrganization()
  const { isAdmin } = usePermissions()
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (selectedOrg && isAdmin) {
      loadAdminData()
    }
  }, [selectedOrg, isAdmin])

  const loadAdminData = async () => {
    if (!selectedOrg) return

    try {
      setLoading(true)
      
      // Load comprehensive admin stats
      const [
        members,
        events,
        volunteerHours
      ] = await Promise.all([
        organizationService.getMembers(selectedOrg.id),
        eventService.getByOrganization(selectedOrg.id),
        userService.getVolunteerHours(selectedOrg.id)
      ])

      const totalVolunteerHours = volunteerHours.reduce((sum, hours) => sum + hours.hours, 0)
      const activeEvents = events.filter(e => e.status === 'published' || e.status === 'in_progress')
      const completedEvents = events.filter(e => e.status === 'completed')
      const upcomingEvents = events.filter(e => e.status === 'published')

      // Calculate growth metrics
      const memberGrowth = members.length > 0 ? 
        Math.round((members.filter(m => {
          const joinDate = new Date(m.joined_at)
          const thirtyDaysAgo = new Date()
          thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
          return joinDate > thirtyDaysAgo
        }).length / members.length) * 100) : 0

      const eventParticipation = events.length > 0 ?
        Math.round((events.reduce((sum, event) => sum + (event.attendee_count || 0), 0) / events.length)) : 0

      setStats({
        totalMembers: members.length,
        activeEvents: activeEvents.length,
        completedEvents: completedEvents.length,
        totalVolunteerHours,
        upcomingEvents: upcomingEvents.length,
        recentRegistrations: members.filter(m => {
          const joinDate = new Date(m.joined_at)
          const sevenDaysAgo = new Date()
          sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
          return joinDate > sevenDaysAgo
        }).length,
        memberGrowth,
        eventParticipation
      })

      // Generate recent activity
      const activities: RecentActivity[] = []
      
      // Recent events
      events.slice(0, 3).forEach(event => {
        activities.push({
          id: `event-${event.id}`,
          type: 'event_created',
          title: 'New Event Created',
          description: event.title,
          timestamp: event.created_at,
          user: event.created_by
        })
      })

      // Recent members
      members.slice(0, 3).forEach(member => {
        activities.push({
          id: `member-${member.id}`,
          type: 'member_joined',
          title: 'New Member Joined',
          description: member.name || member.email,
          timestamp: member.joined_at
        })
      })

      // Sort by timestamp and take most recent
      setRecentActivity(activities
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .slice(0, 5)
      )

    } catch (error) {
      console.error('Error loading admin data:', error)
    } finally {
      setLoading(false)
    }
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
          <p className="text-gray-600 font-semibold">Loading admin dashboard...</p>
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
                Admin Dashboard
              </h1>
              <p className="text-gray-600 mt-2">
                Manage {selectedOrg?.name} organization
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-100 to-emerald-100 rounded-full">
                <Shield className="w-5 h-5 text-green-600" />
                <span className="text-green-700 font-semibold">Admin Access</span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Stats Grid */}
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
                    <p className="text-2xl font-bold text-gray-900">{stats?.totalMembers || 0}</p>
                    <p className="text-sm text-gray-600">Total Members</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <TrendingUp className="w-4 h-4 text-green-600" />
                  <span className="text-green-600 font-semibold">+{stats?.memberGrowth || 0}%</span>
                  <span className="text-gray-500">this month</span>
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
                    <p className="text-2xl font-bold text-gray-900">{stats?.activeEvents || 0}</p>
                    <p className="text-sm text-gray-600">Active Events</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="w-4 h-4 text-orange-600" />
                  <span className="text-orange-600 font-semibold">{stats?.upcomingEvents || 0}</span>
                  <span className="text-gray-500">upcoming</span>
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
                    <p className="text-2xl font-bold text-gray-900">{stats?.totalVolunteerHours || 0}</p>
                    <p className="text-sm text-gray-600">Volunteer Hours</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Activity className="w-4 h-4 text-green-600" />
                  <span className="text-green-600 font-semibold">{stats?.completedEvents || 0}</span>
                  <span className="text-gray-500">completed</span>
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
                    <Target className="w-6 h-6 text-orange-600" />
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-gray-900">{stats?.eventParticipation || 0}</p>
                    <p className="text-sm text-gray-600">Avg Participation</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Zap className="w-4 h-4 text-orange-600" />
                  <span className="text-orange-600 font-semibold">{stats?.recentRegistrations || 0}</span>
                  <span className="text-gray-500">new this week</span>
                </div>
              </div>
            </HiveCard>
          </motion.div>
        </div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mb-8"
        >
          <HiveCard>
            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
              <Zap className="w-6 h-6 text-blue-600" />
              Quick Actions
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <HiveButton
                variant="primary"
                className="h-20 flex flex-col items-center justify-center gap-2"
                onClick={() => window.location.href = `/organizations/${selectedOrg?.id}/events/create`}
              >
                <Plus className="w-6 h-6" />
                <span className="font-semibold">Create Event</span>
              </HiveButton>
              
              <HiveButton
                variant="secondary"
                className="h-20 flex flex-col items-center justify-center gap-2"
                onClick={() => window.location.href = `/organizations/${selectedOrg?.id}/members`}
              >
                <Users className="w-6 h-6" />
                <span className="font-semibold">Manage Members</span>
              </HiveButton>
              
              <HiveButton
                variant="secondary"
                className="h-20 flex flex-col items-center justify-center gap-2"
                onClick={() => window.location.href = `/organizations/${selectedOrg?.id}/analytics`}
              >
                <BarChart3 className="w-6 h-6" />
                <span className="font-semibold">View Analytics</span>
              </HiveButton>
              
              <HiveButton
                variant="secondary"
                className="h-20 flex flex-col items-center justify-center gap-2"
                onClick={() => window.location.href = `/organizations/${selectedOrg?.id}/settings`}
              >
                <Settings className="w-6 h-6" />
                <span className="font-semibold">Settings</span>
              </HiveButton>
            </div>
          </HiveCard>
        </motion.div>

        {/* Recent Activity */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <HiveCard>
            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
              <Activity className="w-6 h-6 text-purple-600" />
              Recent Activity
            </h2>
            <div className="space-y-4">
              {recentActivity.length > 0 ? (
                recentActivity.map((activity, index) => (
                  <motion.div
                    key={activity.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.7 + index * 0.1 }}
                    className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
                  >
                    <div className="p-2 bg-white rounded-lg shadow-sm">
                      {activity.type === 'event_created' && <Calendar className="w-5 h-5 text-blue-600" />}
                      {activity.type === 'member_joined' && <Users className="w-5 h-5 text-green-600" />}
                      {activity.type === 'event_completed' && <CheckCircle className="w-5 h-5 text-purple-600" />}
                      {activity.type === 'hours_logged' && <Award className="w-5 h-5 text-orange-600" />}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900">{activity.title}</h3>
                      <p className="text-gray-600">{activity.description}</p>
                    </div>
                    <div className="text-sm text-gray-500">
                      {new Date(activity.timestamp).toLocaleDateString()}
                    </div>
                  </motion.div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Activity className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>No recent activity</p>
                </div>
              )}
            </div>
          </HiveCard>
        </motion.div>
      </div>
    </div>
  )
}