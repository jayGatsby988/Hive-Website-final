'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { useOrganization } from '@/contexts/OrganizationContext'
import { usePermissions } from '@/components/common/ProtectedRoute'
import { Plus, Calendar, Sparkles } from 'lucide-react'

interface FloatingCreateEventButtonProps {
  className?: string
}

export default function FloatingCreateEventButton({ className = '' }: FloatingCreateEventButtonProps) {
  const router = useRouter()
  const { selectedOrg, canCreateEvents } = useOrganization()
  const { isAdmin } = usePermissions()

  if (!isAdmin || !canCreateEvents || !selectedOrg) {
    return null
  }

  const handleCreateEvent = () => {
    router.push(`/organizations/${selectedOrg.id}/events/create`)
  }

  return (
    <motion.button
      onClick={handleCreateEvent}
      className={`fixed bottom-6 right-6 z-50 ${className}`}
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      whileHover={{ scale: 1.1, rotate: 5 }}
      whileTap={{ scale: 0.95 }}
      transition={{ 
        type: "spring", 
        stiffness: 300, 
        damping: 20,
        delay: 0.5 
      }}
    >
      <div className="relative">
        {/* Main Button */}
        <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full shadow-2xl flex items-center justify-center text-white hover:shadow-3xl transition-all duration-300">
          <Plus className="w-8 h-8" />
        </div>
        
        {/* Glow Effect */}
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full blur-lg opacity-30 animate-pulse"></div>
        
        {/* Tooltip */}
        <div className="absolute bottom-full right-0 mb-2 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg shadow-lg opacity-0 hover:opacity-100 transition-opacity duration-200 whitespace-nowrap">
          Create New Event
          <div className="absolute top-full right-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
        </div>
      </div>
    </motion.button>
  )
}
