'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Calendar,
  Bell,
  Users,
  Clock,
  MapPin,
  TrendingUp,
  CheckCircle2,
  AlertTriangle,
  Info,
  ArrowRight,
} from 'lucide-react';
import { useOrganization } from '@/contexts/OrganizationContext';
import { useRouter } from 'next/navigation';

export default function OrganizationPageClient() {
  const { selectedOrg } = useOrganization();
  const router = useRouter();

  const getPriorityConfig = (priority: string) => {
    switch (priority) {
      case 'high':
        return {
          icon: AlertTriangle,
          color: 'bg-red-50 border-red-200 text-red-700',
          iconColor: 'text-red-600',
        };
      case 'medium':
        return {
          icon: Info,
          color: 'bg-yellow-50 border-yellow-200 text-yellow-700',
          iconColor: 'text-yellow-600',
        };
      case 'low':
        return {
          icon: Bell,
          color: 'bg-blue-50 border-blue-200 text-blue-700',
          iconColor: 'text-blue-600',
        };
      default:
        return {
          icon: Info,
          color: 'bg-gray-50 border-gray-200 text-gray-700',
          iconColor: 'text-gray-600',
        };
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">{selectedOrg?.name}</h1>
        <p className="text-gray-600 mt-1">Organization</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <motion.div
          className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
          whileHover={{ y: -2 }}
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
              <Users className="w-5 h-5 text-yellow-600" />
            </div>
            <h3 className="font-semibold text-gray-900">Members</h3>
          </div>
          <p className="text-3xl font-bold text-gray-900">{selectedOrg?.members || 0}</p>
          <p className="text-sm text-gray-600 mt-1">Active members</p>
        </motion.div>

        <motion.div
          className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
          whileHover={{ y: -2 }}
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
              <Calendar className="w-5 h-5 text-yellow-600" />
            </div>
            <h3 className="font-semibold text-gray-900">Events</h3>
          </div>
          <p className="text-3xl font-bold text-gray-900">{selectedOrg?.stats?.upcomingEvents || 0}</p>
          <p className="text-sm text-gray-600 mt-1">Upcoming events</p>
        </motion.div>

        <motion.div
          className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
          whileHover={{ y: -2 }}
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5 text-green-600" />
            </div>
            <h3 className="font-semibold text-gray-900">Completed</h3>
          </div>
          <p className="text-3xl font-bold text-gray-900">{selectedOrg?.stats?.completedEvents || 0}</p>
          <p className="text-sm text-gray-600 mt-1">Past events</p>
        </motion.div>

        <motion.div
          className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
          whileHover={{ y: -2 }}
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
              <Clock className="w-5 h-5 text-yellow-600" />
            </div>
            <h3 className="font-semibold text-gray-900">Hours</h3>
          </div>
          <p className="text-3xl font-bold text-gray-900">{selectedOrg?.stats?.totalHours || 0}</p>
          <p className="text-sm text-gray-600 mt-1">Volunteer hours</p>
        </motion.div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <TrendingUp className="w-6 h-6 text-yellow-600" />
            <h2 className="text-xl font-bold text-gray-900">Monthly Progress</h2>
          </div>
          <span className="text-sm font-semibold text-gray-700">68% of goal reached</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
          <motion.div
            className="bg-gradient-to-r from-yellow-400 to-yellow-500 h-4 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: '68%' }}
            transition={{ duration: 1, ease: 'easeOut' }}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                <Calendar className="w-5 h-5 text-yellow-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-900">Upcoming Events</h2>
            </div>
            <motion.button
              onClick={() => selectedOrg && router.push(`/organizations/${selectedOrg.id}/events`)}
              className="text-sm text-yellow-600 hover:text-yellow-700 font-semibold flex items-center gap-1"
              whileHover={{ x: 2 }}
            >
              View All
              <ArrowRight className="w-4 h-4" />
            </motion.button>
          </div>
          <div className="space-y-3">
            {selectedOrg?.events?.slice(0, 3).map((event: any, index: number) => (
              <motion.div
                key={event.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="p-4 rounded-xl border border-gray-200 hover:border-yellow-300 hover:bg-yellow-50/30 transition-all cursor-pointer"
                onClick={() => selectedOrg && router.push(`/organizations/${selectedOrg.id}/events`)}
              >
                <h3 className="font-semibold text-gray-900 mb-2">{event.title}</h3>
                <div className="flex flex-wrap gap-3 text-sm text-gray-600">
                  <div className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    <span>{event.date}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    <span>{event.time}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <MapPin className="w-4 h-4" />
                    <span>{event.location}</span>
                  </div>
                </div>
                <div className="mt-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-gray-500" />
                    <span className="text-sm text-gray-600">
                      {event.attendees} / {event.maxAttendees} registered
                    </span>
                  </div>
                  <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                    event.status === 'upcoming' ? 'bg-green-100 text-green-700' :
                    event.status === 'ongoing' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-gray-100 text-gray-700'
                  }`}>
                    {event.status}
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                <Bell className="w-5 h-5 text-yellow-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-900">Announcements</h2>
            </div>
          </div>
          <div className="space-y-3">
            {selectedOrg?.announcements?.map((announcement: any, index: number) => {
              const config = getPriorityConfig(announcement.priority);
              const IconComponent = config.icon;

              return (
                <motion.div
                  key={announcement.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className={`p-4 rounded-xl border-2 ${config.color} transition-all`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${config.iconColor} bg-white/50`}>
                      <IconComponent className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="font-semibold text-gray-900">{announcement.title}</h3>
                        <span className="px-2 py-0.5 bg-white rounded text-xs font-bold capitalize whitespace-nowrap ml-2">
                          {announcement.priority}
                        </span>
                      </div>
                      <p className="text-sm text-gray-700 mb-2">{announcement.content}</p>
                      <div className="flex items-center justify-between text-xs text-gray-600">
                        <span>{announcement.author}</span>
                        <span>{announcement.date}</span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <motion.button
            onClick={() => selectedOrg && router.push(`/organizations/${selectedOrg.id}/events`)}
            className="p-4 rounded-xl border-2 border-gray-200 hover:border-yellow-300 hover:bg-yellow-50 transition-all text-left"
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.98 }}
          >
            <Calendar className="w-8 h-8 text-yellow-600 mb-2" />
            <p className="font-semibold text-gray-900">View Events</p>
            <p className="text-xs text-gray-600 mt-1">See all upcoming events</p>
          </motion.button>

          <motion.button
            onClick={() => selectedOrg && router.push(`/organizations/${selectedOrg.id}/members`)}
            className="p-4 rounded-xl border-2 border-gray-200 hover:border-yellow-300 hover:bg-yellow-50 transition-all text-left"
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.98 }}
          >
            <Users className="w-8 h-8 text-yellow-600 mb-2" />
            <p className="font-semibold text-gray-900">Manage Members</p>
            <p className="text-xs text-gray-600 mt-1">View all members</p>
          </motion.button>

          <motion.button
            onClick={() => selectedOrg && router.push(`/organizations/${selectedOrg.id}/hours`)}
            className="p-4 rounded-xl border-2 border-gray-200 hover:border-yellow-300 hover:bg-yellow-50 transition-all text-left"
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.98 }}
          >
            <Clock className="w-8 h-8 text-yellow-600 mb-2" />
            <p className="font-semibold text-gray-900">Log Hours</p>
            <p className="text-xs text-gray-600 mt-1">Track volunteer time</p>
          </motion.button>

          <motion.button
            onClick={() => selectedOrg && router.push(`/organizations/${selectedOrg.id}/analytics`)}
            className="p-4 rounded-xl border-2 border-gray-200 hover:border-yellow-300 hover:bg-yellow-50 transition-all text-left"
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.98 }}
          >
            <TrendingUp className="w-8 h-8 text-yellow-600 mb-2" />
            <p className="font-semibold text-gray-900">View Analytics</p>
            <p className="text-xs text-gray-600 mt-1">See detailed stats</p>
          </motion.button>
        </div>
      </div>
    </div>
  );
}
