# 🔗 Audit Log - Complete Supabase Connections

## How Everything is Connected

```
┌─────────────────────────────────────────────────────────────┐
│                    SUPABASE DATABASE                        │
└─────────────────────────────────────────────────────────────┘
                            │
                            │ Automatic Triggers
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                TABLE: events                                │
│  - User creates event    →  trigger_audit_event_created     │
│  - User updates event    →  trigger_audit_event_updated     │
│  - User deletes event    →  trigger_audit_event_deleted     │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       │ Automatically logs to ↓
                       ▼
┌─────────────────────────────────────────────────────────────┐
│                TABLE: audit_log                             │
│                                                             │
│  Stores:                                                    │
│  - user_name: "John Doe"                                    │
│  - user_email: "john@example.com"                           │
│  - action: "EVENT_CREATED"                                  │
│  - entity_name: "Beach Cleanup"                             │
│  - timestamp: "2025-12-04T15:45:32Z"                        │
│  - details: { date, time, location, etc }                   │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       │ Admins view via ↓
                       ▼
┌─────────────────────────────────────────────────────────────┐
│          AUDIT LOG PAGE (UI)                                │
│  /organizations/[id]/audit-log                              │
│                                                             │
│  - View all logs                                            │
│  - Search logs                                              │
│  - Filter by action/date                                    │
│  - Export to CSV                                            │
└─────────────────────────────────────────────────────────────┘
```

## Complete Connection Map

### 1. Event Tracking
```
events table
    │
    ├─ INSERT (new event)
    │   └─→ trigger_audit_event_created
    │       └─→ INSERT into audit_log
    │           ├─ action: "EVENT_CREATED"
    │           ├─ user_name: from users table
    │           ├─ entity_name: event title
    │           └─ details: {date, time, location, max_attendees}
    │
    ├─ UPDATE (edit event)
    │   └─→ trigger_audit_event_updated
    │       └─→ INSERT into audit_log
    │           ├─ action: "EVENT_UPDATED"
    │           └─ details: {changes: {old → new}}
    │
    └─ DELETE (remove event)
        └─→ trigger_audit_event_deleted
            └─→ INSERT into audit_log
                ├─ action: "EVENT_DELETED"
                └─ details: {date, signup_count}
```

### 2. Signup Tracking
```
event_attendees table
    │
    └─ INSERT (user signs up)
        └─→ trigger_audit_event_signup
            └─→ INSERT into audit_log
                ├─ action: "EVENT_SIGNUP"
                ├─ user_name: from users table
                ├─ entity_name: event title
                └─ details: {user, status}
```

### 3. Check-In/Out Tracking
```
event_checkins table
    │
    ├─ INSERT (check in)
    │   └─→ trigger_audit_checkin
    │       └─→ INSERT into audit_log
    │           ├─ action: "EVENT_CHECKIN"
    │           ├─ user_name: from users table
    │           ├─ entity_name: event title
    │           └─ details: {user, check_in_time, checked_in_by_admin}
    │
    └─ UPDATE (check out)
        └─→ trigger_audit_checkin
            └─→ INSERT into audit_log
                ├─ action: "EVENT_CHECKOUT"
                └─ details: {user, check_in_time, check_out_time}
```

### 4. Member Tracking
```
organization_members table
    │
    ├─ INSERT (new member)
    │   └─→ trigger_audit_member_joined
    │       └─→ INSERT into audit_log
    │           ├─ action: "MEMBER_JOINED"
    │           ├─ user_name: from users table
    │           └─ details: {role, organization}
    │
    └─ UPDATE (role change)
        └─→ trigger_audit_member_role_changed
            └─→ INSERT into audit_log
                ├─ action: "MEMBER_ROLE_CHANGED"
                └─ details: {old_role, new_role}
```

### 5. Role Tracking
```
user_organization_roles table
    │
    └─ INSERT (role assigned)
        └─→ trigger_audit_role_assigned
            └─→ INSERT into audit_log
                ├─ action: "ROLE_ASSIGNED"
                ├─ user_name: from users table
                └─ details: {role, assigned_by}
```

## Example Flow: User Signs Up for Event

```
1. User clicks "Sign Up" button
   ↓
2. Frontend calls: eventService.signUp(eventId, userId)
   ↓
3. Supabase INSERT into event_attendees:
   {
     event_id: "event-123",
     user_id: "user-456",
     status: "confirmed"
   }
   ↓
4. Trigger fires: trigger_audit_event_signup
   ↓
5. Trigger gets user name from users table
   ↓
6. Trigger gets event title from events table
   ↓
7. Trigger calls: log_audit_action()
   ↓
8. Function INSERTs into audit_log:
   {
     organization_id: "org-789",
     user_id: "user-456",
     user_name: "John Doe",
     user_email: "john@example.com",
     action: "EVENT_SIGNUP",
     entity_type: "event_attendee",
     entity_name: "Beach Cleanup",
     details: {
       user: "John Doe",
       status: "confirmed"
     },
     timestamp: NOW()
   }
   ↓
9. Admin views Audit Log page
   ↓
10. Page queries audit_log table
   ↓
11. Displays: "John Doe signed up for 'Beach Cleanup'"
```

## Example Flow: Admin Checks In Member

