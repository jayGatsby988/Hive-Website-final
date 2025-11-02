'use client';

import { motion } from 'framer-motion';
import { Users, MapPin, Calendar, ChevronRight } from 'lucide-react';
import HiveButton from '../common/HiveButton';

interface OrganizationCardProps {
  name: string;
  description: string;
  location: string;
  members: number;
  activeEvents: number;
  category: string;
  logo?: string;
  delay?: number;
  isJoined?: boolean;
  onJoin?: () => void;
  onViewDetails?: () => void;
}

export default function OrganizationCard({
  name,
  description,
  location,
  members,
  activeEvents,
  category,
  logo,
  delay = 0,
  isJoined = false,
  onJoin,
  onViewDetails,
}: OrganizationCardProps) {
  return (
    <motion.div
      className="bg-hiveWhite rounded-xl shadow-hive-card overflow-hidden hover:shadow-hive-lift transition-all duration-300"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay }}
      whileHover={{ y: -4 }}
    >
      <div className="h-32 bg-gradient-to-br from-hiveYellow/20 to-hiveYellow/5 flex items-center justify-center relative overflow-hidden">
        {logo ? (
          <img src={logo} alt={name} className="w-20 h-20 object-contain" />
        ) : (
          <div className="w-20 h-20 bg-hiveYellow rounded-full flex items-center justify-center">
            <span className="text-3xl font-bold text-hiveGray-dark">
              {name.charAt(0)}
            </span>
          </div>
        )}
        <div className="absolute top-3 right-3">
          <span className="px-3 py-1 bg-hiveWhite rounded-full text-xs font-semibold text-hiveGray-dark">
            {category}
          </span>
        </div>
      </div>

      <div className="p-6">
        <h3 className="text-xl font-bold text-hiveGray-dark mb-2">{name}</h3>
        <p className="text-sm text-hiveGray mb-4 line-clamp-2">{description}</p>

        <div className="space-y-2 mb-6">
          <div className="flex items-center gap-2 text-hiveGray text-sm">
            <MapPin className="w-4 h-4" />
            <span>{location}</span>
          </div>
          <div className="flex items-center gap-2 text-hiveGray text-sm">
            <Users className="w-4 h-4" />
            <span>{members} members</span>
          </div>
          <div className="flex items-center gap-2 text-hiveGray text-sm">
            <Calendar className="w-4 h-4" />
            <span>{activeEvents} active events</span>
          </div>
        </div>

        <div className="flex gap-2">
          {isJoined ? (
            <HiveButton
              variant="secondary"
              size="sm"
              className="flex-1"
              onClick={onViewDetails}
            >
              View Details
              <ChevronRight className="w-4 h-4 ml-1" />
            </HiveButton>
          ) : (
            <>
              <HiveButton
                size="sm"
                className="flex-1"
                onClick={onJoin}
              >
                Join
              </HiveButton>
              <HiveButton
                variant="outline"
                size="sm"
                onClick={onViewDetails}
              >
                <ChevronRight className="w-4 h-4" />
              </HiveButton>
            </>
          )}
        </div>
      </div>
    </motion.div>
  );
}
