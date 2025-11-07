'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Clock, Calendar, Plus, Edit, Trash2, CheckCircle } from 'lucide-react'
import HiveCard from '@/components/common/HiveCard'
import HiveButton from '@/components/common/HiveButton'
import HiveInput from '@/components/common/HiveInput'
import HiveModal from '@/components/common/HiveModal'
import { ProtectedRoute } from '@/components/common/ProtectedRoute'
import { useAuth } from '@/contexts/AuthContext'
import { useOrganization } from '@/contexts/OrganizationContext'
import { volunteerHoursService, eventService } from '@/lib/services'
import { VolunteerHours, Event } from '@/lib/types'

export default function VolunteerHoursPage() {
  const { user } = useAuth()
  const { selectedOrg } = useOrganization()
  const [volunteerHours, setVolunteerHours] = useState<VolunteerHours[]>([])
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingHour, setEditingHour] = useState<VolunteerHours | null>(null)
  const [formData, setFormData] = useState({
    date: '',
    hours: '',
    description: '',
    event_id: '',
    organization_id: '',
  })

  useEffect(() => {
    loadData()
  }, [user, selectedOrg])

  const loadData = async () => {
    if (!user) return

    try {
      setLoading(true)
      
      // Load volunteer hours
      const hours = await volunteerHoursService.getUserHours(user.id)
      setVolunteerHours(hours)

      // Load events for dropdown
      if (selectedOrg) {
        const orgEvents = await eventService.getByOrganization(selectedOrg.id)
        setEvents(orgEvents)
      }
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    try {
      const hourData = {
        user_id: user.id,
        date: formData.date,
        hours: parseFloat(formData.hours),
        description: formData.description,
        event_id: formData.event_id || null,
        organization_id: formData.organization_id || selectedOrg?.id || null,
        status: 'pending',
      }

      if (editingHour) {
        await volunteerHoursService.update(editingHour.id, hourData)
      } else {
        await volunteerHoursService.create(hourData)
      }

      await loadData()
      resetForm()
    } catch (error) {
      console.error('Error saving volunteer hours:', error)
    }
  }

  const handleEdit = (hour: VolunteerHours) => {
    setEditingHour(hour)
    setFormData({
      date: hour.date,
      hours: hour.hours.toString(),
      description: hour.description || '',
      event_id: hour.event_id || '',
      organization_id: hour.organization_id || '',
    })
    setIsModalOpen(true)
  }

  const handleDelete = async (hourId: string) => {
    if (!confirm('Are you sure you want to delete this volunteer hour entry?')) return

    try {
      await volunteerHoursService.delete(hourId)
      await loadData()
    } catch (error) {
      console.error('Error deleting volunteer hours:', error)
    }
  }

  const resetForm = () => {
    setFormData({
      date: '',
      hours: '',
      description: '',
      event_id: '',
      organization_id: '',
    })
    setEditingHour(null)
    setIsModalOpen(false)
  }

  const totalHours = volunteerHours.reduce((sum, hour) => sum + hour.hours, 0)
  const thisMonthHours = volunteerHours
    .filter(hour => {
      const hourDate = new Date(hour.date)
      const now = new Date()
      return hourDate.getMonth() === now.getMonth() && 
             hourDate.getFullYear() === now.getFullYear()
    })
    .reduce((sum, hour) => sum + hour.hours, 0)

  const thisYearHours = volunteerHours
    .filter(hour => {
      const hourDate = new Date(hour.date)
      const now = new Date()
      return hourDate.getFullYear() === now.getFullYear()
    })
    .reduce((sum, hour) => sum + hour.hours, 0)

  if (loading) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-gradient-to-br from-hiveYellow/5 via-hiveWhite to-hiveYellow/10 pt-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex items-center justify-center min-h-96">
              <div className="text-center">
                <div className="w-16 h-16 border-4 border-hiveYellow border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-hiveGray">Loading volunteer hours...</p>
              </div>
            </div>
          </div>
        </div>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gradient-to-br from-hiveYellow/5 via-hiveWhite to-hiveYellow/10 pt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <motion.div
            className="mb-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-hiveYellow/20 rounded-lg flex items-center justify-center">
                  <Clock className="w-6 h-6 text-hiveYellow" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-hiveGray-dark">Volunteer Hours</h1>
                  <p className="text-hiveGray">Track and manage your volunteer hours</p>
                </div>
              </div>
              <HiveButton onClick={() => setIsModalOpen(true)}>
                <Plus className="w-5 h-5 mr-2" />
                Log Hours
              </HiveButton>
            </div>
          </motion.div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
            >
              <HiveCard>
                <div className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-hiveYellow/20 rounded-lg flex items-center justify-center">
                      <Clock className="w-5 h-5 text-hiveYellow" />
                    </div>
                    <h3 className="text-lg font-semibold text-hiveGray-dark">Total Hours</h3>
                  </div>
                  <p className="text-3xl font-bold text-hiveGray-dark mb-2">{totalHours}</p>
                  <p className="text-sm text-hiveGray">All time</p>
                </div>
              </HiveCard>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <HiveCard>
                <div className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <Calendar className="w-5 h-5 text-blue-600" />
                    </div>
                    <h3 className="text-lg font-semibold text-hiveGray-dark">This Month</h3>
                  </div>
                  <p className="text-3xl font-bold text-hiveGray-dark mb-2">{thisMonthHours}</p>
                  <p className="text-sm text-hiveGray">Current month</p>
                </div>
              </HiveCard>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
            >
              <HiveCard>
                <div className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                    </div>
                    <h3 className="text-lg font-semibold text-hiveGray-dark">This Year</h3>
                  </div>
                  <p className="text-3xl font-bold text-hiveGray-dark mb-2">{thisYearHours}</p>
                  <p className="text-sm text-hiveGray">Current year</p>
                </div>
              </HiveCard>
            </motion.div>
          </div>

          {/* Hours List */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            <HiveCard>
              <div className="p-6">
                <h2 className="text-xl font-bold text-hiveGray-dark mb-6">Recent Hours</h2>
                
                {volunteerHours.length > 0 ? (
                  <div className="space-y-4">
                    {volunteerHours.map((hour, index) => (
                      <motion.div
                        key={hour.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.5 + index * 0.1 }}
                        className="flex items-center justify-between p-4 rounded-lg border border-hiveGray-light hover:border-hiveYellow transition-colors"
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-hiveYellow/20 rounded-lg flex items-center justify-center">
                            <Clock className="w-6 h-6 text-hiveYellow" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-hiveGray-dark">
                              {hour.event_id ? 'Event Volunteering' : 'General Volunteering'}
                            </h3>
                            <p className="text-sm text-hiveGray">
                              {hour.description || 'No description provided'}
                            </p>
                            <div className="flex items-center gap-4 mt-1">
                              <span className="text-xs text-hiveGray flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                {new Date(hour.date).toLocaleDateString()}
                              </span>
                              <span className="text-xs text-hiveGray">
                                {hour.organization_id ? 'Organization Event' : 'Independent'}
                              </span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <p className="text-lg font-bold text-hiveYellow">{hour.hours} hrs</p>
                            <span className={`text-xs px-2 py-1 rounded ${
                              hour.status === 'approved' 
                                ? 'bg-green-100 text-green-700'
                                : hour.status === 'pending'
                                ? 'bg-yellow-100 text-yellow-700'
                                : 'bg-red-100 text-red-700'
                            }`}>
                              {hour.status}
                            </span>
                          </div>
                          
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleEdit(hour)}
                              className="p-2 hover:bg-hiveGray-light rounded-lg transition-colors"
                            >
                              <Edit className="w-4 h-4 text-hiveGray" />
                            </button>
                            <button
                              onClick={() => handleDelete(hour.id)}
                              className="p-2 hover:bg-red-100 rounded-lg transition-colors"
                            >
                              <Trash2 className="w-4 h-4 text-red-500" />
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Clock className="w-16 h-16 text-hiveGray mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-hiveGray-dark mb-2">
                      No volunteer hours logged yet
                    </h3>
                    <p className="text-hiveGray mb-6">
                      Start tracking your volunteer hours to see your impact
                    </p>
                    <HiveButton onClick={() => setIsModalOpen(true)}>
                      <Plus className="w-5 h-5 mr-2" />
                      Log Your First Hours
                    </HiveButton>
                  </div>
                )}
              </div>
            </HiveCard>
          </motion.div>
        </div>

        {/* Add/Edit Hours Modal */}
        <HiveModal
          isOpen={isModalOpen}
          onClose={resetForm}
          title={editingHour ? 'Edit Volunteer Hours' : 'Log Volunteer Hours'}
          size="md"
        >
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-hiveGray-dark mb-2">
                  Date *
                </label>
                <HiveInput
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-hiveGray-dark mb-2">
                  Hours *
                </label>
                <HiveInput
                  type="number"
                  step="0.5"
                  min="0"
                  placeholder="2.5"
                  value={formData.hours}
                  onChange={(e) => setFormData(prev => ({ ...prev, hours: e.target.value }))}
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-hiveGray-dark mb-2">
                Description *
              </label>
              <textarea
                className="w-full px-4 py-3 border border-hiveGray-light rounded-lg focus:ring-2 focus:ring-hiveYellow focus:border-transparent resize-none"
                placeholder="Describe what you did during these volunteer hours..."
                rows={3}
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                required
              />
            </div>

            {selectedOrg && (
              <div>
                <label className="block text-sm font-medium text-hiveGray-dark mb-2">
                  Related Event (Optional)
                </label>
                <select
                  className="w-full px-4 py-3 border border-hiveGray-light rounded-lg focus:ring-2 focus:ring-hiveYellow focus:border-transparent"
                  value={formData.event_id}
                  onChange={(e) => setFormData(prev => ({ ...prev, event_id: e.target.value }))}
                >
                  <option value="">Select an event (optional)</option>
                  {events.map(event => (
                    <option key={event.id} value={event.id}>
                      {event.title} - {event.date}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="flex gap-4 pt-4">
              <HiveButton
                type="button"
                variant="outline"
                className="flex-1"
                onClick={resetForm}
              >
                Cancel
              </HiveButton>
              <HiveButton type="submit" className="flex-1">
                {editingHour ? 'Update Hours' : 'Log Hours'}
              </HiveButton>
            </div>
          </form>
        </HiveModal>
      </div>
    </ProtectedRoute>
  )
}
