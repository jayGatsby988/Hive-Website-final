'use client';

import { motion } from 'framer-motion';
import { Calendar, MapPin, Users, Clock } from 'lucide-react';
import HiveButton from '../common/HiveButton';

interface EventCardProps {
  title: string;
  date: string;
  time: string;
  location: string;
  attendees: number;
  maxAttendees?: number;
  status?: 'upcoming' | 'ongoing' | 'completed';
  delay?: number;
  onViewDetails?: () => void;
}

export default function EventCard({
  title,
  date,
  time,
  location,
  attendees,
  maxAttendees,
  status = 'upcoming',
  delay = 0,
  onViewDetails,
}: EventCardProps) {
  const statusColors = {
    upcoming: 'bg-blue-100 text-blue-700',
    ongoing: 'bg-green-100 text-green-700',
    completed: 'bg-hiveGray-light text-hiveGray',
  };

  return (
    <motion.div
      className="bg-hiveWhite rounded-xl shadow-hive-card p-6 hover:shadow-hive-lift transition-all duration-300"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay }}
      whileHover={{ y: -4 }}
    >
      <div className="flex items-start justify-between mb-4">
        <h3 className="text-xl font-bold text-hiveGray-dark flex-1">{title}</h3>
        <span
          className={`px-3 py-1 rounded-full text-xs font-semibold ${statusColors[status]}`}
        >
          {status.charAt(0).toUpperCase() + status.slice(1)}
        </span>
      </div>

      <div className="space-y-3 mb-6">
        <div className="flex items-center gap-2 text-hiveGray">
          <Calendar className="w-4 h-4" />
          <span className="text-sm">{date}</span>
        </div>
        <div className="flex items-center gap-2 text-hiveGray">
          <Clock className="w-4 h-4" />
          <span className="text-sm">{time}</span>
        </div>
        <div className="flex items-center gap-2 text-hiveGray">
          <MapPin className="w-4 h-4" />
          <span className="text-sm">{location}</span>
        </div>
        <div className="flex items-center gap-2 text-hiveGray">
          <Users className="w-4 h-4" />
          <span className="text-sm">
            {attendees} {maxAttendees && `/ ${maxAttendees}`} attendees
          </span>
        </div>
      </div>

      {maxAttendees && (
        <div className="mb-4">
          <div className="w-full bg-hiveGray-light rounded-full h-2 overflow-hidden">
            <motion.div
              className="h-full bg-hiveYellow"
              initial={{ width: 0 }}
              animate={{ width: `${(attendees / maxAttendees) * 100}%` }}
              transition={{ duration: 1, delay: delay + 0.3 }}
            />
          </div>
        </div>
      )}

      <HiveButton
        variant="outline"
        size="sm"
        className="w-full"
        onClick={onViewDetails}
      >
        View Details
      </HiveButton>
    </motion.div>
  );
}
