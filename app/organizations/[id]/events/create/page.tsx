'use client'

import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { useOrganization } from '@/contexts/OrganizationContext'
import { eventService } from '@/lib/services'
import { Calendar, MapPin, Clock, Users, X, Save, Eye, EyeOff } from 'lucide-react'
import HiveCard from '@/components/common/HiveCard'
import HiveButton from '@/components/common/HiveButton'
import HiveInput from '@/components/common/HiveInput'

interface EventFormData {
  title: string
  description: string
  date: string
  time: string
  end_time?: string
  location?: string
  address?: string
  capacity: number
  max_attendees: number
  status: 'draft' | 'published'
  event_type: string
  is_private: boolean
  requires_approval: boolean
  tags: string[]
  registration_deadline?: string
}

export default function AdminEventCreation() {
  const router = useRouter()
  const { user } = useAuth()
  const { selectedOrg, isAdmin } = useOrganization()
  const [loading, setLoading] = useState(false)
  const [previewMode, setPreviewMode] = useState(false)
  const [errors, setErrors] = useState<Partial<Record<keyof EventFormData, string>>>({})
  
  const [formData, setFormData] = useState<EventFormData>({
    title: '',
    description: '',
    date: '',
    time: '',
    end_time: '',
    location: '',
    address: '',
    capacity: 50,
    max_attendees: 50,
    status: 'draft',
    event_type: 'volunteer',
    is_private: false,
    requires_approval: false,
    tags: [],
    registration_deadline: ''
  })

  if (!isAdmin || !selectedOrg || !user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-600">You need admin privileges to create events.</p>
        </div>
      </div>
    )
  }

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof EventFormData, string>> = {}

    if (!formData.title.trim()) newErrors.title = 'Title is required'
    if (!formData.description.trim()) newErrors.description = 'Description is required'
    if (!formData.date) newErrors.date = 'Date is required'
    if (!formData.time) newErrors.time = 'Start time is required'
    if (formData.max_attendees < 1) newErrors.max_attendees = 'Must allow at least 1 attendee'

    if (formData.date && formData.time) {
      const startDateTime = new Date(`${formData.date}T${formData.time}`)
      if (startDateTime < new Date()) {
        newErrors.date = 'Event date cannot be in the past'
      }
    }

    if (formData.end_time && formData.date && formData.time) {
      const startDateTime = new Date(`${formData.date}T${formData.time}`)
      const endDateTime = new Date(`${formData.date}T${formData.end_time}`)
      if (endDateTime <= startDateTime) {
        newErrors.end_time = 'End time must be after start time'
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (status: 'draft' | 'published') => {
    if (!validateForm()) return

    try {
      setLoading(true)
      
      // Create event data with only Supabase parameters
      const eventData = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        date: formData.date,
        time: formData.time,
        end_time: formData.end_time || null,
        location: formData.location || null,
        address: formData.address || null,
        capacity: formData.capacity,
        max_attendees: formData.max_attendees,
        status: status,
        event_type: formData.event_type,
        is_private: formData.is_private,
        requires_approval: formData.requires_approval,
        organization_id: selectedOrg.id,
        created_by: user.id,
        tags: formData.tags || [],
        registration_deadline: formData.registration_deadline || null,
        signup_count: 0,
        is_active: true,
        start_type: 'manual' as const,
        auto_start_enabled: false
      }

      await eventService.create(eventData)
      router.push(`/organizations/${selectedOrg.id}/events`)
    } catch (error: any) {
      console.error('Error creating event:', error)
      alert(error.message || 'Failed to create event')
    } finally {
      setLoading(false)
    }
  }

  const addTag = (tag: string) => {
    if (tag.trim() && !formData.tags.includes(tag.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, tag.trim()]
      }))
    }
  }

  const removeTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }))
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Create Event
              </h1>
              <p className="text-gray-600 mt-2">
                Create a new event for {selectedOrg.name}
              </p>
            </div>
            <HiveButton
              variant="secondary"
              onClick={() => setPreviewMode(!previewMode)}
              className="flex items-center gap-2"
            >
              {previewMode ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              {previewMode ? 'Edit Mode' : 'Preview'}
            </HiveButton>
          </div>
        </motion.div>

        <HiveCard className="p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
            <Calendar className="w-6 h-6 text-blue-600" />
            Event Details
          </h2>

          <div className="space-y-6">
            {/* Title */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Event Title *
              </label>
              <HiveInput
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Enter event title"
                error={errors.title}
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Description *
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Describe your event..."
                rows={4}
                className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none ${
                  errors.description ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.description && (
                <p className="text-red-500 text-sm mt-1">{errors.description}</p>
              )}
            </div>

            {/* Date and Time */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Date *
                </label>
                <HiveInput
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                  error={errors.date}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Start Time *
                </label>
                <HiveInput
                  type="time"
                  value={formData.time}
                  onChange={(e) => setFormData(prev => ({ ...prev, time: e.target.value }))}
                  error={errors.time}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  End Time
                </label>
                <HiveInput
                  type="time"
                  value={formData.end_time || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, end_time: e.target.value }))}
                  error={errors.end_time}
                />
              </div>
            </div>

            {/* Location */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Location
                </label>
                <HiveInput
                  value={formData.location || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                  placeholder="e.g., City, State"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Address
                </label>
                <HiveInput
                  value={formData.address || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                  placeholder="Full address"
                />
              </div>
            </div>

            {/* Capacity and Type */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Max Attendees *
                </label>
                <HiveInput
                  type="number"
                  value={formData.max_attendees}
                  onChange={(e) => setFormData(prev => ({ ...prev, max_attendees: parseInt(e.target.value) || 0 }))}
                  error={errors.max_attendees}
                  min={1}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Event Type
                </label>
                <select
                  value={formData.event_type}
                  onChange={(e) => setFormData(prev => ({ ...prev, event_type: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                >
                  <option value="volunteer">Volunteer Work</option>
                  <option value="fundraising">Fundraising</option>
                  <option value="community">Community Service</option>
                  <option value="education">Educational</option>
                  <option value="social">Social Event</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>

            {/* Settings */}
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                <div>
                  <label className="block text-sm font-semibold text-gray-700">Private Event</label>
                  <p className="text-xs text-gray-500">Only approved members can see this event</p>
                </div>
                <input
                  type="checkbox"
                  checked={formData.is_private}
                  onChange={(e) => setFormData(prev => ({ ...prev, is_private: e.target.checked }))}
                  className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                <div>
                  <label className="block text-sm font-semibold text-gray-700">Requires Approval</label>
                  <p className="text-xs text-gray-500">Manually approve sign-ups</p>
                </div>
                <input
                  type="checkbox"
                  checked={formData.requires_approval}
                  onChange={(e) => setFormData(prev => ({ ...prev, requires_approval: e.target.checked }))}
                  className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Tags */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Tags
              </label>
              <div className="flex flex-wrap gap-2 mb-2">
                {formData.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm"
                  >
                    {tag}
                    <button
                      onClick={() => removeTag(tag)}
                      className="hover:text-blue-900"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
              <HiveInput
                placeholder="Add a tag and press Enter"
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    addTag(e.currentTarget.value)
                    e.currentTarget.value = ''
                  }
                }}
              />
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4 pt-4 border-t">
              <HiveButton
                variant="secondary"
                onClick={() => router.back()}
                disabled={loading}
                className="flex-1"
              >
                Cancel
              </HiveButton>
              <HiveButton
                variant="secondary"
                onClick={() => handleSubmit('draft')}
                disabled={loading}
                className="flex-1"
              >
                <Save className="w-4 h-4 mr-2" />
                Save Draft
              </HiveButton>
              <HiveButton
                onClick={() => handleSubmit('published')}
                disabled={loading}
                className="flex-1 bg-gradient-to-r from-blue-500 to-purple-600"
              >
                {loading ? 'Publishing...' : 'Publish Event'}
              </HiveButton>
            </div>
          </div>
        </HiveCard>
      </div>
    </div>
  )
}