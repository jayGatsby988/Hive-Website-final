import { supabase } from './supabase'
import { 
  Organization, 
  Event, 
  EventAttendee, 
  User, 
  OrganizationMember,
  VolunteerHours,
  Notification,
  Announcement
} from './types'

// Organization Services
export const organizationService = {
  async getAll(): Promise<Organization[]> {
    const { data, error } = await supabase
      .from('organizations')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data || []
  },

  async getOrganizationWithStats(organizationId: string): Promise<{
    organization: Organization,
    memberCount: number,
    eventCount: number
  }> {
    // Get organization
    const { data: org, error: orgError } = await supabase
      .from('organizations')
      .select('*')
      .eq('id', organizationId)
      .single()

    if (orgError) throw orgError

    // Get member count
    const { count: memberCount, error: memberError } = await supabase
      .from('organization_members')
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', organizationId)
      .eq('is_active', true)

    if (memberError) throw memberError

    // Get active event count
    const { count: eventCount, error: eventError } = await supabase
      .from('events')
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', organizationId)
      .eq('is_active', true)
      .in('status', ['published', 'in_progress'])

    if (eventError) throw eventError

    return {
      organization: org,
      memberCount: memberCount || 0,
      eventCount: eventCount || 0
    }
  },

  async getById(id: string): Promise<Organization | null> {
    const { data, error } = await supabase
      .from('organizations')
      .select('*')
      .eq('id', id)
      .single()

    if (error) throw error
    return data
  },

  async create(organization: Omit<Organization, 'id' | 'created_at' | 'updated_at'>): Promise<Organization> {
    const { data, error } = await supabase
      .from('organizations')
      .insert(organization)
      .select()
      .single()

    if (error) throw error
    return data
  },

  async update(id: string, updates: Partial<Organization>): Promise<Organization> {
    const { data, error } = await supabase
      .from('organizations')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data
  },

  async getMembers(organizationId: string): Promise<OrganizationMember[]> {
    const { data, error } = await supabase
      .from('organization_members')
      .select(`
        *,
        users:user_id (
          id,
          name,
          email,
          avatar_url,
          role
        )
      `)
      .eq('organization_id', organizationId)
      .eq('is_active', true)

    if (error) throw error
    return data || []
  },

  async joinOrganization(organizationId: string, userId: string, role: string = 'member'): Promise<void> {
    // Check if user is already a member
    const { data: existingMember } = await supabase
      .from('organization_members')
      .select('id')
      .eq('organization_id', organizationId)
      .eq('user_id', userId)
      .single()

    if (existingMember) {
      // User is already a member, update their status to active
      const { error: updateError } = await supabase
        .from('organization_members')
        .update({ is_active: true })
        .eq('organization_id', organizationId)
        .eq('user_id', userId)
      
      if (updateError) throw updateError
      return
    }

    // Add new member
    const { error } = await supabase
      .from('organization_members')
      .insert({
        organization_id: organizationId,
        user_id: userId,
        role: (role === 'admin' || role === 'member') ? role : 'member',
        is_active: true,
      })

    if (error) throw error
  },

  async leaveOrganization(organizationId: string, userId: string): Promise<void> {
    const { error } = await supabase
      .from('organization_members')
      .update({ is_active: false })
      .eq('organization_id', organizationId)
      .eq('user_id', userId)

    if (error) throw error
  },

  async updateMemberRole(organizationId: string, memberId: string, newRole: string): Promise<void> {
    const { error } = await supabase
      .from('organization_members')
      .update({ role: newRole })
      .eq('organization_id', organizationId)
      .eq('id', memberId)

    if (error) throw error
  },

  async updateMemberStatus(organizationId: string, memberId: string, isActive: boolean): Promise<void> {
    const { error } = await supabase
      .from('organization_members')
      .update({ is_active: isActive })
      .eq('organization_id', organizationId)
      .eq('id', memberId)

    if (error) throw error
  },

  async removeMember(organizationId: string, memberId: string): Promise<void> {
    const { error } = await supabase
      .from('organization_members')
      .delete()
      .eq('organization_id', organizationId)
      .eq('id', memberId)

    if (error) throw error
  }
}

