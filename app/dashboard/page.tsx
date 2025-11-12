'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { useOrganization } from '@/contexts/OrganizationContext'

export default function DashboardPage() {
  const { user, loading } = useAuth()
  const { isAdmin, loading: orgLoading } = useOrganization()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !orgLoading) {
      if (!user) {
        router.push('/login')
        return
      }

      // Redirect based on user role (organization-level admin/moderator or global super_admin)
      if (user.role === 'super_admin') {
        router.push('/super-admin')
      } else if (isAdmin) {
        router.push('/dashboard/admin')
      } else {
        router.push('/dashboard/user')
      }
    }
  }, [user, loading, orgLoading, isAdmin, router])

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-hiveYellow/10 via-hiveWhite to-hiveYellow/5 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-hiveYellow"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-hiveYellow/10 via-hiveWhite to-hiveYellow/5 flex items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-hiveYellow border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-hiveGray">Redirecting to dashboard...</p>
      </div>
    </div>
  )
}
