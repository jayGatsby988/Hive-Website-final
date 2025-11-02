import { User } from './types'

export type Permission = 
  | 'create_events'
  | 'edit_events'
  | 'delete_events'
  | 'manage_members'
  | 'view_analytics'
  | 'manage_settings'
  | 'create_announcements'
  | 'manage_roles'
  | 'view_financials'
  | 'export_data'
  | 'manage_resources'
  | 'view_volunteer_hours'

export type Role = 'super_admin' | 'admin' | 'member' | 'volunteer'

export interface RolePermissions {
  [key: string]: Permission[]
}

// Define permissions for each role
export const ROLE_PERMISSIONS: RolePermissions = {
  super_admin: [
    'create_events',
    'edit_events', 
    'delete_events',
    'manage_members',
    'view_analytics',
    'manage_settings',
    'create_announcements',
    'manage_roles',
    'view_financials',
    'export_data',
    'manage_resources',
    'view_volunteer_hours'
  ],
  admin: [
    'create_events',
    'edit_events',
    'delete_events', 
    'manage_members',
    'view_analytics',
    'manage_settings',
    'create_announcements',
    'view_volunteer_hours',
    'manage_resources'
  ],
  member: [
    'view_analytics'
  ],
  volunteer: [
    'view_volunteer_hours'
  ]
}

// Organization-specific role permissions
export const ORG_ROLE_PERMISSIONS: RolePermissions = {
  admin: [
    'create_events',
    'edit_events',
    'delete_events',
    'manage_members', 
    'view_analytics',
    'manage_settings',
    'create_announcements',
    'view_volunteer_hours',
    'manage_resources'
  ],
  member: [
    'view_analytics'
  ]
}

/**
 * Check if user has a specific permission
 */
export function hasPermission(
  user: User | null, 
  permission: Permission, 
  organizationId?: string,
  userOrgRole?: string
): boolean {
  if (!user) return false

  // Super admin has all permissions
  if (user.role === 'super_admin') return true

  // Check organization-specific permissions
  if (organizationId && userOrgRole) {
    const orgPermissions = ORG_ROLE_PERMISSIONS[userOrgRole] || []
    return orgPermissions.includes(permission)
  }

  // Check global permissions
  const globalPermissions = ROLE_PERMISSIONS[user.role] || []
  return globalPermissions.includes(permission)
}

/**
 * Check if user is admin in an organization
 */
export function isOrgAdmin(userOrgRole?: string): boolean {
  return userOrgRole === 'admin'
}

/**
 * Check if user can manage organization
 */
export function canManageOrganization(user: User | null, userOrgRole?: string): boolean {
  return user?.role === 'super_admin' || isOrgAdmin(userOrgRole)
}

/**
 * Check if user can create events in organization
 */
export function canCreateEvents(user: User | null, userOrgRole?: string): boolean {
  return hasPermission(user, 'create_events', undefined, userOrgRole)
}

/**
 * Check if user can manage members
 */
export function canManageMembers(user: User | null, userOrgRole?: string): boolean {
  return hasPermission(user, 'manage_members', undefined, userOrgRole)
}

/**
 * Check if user can view analytics
 */
export function canViewAnalytics(user: User | null, userOrgRole?: string): boolean {
  return hasPermission(user, 'view_analytics', undefined, userOrgRole)
}

/**
 * Get user's effective role in organization
 */
export function getUserEffectiveRole(user: User | null, userOrgRole?: string): Role {
  if (user?.role === 'super_admin') return 'super_admin'
  if (userOrgRole === 'admin') return 'admin'
  if (userOrgRole === 'member') return 'member'
  return user?.role || 'volunteer'
}

/**
 * Get all permissions for user in organization
 */
export function getUserPermissions(user: User | null, userOrgRole?: string): Permission[] {
  if (!user) return []
  
  const effectiveRole = getUserEffectiveRole(user, userOrgRole)
  return ROLE_PERMISSIONS[effectiveRole] || []
}
