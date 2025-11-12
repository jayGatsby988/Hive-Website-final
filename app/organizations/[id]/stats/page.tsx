'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import HiveCard from '@/components/common/HiveCard';
import { Clock, Calendar, Users, TrendingUp, Award, Activity, RefreshCw, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import HiveButton from '@/components/common/HiveButton';

interface VolunteerStats {
  totalHours: number;
  totalMinutes: number;
  totalSeconds: number;
  totalEvents: number;
  organizationName: string;
  recentEvents: Array<{
    id: string;
    title: string;
    date: string;
    hours: number;
    minutes: number;
    seconds: number;
  }>;
  allOrgsStats: Array<{
    orgId: string;
    orgName: string;
    totalHours: number;
    totalMinutes: number;
    totalSeconds: number;
    eventCount: number;
  }>;
}

export default function StatsPage() {
  const params = useParams();
  const orgId = params?.id as string;
  const { user } = useAuth();
  const [stats, setStats] = useState<VolunteerStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const loadStats = useCallback(async (isRefresh = false) => {
    if (!user) return;

    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);
      console.log('[Stats] Loading stats for user:', user.id, 'org:', orgId);

      // Get current organization name
      const { data: org, error: orgError } = await supabase
        .from('organizations')
        .select('name')
        .eq('id', orgId)
        .single();
      
      if (orgError) console.error('[Stats] Error fetching org:', orgError);
      console.log('[Stats] Organization:', org);

      // Get all volunteer hours for this user in this organization (without joins first)
      const { data: hours, error: hoursError } = await supabase
        .from('volunteer_hours')
        .select('id, hours, date, event_id, organization_id')
        .eq('user_id', user.id)
        .eq('organization_id', orgId)
        .order('date', { ascending: false });

      if (hoursError) console.error('[Stats] Error fetching hours:', hoursError);
      console.log('[Stats] Volunteer hours for this org:', hours?.length || 0, 'records');
      console.log('[Stats] Raw hours data:', hours);

      // Get all volunteer hours across all organizations (without joins)
      const { data: allHours, error: allHoursError } = await supabase
        .from('volunteer_hours')
        .select('id, hours, organization_id, event_id')
        .eq('user_id', user.id);

      if (allHoursError) console.error('[Stats] Error fetching all hours:', allHoursError);
      console.log('[Stats] All volunteer hours across orgs:', allHours?.length || 0, 'records');

      // Calculate total hours/minutes/seconds for this organization
      const totalHoursDecimal = hours?.reduce((sum: number, h: any) => sum + (h.hours || 0), 0) || 0;
      console.log('[Stats] Total hours decimal:', totalHoursDecimal);
      
      const totalHours = Math.floor(totalHoursDecimal);
      const remainingMinutes = (totalHoursDecimal - totalHours) * 60;
      const totalMinutes = Math.floor(remainingMinutes);
      const totalSeconds = Math.floor((remainingMinutes - totalMinutes) * 60);
      
      console.log('[Stats] Formatted time:', {
        hours: totalHours,
        minutes: totalMinutes,
        seconds: totalSeconds
      });

      // Get unique events
      const uniqueEvents = new Set(hours?.map((h: any) => h.event_id).filter(Boolean) || []);

      // Fetch event details separately
      const eventIds = Array.from(uniqueEvents).slice(0, 10);
      const { data: events } = await supabase
        .from('events')
        .select('id, title')
        .in('id', eventIds.length > 0 ? eventIds : ['']);

      const eventMap = new Map((events || []).map((e: any) => [e.id, e.title]));

      // Get recent events with hours
      const recentEvents = (hours || [])
        .filter((h: any) => h.event_id)
        .slice(0, 10)
        .map((h: any) => {
          const eventHours = h.hours || 0;
          const hrs = Math.floor(eventHours);
          const mins = Math.floor((eventHours - hrs) * 60);
          const secs = Math.floor(((eventHours - hrs) * 60 - mins) * 60);

          return {
            id: h.event_id || '',
            title: eventMap.get(h.event_id) || 'Unknown Event',
            date: h.date || '',
            hours: hrs,
            minutes: mins,
            seconds: secs
          };
        });

      // Fetch organization names separately
      const allOrgIds = Array.from(new Set((allHours || []).map((h: any) => h.organization_id).filter(Boolean)));
      const { data: organizations } = await supabase
        .from('organizations')
        .select('id, name')
        .in('id', allOrgIds.length > 0 ? allOrgIds : ['']);

      const orgNameMap = new Map((organizations || []).map((o: any) => [o.id, o.name]));

      // Calculate stats by organization
      const orgStatsMap = new Map<string, {
        orgId: string;
        orgName: string;
        totalHours: number;
        eventIds: Set<string>;
      }>();

      (allHours || []).forEach((h: any) => {
        const orgId = h.organization_id;
        if (!orgId) return;

        const orgName = orgNameMap.get(orgId) as string || 'Unknown Organization';
        
        if (!orgStatsMap.has(orgId)) {
          orgStatsMap.set(orgId, {
            orgId,
            orgName: orgName as string,
            totalHours: 0,
            eventIds: new Set()
          });
        }

        const orgStats = orgStatsMap.get(orgId)!;
        orgStats.totalHours += h.hours || 0;
        if (h.event_id) {
          orgStats.eventIds.add(h.event_id);
        }
      });

      // Convert orgStatsMap to array with formatted times
      const allOrgsStats = Array.from(orgStatsMap.values()).map(os => {
        const totalHrsDecimal = os.totalHours;
        const hrs = Math.floor(totalHrsDecimal);
        const mins = Math.floor((totalHrsDecimal - hrs) * 60);
        const secs = Math.floor(((totalHrsDecimal - hrs) * 60 - mins) * 60);

        return {
          orgId: os.orgId,
          orgName: os.orgName,
          totalHours: hrs,
          totalMinutes: mins,
          totalSeconds: secs,
          eventCount: os.eventIds.size
        };
      });

      setStats({
        totalHours,
        totalMinutes,
        totalSeconds,
        totalEvents: uniqueEvents.size,
        organizationName: org?.name || 'Unknown',
        recentEvents,
        allOrgsStats
      });
      
      console.log('[Stats] ✅ Stats loaded successfully');
    } catch (err) {
      console.error('[Stats] ❌ Failed to load stats:', err);
      setError(err instanceof Error ? err.message : 'Failed to load stats');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user, orgId]);

  useEffect(() => {
    if (!user || !orgId) return;
    loadStats();
  }, [user, orgId, loadStats]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-hiveYellow border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-hiveGray">Loading your stats...</p>
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="text-center py-12">
        <Activity className="w-16 h-16 text-hiveGray mx-auto mb-4" />
        <p className="text-hiveGray">No stats available</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Error Display */}
      {error && (
        <HiveCard hoverable={false} className="bg-red-50 border-red-200">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-6 h-6 text-red-500" />
            <div>
              <h3 className="font-bold text-red-800">Error Loading Stats</h3>
              <p className="text-sm text-red-600">{error}</p>
            </div>
          </div>
        </HiveCard>
      )}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-hiveGray-dark mb-2">Your Volunteer Stats</h1>
          <p className="text-hiveGray">Track your volunteer hours and contributions</p>
        </div>
        <HiveButton
          onClick={() => loadStats(true)}
          disabled={refreshing}
          variant="secondary"
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
          {refreshing ? 'Refreshing...' : 'Refresh'}
        </HiveButton>
      </div>

      {/* Current Organization Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <HiveCard hoverable={false} className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center">
                <Clock className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-sm text-hiveGray mb-1">Total Hours</p>
                <p className="text-2xl font-bold text-hiveGray-dark">
                  {stats.totalHours}h {stats.totalMinutes}m {stats.totalSeconds}s
                </p>
              </div>
            </div>
          </HiveCard>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <HiveCard hoverable={false} className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-green-500 rounded-lg flex items-center justify-center">
                <Calendar className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-sm text-hiveGray mb-1">Events Attended</p>
                <p className="text-2xl font-bold text-hiveGray-dark">{stats.totalEvents}</p>
              </div>
            </div>
          </HiveCard>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <HiveCard hoverable={false} className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-purple-500 rounded-lg flex items-center justify-center">
                <Users className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-sm text-hiveGray mb-1">Organization</p>
                <p className="text-lg font-bold text-hiveGray-dark truncate">{stats.organizationName}</p>
              </div>
            </div>
          </HiveCard>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <HiveCard hoverable={false} className="bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-hiveYellow rounded-lg flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-sm text-hiveGray mb-1">Avg Hours/Event</p>
                <p className="text-2xl font-bold text-hiveGray-dark">
                  {stats.totalEvents > 0
                    ? ((stats.totalHours + stats.totalMinutes / 60 + stats.totalSeconds / 3600) / stats.totalEvents).toFixed(2)
                    : '0.00'}
                </p>
              </div>
            </div>
          </HiveCard>
        </motion.div>
      </div>

      {/* Recent Events */}
      {stats.recentEvents.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <HiveCard hoverable={false}>
            <div className="flex items-center gap-3 mb-6">
              <Award className="w-6 h-6 text-hiveYellow" />
              <h2 className="text-xl font-bold text-hiveGray-dark">Recent Events</h2>
            </div>
            <div className="space-y-3">
              {stats.recentEvents.map((event, index) => (
                <motion.div
                  key={event.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.6 + index * 0.05 }}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div>
                    <p className="font-semibold text-hiveGray-dark">{event.title}</p>
                    <p className="text-sm text-hiveGray">{new Date(event.date).toLocaleDateString()}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-hiveYellow">
                      {event.hours}h {event.minutes}m {event.seconds}s
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </HiveCard>
        </motion.div>
      )}

      {/* All Organizations Stats */}
      {stats.allOrgsStats.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
        >
          <HiveCard hoverable={false}>
            <div className="flex items-center gap-3 mb-6">
              <TrendingUp className="w-6 h-6 text-hiveYellow" />
              <h2 className="text-xl font-bold text-hiveGray-dark">All Organizations</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {stats.allOrgsStats.map((org, index) => (
                <motion.div
                  key={org.orgId}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.8 + index * 0.05 }}
                  className="p-4 bg-gradient-to-br from-hiveYellow/10 to-hiveYellow/5 rounded-lg border border-hiveYellow/20"
                >
                  <h3 className="font-bold text-hiveGray-dark mb-2">{org.orgName}</h3>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-hiveGray">Total Hours:</span>
                      <span className="font-semibold text-hiveYellow">
                        {org.totalHours}h {org.totalMinutes}m {org.totalSeconds}s
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-hiveGray">Events:</span>
                      <span className="font-semibold text-hiveGray-dark">{org.eventCount}</span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </HiveCard>
        </motion.div>
      )}

      {/* Empty State */}
      {stats.recentEvents.length === 0 && stats.allOrgsStats.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          <HiveCard hoverable={false} className="text-center py-12">
            <Activity className="w-16 h-16 text-hiveGray mx-auto mb-4" />
            <h3 className="text-xl font-bold text-hiveGray-dark mb-2">No Activity Yet</h3>
            <p className="text-hiveGray">
              Start attending events to see your volunteer stats!
            </p>
          </HiveCard>
        </motion.div>
      )}
    </div>
  );
}

