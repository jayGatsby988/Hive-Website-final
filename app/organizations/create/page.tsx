'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { ArrowLeft, Building2, MapPin, Mail, Globe, Phone, Home, CheckCircle } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import HiveButton from '@/components/common/HiveButton'
import HiveInput from '@/components/common/HiveInput'
import ProtectedRoute from '@/components/common/ProtectedRoute'
import { organizationService } from '@/lib/services'
import { useAuth } from '@/contexts/AuthContext'

export default function CreateOrganizationPage() {
  const router = useRouter()
  const { user } = useAuth()
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    address: '',
    email: '',
    website: '',
    phone: '',
    logo_url: '',
    category: '',
    is_active: true,
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const generateJoinCode = () => {
    // Generate a random 6-character alphanumeric code
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return code;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess(false)
    setLoading(true)

    try {
      if (!user) {
        setError('You must be logged in to create an organization')
        return
      }

      const joinCode = generateJoinCode();

      const organization = await organizationService.create({
        name: formData.name,
        description: formData.description,
        address: formData.address,
        email: formData.email,
        website: formData.website,
        phone: formData.phone,
        logo_url: formData.logo_url || null,
        is_active: formData.is_active,
        created_by: user.id,
        join_code: joinCode,
      })

      // Join the organization as admin
      await organizationService.joinOrganization(organization.id, user.id, 'admin')

      setSuccess(true)
      
      // Redirect after a short delay to show success message
      setTimeout(() => {
        router.push(`/organizations/${organization.id}`)
      }, 2000)
    } catch (err: any) {
      setError(err.message || 'Failed to create organization')
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gradient-to-br from-hiveYellow/5 via-hiveWhite to-hiveYellow/10">
        {/* Navigation Header */}
        <motion.div
          className="bg-hiveWhite/90 backdrop-blur-md border-b border-hiveGray-light sticky top-0 z-40"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center gap-4">
                <Link
                  href="/organizations"
                  className="inline-flex items-center gap-2 text-hiveGray hover:text-hiveYellow transition-colors"
                >
                  <ArrowLeft className="w-5 h-5" />
                  Back to Organizations
                </Link>
                <div className="w-px h-6 bg-hiveGray-light"></div>
                <Link
                  href={user?.role === 'super_admin' ? '/super-admin' : '/dashboard'}
                  className="inline-flex items-center gap-2 text-hiveGray hover:text-hiveYellow transition-colors"
                >
                  <Home className="w-5 h-5" />
                  {user?.role === 'super_admin' ? 'Super Admin' : 'Dashboard'}
                </Link>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-hiveGray">
                  Creating as {user?.name}
                </span>
              </div>
            </div>
          </div>
        </motion.div>

        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <motion.div
            className="mb-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 bg-hiveYellow/20 rounded-lg flex items-center justify-center">
                <Building2 className="w-6 h-6 text-hiveYellow" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-hiveGray-dark">Create Organization</h1>
                <p className="text-hiveGray">Start a new organization and build your community</p>
              </div>
            </div>
          </motion.div>

          {/* Form */}
          <motion.div
            className="bg-hiveWhite rounded-2xl shadow-hive-lift p-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Organization Name */}
              <div>
                <label className="block text-sm font-medium text-hiveGray-dark mb-2">
                  Organization Name *
                </label>
                <HiveInput
                  type="text"
                  placeholder="Enter organization name"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  required
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-hiveGray-dark mb-2">
                  Description *
                </label>
                <textarea
                  className="w-full px-4 py-3 border border-hiveGray-light rounded-lg focus:ring-2 focus:ring-hiveYellow focus:border-transparent resize-none"
                  placeholder="Describe your organization's mission and goals"
                  rows={4}
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  required
                />
              </div>

              {/* Address */}
              <div>
                <label className="block text-sm font-medium text-hiveGray-dark mb-2">
                  <MapPin className="w-4 h-4 inline mr-2" />
                  Address
                </label>
                <HiveInput
                  type="text"
                  placeholder="Enter organization address"
                  value={formData.address}
                  onChange={(e) => handleInputChange('address', e.target.value)}
                />
              </div>

              {/* Contact Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-hiveGray-dark mb-2">
                    <Mail className="w-4 h-4 inline mr-2" />
                    Email
                  </label>
                  <HiveInput
                    type="email"
                    placeholder="contact@organization.com"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-hiveGray-dark mb-2">
                    <Phone className="w-4 h-4 inline mr-2" />
                    Phone
                  </label>
                  <HiveInput
                    type="tel"
                    placeholder="(555) 123-4567"
                    value={formData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                  />
                </div>
              </div>

              {/* Website */}
              <div>
                <label className="block text-sm font-medium text-hiveGray-dark mb-2">
                  <Globe className="w-4 h-4 inline mr-2" />
                  Website
                </label>
                <HiveInput
                  type="url"
                  placeholder="https://www.organization.com"
                  value={formData.website}
                  onChange={(e) => handleInputChange('website', e.target.value)}
                />
              </div>

              {/* Logo URL */}
              <div>
                <label className="block text-sm font-medium text-hiveGray-dark mb-2">
                  Logo URL
                </label>
                <HiveInput
                  type="url"
                  placeholder="https://example.com/logo.png"
                  value={formData.logo_url}
                  onChange={(e) => handleInputChange('logo_url', e.target.value)}
                />
              </div>

              {/* Category */}
              <div>
                <label className="block text-sm font-medium text-hiveGray-dark mb-2">
                  Category
                </label>
                <select
                  className="w-full px-4 py-3 border border-hiveGray-light rounded-lg focus:ring-2 focus:ring-hiveYellow focus:border-transparent"
                  value={formData.category}
                  onChange={(e) => handleInputChange('category', e.target.value)}
                >
                  <option value="">Select a category</option>
                  <option value="environment">Environment</option>
                  <option value="education">Education</option>
                  <option value="health">Health</option>
                  <option value="community">Community</option>
                  <option value="animals">Animals</option>
                  <option value="social">Social</option>
                  <option value="other">Other</option>
                </select>
              </div>

              {/* Success Message */}
              {success && (
                <motion.div
                  className="bg-green-50 border border-green-200 text-green-600 px-4 py-3 rounded-lg"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5" />
                    <span className="font-medium">Organization created successfully!</span>
                  </div>
                  <p className="text-sm mt-1">Redirecting to your new organization...</p>
                </motion.div>
              )}

              {/* Error Message */}
              {error && (
                <motion.div
                  className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  {error}
                </motion.div>
              )}

              {/* Submit Button */}
              <div className="flex gap-4 pt-4">
                <Link href="/organizations" className="flex-1">
                  <HiveButton variant="outline" className="w-full">
                    Cancel
                  </HiveButton>
                </Link>
                <HiveButton
                  type="submit"
                  className="flex-1"
                  disabled={loading || success}
                >
                  {loading ? 'Creating...' : success ? 'Created!' : 'Create Organization'}
                </HiveButton>
              </div>
            </form>
          </motion.div>

          {/* Info Box */}
          <motion.div
            className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            <h3 className="text-lg font-semibold text-blue-800 mb-2">What happens next?</h3>
            <ul className="list-disc list-inside text-blue-700 space-y-1">
              <li>Your organization will be created and you'll become the admin</li>
              <li>You can start creating events and inviting members</li>
              <li>Members can join using your organization's join code</li>
              <li>You'll have full control over organization settings and events</li>
            </ul>
          </motion.div>
        </div>
      </div>
    </ProtectedRoute>
  )
}