// Event Services
export const eventService = {
  async getAll(): Promise<Event[]> {
    const { data, error } = await supabase
      .from('events')
      .select(`
        *,
        organizations:organization_id (
          id,
          name,
          logo_url
        )
      `)
      .eq('is_active', true)
      .order('date', { ascending: true })

    if (error) throw error
    return data || []
  },

  async getById(id: string): Promise<Event | null> {
    const { data, error } = await supabase
      .from('events')
      .select(`
        *,
        organizations:organization_id (
          id,
          name,
          logo_url
        )
      `)
      .eq('id', id)
      .single()

    if (error) throw error
    return data
  },

  async getByOrganization(organizationId: string): Promise<Event[]> {
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('is_active', true)
      .order('date', { ascending: true })

    if (error) throw error
    return data || []
  },

  async create(event: Omit<Event, 'id' | 'created_at' | 'updated_at'>): Promise<Event> {
    const { data, error } = await supabase
      .from('events')
      .insert(event)
      .select()
      .single()

    if (error) throw error
    return data
  },

  async update(id: string, updates: Partial<Event>): Promise<Event> {
    const { data, error } = await supabase
      .from('events')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data
  },

  async startEvent(eventId: string): Promise<Event> {
    const { data, error } = await supabase
      .from('events')
      .update({
        status: 'in_progress',
        started_at: new Date().toISOString()
      })
      .eq('id', eventId)
      .select()
      .single()

    if (error) throw error
    return data
  },

  async endEvent(eventId: string): Promise<Event> {
    const { data, error } = await supabase
      .from('events')
      .update({
        status: 'completed',
        ended_at: new Date().toISOString()
      })
      .eq('id', eventId)
      .select()
      .single()

    if (error) throw error
    return data
  },

  async joinEvent(eventId: string, userId: string): Promise<void> {
    // Check if user is already registered
    const { data: existingAttendee } = await supabase
      .from('event_attendees')
      .select('id')
      .eq('event_id', eventId)
      .eq('user_id', userId)
      .single()

    if (existingAttendee) {
      // User is already registered
      console.log('User is already registered for this event')
      return
    }

    // Check event capacity
    const { data: event } = await supabase
      .from('events')
      .select('max_attendees, signup_count')
      .eq('id', eventId)
      .single()

    if (event && event.signup_count >= event.max_attendees) {
      throw new Error('Event is full. Maximum capacity reached.')
    }

    // Add new attendee (trigger will auto-increment signup_count)
    const { error } = await supabase
      .from('event_attendees')
      .insert({
        event_id: eventId,
        user_id: userId,
        status: 'confirmed',
        joined_at: new Date().toISOString()
      })

    if (error) {
      // Handle duplicate key error gracefully
      if (error.code === '23505') {
        console.log('User is already registered for this event')
        return
      }
      throw error
    }
  },

  async leaveEvent(eventId: string, userId: string): Promise<void> {
    // Delete attendee (trigger will auto-decrement signup_count)
    const { error } = await supabase
      .from('event_attendees')
      .delete()
      .eq('event_id', eventId)
      .eq('user_id', userId)

    if (error) throw error
  },

  async getAttendees(eventId: string): Promise<EventAttendee[]> {
    const { data, error } = await supabase
      .from('event_attendees')
      .select(`
        *,
        users:user_id (
          id,
          name,
          email,
          avatar_url
        )
      `)
      .eq('event_id', eventId)

    if (error) throw error
    return data || []
  },

  async checkIn(eventId: string, userId: string, latitude: number, longitude: number): Promise<void> {
    const { error } = await supabase
      .from('event_checkins')
      .insert({
        event_id: eventId,
        user_id: userId,
        latitude,
        longitude,
      })

    if (error) throw error
  },

  async adminCheckIn(eventId: string, userId: string, adminId: string): Promise<void> {
    console.log('[adminCheckIn] Starting check-in:', { eventId, userId, adminId });
    
    // Check if user already has an active check-in
    const { data: existing, error: checkError } = await supabase
      .from('event_checkins')
      .select('id')
      .eq('event_id', eventId)
      .eq('user_id', userId)
      .is('check_out_time', null)
      .maybeSingle();

    console.log('[adminCheckIn] Existing check-in:', existing, checkError);

    if (checkError) {
      console.error('[adminCheckIn] Error checking existing:', checkError);
      throw new Error(`Failed to check existing check-in: ${checkError.message}`);
    }

    if (existing) {
      console.warn('[adminCheckIn] User already checked in');
      throw new Error('User is already checked in to this event');
    }

    // Create check-in record
    const checkinData = {
      user_id: userId,
      event_id: eventId,
      check_in_time: new Date().toISOString(),
      checked_in_by_admin: true
    };
    
    console.log('[adminCheckIn] Inserting check-in:', checkinData);
    
    const { data: result, error: insertError } = await supabase
      .from('event_checkins')
      .insert(checkinData)
      .select();

    console.log('[adminCheckIn] Insert result:', result, insertError);

    if (insertError) {
      console.error('[adminCheckIn] Insert failed:', insertError);
      throw new Error(`Failed to check in: ${insertError.message}`);
    }

    // Log admin action
    const auditData = {
      event_id: eventId,
      user_id: userId,
      admin_id: adminId,
      action: 'checkin' as const,
      timestamp: new Date().toISOString()
    };
    
    console.log('[adminCheckIn] Logging audit:', auditData);
    
    const { error: auditError } = await supabase
      .from('admin_checkin_audit')
      .insert(auditData);

    if (auditError) {
      console.error('[adminCheckIn] Failed to log audit:', auditError);
    } else {
      console.log('[adminCheckIn] Successfully checked in user');
    }
  },

  async adminCheckOut(eventId: string, userId: string, adminId: string): Promise<void> {
    console.log('[adminCheckOut] Starting check-out:', { eventId, userId, adminId });
    
    // Find active check-in
    const { data: checkins, error: fetchError } = await supabase
      .from('event_checkins')
      .select('*')
      .eq('event_id', eventId)
      .eq('user_id', userId)
      .is('check_out_time', null)
      .order('check_in_time', { ascending: false })
      .limit(1)

    console.log('[adminCheckOut] Active check-ins found:', checkins, fetchError);

    if (fetchError) {
      console.error('[adminCheckOut] Error fetching:', fetchError);
      throw new Error(`Failed to fetch check-in: ${fetchError.message}`);
    }

    if (!checkins || checkins.length === 0) {
      console.warn('[adminCheckOut] No active check-in found');
      throw new Error('User is not currently checked in to this event');
    }

    const checkin = checkins[0]
    const checkOutTime = new Date().toISOString()

    console.log('[adminCheckOut] Ending check-in:', checkin.id, 'started:', checkin.check_in_time);

    // Set check-out time
    const { error: updateError } = await supabase
      .from('event_checkins')
      .update({
        check_out_time: checkOutTime
      })
      .eq('id', checkin.id)

    console.log('[adminCheckOut] Update result:', updateError);

    if (updateError) {
      console.error('[adminCheckOut] Update failed:', updateError);
      throw new Error(`Failed to check out: ${updateError.message}`);
    }

    // Calculate hours with high precision (for minute/second display)
    const startTime = new Date(checkin.check_in_time).getTime()
    const endTime = new Date(checkOutTime).getTime()
    const hours = (endTime - startTime) / (1000 * 60 * 60)

    // Get event details for organization_id
    const { data: event } = await supabase
      .from('events')
      .select('organization_id')
      .eq('id', eventId)
      .single()

    // Record volunteer hours with high precision (6 decimal places for seconds accuracy)
    if (event) {
      console.log('[adminCheckOut] Recording volunteer hours:', {
        userId,
        eventId,
        organizationId: event.organization_id,
        hours: parseFloat(hours.toFixed(6))
      });

      const { data: hoursData, error: hoursError } = await supabase
        .from('volunteer_hours')
        .insert({
          user_id: userId,
          event_id: eventId,
          organization_id: event.organization_id,
          date: checkin.check_in_time.split('T')[0],
          hours: parseFloat(hours.toFixed(6)),
          notes: `Checked out by admin`
        })
        .select();

      if (hoursError) {
        console.error('[adminCheckOut] FAILED to record volunteer hours:', hoursError);
        console.error('[adminCheckOut] Hour data attempted:', {
          user_id: userId,
          event_id: eventId,
          organization_id: event.organization_id,
          hours: parseFloat(hours.toFixed(6))
        });
      } else {
        console.log('[adminCheckOut] ✅ Successfully recorded volunteer hours:', hoursData);
      }
    } else {
      console.error('[adminCheckOut] No event data found, cannot record hours');
    }

    // Log admin action
    const { error: auditError } = await supabase
      .from('admin_checkin_audit')
      .insert({
        event_id: eventId,
        user_id: userId,
        admin_id: adminId,
        action: 'checkout',
        timestamp: checkOutTime
      })

    if (auditError) console.error('Failed to log admin check-out audit:', auditError)
  },

  // Self check-in for mobile app / user-initiated check-ins
  async selfCheckIn(eventId: string, userId: string, latitude?: number, longitude?: number): Promise<void> {
    // Check if user already has an active check-in (no check_out_time)
    const { data: existing } = await supabase
      .from('event_checkins')
      .select('id')
      .eq('event_id', eventId)
      .eq('user_id', userId)
      .is('check_out_time', null)
      .maybeSingle()

    if (existing) {
      throw new Error('User already has an active check-in for this event')
    }

    // Create check-in record
    const { error } = await supabase
      .from('event_checkins')
      .insert({
        event_id: eventId,
        user_id: userId,
        check_in_time: new Date().toISOString(),
        checked_in_by_admin: false,
        latitude: latitude || null,
        longitude: longitude || null
      })

    if (error) throw error
  },

  // Self check-out for mobile app / user-initiated check-outs
  async selfCheckOut(eventId: string, userId: string): Promise<void> {
    // Find active check-in (no check_out_time set)
    const { data: checkins, error: fetchError } = await supabase
      .from('event_checkins')
      .select('*')
      .eq('event_id', eventId)
      .eq('user_id', userId)
      .is('check_out_time', null)
      .order('check_in_time', { ascending: false })
      .limit(1)

    if (fetchError) throw fetchError

    if (!checkins || checkins.length === 0) {
      throw new Error('No active check-in found for this user')
    }

    const checkin = checkins[0]
    const checkOutTime = new Date().toISOString()

    // Set check-out time
    const { error: updateError } = await supabase
      .from('event_checkins')
      .update({
        check_out_time: checkOutTime
      })
      .eq('id', checkin.id)

    if (updateError) throw updateError

    // Calculate hours
    const startTime = new Date(checkin.check_in_time).getTime()
    const endTime = new Date(checkOutTime).getTime()
    const hours = (endTime - startTime) / (1000 * 60 * 60)

    // Get event details for organization_id
    const { data: event } = await supabase
      .from('events')
      .select('organization_id')
      .eq('id', eventId)
      .single()

    // Record volunteer hours with high precision (6 decimal places for seconds accuracy)
    if (event) {
      console.log('[selfCheckOut] Recording volunteer hours:', {
        userId,
        eventId,
        organizationId: event.organization_id,
        hours: parseFloat(hours.toFixed(6))
      });

      const { data: hoursData, error: hoursError } = await supabase
        .from('volunteer_hours')
        .insert({
          user_id: userId,
          event_id: eventId,
          organization_id: event.organization_id,
          date: checkin.check_in_time.split('T')[0],
          hours: parseFloat(hours.toFixed(6)),
          notes: `Self-tracked from check-in`
        })
        .select();

      if (hoursError) {
        console.error('[selfCheckOut] FAILED to record volunteer hours:', hoursError);
        console.error('[selfCheckOut] Hour data attempted:', {
          user_id: userId,
          event_id: eventId,
          organization_id: event.organization_id,
          hours: parseFloat(hours.toFixed(6))
        });
      } else {
        console.log('[selfCheckOut] ✅ Successfully recorded volunteer hours:', hoursData);
      }
    } else {
      console.error('[selfCheckOut] No event data found, cannot record hours');
    }
  },

  async getUserOrganizationEvents(userId: string): Promise<Event[]> {
    // Get user's organizations
    const { data: memberships, error: memberError } = await supabase
      .from('organization_members')
      .select('organization_id')
      .eq('user_id', userId)
      .eq('is_active', true)

    if (memberError) throw memberError

    if (!memberships || memberships.length === 0) {
      return []
    }

    const orgIds = memberships.map((m: any) => m.organization_id)

    // Get events from those organizations
    const { data, error } = await supabase
      .from('events')
      .select(`
        *,
        organizations:organization_id (
          id,
          name,
          logo_url
        )
      `)
      .in('organization_id', orgIds)
      .eq('is_active', true)
      .in('status', ['published', 'in_progress'])
      .order('date', { ascending: true })

    if (error) throw error
    return data || []
  }
}

