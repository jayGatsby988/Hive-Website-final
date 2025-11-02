'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Calendar as CalendarIcon,
  Award,
  TrendingUp,
  Clock,
  ChevronLeft,
  ChevronRight,
  MapPin,
  Users,
  Mail,
  Globe,
  History,
} from 'lucide-react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import StatCard from '@/components/dashboard/StatCard';
import HiveCard from '@/components/common/HiveCard';
import HiveButton from '@/components/common/HiveButton';
import HiveModal from '@/components/common/HiveModal';
import { useOrganization } from '@/contexts/OrganizationContext';
import { useAuth } from '@/contexts/AuthContext';
import { usePermissions } from '@/components/common/ProtectedRoute';
import { eventService, volunteerHoursService } from '@/lib/services';
import { Event as SupabaseEvent, VolunteerHours } from '@/lib/types';

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

export default function UserDashboard() {
  const { selectedOrg, organizations, isAdmin } = useOrganization();
  const { user } = useAuth();
  const { isSuperAdmin } = usePermissions();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [events, setEvents] = useState<Event[]>([]);
  const [volunteerHours, setVolunteerHours] = useState<VolunteerHours[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Redirect admins to admin dashboard
    if (isAdmin && !isSuperAdmin) {
      window.location.href = '/dashboard/admin'
      return
    }
    
    // Redirect super admins to super admin dashboard
    if (isSuperAdmin) {
      window.location.href = '/super-admin'
      return
    }
    
    loadDashboardData();
  }, [user, isAdmin, isSuperAdmin]);

  const loadDashboardData = async () => {
    if (!user) return;

    try {
      setLoading(true);
      
      // Load events from user's organizations only
      const allEvents = await eventService.getUserOrganizationEvents(user.id);
      const convertedEvents: Event[] = allEvents.map(event => ({
        id: event.id,
        title: event.title,
        date: event.date,
        time: `${event.time}${event.end_time ? ` - ${event.end_time}` : ''}`,
        location: event.location || '',
        description: event.description,
        attendees: event.signup_count,
        maxAttendees: event.max_attendees,
        status: event.status === 'completed' ? 'completed' : 
                event.status === 'in_progress' ? 'ongoing' : 'upcoming',
        hours: 0, // This would need to be calculated
      }));
      setEvents(convertedEvents);

      // Load volunteer hours
      const hours = await volunteerHoursService.getUserHours(user.id);
      setVolunteerHours(hours);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const totalHours = volunteerHours.reduce((sum, hour) => sum + hour.hours, 0);
  const thisMonthHours = volunteerHours
    .filter(hour => {
      const hourDate = new Date(hour.date);
      const now = new Date();
      return hourDate.getMonth() === now.getMonth() && 
             hourDate.getFullYear() === now.getFullYear();
    })
    .reduce((sum, hour) => sum + hour.hours, 0);

  const stats = [
    {
      title: 'Events Attended',
      value: volunteerHours.length,
      icon: CalendarIcon,
      trend: { value: 8, isPositive: true },
    },
    {
      title: 'Hours Volunteered',
      value: totalHours,
      icon: Clock,
      trend: { value: 12, isPositive: true },
    },
    {
      title: 'Impact Score',
      value: '92%',
      icon: Award,
      trend: { value: 5, isPositive: true },
    },
  ];

  const upcomingEvents = events.filter(e => e.status === 'upcoming').slice(0, 5);

  const daysInMonth = new Date(
    currentDate.getFullYear(),
    currentDate.getMonth() + 1,
    0
  ).getDate();
  const firstDayOfMonth = new Date(
    currentDate.getFullYear(),
    currentDate.getMonth(),
    1
  ).getDay();

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const today = new Date().getDate();
  const isCurrentMonth =
    currentDate.getMonth() === new Date().getMonth() &&
    currentDate.getFullYear() === new Date().getFullYear();

  const getEventsForDay = (day: number, month: number, year: number): Event[] => {
    return events.filter(event => {
      const eventDate = new Date(event.date);
      return eventDate.getDate() === day && 
             eventDate.getMonth() === month && 
             eventDate.getFullYear() === year;
    });
  };

  const hasEventOnDay = (day: number, month: number, year: number): boolean => {
    return getEventsForDay(day, month, year).length > 0;
  };

  const handleDayClick = (day: number) => {
    const dayEvents = getEventsForDay(day, currentDate.getMonth(), currentDate.getFullYear());
    if (dayEvents.length > 0) {
      setSelectedEvent(dayEvents[0]);
    }
  };

  const handleEventRegistration = async (eventId: string) => {
    if (!user) return;
    
    try {
      await eventService.joinEvent(eventId, user.id);
      // Refresh events to update attendee count
      await loadDashboardData();
    } catch (error) {
      console.error('Error registering for event:', error);
    }
  };

  if (loading) {
    return (
      <DashboardLayout userRole="user">
        <div className="flex items-center justify-center min-h-96">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-hiveYellow border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-hiveGray">Loading dashboard...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout userRole="user">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="mb-8"
      >
        <h1 className="text-4xl font-bold text-hiveGray-dark mb-2">Dashboard</h1>
        <p className="text-lg text-hiveGray">Welcome back! Here's your overview.</p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {stats.map((stat, index) => (
          <StatCard key={stat.title} {...stat} delay={index * 0.1} />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          <HiveCard hoverable={false}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-hiveGray-dark">Calendar</h2>
              <div className="flex items-center gap-2">
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={prevMonth}
                  className="p-2 rounded-lg hover:bg-hiveGray-light transition-colors"
                >
                  <ChevronLeft className="w-5 h-5 text-hiveGray" />
                </motion.button>
                <span className="text-lg font-semibold text-hiveGray-dark min-w-[150px] text-center">
                  {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
                </span>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={nextMonth}
                  className="p-2 rounded-lg hover:bg-hiveGray-light transition-colors"
                >
                  <ChevronRight className="w-5 h-5 text-hiveGray" />
                </motion.button>
              </div>
            </div>

            <div className="grid grid-cols-7 gap-2 mb-4">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                <div
                  key={day}
                  className="text-center text-sm font-semibold text-hiveGray py-2"
                >
                  {day}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-2">
              {Array.from({ length: firstDayOfMonth }).map((_, index) => (
                <div key={`empty-${index}`} className="aspect-square" />
              ))}

              {Array.from({ length: daysInMonth }).map((_, index) => {
                const day = index + 1;
                const isToday = isCurrentMonth && day === today;
                const hasEvent = hasEventOnDay(day, currentDate.getMonth(), currentDate.getFullYear());
                const dayEvents = getEventsForDay(day, currentDate.getMonth(), currentDate.getFullYear());

                return (
                  <motion.div
                    key={day}
                    className={`aspect-square flex items-center justify-center rounded-lg text-sm font-medium transition-all cursor-pointer relative ${
                      isToday
                        ? 'bg-hiveYellow text-hiveGray-dark font-bold'
                        : hasEvent
                        ? 'bg-hiveYellow/20 text-hiveYellow hover:bg-hiveYellow/30'
                        : 'hover:bg-hiveGray-light text-hiveGray'
                    }`}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleDayClick(day)}
                  >
                    {day}
                    {hasEvent && (
                      <div className="absolute bottom-1 flex gap-0.5">
                        {dayEvents.slice(0, 3).map((_, i) => (
                          <div key={i} className="w-1 h-1 bg-hiveYellow rounded-full" />
                        ))}
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </div>
          </HiveCard>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          <HiveCard hoverable={false}>
            <h2 className="text-2xl font-bold text-hiveGray-dark mb-6">
              Upcoming Events
            </h2>
            <div className="space-y-4 max-h-[400px] overflow-y-auto">
              {upcomingEvents.map((event, index) => (
                <motion.div
                  key={event.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 + index * 0.1 }}
                  className="p-4 rounded-lg border border-hiveGray-light hover:border-hiveYellow hover:bg-hiveYellow/5 transition-all cursor-pointer"
                  onClick={() => setSelectedEvent(event)}
                >
                  <h3 className="font-semibold text-hiveGray-dark mb-2">
                    {event.title}
                  </h3>
                  <div className="space-y-1 text-sm text-hiveGray">
                    <p className="flex items-center gap-2">
                      <CalendarIcon className="w-4 h-4" />
                      {event.date}
                    </p>
                    <p className="flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      {event.time}
                    </p>
                    <p className="flex items-center gap-2">
                      <MapPin className="w-4 h-4" />
                      {event.location}
                    </p>
                  </div>
                  <div className="mt-3 flex items-center justify-between">
                    <span className="text-sm text-hiveGray">
                      {event.attendees} / {event.maxAttendees} registered
                    </span>
                    <HiveButton 
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEventRegistration(event.id);
                      }}
                    >
                      Register
                    </HiveButton>
                  </div>
                </motion.div>
              ))}
            </div>
          </HiveCard>
        </motion.div>
      </div>

      {selectedOrg && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="mb-8"
        >
          <HiveCard>
            <div className="flex items-start justify-between mb-6">
              <div className="flex items-start gap-6">
                <div className="w-20 h-20 bg-hiveYellow rounded-2xl flex items-center justify-center shadow-hive-card">
                  <span className="text-4xl font-bold text-hiveGray-dark">
                    {selectedOrg.name.charAt(0)}
                  </span>
                </div>
                <div>
                  <h2 className="text-3xl font-bold text-hiveGray-dark mb-2">
                    {selectedOrg.name}
                  </h2>
                  <div className="flex items-center gap-4 text-hiveGray">
                    <span className="px-3 py-1 bg-hiveYellow/20 text-hiveYellow rounded-full text-sm font-semibold">
                      {selectedOrg.category}
                    </span>
                    <span className="flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      {selectedOrg.location}
                    </span>
                  </div>
                </div>
              </div>
              <HiveButton onClick={() => window.location.href = `/organizations/${selectedOrg.id}`}>
                View Details
              </HiveButton>
            </div>

            <p className="text-lg text-hiveGray mb-6">
              {selectedOrg.description}
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <div className="p-4 rounded-lg bg-hiveGray-light/50">
                <div className="flex items-center gap-3 mb-2">
                  <Users className="w-5 h-5 text-hiveYellow" />
                  <span className="text-sm text-hiveGray">Total Members</span>
                </div>
                <p className="text-2xl font-bold text-hiveGray-dark">
                  {selectedOrg.members}
                </p>
              </div>

              <div className="p-4 rounded-lg bg-hiveGray-light/50">
                <div className="flex items-center gap-3 mb-2">
                  <CalendarIcon className="w-5 h-5 text-hiveYellow" />
                  <span className="text-sm text-hiveGray">Active Events</span>
                </div>
                <p className="text-2xl font-bold text-hiveGray-dark">
                  {selectedOrg.activeEvents}
                </p>
              </div>

              <div className="p-4 rounded-lg bg-hiveGray-light/50">
                <div className="flex items-center gap-3 mb-2">
                  <TrendingUp className="w-5 h-5 text-hiveYellow" />
                  <span className="text-sm text-hiveGray">Your Role</span>
                </div>
                <p className="text-2xl font-bold text-hiveGray-dark capitalize">
                  {selectedOrg.role}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-6 text-hiveGray">
              <a
                href={`mailto:${selectedOrg.email}`}
                className="flex items-center gap-2 hover:text-hiveYellow transition-colors"
              >
                <Mail className="w-4 h-4" />
                {selectedOrg.email}
              </a>
              <a
                href={`https://${selectedOrg.website}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 hover:text-hiveYellow transition-colors"
              >
                <Globe className="w-4 h-4" />
                {selectedOrg.website}
              </a>
            </div>
          </HiveCard>
        </motion.div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.7 }}
        >
          <HiveCard hoverable={false}>
            <div className="flex items-center gap-3 mb-6">
              <History className="w-6 h-6 text-hiveYellow" />
              <h2 className="text-2xl font-bold text-hiveGray-dark">Event History</h2>
            </div>
            <div className="space-y-3 max-h-[400px] overflow-y-auto">
              {volunteerHours.map((hour, index) => (
                <motion.div
                  key={hour.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.8 + index * 0.05 }}
                  className="p-4 rounded-lg bg-hiveGray-light/50 hover:bg-hiveGray-light transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold text-hiveGray-dark mb-1">
                        {hour.event_id ? 'Event Volunteering' : 'General Volunteering'}
                      </h3>
                      <p className="text-sm text-hiveGray mb-2">
                        {hour.organization_id ? 'Organization Event' : 'Independent Volunteering'}
                      </p>
                      <div className="flex items-center gap-4 text-xs text-hiveGray">
                        <span className="flex items-center gap-1">
                          <CalendarIcon className="w-3 h-3" />
                          {hour.date}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {hour.hours} hours
                        </span>
                      </div>
                    </div>
                    <span className="px-2 py-1 bg-hiveYellow/20 text-hiveYellow rounded text-xs font-medium">
                      Completed
                    </span>
                  </div>
                </motion.div>
              ))}
            </div>
          </HiveCard>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.8 }}
        >
          <HiveCard hoverable={false}>
            <div className="flex items-center gap-3 mb-6">
              <Clock className="w-6 h-6 text-hiveYellow" />
              <h2 className="text-2xl font-bold text-hiveGray-dark">Volunteer Hours</h2>
            </div>
            <div className="space-y-4">
              <div className="p-6 rounded-xl bg-gradient-to-br from-hiveYellow/20 to-hiveYellow/5">
                <p className="text-sm text-hiveGray mb-2">Total Hours This Month</p>
                <p className="text-5xl font-bold text-hiveGray-dark mb-1">{thisMonthHours}</p>
                <p className="text-sm text-green-600 font-medium">+12 from last month</p>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 rounded-lg bg-hiveGray-light/50">
                  <span className="text-sm font-medium text-hiveGray-dark">This Week</span>
                  <span className="text-lg font-bold text-hiveYellow">8 hrs</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-hiveGray-light/50">
                  <span className="text-sm font-medium text-hiveGray-dark">This Year</span>
                  <span className="text-lg font-bold text-hiveYellow">{totalHours} hrs</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-hiveGray-light/50">
                  <span className="text-sm font-medium text-hiveGray-dark">All Time</span>
                  <span className="text-lg font-bold text-hiveYellow">{totalHours} hrs</span>
                </div>
              </div>
            </div>
          </HiveCard>
        </motion.div>
      </div>

      <HiveModal
        isOpen={selectedEvent !== null}
        onClose={() => setSelectedEvent(null)}
        title={selectedEvent?.title || ''}
        size="md"
      >
        {selectedEvent && (
          <div className="space-y-4">
            <p className="text-hiveGray">{selectedEvent.description}</p>

            <div className="space-y-2">
              <div className="flex items-center gap-2 text-hiveGray">
                <CalendarIcon className="w-4 h-4" />
                <span>{selectedEvent.date}</span>
              </div>
              <div className="flex items-center gap-2 text-hiveGray">
                <Clock className="w-4 h-4" />
                <span>{selectedEvent.time}</span>
              </div>
              <div className="flex items-center gap-2 text-hiveGray">
                <MapPin className="w-4 h-4" />
                <span>{selectedEvent.location}</span>
              </div>
              <div className="flex items-center gap-2 text-hiveGray">
                <Users className="w-4 h-4" />
                <span>{selectedEvent.attendees} / {selectedEvent.maxAttendees} registered</span>
              </div>
            </div>

            <div className="flex gap-2 pt-4">
              <HiveButton 
                className="flex-1"
                onClick={() => {
                  handleEventRegistration(selectedEvent.id);
                  setSelectedEvent(null);
                }}
              >
                Register for Event
              </HiveButton>
              <HiveButton variant="outline" onClick={() => setSelectedEvent(null)}>
                Close
              </HiveButton>
            </div>
          </div>
        )}
      </HiveModal>
    </DashboardLayout>
  );
}