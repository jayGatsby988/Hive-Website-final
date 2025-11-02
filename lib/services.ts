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

    // Add new attendee
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
    // Start a volunteer session
    const { error: sessionError } = await supabase
      .from('volunteer_sessions')
      .insert({
        user_id: userId,
        event_id: eventId,
        started_at: new Date().toISOString(),
        status: 'active'
      })

    if (sessionError) throw sessionError

    // Log admin action
    const { error: auditError } = await supabase
      .from('admin_checkin_audit')
      .insert({
        event_id: eventId,
        user_id: userId,
        admin_id: adminId,
        action: 'checkin',
        timestamp: new Date().toISOString()
      })

    if (auditError) console.error('Failed to log admin check-in audit:', auditError)
  },

  async adminCheckOut(eventId: string, userId: string, adminId: string): Promise<void> {
    // Find active session
    const { data: sessions, error: fetchError } = await supabase
      .from('volunteer_sessions')
      .select('*')
      .eq('event_id', eventId)
      .eq('user_id', userId)
      .eq('status', 'active')
      .order('started_at', { ascending: false })
      .limit(1)

    if (fetchError) throw fetchError

    if (!sessions || sessions.length === 0) {
      throw new Error('No active session found for this user')
    }

    const session = sessions[0]
    const endedAt = new Date().toISOString()

    // End the session
    const { error: updateError } = await supabase
      .from('volunteer_sessions')
      .update({
        ended_at: endedAt,
        status: 'completed'
      })
      .eq('id', session.id)

    if (updateError) throw updateError

    // Calculate hours
    const startTime = new Date(session.started_at).getTime()
    const endTime = new Date(endedAt).getTime()
    const hours = (endTime - startTime) / (1000 * 60 * 60)

    // Get event details for organization_id
    const { data: event } = await supabase
      .from('events')
      .select('organization_id')
      .eq('id', eventId)
      .single()

    // Record volunteer hours
    if (event) {
      const { error: hoursError } = await supabase
        .from('volunteer_hours')
        .insert({
          user_id: userId,
          event_id: eventId,
          organization_id: event.organization_id,
          date: session.started_at.split('T')[0],
          hours: parseFloat(hours.toFixed(2)),
          notes: `Auto-tracked from event session`
        })

      if (hoursError) console.error('Failed to record volunteer hours:', hoursError)
    }

    // Log admin action
    const { error: auditError } = await supabase
      .from('admin_checkin_audit')
      .insert({
        event_id: eventId,
        user_id: userId,
        admin_id: adminId,
        action: 'checkout',
        timestamp: endedAt
      })

    if (auditError) console.error('Failed to log admin check-out audit:', auditError)
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

    const orgIds = memberships.map(m => m.organization_id)

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
    return data?.map(item => ({
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