```
1. Admin clicks "Check In" button for member
   ↓
2. Frontend calls: eventService.adminCheckIn(eventId, userId)
   ↓
3. Supabase INSERT into event_checkins:
   {
     event_id: "event-123",
     user_id: "user-456",
     check_in_time: NOW(),
     checked_in_by_admin: true
   }
   ↓
4. Trigger fires: trigger_audit_checkin
   ↓
5. Trigger detects: check_out_time is NULL → action = "EVENT_CHECKIN"
   ↓
6. Trigger gets user name and event title
   ↓
7. Trigger INSERTs into audit_log:
   {
     user_name: "Sarah Smith",
     action: "EVENT_CHECKIN",
     entity_name: "Food Drive",
     details: {
       user: "Sarah Smith",
       checked_in_by_admin: true,
       check_in_time: "2025-12-04T10:30:00Z"
     },
     timestamp: NOW()
   }
   ↓
8. Admin refreshes Audit Log
   ↓
9. Displays: "Sarah Smith checked in to 'Food Drive'"
```

## What's Automatic vs Manual

### ✅ AUTOMATIC (No code needed)
- Event creation → logged automatically
- Event updates → logged automatically
- Event deletion → logged automatically
- Event signups → logged automatically
- Check-ins → logged automatically
- Check-outs → logged automatically
- Member joins → logged automatically
- Role changes → logged automatically
- Role assignments → logged automatically

### ⚠️ MANUAL (If needed for custom actions)
```typescript
// For custom actions not covered by triggers
await auditLogService.logAction(
  organizationId,
  userId,
  'CUSTOM_ACTION',
  'entity_type',
  entityId,
  entityName,
  details
)
```

## Database Relationships

```
users table
    ↓ (user_id)
audit_log table
    ↓ (organization_id)
organizations table

events table
    ↓ (entity_id when entity_type = 'event')
audit_log table

event_attendees table
    ↓ (entity_id when entity_type = 'event_attendee')
audit_log table

event_checkins table
    ↓ (entity_id when entity_type = 'event_checkin')
audit_log table
```

## RLS Policies

```
audit_log table
    │
    ├─ SELECT policy: "admins_can_view_audit_logs"
    │   └─ Only users with role='admin' can view logs
    │
    └─ INSERT policy: "system_can_insert_audit_logs"
        └─ Authenticated users can insert (for triggers)
```

## UI to Database Flow

```
Audit Log Page
    │
    ├─ calls auditLogService.getOrganizationLogs(orgId)
    │   │
    │   └─→ Supabase SELECT from audit_log
    │       WHERE organization_id = orgId
    │       ORDER BY timestamp DESC
    │
    ├─ calls auditLogService.searchLogs(orgId, searchTerm)
    │   │
    │   └─→ Supabase SELECT from audit_log
    │       WHERE organization_id = orgId
    │       AND (user_name ILIKE '%term%' OR ...)
    │
    └─ calls auditLogService.getLogsByAction(orgId, action)
        │
        └─→ Supabase SELECT from audit_log
            WHERE organization_id = orgId
            AND action = 'EVENT_CREATED'
```

## Complete Audit Trail Example

### Timeline of Events:
```
Dec 4, 2025 10:00 AM - John creates "Beach Cleanup" event
                      └─→ EVENT_CREATED logged

Dec 4, 2025 11:30 AM - Sarah signs up for "Beach Cleanup"
                      └─→ EVENT_SIGNUP logged

Dec 4, 2025 02:00 PM - John updates "Beach Cleanup" (changes max_attendees)
                      └─→ EVENT_UPDATED logged

Dec 15, 2025 09:00 AM - Event starts, admin checks in Sarah
                       └─→ EVENT_CHECKIN logged

Dec 15, 2025 12:00 PM - Sarah checks herself out
                       └─→ EVENT_CHECKOUT logged

Dec 15, 2025 01:00 PM - Admin ends event
                       └─→ EVENT_UPDATED logged (status changed)
```

### Audit Log Shows:
```
[Dec 15, 2025, 1:00 PM] EVENT_UPDATED
  John Doe updated event "Beach Cleanup"

[Dec 15, 2025, 12:00 PM] EVENT_CHECKOUT
  Sarah Smith checked out from "Beach Cleanup"

[Dec 15, 2025, 9:00 AM] EVENT_CHECKIN
  Sarah Smith checked in to "Beach Cleanup"

[Dec 4, 2025, 2:00 PM] EVENT_UPDATED
  John Doe updated event "Beach Cleanup"

[Dec 4, 2025, 11:30 AM] EVENT_SIGNUP
  Sarah Smith signed up for "Beach Cleanup"

[Dec 4, 2025, 10:00 AM] EVENT_CREATED
  John Doe created event "Beach Cleanup"
```

## Summary

### Everything Connected to Supabase:
✅ Event creation → `events` table → `trigger_audit_event_created` → `audit_log` table
✅ Event signups → `event_attendees` table → `trigger_audit_event_signup` → `audit_log` table
✅ Check-ins → `event_checkins` table → `trigger_audit_checkin` → `audit_log` table
✅ All other actions → respective tables → respective triggers → `audit_log` table

### Fully Automatic:
- ✅ No manual logging code needed
- ✅ Triggers fire on INSERT/UPDATE/DELETE
- ✅ Everything happens in Supabase
- ✅ UI just reads from `audit_log` table

### Just Run SQL:
1. Open `SETUP_AUDIT_LOG.sql`
2. Run in Supabase SQL Editor
3. Done! Everything connected!

**All actions are now tracked automatically via Supabase!** 🎉

