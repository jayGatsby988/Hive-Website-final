'use client';

import { motion } from 'framer-motion';
import { Clock } from 'lucide-react';

interface VolunteerHoursTrackerProps {
  totalHours: number;
  goalHours: number;
  delay?: number;
}

export default function VolunteerHoursTracker({
  totalHours,
  goalHours,
  delay = 0,
}: VolunteerHoursTrackerProps) {
  const percentage = Math.min((totalHours / goalHours) * 100, 100);
  const circumference = 2 * Math.PI * 70;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <motion.div
      className="bg-hiveWhite rounded-xl shadow-hive-card p-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay }}
    >
      <div className="flex items-center gap-2 mb-6">
        <Clock className="w-5 h-5 text-hiveYellow" />
        <h3 className="text-xl font-bold text-hiveGray-dark">
          Volunteer Hours
        </h3>
      </div>

      <div className="flex items-center justify-center mb-6">
        <div className="relative w-48 h-48">
          <svg className="transform -rotate-90 w-full h-full">
            <circle
              cx="96"
              cy="96"
              r="70"
              stroke="currentColor"
              strokeWidth="12"
              fill="none"
              className="text-hiveGray-light"
            />
            <motion.circle
              cx="96"
              cy="96"
              r="70"
              stroke="currentColor"
              strokeWidth="12"
              fill="none"
              strokeLinecap="round"
              className="text-hiveYellow"
              initial={{ strokeDashoffset: circumference }}
              animate={{ strokeDashoffset }}
              transition={{ duration: 1.5, delay: delay + 0.3, ease: 'easeOut' }}
              style={{
                strokeDasharray: circumference,
              }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <motion.div
              className="text-4xl font-bold text-hiveGray-dark"
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: delay + 0.5, type: 'spring' }}
            >
              {totalHours}
            </motion.div>
            <div className="text-sm text-hiveGray">of {goalHours} hours</div>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <span className="text-sm text-hiveGray">This Month</span>
          <span className="text-sm font-semibold text-hiveGray-dark">
            {Math.round(totalHours * 0.4)} hrs
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-sm text-hiveGray">This Year</span>
          <span className="text-sm font-semibold text-hiveGray-dark">
            {totalHours} hrs
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-sm text-hiveGray">Completion</span>
          <span className="text-sm font-semibold text-hiveYellow">
            {Math.round(percentage)}%
          </span>
        </div>
      </div>

      <motion.div
        className="mt-6 p-4 bg-hiveYellow/10 rounded-lg"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: delay + 0.6 }}
      >
        <p className="text-sm text-hiveGray-dark">
          {percentage >= 100
            ? 'Congratulations! You have reached your goal!'
            : `${goalHours - totalHours} hours left to reach your goal!`}
        </p>
      </motion.div>
    </motion.div>
  );
}
