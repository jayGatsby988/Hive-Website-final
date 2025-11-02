'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useOrganization } from '@/contexts/OrganizationContext';
import { eventService } from '@/lib/services';
import { supabase } from '@/lib/supabase';
import { Event as SupabaseEvent } from '@/lib/types';
import HiveCard from '@/components/common/HiveCard';
import HiveButton from '@/components/common/HiveButton';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Calendar,
  Clock,
  MapPin,
  Users,
  Play,
  StopCircle,
  RefreshCw,
  Shield,
  LogIn,
  LogOut,
} from 'lucide-react';

export default function EventDetailPageClient() {
  const params = useParams();
  const router = useRouter();
  const orgId = params?.id as string;
  const eventId = params?.eventId as string;
  const { user } = useAuth();
  const { isAdmin, selectedOrg } = useOrganization();

  const [event, setEvent] = useState<SupabaseEvent | null>(null);
  const [attendees, setAttendees] = useState<any[]>([]);
  const [registeredCount, setRegisteredCount] = useState<number>(0);
  const [checkinCount, setCheckinCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [updating, setUpdating] = useState<boolean>(false);
  const [activity, setActivity] = useState<Array<{
    type: 'checkin' | 'checkout'
    user_id: string
    at: string
    user?: { id: string; name?: string; email?: string; avatar_url?: string }
  }>>([]);
  const [checkingInOut, setCheckingInOut] = useState<string | null>(null);
  const [activeSessions, setActiveSessions] = useState<Set<string>>(new Set());

  const statusBadge = useMemo(() => {
    if (!event) return 'bg-hiveGray-light text-hiveGray';
    switch (event.status) {
      case 'in_progress':
        return 'bg-green-100 text-green-700';
      case 'completed':
        return 'bg-hiveGray-light text-hiveGray';
      case 'published':
      default:
        return 'bg-blue-100 text-blue-700';
    }
  }, [event]);

  useEffect(() => {
    if (!eventId) return;
    const load = async () => {
      try {
        setLoading(true);
        const e = await eventService.getById(eventId);
        setEvent(e as SupabaseEvent);

        // Load attendees with robust user profile fetching
        const attendeesData = await loadAttendeesWithProfiles(eventId);
        setAttendees(attendeesData);

        const { count: regCount, error: regError } = await supabase
          .from('event_attendees')
          .select('*', { count: 'exact', head: true })
          .eq('event_id', eventId);
        setRegisteredCount(
          typeof regCount === 'number' && !regError
            ? regCount
            : (e?.signup_count ?? attendeesData.length)
        );

        const { count: ciCount } = await supabase
          .from('event_checkins')
          .select('*', { count: 'exact', head: true })
          .eq('event_id', eventId);
        setCheckinCount(ciCount || 0);

        // Load activity log (check-ins and admin check-outs)
        const logItems = await loadActivity(eventId);
        setActivity(logItems);

        // Load active sessions
        const { data: sessions } = await supabase
          .from('volunteer_sessions')
          .select('user_id')
          .eq('event_id', eventId)
          .eq('status', 'active');
        setActiveSessions(new Set((sessions || []).map((s: any) => s.user_id)));
      } catch (err) {
        console.error('Failed to load event', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [eventId]);

  // Realtime updates for check-ins and admin audit
  useEffect(() => {
    if (!eventId) return;

    const channel = supabase
      .channel(`event-activity-${eventId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'event_checkins', filter: `event_id=eq.${eventId}` }, () => {
        // Refresh count and activity when a check-in changes
        (async () => {
          const { count: ciCount } = await supabase
            .from('event_checkins')
            .select('*', { count: 'exact', head: true })
            .eq('event_id', eventId);
          setCheckinCount(ciCount || 0);
          const logItems = await loadActivity(eventId);
          setActivity(logItems);
        })();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'admin_checkin_audit', filter: `event_id=eq.${eventId}` }, () => {
        (async () => {
          const logItems = await loadActivity(eventId);
          setActivity(logItems);
        })();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'volunteer_sessions', filter: `event_id=eq.${eventId}` }, () => {
        // Refresh active sessions and activity when volunteer sessions change
        (async () => {
          const logItems = await loadActivity(eventId);
          setActivity(logItems);
          const { data: sessions } = await supabase
            .from('volunteer_sessions')
            .select('user_id')
            .eq('event_id', eventId)
            .eq('status', 'active');
          setActiveSessions(new Set((sessions || []).map((s: any) => s.user_id)));
        })();
      })
      .subscribe();

    return () => {
      try {
        supabase.removeChannel(channel);
      } catch (_) {
        // ignore
      }
    };
  }, [eventId]);

  const loadAttendeesWithProfiles = async (eId: string) => {
    try {
      // Prefer joined query; if user profiles are blocked, rows still return without nested user
      const joined = await eventService.getAttendees(eId);
      if (Array.isArray(joined) && joined.length > 0) {
        return joined.map((a: any) => ({ ...a, user: (a as any).users || (a as any).user }));
      }

      // Fallback to raw event_attendees rows
      const { data: attendeesRows } = await supabase
        .from('event_attendees')
        .select('*')
        .eq('event_id', eId);
      const rows = attendeesRows || [];

      // Attempt to enrich with user profiles if readable
      if (rows.length > 0) {
        const userIds = Array.from(new Set(rows.map((r: any) => r.user_id).filter(Boolean)));
        if (userIds.length > 0) {
          try {
            const { data: usersRows } = await supabase
              .from('users')
              .select('id, name, email, avatar_url')
              .in('id', userIds);
            const idToUser: Record<string, any> = Object.fromEntries((usersRows || []).map((u: any) => [u.id, u]));
            return rows.map((r: any) => ({ ...r, user: idToUser[r.user_id] }));
          } catch (_) {
            // If blocked, return raw rows
            return rows;
          }
        }
      }
      return rows;
    } catch (err) {
      console.error('Failed to load attendees with profiles', err);
      // Last resort: attempt to at least get raw attendees without profiles
      try {
        const { data: attendeesRows } = await supabase
          .from('event_attendees')
          .select('*')
          .eq('event_id', eId);
        const rows = attendeesRows || [];
        // Try enrichment quietly
        try {
          const userIds = Array.from(new Set(rows.map((r: any) => r.user_id).filter(Boolean)));
          if (userIds.length > 0) {
            const { data: usersRows } = await supabase
              .from('users')
              .select('id, name, email, avatar_url')
              .in('id', userIds);
            const idToUser: Record<string, any> = Object.fromEntries((usersRows || []).map((u: any) => [u.id, u]));
            return rows.map((r: any) => ({ ...r, user: idToUser[r.user_id] }));
          }
        } catch (_) {
          // ignore
        }
        return rows;
      } catch (_) {
        return [];
      }
    }
  };

  const handleStart = async () => {
    if (!event || !isAdmin) return;
    try {
      setUpdating(true);
      const updated = await eventService.startEvent(event.id);
      setEvent(updated);
    } catch (err) {
      console.error('Failed to start event', err);
    } finally {
      setUpdating(false);
    }
  };

  const handleEnd = async () => {
    if (!event || !isAdmin) return;
    try {
      setUpdating(true);
      const updated = await eventService.endEvent(event.id);
      setEvent(updated);
    } catch (err) {
      console.error('Failed to end event', err);
    } finally {
      setUpdating(false);
    }
  };

  const reload = async () => {
    if (!eventId) return;
    try {
      setLoading(true);
      const e = await eventService.getById(eventId);
      setEvent(e as SupabaseEvent);
      const attendeesData = await loadAttendeesWithProfiles(eventId);
      setAttendees(attendeesData);
      const { count: regCount, error: regError } = await supabase
        .from('event_attendees')
        .select('*', { count: 'exact', head: true })
        .eq('event_id', eventId);
      setRegisteredCount(
        typeof regCount === 'number' && !regError
          ? regCount
          : (e?.signup_count ?? attendeesData.length)
      );
      const { count: ciCount } = await supabase
        .from('event_checkins')
        .select('*', { count: 'exact', head: true })
        .eq('event_id', eventId);
      setCheckinCount(ciCount || 0);

      const logItems = await loadActivity(eventId);
      setActivity(logItems);

      const { data: sessions } = await supabase
        .from('volunteer_sessions')
        .select('user_id')
        .eq('event_id', eventId)
        .eq('status', 'active');
      setActiveSessions(new Set((sessions || []).map((s: any) => s.user_id)));
    } catch (err) {
      console.error('Failed to reload event', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAdminCheckIn = async (userId: string) => {
    if (!user || !event || !isAdmin) return;
    try {
      setCheckingInOut(userId);
      await eventService.adminCheckIn(event.id, userId, user.id);
      await reload();
    } catch (err: any) {
      console.error('Failed to check in user:', err);
      alert(err.message || 'Failed to check in user');
    } finally {
      setCheckingInOut(null);
    }
  };

  const handleAdminCheckOut = async (userId: string) => {
    if (!user || !event || !isAdmin) return;
    try {
      setCheckingInOut(userId);
      await eventService.adminCheckOut(event.id, userId, user.id);
      await reload();
    } catch (err: any) {
      console.error('Failed to check out user:', err);
      alert(err.message || 'Failed to check out user');
    } finally {
      setCheckingInOut(null);
    }
  };

  const loadActivity = async (eId: string) => {
    try {
      // Try simple queries without joins first
      const checkinsRes = await supabase
        .from('event_checkins')
        .select('user_id, checked_in_at, created_at')
        .eq('event_id', eId)
        .order('created_at', { ascending: false });

      const adminAuditRes = await supabase
        .from('admin_checkin_audit')
        .select('user_id, action, timestamp')
        .eq('event_id', eId)
        .order('timestamp', { ascending: false });

      const sessionsRes = await supabase
        .from('volunteer_sessions')
        .select('user_id, started_at, ended_at')
        .eq('event_id', eId)
        .order('started_at', { ascending: false });

      const checkins = (checkinsRes.data || []).map((r: any) => ({
        type: 'checkin' as const,
        user_id: r.user_id,
        at: r.checked_in_at || r.created_at
      }));

      const sessions = (sessionsRes.data || []).flatMap((s: any) => {
        const items: Array<{ type: 'checkin' | 'checkout'; user_id: string; at: string }> = [];
        if (s.started_at) items.push({ type: 'checkin', user_id: s.user_id, at: s.started_at });
        if (s.ended_at) items.push({ type: 'checkout', user_id: s.user_id, at: s.ended_at });
        return items;
      });

      const admin = (adminAuditRes.data || [])
        .filter((r: any) => r.action === 'checkout' || r.action === 'checkin')
        .map((r: any) => ({
          type: (r.action === 'checkout' ? 'checkout' : 'checkin') as 'checkin' | 'checkout',
          user_id: r.user_id,
          at: r.timestamp,
        }));

      const mergedBase = [...checkins, ...sessions, ...admin];
      const merged = mergedBase
        .filter((m) => !!m.at)
        .sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime());

      // Enrich with user names
      const userIds = Array.from(new Set(merged.map(m => m.user_id).filter(Boolean)));
      if (userIds.length > 0) {
        try {
          const { data: users } = await supabase
            .from('users')
            .select('id, name, email, avatar_url')
            .in('id', userIds);
          const map: Record<string, any> = Object.fromEntries((users || []).map((u: any) => [u.id, u]));
          return merged.map(m => ({ ...m, user: map[m.user_id] }));
        } catch (_) {
          return merged;
        }
      }
      return merged;
    } catch (err) {
      console.error('[EventActivity] Failed to load activity log', err);
      return [];
    }
  };

  if (loading || !event) {
    return (
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-center min-h-96">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-hiveYellow border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-hiveGray">Loading event...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <HiveButton variant="outline" onClick={() => router.push(`/organizations/${orgId}/events`)}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Events
          </HiveButton>
          <span className={`px-3 py-1 rounded-full text-xs font-semibold capitalize ${statusBadge}`}>
            {event.status === 'in_progress' ? 'ongoing' : event.status === 'published' ? 'upcoming' : event.status}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <HiveButton variant="ghost" onClick={reload} disabled={loading}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </HiveButton>
          {isAdmin && event.status === 'published' && (
            <HiveButton onClick={handleStart} disabled={updating}>
              <Play className="w-4 h-4 mr-2" />
              {updating ? 'Starting...' : 'Start Event'}
            </HiveButton>
          )}
          {isAdmin && event.status === 'in_progress' && (
            <HiveButton variant="secondary" onClick={handleEnd} disabled={updating}>
              <StopCircle className="w-4 h-4 mr-2" />
              {updating ? 'Ending...' : 'End Event'}
            </HiveButton>
          )}
        </div>
      </div>

      <HiveCard hoverable={false}>
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-hiveGray-dark mb-2">{event.title}</h1>
            <p className="text-hiveGray mb-4">{event.description}</p>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-hiveGray">
                <Calendar className="w-4 h-4 text-hiveYellow" />
                <span className="text-sm">{event.date}</span>
              </div>
              <div className="flex items-center gap-2 text-hiveGray">
                <Clock className="w-4 h-4 text-hiveYellow" />
                <span className="text-sm">{`${event.time}${event.end_time ? ` - ${event.end_time}` : ''}`}</span>
              </div>
              {event.location && (
                <div className="flex items-center gap-2 text-hiveGray">
                  <MapPin className="w-4 h-4 text-hiveYellow" />
                  <span className="text-sm">{event.location}</span>
                </div>
              )}
            </div>
          </div>
          <div className="w-full md:w-80">
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl border-2 border-hiveGray-light p-3 text-center">
                <div className="text-xs text-hiveGray">Registered</div>
                <div className="text-lg font-bold text-hiveGray-dark">{registeredCount} / {event.max_attendees}</div>
              </div>
              <div className="rounded-xl border-2 border-hiveGray-light p-3 text-center">
                <div className="text-xs text-hiveGray">Check-ins</div>
                <div className="text-lg font-bold text-hiveGray-dark">{checkinCount}</div>
              </div>
              <div className="rounded-xl border-2 border-hiveGray-light p-3 text-center">
                <div className="text-xs text-hiveGray">Start</div>
                <div className="text-sm font-semibold text-hiveGray-dark">{event.started_at ? new Date(event.started_at).toLocaleString() : '-'}</div>
              </div>
              <div className="rounded-xl border-2 border-hiveGray-light p-3 text-center">
                <div className="text-xs text-hiveGray">End</div>
                <div className="text-sm font-semibold text-hiveGray-dark">{event.ended_at ? new Date(event.ended_at).toLocaleString() : '-'}</div>
              </div>
            </div>
          </div>
        </div>
      </HiveCard>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <HiveCard hoverable={false} className="lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-hiveYellow" />
              <h3 className="text-lg font-bold text-hiveGray-dark">Attendees ({registeredCount})</h3>
            </div>
          </div>
          <div className="space-y-2 max-h-[28rem] overflow-y-auto pr-1">
            {attendees.length === 0 && registeredCount === 0 ? (
              <div className="text-center py-12 text-hiveGray">No attendees yet</div>
            ) : (
              attendees.map((attendee: any) => (
                <div key={attendee.id} className="flex items-center justify-between p-3 rounded-lg border-2 border-hiveGray-light">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-hiveYellow rounded-lg flex items-center justify-center">
                      {attendee.user?.avatar_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={attendee.user.avatar_url} alt={attendee.user.name} className="w-full h-full rounded-lg object-cover" />
                      ) : (
                        <span className="text-lg font-bold text-hiveGray-dark">
                          {(attendee.user?.name?.charAt(0)) || (attendee.user_id?.charAt(0)) || 'U'}
                        </span>
                      )}
                    </div>
                    <div>
                      <p className="font-semibold text-hiveGray-dark">{attendee.user?.name || `User ${attendee.user_id?.slice(0, 6)}…`}</p>
                      <p className="text-sm text-hiveGray">{attendee.user?.email || `ID: ${attendee.user_id}`}</p>
                      <p className="text-xs text-hiveGray mt-1">Registered: {attendee.joined_at ? new Date(attendee.joined_at).toLocaleString() : (attendee.created_at ? new Date(attendee.created_at).toLocaleString() : '-')}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-1 rounded text-xs font-semibold ${attendee.status === 'confirmed' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                      {attendee.status}
                    </span>
                    {isAdmin && event.status === 'in_progress' && (
                      activeSessions.has(attendee.user_id) ? (
                        <button
                          onClick={() => handleAdminCheckOut(attendee.user_id)}
                          disabled={checkingInOut === attendee.user_id}
                          className="px-3 py-1 bg-gray-700 text-white rounded text-xs font-semibold hover:bg-gray-800 transition-colors disabled:opacity-50"
                        >
                          {checkingInOut === attendee.user_id ? 'Checking Out...' : 'Check Out'}
                        </button>
                      ) : (
                        <button
                          onClick={() => handleAdminCheckIn(attendee.user_id)}
                          disabled={checkingInOut === attendee.user_id}
                          className="px-3 py-1 bg-green-600 text-white rounded text-xs font-semibold hover:bg-green-700 transition-colors disabled:opacity-50"
                        >
                          {checkingInOut === attendee.user_id ? 'Checking In...' : 'Check In'}
                        </button>
                      )
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </HiveCard>

        <HiveCard hoverable={false}>
          <div className="flex items-center gap-2 mb-4">
            <Shield className="w-5 h-5 text-hiveYellow" />
            <h3 className="text-lg font-bold text-hiveGray-dark">Admin Details</h3>
          </div>
          <div className="space-y-2 text-sm text-hiveGray">
            <div className="flex items-center justify-between">
              <span>Status</span>
              <span className="font-semibold text-hiveGray-dark">{event.status}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Capacity</span>
              <span className="font-semibold text-hiveGray-dark">{event.max_attendees}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Created</span>
              <span className="font-semibold text-hiveGray-dark">{new Date(event.created_at).toLocaleString()}</span>
            </div>
            {event.updated_at && (
              <div className="flex items-center justify-between">
                <span>Updated</span>
                <span className="font-semibold text-hiveGray-dark">{new Date(event.updated_at).toLocaleString()}</span>
              </div>
            )}
            {selectedOrg?.role === 'admin' && (
              <div className="pt-3 mt-3 border-t border-hiveGray-light">
                {event.status === 'published' && (
                  <HiveButton onClick={handleStart} disabled={updating} className="w-full">
                    <Play className="w-4 h-4 mr-2" />
                    {updating ? 'Starting...' : 'Start Event'}
                  </HiveButton>
                )}
                {event.status === 'in_progress' && (
                  <HiveButton variant="secondary" onClick={handleEnd} disabled={updating} className="w-full">
                    <StopCircle className="w-4 h-4 mr-2" />
                    {updating ? 'Ending...' : 'End Event'}
                  </HiveButton>
                )}
              </div>
            )}
          </div>
        </HiveCard>
      </div>

      <div className="grid grid-cols-1 gap-6">
        <HiveCard hoverable={false}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-hiveYellow" />
              <h3 className="text-lg font-bold text-hiveGray-dark">Event Activity</h3>
            </div>
          </div>
          <div className="space-y-2">
            {activity.length === 0 ? (
              <div className="text-center py-12 text-hiveGray">No activity yet</div>
            ) : (
              activity.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 rounded-lg border-2 border-hiveGray-light">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${item.type === 'checkin' ? 'bg-green-100' : 'bg-gray-200'}`}>
                      {item.type === 'checkin' ? (
                        <LogIn className="w-5 h-5 text-green-700" />
                      ) : (
                        <LogOut className="w-5 h-5 text-gray-700" />
                      )}
                    </div>
                    <div>
                      <p className="font-semibold text-hiveGray-dark">
                        {item.user?.name || `User ${item.user_id?.slice(0, 6)}…`} {item.type === 'checkin' ? 'checked in' : 'checked out'}
                      </p>
                      <p className="text-xs text-hiveGray">{new Date(item.at).toLocaleString()}</p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </HiveCard>
      </div>
    </div>
  );
}


