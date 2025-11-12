'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import HiveButton from '@/components/common/HiveButton';
import HiveModal from '@/components/common/HiveModal';
import EventCard from '@/components/dashboard/EventCard';
import { useAuth } from '@/contexts/AuthContext';
import { eventService } from '@/lib/services';
import { Event as SupabaseEvent } from '@/lib/types';

interface CalendarEvent {
  id: string;
  title: string;
  date: string;
  time: string;
  location: string;
  attendees: number;
  maxAttendees: number;
  description: string;
  status: 'upcoming' | 'ongoing' | 'completed';
}

export default function CalendarPage() {
  const { user } = useAuth();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [viewMode, setViewMode] = useState<'month' | 'week'>('month');
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);

  const loadEvents = useCallback(async () => {
    if (!user) {
      setEvents([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      // Load events from user's organizations only
      const allEvents = await eventService.getUserOrganizationEvents(user.id);
      const convertedEvents: CalendarEvent[] = allEvents.map(event => ({
        id: event.id,
        title: event.title,
        date: event.date,
        time: `${event.time}${event.end_time ? ` - ${event.end_time}` : ''}`,
        location: event.location || '',
        attendees: event.signup_count,
        maxAttendees: event.max_attendees,
        description: event.description,
        status: event.status === 'completed' ? 'completed' : 
                event.status === 'in_progress' ? 'ongoing' : 'upcoming',
      }));
      setEvents(convertedEvents);
    } catch (error) {
      console.error('Error loading events:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadEvents();
  }, [loadEvents]);

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    return { firstDay, daysInMonth };
  };

  const { firstDay, daysInMonth } = getDaysInMonth(currentDate);
  const today = new Date().getDate();
  const isCurrentMonth =
    currentDate.getMonth() === new Date().getMonth() &&
    currentDate.getFullYear() === new Date().getFullYear();

  const hasEvent = (day: number) => {
    return events.some((event) => {
      const eventDate = new Date(event.date);
      return (
        eventDate.getDate() === day &&
        eventDate.getMonth() === currentDate.getMonth() &&
        eventDate.getFullYear() === currentDate.getFullYear()
      );
    });
  };

  const getEventsForDay = (day: number) => {
    return events.filter((event) => {
      const eventDate = new Date(event.date);
      return (
        eventDate.getDate() === day &&
        eventDate.getMonth() === currentDate.getMonth() &&
        eventDate.getFullYear() === currentDate.getFullYear()
      );
    });
  };

  const handleDayClick = (day: number) => {
    const dayEvents = getEventsForDay(day);
    if (dayEvents.length > 0) {
      setSelectedEvent(dayEvents[0]);
    }
  };

  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  if (loading) {
    return (
      <DashboardLayout userRole="user">
        <div className="flex items-center justify-center min-h-96">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-hiveYellow border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-hiveGray">Loading calendar...</p>
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
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-4xl font-bold text-hiveGray-dark mb-2">Calendar</h1>
            <p className="text-lg text-hiveGray">View and manage your volunteer events</p>
          </div>
          <div className="flex gap-2">
            <HiveButton
              variant={viewMode === 'month' ? 'primary' : 'outline'}
              onClick={() => setViewMode('month')}
            >
              Month
            </HiveButton>
            <HiveButton
              variant={viewMode === 'week' ? 'primary' : 'outline'}
              onClick={() => setViewMode('week')}
            >
              Week
            </HiveButton>
          </div>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className="bg-white rounded-2xl shadow-hive-lift p-8"
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-hiveGray-dark">
            {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
          </h2>
          <div className="flex items-center gap-2">
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              onClick={prevMonth}
              className="p-2 rounded-lg hover:bg-hiveGray-light transition-colors"
            >
              <ChevronLeft className="w-5 h-5 text-hiveGray" />
            </motion.button>
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
          {Array.from({ length: firstDay }).map((_, index) => (
            <div key={`empty-${index}`} className="aspect-square" />
          ))}

          {Array.from({ length: daysInMonth }).map((_, index) => {
            const day = index + 1;
            const isToday = isCurrentMonth && day === today;
            const hasEventOnDay = hasEvent(day);
            const dayEvents = getEventsForDay(day);

            return (
              <motion.div
                key={day}
                className={`aspect-square flex items-center justify-center rounded-lg text-sm font-medium transition-all cursor-pointer relative ${
                  isToday
                    ? 'bg-hiveYellow text-hiveGray-dark font-bold'
                    : hasEventOnDay
                    ? 'bg-hiveYellow/20 text-hiveYellow hover:bg-hiveYellow/30'
                    : 'hover:bg-hiveGray-light text-hiveGray'
                }`}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleDayClick(day)}
              >
                {day}
                {hasEventOnDay && (
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
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.4 }}
        className="mt-8"
      >
        <h2 className="text-2xl font-bold text-hiveGray-dark mb-6">Upcoming Events</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {events.filter(e => e.status === 'upcoming').slice(0, 6).map((event, index) => (
            <EventCard key={event.id} {...event} delay={index * 0.1} />
          ))}
        </div>
      </motion.div>

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
                <CalendarIcon className="w-4 h-4" />
                <span>{selectedEvent.time}</span>
              </div>
              <div className="flex items-center gap-2 text-hiveGray">
                <CalendarIcon className="w-4 h-4" />
                <span>{selectedEvent.location}</span>
              </div>
            </div>

            <div className="flex gap-2 pt-4">
              <HiveButton className="flex-1">Register</HiveButton>
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