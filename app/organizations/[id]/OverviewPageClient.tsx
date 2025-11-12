'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  Calendar,
  Users,
  Clock,
  TrendingUp,
  CheckCircle2,
  BarChart3,
  Settings,
  FolderOpen,
  UserPlus,
} from 'lucide-react';
import { useOrganization } from '@/contexts/OrganizationContext';
import { useAuth } from '@/contexts/AuthContext';
import { usePermissions } from '@/components/common/ProtectedRoute';
import { useRouter } from 'next/navigation';
import { eventService, organizationService } from '@/lib/services';
import { supabase } from '@/lib/supabase';
import HiveButton from '@/components/common/HiveButton';
import HiveCard from '@/components/common/HiveCard';

export default function OverviewPageClient() {
  const { selectedOrg, isAdmin, canCreateEvents } = useOrganization();
  const { user } = useAuth();
  const { isSuperAdmin } = usePermissions();
  const router = useRouter();
  const [stats, setStats] = useState({
    members: 0,
    upcomingEvents: 0,
    completedEvents: 0,
    totalHours: 0,
  });
  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState<any[]>([]);
  const [signingUp, setSigningUp] = useState<string | null>(null);
  const [userJoinedEvents, setUserJoinedEvents] = useState<Set<string>>(new Set());
  const [updatingEventId, setUpdatingEventId] = useState<string | null>(null);

  const loadStats = useCallback(async () => {
    if (!selectedOrg) return;

    try {
      setLoading(true);
      
      // Get member count
      const members = await organizationService.getMembers(selectedOrg.id);
      
      // Get events
      const orgEvents = await eventService.getByOrganization(selectedOrg.id);
      const upcomingEvents = orgEvents.filter(e => e.status === 'published' || e.status === 'in_progress').length;
      const completedEvents = orgEvents.filter(e => e.status === 'completed').length;

      setStats({
        members: members.length,
        upcomingEvents,
        completedEvents,
        totalHours: 0, // Could be calculated from volunteer hours
      });

      // Set events (upcoming only)
      const upcoming = orgEvents.filter(e => e.status === 'published' || e.status === 'in_progress');
      console.log('Upcoming events:', upcoming);
      setEvents(upcoming);

      // Load which events user has joined
      if (user) {
        const { data: userAttendances } = await supabase
          .from('event_attendees')
          .select('event_id')
          .eq('user_id', user.id);
        
        if (userAttendances) {
          setUserJoinedEvents(new Set(userAttendances.map((a: any) => a.event_id)));
        }
      }
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setLoading(false);
    }
  }, [selectedOrg, user]);

  useEffect(() => {
    if (selectedOrg) {
      loadStats();
    }
  }, [selectedOrg, loadStats]);

  const handleSignUp = async (eventId: string) => {
    if (!user) {
      alert('Please log in to register for events');
      return;
    }

    try {
      setSigningUp(eventId);
      await eventService.joinEvent(eventId, user.id);
      
      // Add to joined events set
      setUserJoinedEvents(prev => new Set(prev).add(eventId));
      
      // Refresh data
      await loadStats();
      
      alert('Successfully registered for event!');
    } catch (error: any) {
      console.error('Error registering for event:', error);
      alert(error.message || 'Failed to register for event');
    } finally {
      setSigningUp(null);
    }
  };

  const handleStartEvent = async (eventId: string) => {
    if (!user || !selectedOrg || !isAdmin) return;
    try {
      setUpdatingEventId(eventId);
      await eventService.startEvent(eventId);
      await loadStats();
    } catch (error) {
      console.error('Error starting event:', error);
    } finally {
      setUpdatingEventId(null);
    }
  };

  const handleEndEvent = async (eventId: string) => {
    if (!user || !selectedOrg || !isAdmin) return;
    try {
      setUpdatingEventId(eventId);
      await eventService.endEvent(eventId);
      await loadStats();
    } catch (error) {
      console.error('Error ending event:', error);
    } finally {
      setUpdatingEventId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-hiveYellow border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-hiveGray">Loading organization data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">{selectedOrg?.name}</h1>
        <p className="text-gray-600 mt-1">{selectedOrg?.description || 'Community Organization'}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <motion.div
          className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl shadow-lg border border-blue-200 p-6 relative overflow-hidden group"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          whileHover={{ y: -8, scale: 1.02 }}
        >
          <div className="absolute top-0 right-0 w-20 h-20 bg-blue-200 rounded-full blur-3xl opacity-50 group-hover:opacity-70 transition-opacity"></div>
          <div className="flex items-center gap-3 mb-4 relative z-10">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
              <Users className="w-6 h-6 text-white" />
            </div>
            <h3 className="font-bold text-gray-800">Members</h3>
          </div>
          <p className="text-4xl font-bold text-gray-900 relative z-10">{stats.members}</p>
          <p className="text-sm text-gray-600 mt-1 relative z-10">Active members</p>
        </motion.div>

        <motion.div
          className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-2xl shadow-lg border border-yellow-200 p-6 relative overflow-hidden group"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          whileHover={{ y: -8, scale: 1.02 }}
        >
          <div className="absolute top-0 right-0 w-20 h-20 bg-yellow-200 rounded-full blur-3xl opacity-50 group-hover:opacity-70 transition-opacity"></div>
          <div className="flex items-center gap-3 mb-4 relative z-10">
            <div className="w-12 h-12 bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-xl flex items-center justify-center shadow-lg">
              <Calendar className="w-6 h-6 text-white" />
            </div>
            <h3 className="font-bold text-gray-800">Events</h3>
          </div>
          <p className="text-4xl font-bold text-gray-900 relative z-10">{stats.upcomingEvents}</p>
          <p className="text-sm text-gray-600 mt-1 relative z-10">Upcoming events</p>
        </motion.div>

        <motion.div
          className="bg-gradient-to-br from-green-50 to-green-100 rounded-2xl shadow-lg border border-green-200 p-6 relative overflow-hidden group"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          whileHover={{ y: -8, scale: 1.02 }}
        >
          <div className="absolute top-0 right-0 w-20 h-20 bg-green-200 rounded-full blur-3xl opacity-50 group-hover:opacity-70 transition-opacity"></div>
          <div className="flex items-center gap-3 mb-4 relative z-10">
            <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center shadow-lg">
              <CheckCircle2 className="w-6 h-6 text-white" />
            </div>
            <h3 className="font-bold text-gray-800">Completed</h3>
          </div>
          <p className="text-4xl font-bold text-gray-900 relative z-10">{stats.completedEvents}</p>
          <p className="text-sm text-gray-600 mt-1 relative z-10">Past events</p>
        </motion.div>

        <motion.div
          className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-2xl shadow-lg border border-purple-200 p-6 relative overflow-hidden group"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          whileHover={{ y: -8, scale: 1.02 }}
        >
          <div className="absolute top-0 right-0 w-20 h-20 bg-purple-200 rounded-full blur-3xl opacity-50 group-hover:opacity-70 transition-opacity"></div>
          <div className="flex items-center gap-3 mb-4 relative z-10">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
              <Clock className="w-6 h-6 text-white" />
            </div>
            <h3 className="font-bold text-gray-800">Hours</h3>
          </div>
          <p className="text-4xl font-bold text-gray-900 relative z-10">{stats.totalHours}</p>
          <p className="text-sm text-gray-600 mt-1 relative z-10">Volunteer hours</p>
        </motion.div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <TrendingUp className="w-6 h-6 text-yellow-600" />
            <h2 className="text-xl font-bold text-gray-900">Quick Actions</h2>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <motion.button
            onClick={() => selectedOrg && router.push(`/organizations/${selectedOrg.id}/events`)}
            className="p-4 rounded-xl border-2 border-gray-200 hover:border-yellow-300 hover:bg-yellow-50 transition-all text-left"
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.98 }}
          >
            <Calendar className="w-8 h-8 text-yellow-600 mb-2" />
            <p className="font-semibold text-gray-900">View Events</p>
            <p className="text-xs text-gray-600 mt-1">See all events</p>
          </motion.button>

          <motion.button
            onClick={() => selectedOrg && router.push(`/organizations/${selectedOrg.id}/members`)}
            className="p-4 rounded-xl border-2 border-gray-200 hover:border-yellow-300 hover:bg-yellow-50 transition-all text-left"
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.98 }}
          >
            <Users className="w-8 h-8 text-yellow-600 mb-2" />
            <p className="font-semibold text-gray-900">Members</p>
            <p className="text-xs text-gray-600 mt-1">View all members</p>
          </motion.button>

          {/* Admin-only actions */}
          {canCreateEvents && (
            <motion.button
              onClick={() => selectedOrg && router.push(`/organizations/${selectedOrg.id}/events/create`)}
              className="relative p-4 rounded-xl border-2 border-blue-500 bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:from-blue-600 hover:to-purple-700 transition-all text-left group overflow-hidden"
              whileHover={{ y: -2, scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            >
              <div className="relative z-10">
                <div className="flex items-center gap-2 mb-2">
                  <UserPlus className="w-8 h-8 text-white" />
                  <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                </div>
                <p className="font-bold text-white text-lg">Create Event</p>
                <p className="text-xs text-blue-100 mt-1">Add new event</p>
              </div>
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-600 opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
              <div className="absolute -top-2 -right-2 w-4 h-4 bg-white rounded-full opacity-20 group-hover:opacity-40 transition-opacity duration-300"></div>
            </motion.button>
          )}

          {isAdmin && (
            <motion.button
              onClick={() => selectedOrg && router.push(`/organizations/${selectedOrg.id}/analytics`)}
              className="p-4 rounded-xl border-2 border-gray-200 hover:border-purple-300 hover:bg-purple-50 transition-all text-left"
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.98 }}
            >
              <BarChart3 className="w-8 h-8 text-purple-600 mb-2" />
              <p className="font-semibold text-gray-900">Analytics</p>
              <p className="text-xs text-gray-600 mt-1">View insights</p>
            </motion.button>
          )}

          {isAdmin && (
            <motion.button
              onClick={() => selectedOrg && router.push(`/organizations/${selectedOrg.id}/settings`)}
              className="p-4 rounded-xl border-2 border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-all text-left"
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.98 }}
            >
              <Settings className="w-8 h-8 text-blue-600 mb-2" />
              <p className="font-semibold text-gray-900">Settings</p>
              <p className="text-xs text-gray-600 mt-1">Manage organization</p>
            </motion.button>
          )}

        </div>
      </div>

      {/* Upcoming Events */}
      {events.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <Calendar className="w-6 h-6 text-yellow-600" />
              <h2 className="text-xl font-bold text-gray-900">Upcoming Events</h2>
            </div>
            <button
              onClick={() => selectedOrg && router.push(`/organizations/${selectedOrg.id}/events`)}
              className="text-sm text-yellow-600 hover:text-yellow-700 font-semibold"
            >
              View All
            </button>
          </div>
          <div className="space-y-3">
            {events.slice(0, 3).map((event) => (
              <motion.div
                key={event.id}
                className="flex items-center justify-between p-4 rounded-lg border-2 border-gray-200 hover:border-yellow-300 transition-all"
                whileHover={{ y: -2 }}
              >
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900">{event.title}</h3>
                  <p className="text-sm text-gray-600 mt-1">{event.description}</p>
                  <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {new Date(event.date).toLocaleDateString()}
                    </span>
                    {event.location && (
                      <span className="flex items-center gap-1">
                        <FolderOpen className="w-3 h-3" />
                        {event.location}
                      </span>
                    )}
                  </div>
                </div>
                <div className="ml-4 flex items-center gap-2">
                  {userJoinedEvents.has(event.id) ? (
                    <button
                      disabled
                      className="px-4 py-2 bg-green-100 text-green-700 rounded-lg font-semibold text-sm cursor-not-allowed"
                    >
                      <UserPlus className="w-4 h-4 inline mr-2" />
                      Joined
                    </button>
                  ) : event.status === 'completed' ? (
                    <button
                      disabled
                      className="px-4 py-2 bg-gray-300 text-gray-600 rounded-lg font-semibold text-sm cursor-not-allowed"
                    >
                      Event Ended
                    </button>
                  ) : event.status === 'ongoing' || event.status === 'in_progress' ? (
                    <button
                      onClick={isAdmin ? () => handleEndEvent(event.id) : undefined}
                      disabled={!isAdmin || updatingEventId === event.id}
                      className={`px-4 py-2 rounded-lg font-semibold text-sm ${isAdmin ? 'bg-gray-800 text-white hover:bg-black transition-colors' : 'bg-gray-300 text-gray-600 cursor-not-allowed'}`}
                    >
                      {isAdmin ? (updatingEventId === event.id ? 'Ending...' : 'End Event') : 'Event Started'}
                    </button>
                  ) : event.signup_count >= event.max_attendees ? (
                    <button
                      disabled
                      className="px-4 py-2 bg-red-100 text-red-700 rounded-lg font-semibold text-sm cursor-not-allowed"
                    >
                      Event Full
                    </button>
                  ) : (
                    <button
                      onClick={() => handleSignUp(event.id)}
                      disabled={signingUp === event.id}
                      className="px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors font-semibold text-sm disabled:opacity-50"
                    >
                      {signingUp === event.id ? (
                        'Signing Up...'
                      ) : (
                        <>
                          <UserPlus className="w-4 h-4 inline mr-2" />
                          Sign Up
                        </>
                      )}
                    </button>
                  )}
                  {isAdmin && (event.status === 'published' || event.status === 'upcoming') && (
                    <button
                      onClick={() => handleStartEvent(event.id)}
                      disabled={updatingEventId === event.id}
                      className="px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-black transition-colors font-semibold text-sm disabled:opacity-50"
                    >
                      {updatingEventId === event.id ? 'Starting...' : 'Start Event'}
                    </button>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      <div className="bg-gradient-to-br from-yellow-50 to-white rounded-xl shadow-sm border border-yellow-200 p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-3">Welcome to {selectedOrg?.name}!</h2>
        <p className="text-gray-700 mb-4">
          You&apos;re now a {selectedOrg?.role || selectedOrg?.userRole || 'member'} of this organization. Use the quick actions above or the sidebar to navigate through different sections.
        </p>
        <div className="flex gap-3">
          <button
            onClick={() => selectedOrg && router.push(`/organizations/${selectedOrg.id}/events`)}
            className="px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors font-semibold"
          >
            Browse Events
          </button>
          {isAdmin && (
            <button
              onClick={() => selectedOrg && router.push(`/organizations/${selectedOrg.id}/settings`)}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-semibold flex items-center gap-2"
            >
              <Settings className="w-4 h-4" />
              Organization Settings
            </button>
          )}
        </div>
      </div>
    </div>
  );
}