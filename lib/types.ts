// Database Types based on Supabase Schema

export interface User {
  id: string
  email: string
  name: string
  job_title?: string
  avatar_url?: string
  role: 'super_admin' | 'admin' | 'volunteer' | 'user'
  is_verified: boolean
  phone?: string
  bio?: string
  created_at: string
  updated_at: string
  admin: boolean
  user_metadata: Record<string, any>
}

export interface Organization {
  id: string
  name: string
  description?: string
  logo_url?: string
  website?: string
  address?: string
  phone?: string
  email?: string
  created_by?: string
  is_active: boolean
  created_at: string
  updated_at: string
  join_code?: string
}

export interface OrganizationMember {
  id: string
  organization_id: string
  user_id: string
  role: 'admin' | 'member'
  joined_at: string
  is_active: boolean
}

export interface Event {
  id: string
  title: string
  description: string
  date: string
  time: string
  end_time?: string
  location?: string
  address?: string
  latitude?: number
  longitude?: number
  capacity: number
  status: 'draft' | 'published' | 'in_progress' | 'completed' | 'cancelled'
  event_type: string
  is_private: boolean
  requires_approval: boolean
  organization_id: string
  created_by: string
  created_at: string
  updated_at: string
  invite_code?: string
  tags: string[]
  registration_deadline?: string
  signup_count: number
  role_restrictions?: string[]
  started_at?: string
  ended_at?: string
  start_time?: string
  max_attendees: number
  is_active: boolean
  start_type: 'manual' | 'auto'
  auto_start_enabled: boolean
}

export interface EventAttendee {
  id: string
  event_id: string
  user_id: string
  status: string
  check_in_time: string
  created_at: string
  joined_at: string
  updated_at: string
}

