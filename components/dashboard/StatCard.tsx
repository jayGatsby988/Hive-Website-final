'use client';

import { motion } from 'framer-motion';
import { LucideIcon } from 'lucide-react';
import { ReactNode } from 'react';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  delay?: number;
}

export default function StatCard({
  title,
  value,
  icon: Icon,
  trend,
  delay = 0,
}: StatCardProps) {
  return (
    <motion.div
      className="bg-hiveWhite rounded-xl shadow-hive-card p-6 hover:shadow-hive-lift transition-shadow duration-300"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay }}
      whileHover={{ y: -4 }}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="p-3 bg-hiveYellow/10 rounded-lg">
          <Icon className="w-6 h-6 text-hiveYellow" />
        </div>
        {trend && (
          <motion.div
            className={`text-sm font-semibold ${
              trend.isPositive ? 'text-green-600' : 'text-red-600'
            }`}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: delay + 0.3, type: 'spring' }}
          >
            {trend.isPositive ? '+' : ''}
            {trend.value}%
          </motion.div>
        )}
      </div>
      <h3 className="text-hiveGray text-sm font-medium mb-1">{title}</h3>
      <motion.p
        className="text-3xl font-bold text-hiveGray-dark"
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: delay + 0.2 }}
      >
        {value}
      </motion.p>
    </motion.div>
  );
}
