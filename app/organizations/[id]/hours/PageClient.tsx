'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Clock, Calendar, TrendingUp, Award, Download } from 'lucide-react';
import { useOrganization } from '@/contexts/OrganizationContext';
import HiveCard from '@/components/common/HiveCard';
import HiveButton from '@/components/common/HiveButton';

export default function HoursPageClient() {
  const { selectedOrg } = useOrganization();

  const hoursData = [
    { month: 'Jan', hours: 120 },
    { month: 'Feb', hours: 145 },
    { month: 'Mar', hours: 180 },
    { month: 'Apr', hours: 165 },
    { month: 'May', hours: 195 },
    { month: 'Jun', hours: 210 },
    { month: 'Jul', hours: 230 },
    { month: 'Aug', hours: 205 },
    { month: 'Sep', hours: 240 },
    { month: 'Oct', hours: 180 },
  ];

  const maxHours = Math.max(...hoursData.map(d => d.hours));

  return (
    <div className="max-w-7xl mx-auto">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-hiveGray-dark mb-2">Volunteer Hours</h1>
            <p className="text-hiveGray">Track and manage volunteer contributions</p>
          </div>
          <HiveButton variant="outline"><Download className="w-5 h-5 mr-2" />Export Report</HiveButton>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <HiveCard className="bg-gradient-to-br from-hiveYellow/20 to-hiveYellow/5">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 bg-hiveYellow rounded-lg flex items-center justify-center">
                <Clock className="w-6 h-6 text-hiveGray-dark" />
              </div>
              <span className="font-medium text-hiveGray">Total Hours (2024)</span>
            </div>
            <p className="text-4xl font-bold text-hiveGray-dark">{selectedOrg?.stats?.totalHours?.toLocaleString() || 0}</p>
          </HiveCard>

          <HiveCard className="bg-gradient-to-br from-green-100 to-green-50">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 bg-green-500 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
              <span className="font-medium text-hiveGray">This Month</span>
            </div>
            <p className="text-4xl font-bold text-hiveGray-dark">180</p>
            <p className="text-sm text-green-600">+12% from last month</p>
          </HiveCard>

          <HiveCard className="bg-gradient-to-br from-blue-100 to-blue-50">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center">
                <Award className="w-6 h-6 text-white" />
              </div>
              <span className="font-medium text-hiveGray">Avg per Member</span>
            </div>
            <p className="text-4xl font-bold text-hiveGray-dark">
              {selectedOrg?.stats?.totalHours && selectedOrg?.members 
                ? Math.round(selectedOrg.stats.totalHours / selectedOrg.members) 
                : 0}
            </p>
          </HiveCard>
        </div>

        <HiveCard>
          <h3 className="text-xl font-bold text-hiveGray-dark mb-6">Monthly Breakdown</h3>
          <div className="space-y-4">
            {hoursData.map((data, index) => (
              <motion.div
                key={data.month}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className="flex items-center gap-4"
              >
                <span className="w-12 text-sm font-medium text-hiveGray">{data.month}</span>
                <div className="flex-1 bg-hiveGray-light rounded-full h-8 overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${(data.hours / maxHours) * 100}%` }}
                    transition={{ duration: 1, delay: index * 0.1 }}
                    className="h-full bg-hiveYellow flex items-center justify-end pr-3"
                  >
                    <span className="text-sm font-bold text-hiveGray-dark">{data.hours}h</span>
                  </motion.div>
                </div>
              </motion.div>
            ))}
          </div>
        </HiveCard>
      </motion.div>
    </div>
  );
}