export interface EventCheckin {
  id: string
  event_id: string
  user_id: string
  latitude: number
  longitude: number
  checked_in_at: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface EventCategory {
  id: string
  name: string
  description?: string
  color: string
  icon?: string
  created_at: string
}

export interface EventCategoryMapping {
  id: string
  event_id: string
  category_id: string
}

export interface EventSession {
  id: string
  event_id?: string
  started_by?: string
  started_at: string
  ended_at?: string
  status: 'active' | 'completed' | 'cancelled'
  metadata: Record<string, any>
  created_at: string
  updated_at: string
}

export interface EventWaitlist {
  id: string
  event_id: string
  user_id: string
  joined_at: string
  waitlist_position: number
  status: 'waiting' | 'promoted' | 'cancelled'
  created_at: string
  updated_at: string
}

export interface VolunteerEvent {
  id: string
  user_id: string
  event_id: string
  organization_id: string
  status: 'active' | 'completed' | 'cancelled'
  joined_at: string
  completed_at?: string
  hours_volunteered: number
  notes?: string
  created_at: string
  updated_at: string
}

export interface VolunteerHours {
  id: string
  user_id: string
  event_id?: string
  organization_id?: string
  date: string
  hours: number
  notes?: string
  created_at: string
  updated_at: string
}

export interface VolunteerSession {
  id: string
  user_id: string
  event_id: string
  started_at: string
  ended_at?: string
  last_seen_at: string
  status: 'active' | 'completed'
}

export interface Notification {
  id: string
  user_id: string
  title: string
  message: string
  type: 'info' | 'success' | 'warning' | 'error'
  is_read: boolean
  data?: Record<string, any>
  created_at: string
}

export interface Announcement {
  id: string
  organization_id?: string
  created_by?: string
  title: string
  message: string
  priority: 'low' | 'normal' | 'high' | 'urgent'
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface MemberAction {
  id: string
  organization_id?: string
  target_user_id?: string
  action_by?: string
  action_type: 'promote' | 'demote' | 'remove' | 'invite' | 'join' | 'leave'
  old_role?: string
  new_role?: string
  reason?: string
  created_at: string
}

export interface OrganizationRole {
  id: string
  organization_id: string
  role_name: string
  is_public: boolean
  options: string[]
  created_at: string
  updated_at: string
}

export interface OrganizationMemberRole {
  id: string
  user_id: string
  organization_id: string
  role_name: string
  created_at: string
}

export interface UserOrganizationRole {
  id: string
  user_id: string
  organization_id: string
  role_name: string
  role_option?: string
  assigned_at: string
  assigned_by?: string
}

export interface RolePermission {
  id: string
  role: string
  permission: string
  granted: boolean
  created_at: string
  updated_at: string
  organization_id: string
}

export interface UserLocation {
  id: string
  user_id: string
  event_id: string
  latitude: number
  longitude: number
  accuracy?: number
  is_sharing: boolean
  last_updated: string
  created_at: string
}

export interface UserNotificationPreference {
  id: string
  user_id: string
  notification_type: string
  email_enabled: boolean
  push_enabled: boolean
  in_app_enabled: boolean
  created_at: string
  updated_at: string
}

export interface VerificationCode {
  id: string
  email: string
  code: string
  expires_at: string
  created_at: string
  used_at?: string
}

export interface AdminCheckinAudit {
  id: string
  event_id: string
  user_id: string
  admin_id: string
  action: 'checkin' | 'checkout'
  timestamp: string
  notes?: string
}

// Database response types
export type Database = {
  public: {
    Tables: {
      users: {
        Row: User
        Insert: Omit<User, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<User, 'id' | 'created_at' | 'updated_at'>>
      }
      organizations: {
        Row: Organization
        Insert: Omit<Organization, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<Organization, 'id' | 'created_at' | 'updated_at'>>
      }
      organization_members: {
        Row: OrganizationMember
        Insert: Omit<OrganizationMember, 'id'>
        Update: Partial<Omit<OrganizationMember, 'id'>>
      }
      events: {
        Row: Event
        Insert: Omit<Event, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<Event, 'id' | 'created_at' | 'updated_at'>>
      }
      event_attendees: {
        Row: EventAttendee
        Insert: Omit<EventAttendee, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<EventAttendee, 'id' | 'created_at' | 'updated_at'>>
      }
      event_checkins: {
        Row: EventCheckin
        Insert: Omit<EventCheckin, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<EventCheckin, 'id' | 'created_at' | 'updated_at'>>
      }
      event_categories: {
        Row: EventCategory
        Insert: Omit<EventCategory, 'id' | 'created_at'>
        Update: Partial<Omit<EventCategory, 'id' | 'created_at'>>
      }
      event_category_mapping: {
        Row: EventCategoryMapping
        Insert: Omit<EventCategoryMapping, 'id'>
        Update: Partial<Omit<EventCategoryMapping, 'id'>>
      }
      event_sessions: {
        Row: EventSession
        Insert: Omit<EventSession, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<EventSession, 'id' | 'created_at' | 'updated_at'>>
      }
      event_waitlist: {
        Row: EventWaitlist
        Insert: Omit<EventWaitlist, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<EventWaitlist, 'id' | 'created_at' | 'updated_at'>>
      }
      volunteer_events: {
        Row: VolunteerEvent
        Insert: Omit<VolunteerEvent, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<VolunteerEvent, 'id' | 'created_at' | 'updated_at'>>
      }
      volunteer_hours: {
        Row: VolunteerHours
        Insert: Omit<VolunteerHours, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<VolunteerHours, 'id' | 'created_at' | 'updated_at'>>
      }
      volunteer_sessions: {
        Row: VolunteerSession
        Insert: Omit<VolunteerSession, 'id'>
        Update: Partial<Omit<VolunteerSession, 'id'>>
      }
      notifications: {
        Row: Notification
        Insert: Omit<Notification, 'id' | 'created_at'>
        Update: Partial<Omit<Notification, 'id' | 'created_at'>>
      }
      announcements: {
        Row: Announcement
        Insert: Omit<Announcement, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<Announcement, 'id' | 'created_at' | 'updated_at'>>
      }
      member_actions: {
        Row: MemberAction
        Insert: Omit<MemberAction, 'id' | 'created_at'>
        Update: Partial<Omit<MemberAction, 'id' | 'created_at'>>
      }
      organization_roles: {
        Row: OrganizationRole
        Insert: Omit<OrganizationRole, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<OrganizationRole, 'id' | 'created_at' | 'updated_at'>>
      }
      organization_member_roles: {
        Row: OrganizationMemberRole
        Insert: Omit<OrganizationMemberRole, 'id' | 'created_at'>
        Update: Partial<Omit<OrganizationMemberRole, 'id' | 'created_at'>>
      }
      user_organization_roles: {
        Row: UserOrganizationRole
        Insert: Omit<UserOrganizationRole, 'id' | 'assigned_at'>
        Update: Partial<Omit<UserOrganizationRole, 'id' | 'assigned_at'>>
      }
      role_permissions: {
        Row: RolePermission
        Insert: Omit<RolePermission, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<RolePermission, 'id' | 'created_at' | 'updated_at'>>
      }
      user_locations: {
        Row: UserLocation
        Insert: Omit<UserLocation, 'id' | 'created_at'>
        Update: Partial<Omit<UserLocation, 'id' | 'created_at'>>
      }
      user_notification_preferences: {
        Row: UserNotificationPreference
        Insert: Omit<UserNotificationPreference, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<UserNotificationPreference, 'id' | 'created_at' | 'updated_at'>>
      }
      verification_codes: {
        Row: VerificationCode
        Insert: Omit<VerificationCode, 'id' | 'created_at'>
        Update: Partial<Omit<VerificationCode, 'id' | 'created_at'>>
      }
      admin_checkin_audit: {
        Row: AdminCheckinAudit
        Insert: Omit<AdminCheckinAudit, 'id' | 'timestamp'>
        Update: Partial<Omit<AdminCheckinAudit, 'id' | 'timestamp'>>
      }
    }
  }
}
