'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { useAuth } from '@/contexts/AuthContext'
import { useOrganization } from '@/contexts/OrganizationContext'
import { ProtectedRoute } from '@/components/common/ProtectedRoute'
import { organizationService, userService, eventService, roleService } from '@/lib/services'
import { supabase } from '@/lib/supabase'
import { OrganizationMember } from '@/lib/types'
import {
  Users,
  Search,
  Filter, 
  MoreVertical,
  UserPlus,
  UserMinus,
  Shield,
  Crown,
  Mail,
  Phone,
  Calendar,
  Award,
  Activity,
  AlertCircle,
  CheckCircle,
  XCircle,
  Edit,
  Trash2,
  Eye,
  Download,
  Upload,
  RefreshCw
} from 'lucide-react'
import HiveCard from '@/components/common/HiveCard'
import HiveButton from '@/components/common/HiveButton'
import HiveInput from '@/components/common/HiveInput'

interface Member extends OrganizationMember {
  user?: {
    id: string
    name: string
    email: string
    avatar_url?: string
    phone?: string
    created_at: string
  }
  volunteer_hours?: number
  events_attended?: number
  last_active?: string
  roles?: string[] // Array of role names from user_organization_roles
}

interface MemberFilters {
  search: string
  role: 'all' | 'admin' | 'member'
  status: 'all' | 'active' | 'inactive'
  sortBy: 'name' | 'joined_at' | 'role' | 'volunteer_hours'
  sortOrder: 'asc' | 'desc'
}

