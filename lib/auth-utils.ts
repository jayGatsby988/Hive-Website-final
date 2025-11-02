import { User } from './types';

/**
 * Check if a user has super admin privileges
 */
export function isSuperAdmin(user: User | null): boolean {
  return user?.role === 'super_admin';
}

/**
 * Check if a user has admin privileges (including super admin)
 */
export function isAdmin(user: User | null): boolean {
  return user?.role === 'admin' || user?.role === 'super_admin';
}

/**
 * Check if a user has volunteer privileges (including admin and super admin)
 */
export function isVolunteer(user: User | null): boolean {
  return user?.role === 'volunteer' || isAdmin(user);
}

/**
 * Check if a user has a specific role
 */
export function hasRole(user: User | null, role: User['role']): boolean {
  return user?.role === role;
}

/**
 * Check if a user has any of the specified roles
 */
export function hasAnyRole(user: User | null, roles: User['role'][]): boolean {
  return user ? roles.includes(user.role) : false;
}

/**
 * Get user role display name
 */
export function getRoleDisplayName(role: User['role']): string {
  switch (role) {
    case 'super_admin':
      return 'Super Admin';
    case 'admin':
      return 'Admin';
    case 'volunteer':
      return 'Volunteer';
    case 'user':
      return 'User';
    default:
      return 'Unknown';
  }
}

/**
 * Check if a user can access a specific feature
 */
export function canAccessFeature(user: User | null, feature: string): boolean {
  if (!user) return false;

  switch (feature) {
    case 'super_admin_panel':
      return isSuperAdmin(user);
    case 'admin_panel':
      return isAdmin(user);
    case 'create_events':
      return isAdmin(user);
    case 'manage_organizations':
      return isAdmin(user);
    case 'view_analytics':
      return isAdmin(user);
    case 'volunteer_hours':
      return isVolunteer(user);
    default:
      return false;
  }
}