// User Services
export const userService = {
  async getById(id: string): Promise<User | null> {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', id)
      .single()

    if (error) throw error
    return data
  },

  async updateProfile(id: string, updates: Partial<User>): Promise<User> {
    const { data, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data
  },

  async getUserOrganizations(userId: string): Promise<Array<Organization & { userRole: string }>> {
    const { data, error } = await supabase
      .from('organization_members')
      .select(`
        role,
        organizations:organization_id (
          id,
          name,
          description,
          logo_url,
          website,
          address,
          phone,
          email,
          created_by,
          is_active,
          join_code,
          created_at,
          updated_at
        )
      `)
      .eq('user_id', userId)
      .eq('is_active', true)

    if (error) throw error
    
    // Map to include user's role in each organization
    return data?.map((item: any) => ({
      ...item.organizations,
      userRole: item.role
    })).filter(Boolean) || []
  },

  async getVolunteerHours(organizationId: string): Promise<VolunteerHours[]> {
    const { data, error } = await supabase
      .from('volunteer_hours')
      .select(`
        *,
        events:event_id (
          id,
          title,
          organization_id
        )
      `)
      .eq('events.organization_id', organizationId)

    if (error) throw error
    return data || []
  }
}

// Volunteer Hours Services
export const volunteerHoursService = {
  async getUserHours(userId: string): Promise<VolunteerHours[]> {
    const { data, error } = await supabase
      .from('volunteer_hours')
      .select(`
        *,
        events:event_id (
          id,
          title,
          date
        ),
        organizations:organization_id (
          id,
          name
        )
      `)
      .eq('user_id', userId)
      .order('date', { ascending: false })

    if (error) throw error
    return data || []
  },

  async addHours(hours: Omit<VolunteerHours, 'id' | 'created_at' | 'updated_at'>): Promise<VolunteerHours> {
    const { data, error } = await supabase
      .from('volunteer_hours')
      .insert(hours)
      .select()
      .single()

    if (error) throw error
    return data
  },

  async updateHours(id: string, updates: Partial<VolunteerHours>): Promise<VolunteerHours> {
    const { data, error } = await supabase
      .from('volunteer_hours')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data
  },

  async deleteHours(id: string): Promise<void> {
    const { error } = await supabase
      .from('volunteer_hours')
      .delete()
      .eq('id', id)

    if (error) throw error
  }
}

// Notification Services
export const notificationService = {
  async getUserNotifications(userId: string): Promise<Notification[]> {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data || []
  },

  async markAsRead(notificationId: string): Promise<void> {
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', notificationId)

    if (error) throw error
  },

  async createNotification(notification: Omit<Notification, 'id' | 'created_at'>): Promise<Notification> {
    const { data, error } = await supabase
      .from('notifications')
      .insert(notification)
      .select()
      .single()

    if (error) throw error
    return data
  }
}

// Announcement Services
export const announcementService = {
  async getByOrganization(organizationId: string): Promise<Announcement[]> {
    const { data, error } = await supabase
      .from('announcements')
      .select(`
        *,
        users:created_by (
          id,
          name,
          avatar_url
        )
      `)
      .eq('organization_id', organizationId)
      .eq('is_active', true)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data || []
  },

  async create(announcement: Omit<Announcement, 'id' | 'created_at' | 'updated_at'>): Promise<Announcement> {
    const { data, error } = await supabase
      .from('announcements')
      .insert(announcement)
      .select()
      .single()

    if (error) throw error
    return data
  },

  async update(id: string, updates: Partial<Announcement>): Promise<Announcement> {
    const { data, error } = await supabase
      .from('announcements')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('announcements')
      .update({ is_active: false })
      .eq('id', id)

    if (error) throw error
  }
}

// Role Management Services
export const roleService = {
  // Get all roles for an organization
  async getOrganizationRoles(organizationId: string) {
    const { data, error } = await supabase
      .from('organization_roles')
      .select('*')
      .eq('organization_id', organizationId)
      .order('role_name', { ascending: true })

    if (error) throw error
    return data || []
  },

  // Get user's roles in an organization
  async getUserRoles(userId: string, organizationId: string) {
    const { data, error } = await supabase
      .from('user_organization_roles')
      .select('*')
      .eq('user_id', userId)
      .eq('organization_id', organizationId)

    if (error) throw error
    return data || []
  },

  // Assign a role to a user
  async assignRole(userId: string, organizationId: string, roleName: string, assignedBy?: string) {
    const { data, error } = await supabase
      .from('user_organization_roles')
      .insert({
        user_id: userId,
        organization_id: organizationId,
        role_name: roleName,
        assigned_by: assignedBy || userId,
        assigned_at: new Date().toISOString()
      })
      .select()
      .single()

    if (error) {
      // Handle duplicate key error gracefully
      if (error.code === '23505') {
        console.log('User already has this role');
        return null;
      }
      throw error;
    }
    return data
  },

  // Remove a role from a user
  async removeRole(userId: string, organizationId: string, roleName: string) {
    const { error } = await supabase
      .from('user_organization_roles')
      .delete()
      .eq('user_id', userId)
      .eq('organization_id', organizationId)
      .eq('role_name', roleName)

    if (error) throw error
  },

  // Get all users with a specific role
  async getUsersWithRole(organizationId: string, roleName: string) {
    const { data, error } = await supabase
      .from('user_organization_roles')
      .select(`
        *,
        users:user_id (
          id,
          name,
          email,
          avatar_url
        )
      `)
      .eq('organization_id', organizationId)
      .eq('role_name', roleName)

    if (error) throw error
    return data || []
  },

  // Create a new role for an organization (admin only)
  async createOrganizationRole(organizationId: string, roleName: string, isPublic: boolean = true, options: string[] = []) {
    const { data, error } = await supabase
      .from('organization_roles')
      .insert({
        organization_id: organizationId,
        role_name: roleName,
        is_public: isPublic,
        options: options
      })
      .select()
      .single()

    if (error) {
      if (error.code === '23505') {
        throw new Error('A role with this name already exists in this organization');
      }
      throw error;
    }
    return data
  },

  // Delete a role from an organization
  async deleteOrganizationRole(organizationId: string, roleName: string) {
    // First, remove all user assignments of this role
    await supabase
      .from('user_organization_roles')
      .delete()
      .eq('organization_id', organizationId)
      .eq('role_name', roleName)

    // Then delete the role itself
    const { error } = await supabase
      .from('organization_roles')
      .delete()
      .eq('organization_id', organizationId)
      .eq('role_name', roleName)

    if (error) throw error
  },

  // Check if event is visible to user based on roles
  async canUserViewEvent(userId: string, eventId: string): Promise<boolean> {
    const { data, error } = await supabase
      .rpc('user_can_view_event', {
        p_user_id: userId,
        p_event_id: eventId
      })

    if (error) {
      console.error('Error checking event visibility:', error);
      return true; // Fail open - if function doesn't exist, show event
    }
    return data || false
  },
}

// Audit Log Services
export const auditLogService = {
  /**
   * Get audit logs for an organization (admin only)
   */
  async getOrganizationLogs(organizationId: string, limit: number = 100): Promise<any[]> {
    const { data, error } = await supabase
      .from('audit_log')
      .select('*')
      .eq('organization_id', organizationId)
      .order('timestamp', { ascending: false })
      .limit(limit)

    if (error) {
      console.error('Error fetching audit logs:', error)
      throw error
    }
    return data || []
  },

  /**
   * Get audit logs filtered by action type
   */
  async getLogsByAction(organizationId: string, action: string, limit: number = 50): Promise<any[]> {
    const { data, error } = await supabase
      .from('audit_log')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('action', action)
      .order('timestamp', { ascending: false })
      .limit(limit)

    if (error) throw error
    return data || []
  },

  /**
   * Get audit logs for a specific user
   */
  async getLogsByUser(organizationId: string, userId: string, limit: number = 50): Promise<any[]> {
    const { data, error } = await supabase
      .from('audit_log')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('user_id', userId)
      .order('timestamp', { ascending: false })
      .limit(limit)

    if (error) throw error
    return data || []
  },

  /**
   * Get audit logs for a specific entity (e.g., specific event)
   */
  async getLogsByEntity(organizationId: string, entityType: string, entityId: string, limit: number = 50): Promise<any[]> {
    const { data, error } = await supabase
      .from('audit_log')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('entity_type', entityType)
      .eq('entity_id', entityId)
      .order('timestamp', { ascending: false })
      .limit(limit)

    if (error) throw error
    return data || []
  },

  /**
   * Manually log an action (for actions not covered by triggers)
   */
  async logAction(
    organizationId: string,
    userId: string,
    action: string,
    entityType: string,
    entityId?: string,
    entityName?: string,
    details?: any
  ): Promise<void> {
    const { error } = await supabase.rpc('log_audit_action', {
      p_organization_id: organizationId,
      p_user_id: userId,
      p_action: action,
      p_entity_type: entityType,
      p_entity_id: entityId || null,
      p_entity_name: entityName || null,
      p_details: details || {}
    })

    if (error) {
      console.error('Error logging audit action:', error)
      throw error
    }
  },

  /**
   * Get logs with date range
   */
  async getLogsByDateRange(
    organizationId: string,
    startDate: string,
    endDate: string,
    limit: number = 100
  ): Promise<any[]> {
    const { data, error } = await supabase
      .from('audit_log')
      .select('*')
      .eq('organization_id', organizationId)
      .gte('timestamp', startDate)
      .lte('timestamp', endDate)
      .order('timestamp', { ascending: false })
      .limit(limit)

    if (error) throw error
    return data || []
  },

  /**
   * Search logs by text
   */
  async searchLogs(organizationId: string, searchTerm: string, limit: number = 50): Promise<any[]> {
    const { data, error } = await supabase
      .from('audit_log')
      .select('*')
      .eq('organization_id', organizationId)
      .or(`user_name.ilike.%${searchTerm}%,entity_name.ilike.%${searchTerm}%,action.ilike.%${searchTerm}%`)
      .order('timestamp', { ascending: false })
      .limit(limit)

    if (error) throw error
    return data || []
  }
}
