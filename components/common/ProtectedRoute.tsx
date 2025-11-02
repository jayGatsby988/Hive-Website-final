'use client'

import React from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useOrganization } from '@/contexts/OrganizationContext'
import { hasPermission, Permission } from '@/lib/permissions'
import { motion } from 'framer-motion'

interface ProtectedRouteProps {
  children: React.ReactNode
  permission?: Permission
  requireAdmin?: boolean
  requireSuperAdmin?: boolean
  fallback?: React.ReactNode
  organizationId?: string
}

export function ProtectedRoute({ 
  children, 
  permission, 
  requireAdmin = false,
  requireSuperAdmin = false,
  fallback = <AccessDenied />,
  organizationId
}: ProtectedRouteProps) {
  const { user, loading: authLoading } = useAuth()
  const { userRole, userPermissions, loading: orgLoading } = useOrganization()

  // Avoid flicker/false negatives while auth/org is still loading
  if (authLoading || orgLoading) {
    return (
      <motion.div className="min-h-[40vh] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-gray-300 border-t-gray-900 rounded-full animate-spin" />
      </motion.div>
    )
  }

  // Check super admin requirement
  if (requireSuperAdmin && user?.role !== 'super_admin') {
    return <>{fallback}</>
  }

  // Check admin requirement
  if (requireAdmin && user?.role !== 'super_admin' && userRole !== 'admin') {
    return <>{fallback}</>
  }

  // Check specific permission
  if (permission && !hasPermission(user, permission, organizationId, userRole)) {
    return <>{fallback}</>
  }

  return <>{children}</>
}

function AccessDenied() {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100"
    >
      <div className="text-center p-8 bg-white rounded-2xl shadow-xl border border-gray-200 max-w-md mx-4">
        <div className="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
          <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
        <p className="text-gray-600 mb-6">
          You don't have permission to access this resource.
        </p>
        <button 
          onClick={() => window.history.back()}
          className="px-6 py-3 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors font-semibold"
        >
          Go Back
        </button>
      </div>
    </motion.div>
  )
}

// Higher-order component for protecting routes
export function withPermission<P extends object>(
  Component: React.ComponentType<P>,
  permission?: Permission,
  requireAdmin = false,
  requireSuperAdmin = false
) {
  return function ProtectedComponent(props: P) {
    return (
      <ProtectedRoute 
        permission={permission}
        requireAdmin={requireAdmin}
        requireSuperAdmin={requireSuperAdmin}
      >
        <Component {...props} />
      </ProtectedRoute>
    )
  }
}

// Hook for checking permissions
export function usePermissions() {
  const { user } = useAuth()
  const { userRole, userPermissions } = useOrganization()

  const hasPermissionCheck = (permission: Permission, orgId?: string) => {
    return hasPermission(user, permission, orgId, userRole)
  }

  const isAdmin = userRole === 'admin' || user?.role === 'super_admin'
  const isSuperAdmin = user?.role === 'super_admin'

  return {
    hasPermission: hasPermissionCheck,
    userPermissions,
    isAdmin,
    isSuperAdmin,
    userRole
  }
}