export default function MembersPageClient() {
  const { user } = useAuth()
  const { selectedOrg, isAdmin, canManageMembers } = useOrganization()
  const [members, setMembers] = useState<Member[]>([])
  const [filteredMembers, setFilteredMembers] = useState<Member[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedMembers, setSelectedMembers] = useState<Set<string>>(new Set())
  const [filters, setFilters] = useState<MemberFilters>({
    search: '',
    role: 'all',
    status: 'all',
    sortBy: 'joined_at',
    sortOrder: 'desc'
  })
  const [showBulkActions, setShowBulkActions] = useState(false)

  const loadMembers = useCallback(async () => {
    if (!selectedOrg) return

    try {
      setLoading(true)
      
      // Fetch members directly from Supabase
      // Try with join first, then fallback to separate query if join fails
      let membersData: any[] = []
      let membersError: any = null
      
      // First try with join
      const { data: joinedData, error: joinError } = await supabase
        .from('organization_members')
        .select(`
          id,
          organization_id,
          user_id,
          role,
          joined_at,
          is_active,
          users:user_id (
            id,
            name,
            email,
            avatar_url,
            phone,
            created_at
          )
        `)
        .eq('organization_id', selectedOrg.id)
        .order('joined_at', { ascending: false })

      if (joinError) {
        console.warn('Join query failed, trying separate query:', joinError)
        // Fallback: fetch members without join
        const { data: membersOnly, error: membersOnlyError } = await supabase
          .from('organization_members')
          .select('id, organization_id, user_id, role, joined_at, is_active')
          .eq('organization_id', selectedOrg.id)
          .order('joined_at', { ascending: false })
        
        if (membersOnlyError) {
          console.error('Error fetching members:', membersOnlyError)
          throw membersOnlyError
        }
        membersData = membersOnly || []
        membersError = membersOnlyError
      } else {
        membersData = joinedData || []
      }

      if (!membersData || membersData.length === 0) {
        console.log('No members found for organization:', selectedOrg.id)
        setMembers([])
        setLoading(false)
        return
      }

      console.log('Found members:', membersData.length, membersData)

      // Get volunteer hours for all members
      let volunteerHours: any[] = []
      try {
        const hoursData = await userService.getVolunteerHours(selectedOrg.id)
        volunteerHours = hoursData || []
      } catch (error) {
        console.error('Error fetching volunteer hours:', error)
      }

      // Enhance members with stats
      const enhancedMembers: Member[] = await Promise.all(
        membersData.map(async (member: any) => {
          // User data might be in member.users (array) or member.users (object)
          let userData = null
          if (member.users) {
            // Handle array response
            if (Array.isArray(member.users) && member.users.length > 0) {
              userData = member.users[0]
            } else if (typeof member.users === 'object') {
              userData = member.users
            }
          }
          
          // If user data not found, fetch it separately
          if (!userData && member.user_id) {
            try {
              const { data: fetchedUser } = await supabase
                .from('users')
                .select('id, name, email, avatar_url, phone, created_at')
                .eq('id', member.user_id)
                .single()
              userData = fetchedUser
            } catch (error) {
              console.error('Error fetching user data:', error)
            }
          }
          
          // Calculate volunteer hours for this member
          const memberHours = volunteerHours
            .filter(hours => hours.user_id === member.user_id)
            .reduce((sum, hours) => sum + hours.hours, 0)

          // Get events attended count from event_attendees
          let attendedCount = 0
          try {
            const { data: eventsAttended } = await supabase
              .from('event_attendees')
              .select('event_id')
              .eq('user_id', member.user_id)
            
            if (eventsAttended && eventsAttended.length > 0) {
              // Get events that belong to this organization
              const eventIds = eventsAttended.map((ea: any) => ea.event_id)
              const { data: orgEvents } = await supabase
                .from('events')
                .select('id')
                .in('id', eventIds)
                .eq('organization_id', selectedOrg.id)
              attendedCount = orgEvents?.length || 0
            }
          } catch (error) {
            console.error('Error fetching events attended:', error)
          }

          // Get user's roles from user_organization_roles
          let userRoles: string[] = []
          try {
            const rolesData = await roleService.getUserRoles(member.user_id, selectedOrg.id)
            userRoles = rolesData.map((r: any) => r.role_name) || []
          } catch (error) {
            console.error('Error fetching user roles:', error)
          }

          return {
            id: member.id,
            organization_id: member.organization_id,
            user_id: member.user_id,
            role: member.role, // Keep the organization_members role (admin/member)
            joined_at: member.joined_at,
            is_active: member.is_active !== undefined ? member.is_active : true,
            user: userData ? {
              id: userData.id,
              name: userData.name || 'Unknown User',
              email: userData.email || '',
              avatar_url: userData.avatar_url,
              phone: userData.phone,
              created_at: userData.created_at || new Date().toISOString()
            } : {
              id: member.user_id,
              name: 'Unknown User',
              email: '',
              created_at: new Date().toISOString()
            },
            volunteer_hours: memberHours,
            events_attended: attendedCount,
            last_active: member.joined_at,
            roles: userRoles // Add the actual role names
          }
        })
      )

      console.log('Loaded members:', enhancedMembers.length, enhancedMembers)
      setMembers(enhancedMembers)
    } catch (error) {
      console.error('Error loading members:', error)
      setMembers([])
    } finally {
      setLoading(false)
    }
  }, [selectedOrg])

  const applyFilters = useCallback(() => {
    let filtered = [...members]

    // Search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase()
      filtered = filtered.filter(member => 
        member.user?.name?.toLowerCase().includes(searchLower) ||
        member.user?.email?.toLowerCase().includes(searchLower)
      )
    }

    // Role filter
    if (filters.role !== 'all') {
      filtered = filtered.filter(member => member.role === filters.role)
    }

    // Status filter
    if (filters.status !== 'all') {
      filtered = filtered.filter(member => 
        filters.status === 'active' ? member.is_active : !member.is_active
      )
    }

    // Sort
    filtered.sort((a, b) => {
      let aValue: any, bValue: any

      switch (filters.sortBy) {
        case 'name':
          aValue = a.user?.name || ''
          bValue = b.user?.name || ''
          break
        case 'joined_at':
          aValue = new Date(a.joined_at)
          bValue = new Date(b.joined_at)
          break
        case 'role':
          aValue = a.role
          bValue = b.role
          break
        case 'volunteer_hours':
          aValue = a.volunteer_hours || 0
          bValue = b.volunteer_hours || 0
          break
        default:
          return 0
      }

      if (filters.sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1
      } else {
        return aValue < bValue ? 1 : -1
      }
    })
    setFilteredMembers(filtered)
  }, [members, filters])

  useEffect(() => {
    if (selectedOrg && isAdmin) {
      loadMembers()
  }
  }, [selectedOrg, isAdmin, loadMembers])

  useEffect(() => {
    applyFilters()
  }, [applyFilters])

  const handleRoleChange = async (memberId: string, newRole: 'admin' | 'member' | 'moderator') => {
    if (!selectedOrg) return

    try {
      // Update member role in database
      await organizationService.updateMemberRole(selectedOrg.id, memberId, newRole)
      
      // Update local state
      setMembers(prev => prev.map(member => 
        member.id === memberId ? { ...member, role: newRole } : member
      ))
    } catch (error) {
      console.error('Error updating member role:', error)
      alert('Failed to update member role')
    }
  }

  const handleMemberStatus = async (memberId: string, isActive: boolean) => {
    if (!selectedOrg) return

    try {
      await organizationService.updateMemberStatus(selectedOrg.id, memberId, isActive)
      
      setMembers(prev => prev.map(member => 
        member.id === memberId ? { ...member, is_active: isActive } : member
      ))
    } catch (error) {
      console.error('Error updating member status:', error)
      alert('Failed to update member status')
    }
  }

  const handleBulkAction = async (action: 'activate' | 'deactivate' | 'remove') => {
    if (!selectedOrg || selectedMembers.size === 0) return

    try {
      const memberIds = Array.from(selectedMembers)
      
      switch (action) {
        case 'activate':
          await Promise.all(
            memberIds.map(id => organizationService.updateMemberStatus(selectedOrg.id, id, true))
          )
          break
        case 'deactivate':
          await Promise.all(
            memberIds.map(id => organizationService.updateMemberStatus(selectedOrg.id, id, false))
          )
          break
        case 'remove':
          await Promise.all(
            memberIds.map(id => organizationService.removeMember(selectedOrg.id, id))
          )
          break
      }

      // Refresh members list
      await loadMembers()
      setSelectedMembers(new Set())
      setShowBulkActions(false)
    } catch (error) {
      console.error('Error performing bulk action:', error)
      alert('Failed to perform bulk action')
    }
  }

  const exportMembers = () => {
    const csvData = filteredMembers.map(member => ({
      Name: member.user?.name || '',
      Email: member.user?.email || '',
      Role: member.role,
      Status: member.is_active ? 'Active' : 'Inactive',
      'Joined Date': new Date(member.joined_at).toLocaleDateString(),
      'Volunteer Hours': member.volunteer_hours || 0,
      'Events Attended': member.events_attended || 0
    }))

    const csv = [
      Object.keys(csvData[0]).join(','),
      ...csvData.map(row => Object.values(row).join(','))
    ].join('\n')

    const blob = new Blob([csv], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `members-${selectedOrg?.name}-${new Date().toISOString().split('T')[0]}.csv`
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
          <p className="text-gray-600 font-semibold">Loading members...</p>
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
                Member Management
              </h1>
              <p className="text-gray-600 mt-2">
                Manage {selectedOrg?.name} organization members
              </p>
        </div>
            <div className="flex items-center gap-3">
              <HiveButton
                variant="secondary"
                onClick={exportMembers}
                className="flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                Export CSV
              </HiveButton>
              <HiveButton
                variant="primary"
                onClick={loadMembers}
                className="flex items-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Refresh
              </HiveButton>
      </div>
          </div>
        </motion.div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <HiveCard>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold text-gray-900">{members.length}</p>
                  <p className="text-sm text-gray-600">Total Members</p>
                </div>
                <Users className="w-8 h-8 text-blue-600" />
        </div>
            </HiveCard>
          </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <HiveCard>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold text-gray-900">
                    {members.filter(m => m.role === 'admin').length}
                  </p>
                  <p className="text-sm text-gray-600">Admins</p>
                </div>
                <Crown className="w-8 h-8 text-purple-600" />
              </div>
            </HiveCard>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <HiveCard>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold text-gray-900">
                    {members.filter(m => m.is_active).length}
                  </p>
                  <p className="text-sm text-gray-600">Active</p>
                </div>
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
            </HiveCard>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <HiveCard>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold text-gray-900">
                    {members.reduce((sum, m) => sum + (m.volunteer_hours || 0), 0)}
                  </p>
                  <p className="text-sm text-gray-600">Total Hours</p>
                </div>
                <Award className="w-8 h-8 text-orange-600" />
              </div>
            </HiveCard>
            </motion.div>
        </div>

        {/* Filters and Search */}
        <HiveCard className="mb-6">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <HiveInput
                  placeholder="Search members..."
                  value={filters.search}
                  onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                  className="pl-10"
                />
              </div>
      </div>

            <div className="flex gap-4">
              <select
                value={filters.role}
                onChange={(e) => setFilters(prev => ({ ...prev, role: e.target.value as any }))}
                className="px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Roles</option>
                <option value="admin">Admins</option>
                <option value="member">Members</option>
              </select>
              
              <select
                value={filters.status}
                onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value as any }))}
                className="px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
              
              <select
                value={`${filters.sortBy}-${filters.sortOrder}`}
                onChange={(e) => {
                  const [sortBy, sortOrder] = e.target.value.split('-')
                  setFilters(prev => ({ ...prev, sortBy: sortBy as any, sortOrder: sortOrder as any }))
                }}
                className="px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="joined_at-desc">Newest First</option>
                <option value="joined_at-asc">Oldest First</option>
                <option value="name-asc">Name A-Z</option>
                <option value="name-desc">Name Z-A</option>
                <option value="volunteer_hours-desc">Most Hours</option>
                <option value="volunteer_hours-asc">Least Hours</option>
              </select>
            </div>
          </div>
        </HiveCard>

        {/* Bulk Actions */}
        {selectedMembers.size > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6"
          >
            <HiveCard className="bg-blue-50 border-blue-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-blue-700 font-semibold">
                    {selectedMembers.size} member{selectedMembers.size > 1 ? 's' : ''} selected
                  </span>
                </div>
                <div className="flex gap-2">
                  <HiveButton
                    variant="secondary"
                    size="sm"
                    onClick={() => handleBulkAction('activate')}
                  >
                    Activate
                  </HiveButton>
                  <HiveButton
                    variant="secondary"
                    size="sm"
                    onClick={() => handleBulkAction('deactivate')}
                  >
                    Deactivate
                  </HiveButton>
                  {/* Only show Remove button to admins who can manage members */}
                  {canManageMembers && (
                    <HiveButton
                      variant="outline"
                      size="sm"
                      onClick={() => handleBulkAction('remove')}
                      className="text-red-600 border-red-300 hover:bg-red-50"
                    >
                      Remove
                    </HiveButton>
                  )}
                  <HiveButton
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedMembers(new Set())}
                  >
                    Clear
                  </HiveButton>
                </div>
        </div>
            </HiveCard>
          </motion.div>
        )}

        {/* Members Table */}
        <HiveCard>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-4 px-4">
                    <input
                      type="checkbox"
                      checked={selectedMembers.size === filteredMembers.length && filteredMembers.length > 0}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedMembers(new Set(filteredMembers.map(m => m.id)))
                        } else {
                          setSelectedMembers(new Set())
                        }
                      }}
                      className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                    />
                  </th>
                  <th className="text-left py-4 px-4 font-semibold text-gray-700">Member</th>
                  <th className="text-left py-4 px-4 font-semibold text-gray-700">Role</th>
                  <th className="text-left py-4 px-4 font-semibold text-gray-700">Status</th>
                  <th className="text-left py-4 px-4 font-semibold text-gray-700">Joined</th>
                  <th className="text-left py-4 px-4 font-semibold text-gray-700">Hours</th>
                  <th className="text-left py-4 px-4 font-semibold text-gray-700">Events</th>
                  <th className="text-left py-4 px-4 font-semibold text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredMembers.map((member, index) => (
                  <motion.tr
                    key={member.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="border-b border-gray-100 hover:bg-gray-50"
                  >
                    <td className="py-4 px-4">
                      <input
                        type="checkbox"
                        checked={selectedMembers.has(member.id)}
                        onChange={(e) => {
                          const newSelected = new Set(selectedMembers)
                          if (e.target.checked) {
                            newSelected.add(member.id)
                          } else {
                            newSelected.delete(member.id)
                          }
                          setSelectedMembers(newSelected)
                        }}
                        className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                      />
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold">
                          {member.user?.name?.charAt(0) || '?'}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">{member.user?.name || 'Unknown'}</p>
                          <p className="text-sm text-gray-600">{member.user?.email}</p>
                        </div>
            </div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex flex-col gap-2">
                        {/* Organization role (admin/member) */}
                        <select
                          value={member.role}
                          onChange={(e) => handleRoleChange(member.id, e.target.value as 'admin' | 'member' | 'moderator')}
                          className="px-3 py-1 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          disabled={member.user_id === user?.id} // Can't change own role
                        >
                          <option value="member">Member</option>
                          <option value="admin">Admin</option>
                          {/* Only show moderator option for existing moderators or to admins */}
                          {(member.role === 'moderator' || isAdmin) && (
                            <option value="moderator">Moderator (Private)</option>
                          )}
                        </select>
                        {/* Display actual role names from user_organization_roles */}
                        {member.roles && member.roles.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1">
                            {member.roles.map((roleName, idx) => (
                              <span
                                key={idx}
                                className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-purple-100 text-purple-800 border border-purple-300"
                              >
                                {roleName}
                              </span>
                            ))}
                          </div>
                        )}
                        {(!member.roles || member.roles.length === 0) && (
                          <span className="text-xs text-gray-400 italic">No roles assigned</span>
                        )}
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-2">
                        {member.is_active ? (
                          <CheckCircle className="w-4 h-4 text-green-600" />
                        ) : (
                          <XCircle className="w-4 h-4 text-red-600" />
                        )}
                        <span className={`text-sm font-semibold ${
                          member.is_active ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {member.is_active ? 'Active' : 'Inactive'}
                        </span>
          </div>
                    </td>
                    <td className="py-4 px-4 text-sm text-gray-600">
                      {new Date(member.joined_at).toLocaleDateString()}
                    </td>
                    <td className="py-4 px-4 text-sm text-gray-600">
                      {member.volunteer_hours || 0}
                    </td>
                    <td className="py-4 px-4 text-sm text-gray-600">
                      {member.events_attended || 0}
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-2">
                        <HiveButton
                          variant="outline"
                          size="sm"
                          onClick={() => handleMemberStatus(member.id, !member.is_active)}
                          className={member.is_active ? 'text-red-600 border-red-300 hover:bg-red-50' : 'text-green-600 border-green-300 hover:bg-green-50'}
                        >
                          {member.is_active ? 'Deactivate' : 'Activate'}
                        </HiveButton>
                        {/* Only show Remove button to admins who can manage members */}
                        {canManageMembers && (
                          <HiveButton
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              if (confirm('Are you sure you want to remove this member?')) {
                                handleBulkAction('remove')
                                setSelectedMembers(new Set([member.id]))
                              }
                            }}
                            className="text-red-600 border-red-300 hover:bg-red-50"
                          >
                            <Trash2 className="w-3 h-3" />
                          </HiveButton>
                        )}
        </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
            
            {filteredMembers.length === 0 && (
              <div className="text-center py-12">
                <Users className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                <p className="text-gray-500">No members found</p>
            </div>
            )}
          </div>
        </HiveCard>
      </div>
    </div>
  )
}