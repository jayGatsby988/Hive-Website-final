'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Plus,
  QrCode,
  Download,
  Bell,
  Users,
  Calendar,
  Settings,
  FileText,
} from 'lucide-react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import HiveButton from '@/components/common/HiveButton';
import HiveCard from '@/components/common/HiveCard';
import HiveModal from '@/components/common/HiveModal';
import HiveInput from '@/components/common/HiveInput';

export default function AdminPanel() {
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [isQRModalOpen, setIsQRModalOpen] = useState(false);
  const [isNotificationModalOpen, setIsNotificationModalOpen] = useState(false);
  const [eventName, setEventName] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [eventTime, setEventTime] = useState('');
  const [eventLocation, setEventLocation] = useState('');

  const adminActions = [
    {
      icon: Plus,
      title: 'Create Event',
      description: 'Set up a new volunteer event',
      color: 'from-hiveYellow/20 to-hiveYellow/5',
      action: () => setIsEventModalOpen(true),
    },
    {
      icon: QrCode,
      title: 'QR Check-In',
      description: 'Generate QR codes for event check-in',
      color: 'from-blue-100 to-blue-50',
      action: () => setIsQRModalOpen(true),
    },
    {
      icon: Download,
      title: 'Export Reports',
      description: 'Download analytics and attendance data',
      color: 'from-green-100 to-green-50',
      action: () => console.log('Export reports'),
    },
    {
      icon: Bell,
      title: 'Send Notifications',
      description: 'Notify volunteers about events',
      color: 'from-orange-100 to-orange-50',
      action: () => setIsNotificationModalOpen(true),
    },
    {
      icon: Users,
      title: 'Manage Volunteers',
      description: 'View and organize volunteer profiles',
      color: 'from-purple-100 to-purple-50',
      action: () => console.log('Manage volunteers'),
    },
    {
      icon: Calendar,
      title: 'Event Calendar',
      description: 'View and edit event schedules',
      color: 'from-pink-100 to-pink-50',
      action: () => console.log('Event calendar'),
    },
    {
      icon: Settings,
      title: 'Organization Settings',
      description: 'Configure organization preferences',
      color: 'from-gray-100 to-gray-50',
      action: () => console.log('Settings'),
    },
    {
      icon: FileText,
      title: 'Generate Reports',
      description: 'Create custom analytics reports',
      color: 'from-teal-100 to-teal-50',
      action: () => console.log('Generate reports'),
    },
  ];

  return (
    <DashboardLayout userRole="admin">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-8"
        >
          <h1 className="text-4xl font-bold text-hiveGray-dark mb-2">
            Admin Panel
          </h1>
          <p className="text-hiveGray text-lg">
            Manage events, volunteers, and organization settings
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {adminActions.map((action, index) => (
            <motion.div
              key={action.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
            >
              <motion.div
                className="bg-hiveWhite rounded-xl shadow-hive-card overflow-hidden cursor-pointer hover:shadow-hive-lift transition-all duration-300 h-full"
                whileHover={{ y: -4 }}
                onClick={action.action}
              >
                <div
                  className={`h-32 bg-gradient-to-br ${action.color} flex items-center justify-center`}
                >
                  <motion.div
                    className="p-4 bg-hiveWhite rounded-2xl shadow-lg"
                    whileHover={{ scale: 1.1, rotate: 5 }}
                    transition={{ type: 'spring', stiffness: 300 }}
                  >
                    <action.icon className="w-8 h-8 text-hiveYellow" />
                  </motion.div>
                </div>
                <div className="p-6">
                  <h3 className="text-lg font-bold text-hiveGray-dark mb-2">
                    {action.title}
                  </h3>
                  <p className="text-sm text-hiveGray">{action.description}</p>
                </div>
              </motion.div>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.8 }}
          className="mt-12"
        >
          <h2 className="text-2xl font-bold text-hiveGray-dark mb-6">
            Quick Stats
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { label: 'Active Events', value: '24', trend: '+12%' },
              { label: 'Total Volunteers', value: '2,847', trend: '+8%' },
              { label: 'Hours This Month', value: '1,234', trend: '+15%' },
            ].map((stat, index) => (
              <HiveCard key={stat.label} delay={0.9 + index * 0.1}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-hiveGray text-sm mb-1">{stat.label}</p>
                    <p className="text-3xl font-bold text-hiveGray-dark">
                      {stat.value}
                    </p>
                  </div>
                  <div className="text-green-600 font-semibold text-sm">
                    {stat.trend}
                  </div>
                </div>
              </HiveCard>
            ))}
          </div>
        </motion.div>

      <HiveModal
        isOpen={isEventModalOpen}
        onClose={() => setIsEventModalOpen(false)}
        title="Create New Event"
        size="lg"
      >
        <div className="space-y-4">
          <HiveInput
            label="Event Name"
            placeholder="Enter event name"
            value={eventName}
            onChange={(e) => setEventName(e.target.value)}
          />
          <div className="grid grid-cols-2 gap-4">
            <HiveInput
              label="Date"
              type="date"
              value={eventDate}
              onChange={(e) => setEventDate(e.target.value)}
            />
            <HiveInput
              label="Time"
              type="time"
              value={eventTime}
              onChange={(e) => setEventTime(e.target.value)}
            />
          </div>
          <HiveInput
            label="Location"
            placeholder="Enter location"
            value={eventLocation}
            onChange={(e) => setEventLocation(e.target.value)}
          />
          <div className="flex gap-2 pt-4">
            <HiveButton
              className="flex-1"
              onClick={() => {
                console.log('Creating event:', {
                  eventName,
                  eventDate,
                  eventTime,
                  eventLocation,
                });
                setIsEventModalOpen(false);
              }}
            >
              Create Event
            </HiveButton>
            <HiveButton
              variant="outline"
              onClick={() => setIsEventModalOpen(false)}
            >
              Cancel
            </HiveButton>
          </div>
        </div>
      </HiveModal>

      <HiveModal
        isOpen={isQRModalOpen}
        onClose={() => setIsQRModalOpen(false)}
        title="QR Code Check-In"
        size="md"
      >
        <div className="text-center space-y-6">
          <motion.div
            className="w-64 h-64 bg-hiveYellow/10 rounded-2xl mx-auto flex items-center justify-center"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 200 }}
          >
            <QrCode className="w-48 h-48 text-hiveYellow" />
          </motion.div>
          <p className="text-hiveGray">
            Scan this QR code to check in volunteers at your event
          </p>
          <div className="flex gap-2">
            <HiveButton className="flex-1">
              <Download className="w-4 h-4 mr-2" />
              Download QR Code
            </HiveButton>
            <HiveButton variant="outline" onClick={() => setIsQRModalOpen(false)}>
              Close
            </HiveButton>
          </div>
        </div>
      </HiveModal>

      <HiveModal
        isOpen={isNotificationModalOpen}
        onClose={() => setIsNotificationModalOpen(false)}
        title="Send Notification"
        size="md"
      >
        <div className="space-y-4">
          <HiveInput label="Subject" placeholder="Enter notification subject" />
          <div>
            <label className="block text-sm font-medium text-hiveGray-dark mb-2">
              Message
            </label>
            <textarea
              className="w-full px-4 py-3 rounded-lg border-2 border-hiveGray-light focus:border-hiveYellow focus:ring-2 focus:ring-hiveYellow focus:ring-opacity-30 focus:outline-none transition-all"
              rows={4}
              placeholder="Enter your message"
            />
          </div>
          <div className="flex gap-2 pt-4">
            <HiveButton
              className="flex-1"
              onClick={() => {
                console.log('Sending notification');
                setIsNotificationModalOpen(false);
              }}
            >
              <Bell className="w-4 h-4 mr-2" />
              Send Notification
            </HiveButton>
            <HiveButton
              variant="outline"
              onClick={() => setIsNotificationModalOpen(false)}
            >
              Cancel
            </HiveButton>
          </div>
        </div>
      </HiveModal>
    </DashboardLayout>
  );
}
