import { ProtectedRoute } from '@/components/common/ProtectedRoute'
import PageClient from './PageClient'

export default function AnalyticsPage() {
  return (
    <ProtectedRoute permission="view_analytics">
      <PageClient />
    </ProtectedRoute>
  )
}