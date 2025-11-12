'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  Calendar,
  Clock,
  MapPin,
  Users,
  Plus,
  Search,
  Filter,
  UserPlus,
  X,
  Eye,
  Play,
  StopCircle,
} from 'lucide-react';
import { useOrganization } from '@/contexts/OrganizationContext';
import { useAuth } from '@/contexts/AuthContext';
import { eventService } from '@/lib/services';
import { supabase } from '@/lib/supabase';
import { Event as SupabaseEvent } from '@/lib/types';
import HiveCard from '@/components/common/HiveCard';
import HiveButton from '@/components/common/HiveButton';
import HiveInput from '@/components/common/HiveInput';
import HiveModal from '@/components/common/HiveModal';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

interface Event {
  id: string;
  title: string;
  date: string;
  time: string;
  location: string;
  description: string;
  attendees: number;
  maxAttendees: number;
  status: 'upcoming' | 'ongoing' | 'completed';
  hours?: number;
}

export default function EventsPageClient() {
  const { selectedOrg, isAdmin } = useOrganization();
  const { user } = useAuth();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'upcoming' | 'completed'>('all');
  const [selectedEvent, setSelectedEvent] = useState<string | null>(null);
  const [isAttendeeModalOpen, setIsAttendeeModalOpen] = useState(false);
  const [events, setEvents] = useState<Event[]>([]);
  const [attendees, setAttendees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [userJoinedEvents, setUserJoinedEvents] = useState<Set<string>>(new Set());
  const [signingUp, setSigningUp] = useState<string | null>(null);
  const [updatingEventId, setUpdatingEventId] = useState<string | null>(null);

  const loadEvents = useCallback(async () => {
    if (!selectedOrg) return;

    try {
      setLoading(true);
      console.log('[EventsPage] Loading events for org:', selectedOrg.id);
      console.log('[EventsPage] Current user:', user?.id);
      
      const supabaseEvents = await eventService.getByOrganization(selectedOrg.id);
      console.log('[EventsPage] ✅ Loaded events from Supabase:', supabaseEvents);
      console.log('[EventsPage] Event count:', supabaseEvents.length);
      
      // Log role filtering info
      supabaseEvents.forEach(event => {
        console.log(`[EventsPage] Event "${event.title}":`, {
          allowed_roles: event.allowed_roles || 'none (everyone can see)',
          status: event.status
        });
      });
      const convertedEvents: Event[] = supabaseEvents.map(event => {
        console.log(`[EventsPage] Event ${event.title}: signup_count=${event.signup_count}, max_attendees=${event.max_attendees}`);
        return {
          id: event.id,
          title: event.title,
          date: event.date,
          time: `${event.time}${event.end_time ? ` - ${event.end_time}` : ''}`,
          location: event.location || '',
          description: event.description,
          attendees: event.signup_count || 0,
          maxAttendees: event.max_attendees || 0,
          status: event.status === 'completed' ? 'completed' : 
                  event.status === 'in_progress' ? 'ongoing' : 'upcoming',
          hours: 0,
        };
      });
      setEvents(convertedEvents);

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
      console.error('Error loading events:', error);
    } finally {
      setLoading(false);
    }
  }, [selectedOrg, user]);

  useEffect(() => {
    loadEvents();
  }, [loadEvents]);

  // Realtime updates for event changes
  useEffect(() => {
    if (!selectedOrg) return;

    const channel = supabase
      .channel(`events-${selectedOrg.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'events', filter: `organization_id=eq.${selectedOrg.id}` }, () => {
        loadEvents();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'event_attendees' }, () => {
        loadEvents();
      })
      .subscribe();

    return () => {
      try {
        supabase.removeChannel(channel);
      } catch (_) {
        // ignore
      }
    };
  }, [selectedOrg, loadEvents]);

  const loadAttendees = async (eventId: string) => {
    try {
      console.log('Loading attendees for event:', eventId);
      
      // First, get the attendee records
      const { data: attendeesData, error: attendeesError } = await supabase
        .from('event_attendees')
        .select('*')
        .eq('event_id', eventId);
      
      console.log('Attendees data:', attendeesData);
      console.log('Attendees error:', attendeesError);
      
      if (attendeesError) {
        console.error('Error fetching attendees:', attendeesError);
        throw attendeesError;
      }
      
      if (!attendeesData || attendeesData.length === 0) {
        console.log('No attendees found');
        return [];
      }
      
      // Get user IDs
      const userIds = attendeesData.map((a: any) => a.user_id);
      console.log('User IDs:', userIds);
      
      // Fetch user details
      const { data: usersData, error: usersError } = await supabase
        .from('users')
        .select('id, name, email, avatar_url')
        .in('id', userIds);
      
      console.log('Users data:', usersData);
      console.log('Users error:', usersError);
      
      if (usersError) {
        console.error('Error fetching users:', usersError);
        throw usersError;
      }
      
      // Combine data
      const combined = attendeesData.map((attendee: any) => ({
        ...attendee,
        user: usersData?.find((u: any) => u.id === attendee.user_id)
      }));
      
      console.log('Combined data:', combined);
      return combined;
    } catch (error) {
      console.error('Error loading attendees:', error);
      return [];
    }
  };

  const handleRegisterForEvent = async (eventId: string) => {
    if (!user) {
      alert('Please log in to register for events');
      return;
    }

    try {
      setSigningUp(eventId);
      await eventService.joinEvent(eventId, user.id);
      
      // Add to joined events set
      setUserJoinedEvents(prev => new Set(prev).add(eventId));
      
      // Refresh events to update attendee count
      await loadEvents();
      
      alert('Successfully registered for event!');
    } catch (error: any) {
      console.error('Error registering for event:', error);
      alert(error.message || 'Failed to register for event');
    } finally {
      setSigningUp(null);
    }
  };

  const handleViewAttendees = async (eventId: string) => {
    console.log('handleViewAttendees called for event:', eventId);
    setSelectedEvent(eventId);
    setIsAttendeeModalOpen(true);
    const attendeesData = await loadAttendees(eventId);
    console.log('Setting attendees state:', attendeesData);
    setAttendees(attendeesData);
  };

  const handleStartEvent = async (eventId: string) => {
    if (!user || !selectedOrg || !isAdmin) return;
    try {
      setUpdatingEventId(eventId);
      await eventService.startEvent(eventId);
      await loadEvents();
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
      await loadEvents();
    } catch (error) {
      console.error('Error ending event:', error);
    } finally {
      setUpdatingEventId(null);
    }
  };

  const filteredEvents = events.filter((event) => {
    const matchesSearch = event.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = filterStatus === 'all' || event.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'upcoming':
        return 'bg-blue-100 text-blue-700';
      case 'ongoing':
        return 'bg-green-100 text-green-700';
      case 'completed':
        return 'bg-hiveGray-light text-hiveGray';
      default:
        return 'bg-hiveGray-light text-hiveGray';
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-center min-h-96">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-hiveYellow border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-hiveGray">Loading events...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold text-hiveGray-dark mb-2">Events</h1>
            <p className="text-hiveGray">Manage and track organization events</p>
          </div>
          {isAdmin && selectedOrg && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
            >
              <Link href={`/organizations/${selectedOrg.id}/events/create`}>
                <motion.div
                  className="relative group cursor-pointer"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <div className="flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 text-white rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300">
                    <div className="relative">
                      <Plus className="w-5 h-5" />
                      <div className="absolute inset-0 bg-white rounded-full opacity-0 group-hover:opacity-20 animate-ping"></div>
                    </div>
                    <span className="font-bold text-sm">Create Event</span>
                    <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-xl blur-lg opacity-0 group-hover:opacity-30 transition-opacity duration-300 -z-10"></div>
                </motion.div>
              </Link>
            </motion.div>
          )}
        </div>

        <HiveCard className="mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-hiveGray w-5 h-5 pointer-events-none" />
              <HiveInput
                type="text"
                placeholder="Search events..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="w-5 h-5 text-hiveGray" />
              <div className="flex gap-2">
                {['all', 'upcoming', 'completed'].map((status) => (
                  <button
                    key={status}
                    onClick={() => setFilterStatus(status as typeof filterStatus)}
                    className={`px-4 py-2 rounded-lg font-medium capitalize transition-all ${
                      filterStatus === status
                        ? 'bg-hiveYellow text-hiveGray-dark'
                        : 'bg-hiveGray-light text-hiveGray hover:bg-hiveGray-light/80'
                    }`}
                  >
                    {status}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </HiveCard>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredEvents.map((event, index) => (
            <motion.div
              key={event.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
            >
              <HiveCard 
                className="h-full hover:shadow-hive-hover transition-shadow"
                onClick={() => router.push(`/organizations/${selectedOrg?.id}/events/${event.id}`)}
              >
                <div className="flex items-start justify-between mb-4">
                  <h3 className="text-xl font-bold text-hiveGray-dark flex-1">
                    {event.title}
                  </h3>
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold capitalize ${getStatusColor(event.status)}`}>
                    {event.status}
                  </span>
                </div>

                <p className="text-hiveGray mb-4">{event.description}</p>

                <div className="space-y-2 mb-4">
                  <div className="flex items-center gap-2 text-hiveGray">
                    <Calendar className="w-4 h-4 text-hiveYellow" />
                    <span className="text-sm">{event.date}</span>
                  </div>
                  <div className="flex items-center gap-2 text-hiveGray">
                    <Clock className="w-4 h-4 text-hiveYellow" />
                    <span className="text-sm">{event.time}</span>
                    {event.hours && (
                      <span className="text-sm text-hiveGray">({event.hours} hours)</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-hiveGray">
                    <MapPin className="w-4 h-4 text-hiveYellow" />
                    <span className="text-sm">{event.location}</span>
                  </div>
                </div>

                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2 text-hiveGray">
                      <Users className="w-4 h-4 text-hiveYellow" />
                      <span className="text-sm font-medium">
                        {event.attendees} / {event.maxAttendees} registered
                      </span>
                    </div>
                    <span className="text-sm text-hiveGray">
                      {event.maxAttendees > 0 ? Math.round((event.attendees / event.maxAttendees) * 100) : 0}%
                    </span>
                  </div>
                  <div className="w-full bg-hiveGray-light rounded-full h-2">
                    <div
                      className="bg-hiveYellow h-2 rounded-full transition-all"
                      style={{
                        width: `${event.maxAttendees > 0 ? (event.attendees / event.maxAttendees) * 100 : 0}%`,
                      }}
                    />
                  </div>
                </div>

                <div className="flex gap-2">
                  <HiveButton
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={(e) => { e.stopPropagation(); handleViewAttendees(event.id); }}
                  >
                    <Users className="w-4 h-4 mr-2" />
                    View Attendees
                  </HiveButton>
                  <Link href={`/organizations/${selectedOrg?.id}/events/${event.id}`}>
                    <HiveButton
                      variant="ghost"
                      size="sm"
                      className="flex-1"
                      onClick={(e) => { e.stopPropagation(); }}
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      Event Details
                    </HiveButton>
                  </Link>
                  {isAdmin && event.status === 'upcoming' && (
                    <HiveButton
                      size="sm"
                      className="flex-1"
                      onClick={(e) => { e.stopPropagation(); handleStartEvent(event.id); }}
                      disabled={updatingEventId === event.id}
                    >
                      <Play className="w-4 h-4 mr-2" />
                      {updatingEventId === event.id ? 'Starting...' : 'Start Event'}
                    </HiveButton>
                  )}
                  {event.status === 'upcoming' && (
                    userJoinedEvents.has(event.id) ? (
                      <HiveButton 
                        variant="secondary"
                        size="sm" 
                        className="flex-1"
                        disabled
                        onClick={(e) => { e.stopPropagation(); }}
                      >
                        <Users className="w-4 h-4 mr-2" />
                        Joined
                      </HiveButton>
                    ) : event.attendees >= event.maxAttendees ? (
                      <HiveButton 
                        variant="secondary"
                        size="sm" 
                        className="flex-1 !bg-red-100 !text-red-700"
                        disabled
                        onClick={(e) => { e.stopPropagation(); }}
                      >
                        Event Full
                      </HiveButton>
                    ) : (
                      <HiveButton 
                        size="sm" 
                        className="flex-1"
                        onClick={(e) => { e.stopPropagation(); handleRegisterForEvent(event.id); }}
                        disabled={signingUp === event.id}
                      >
                        <UserPlus className="w-4 h-4 mr-2" />
                        {signingUp === event.id ? 'Signing Up...' : 'Sign Up'}
                      </HiveButton>
                    )
                  )}
                  {event.status === 'ongoing' && (
                    isAdmin ? (
                      <HiveButton 
                        variant="secondary"
                        size="sm" 
                        className="flex-1"
                        onClick={(e) => { e.stopPropagation(); handleEndEvent(event.id); }}
                        disabled={updatingEventId === event.id}
                      >
                        <StopCircle className="w-4 h-4 mr-2" />
                        {updatingEventId === event.id ? 'Ending...' : 'End Event'}
                      </HiveButton>
                    ) : (
                      <HiveButton 
                        variant="secondary"
                        size="sm" 
                        className="flex-1"
                        disabled
                        onClick={(e) => { e.stopPropagation(); }}
                      >
                        Event Started
                      </HiveButton>
                    )
                  )}
                </div>
              </HiveCard>
            </motion.div>
          ))}
        </div>

        {filteredEvents.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-16"
          >
            <Calendar className="w-16 h-16 text-hiveGray mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-hiveGray-dark mb-2">
              No events found
            </h3>
            <p className="text-hiveGray mb-4">
              {searchQuery || filterStatus !== 'all' 
                ? 'Try adjusting your search or filter criteria'
                : 'No events have been created yet'
              }
            </p>
            {isAdmin && selectedOrg && (
              <Link href={`/organizations/${selectedOrg.id}/events/create`}>
                <HiveButton>
                  <Plus className="w-5 h-5 mr-2" />
                  Create First Event
                </HiveButton>
              </Link>
            )}
          </motion.div>
        )}
      </motion.div>

      <HiveModal
        isOpen={isAttendeeModalOpen}
        onClose={() => {
          setIsAttendeeModalOpen(false);
          setSelectedEvent(null);
        }}
        title="Event Attendees"
        size="lg"
      >
        {selectedEvent && (
          <div>
            <div className="mb-6">
              <h3 className="font-bold text-lg text-hiveGray-dark mb-1">
                {events.find(e => e.id === selectedEvent)?.title}
              </h3>
              <p className="text-sm text-hiveGray">
                {attendees.length} registered attendees
              </p>
            </div>

            <div className="mb-4">
              <HiveInput
                type="text"
                placeholder="Search attendees..."
                className="w-full"
              />
            </div>

            <div className="space-y-2 max-h-96 overflow-y-auto">
              {attendees.length === 0 ? (
                <div className="text-center py-8 text-hiveGray">
                  <Users className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>No attendees yet</p>
                </div>
              ) : (
                attendees.map((attendee: any, index) => (
                <motion.div
                  key={attendee.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="flex items-center justify-between p-3 rounded-lg border-2 border-hiveGray-light hover:border-hiveYellow transition-all"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-hiveYellow rounded-lg flex items-center justify-center">
                      {attendee.user?.avatar_url ? (
                        <Image
                          src={attendee.user.avatar_url}
                          alt={attendee.user.name || 'Attendee avatar'}
                          width={40}
                          height={40}
                          className="w-full h-full rounded-lg object-cover"
                        />
                      ) : (
                        <span className="text-lg font-bold text-hiveGray-dark">
                          {attendee.user?.name?.charAt(0) || 'U'}
                        </span>
                      )}
                    </div>
                    <div>
                      <p className="font-semibold text-hiveGray-dark">
                        {attendee.user?.name || 'Unknown User'}
                      </p>
                      <p className="text-sm text-hiveGray">
                        {attendee.user?.email || 'No email'}
                      </p>
                      <p className="text-xs text-hiveGray mt-1">
                        Registered: {new Date(attendee.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <span
                        className={`px-2 py-1 rounded text-xs font-semibold ${
                          attendee.status === 'confirmed'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-yellow-100 text-yellow-700'
                        }`}
                      >
                        {attendee.status}
                      </span>
                    </div>
                    {isAdmin && (
                      <button className="p-2 hover:bg-red-100 rounded-lg transition-colors">
                        <X className="w-4 h-4 text-red-500" />
                      </button>
                    )}
                  </div>
                </motion.div>
              ))
              )}
            </div>

            {isAdmin && (
              <div className="mt-6 pt-4 border-t border-hiveGray-light">
                <HiveButton className="w-full">
                  <UserPlus className="w-4 h-4 mr-2" />
                  Add Attendee
                </HiveButton>
              </div>
            )}
          </div>
        )}
      </HiveModal>
    </div>
  );
}