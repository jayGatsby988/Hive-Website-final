'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { organizationService, userService } from '@/lib/services'
import { Organization } from '@/lib/types'
import { getUserEffectiveRole, getUserPermissions, Permission } from '@/lib/permissions'

interface OrganizationContextType {
  selectedOrg: Organization | null
  organizations: Organization[]
  loading: boolean
  error: string | null
  userRole: string | null
  userPermissions: Permission[]
  setSelectedOrg: (org: Organization | null) => void
  refreshOrganizations: () => Promise<void>
  isAdmin: boolean
  canCreateEvents: boolean
  canManageMembers: boolean
  canViewAnalytics: boolean
}

const OrganizationContext = createContext<OrganizationContextType | undefined>(undefined)

export function OrganizationProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()
  const [selectedOrg, setSelectedOrg] = useState<Organization | null>(null)
  const [organizations, setOrganizations] = useState<Organization[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [userRole, setUserRole] = useState<string | null>(null)
  const [userPermissions, setUserPermissions] = useState<Permission[]>([])

  const loadOrganizations = async () => {
    if (!user) {
      setOrganizations([])
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)
      
      const orgsWithRoles = await userService.getUserOrganizations(user.id)
      
      const convertedOrgs = orgsWithRoles.map(org => ({
        ...org,
        members: org.members || 0,
        activeEvents: org.activeEvents || 0,
        events: [],
        announcements: [],
        generalChat: [],
        stats: {
          totalHours: 0,
          completedEvents: 0,
          upcomingEvents: 0
        }
      }))

      setOrganizations(convertedOrgs)
      
      // Set user role and permissions for selected org
      if (selectedOrg) {
        const currentOrg = convertedOrgs.find(org => org.id === selectedOrg.id)
        if (currentOrg) {
          const role = currentOrg.userRole
          setUserRole(role)
          setUserPermissions(getUserPermissions(user, role))
        }
      }
      
    } catch (err: any) {
      console.error('Error loading organizations:', err)
      setError(err.message || 'Failed to load organizations')
    } finally {
      setLoading(false)
    }
  }

  const refreshOrganizations = async () => {
    await loadOrganizations()
  }

  useEffect(() => {
    loadOrganizations()
  }, [user])

  // Update permissions when selected org changes
  useEffect(() => {
    if (selectedOrg && user) {
      const org = organizations.find(o => o.id === selectedOrg.id)
      if (org) {
        const role = org.userRole
        setUserRole(role)
        setUserPermissions(getUserPermissions(user, role))
      }
    } else {
      setUserRole(null)
      setUserPermissions([])
    }
  }, [selectedOrg, organizations, user])

  // Computed permissions
  // Moderators get admin-like permissions except member management
  const isAdmin = userRole === 'admin' || userRole === 'moderator' || user?.role === 'super_admin'
  const isModerator = userRole === 'moderator'
  
  // Moderators can create events, but cannot manage members
  const canCreateEvents = userPermissions.includes('create_events') || isAdmin
  const canManageMembers = userPermissions.includes('manage_members') || (userRole === 'admin' && !isModerator)
  const canViewAnalytics = userPermissions.includes('view_analytics') || isAdmin

  const value: OrganizationContextType = {
    selectedOrg,
    organizations,
    loading,
    error,
    userRole,
    userPermissions,
    setSelectedOrg,
    refreshOrganizations,
    isAdmin,
    canCreateEvents,
    canManageMembers,
    canViewAnalytics
  }

  return (
    <OrganizationContext.Provider value={value}>
      {children}
    </OrganizationContext.Provider>
  )
}

export function useOrganization() {
  const context = useContext(OrganizationContext)
  if (context === undefined) {
    throw new Error('useOrganization must be used within an OrganizationProvider')
  }
  return context
}