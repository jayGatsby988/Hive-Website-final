# 🚨 RUN THIS SQL TO ENABLE AUDIT LOG

## What This Does

**Connects EVERYTHING to Supabase automatically!**

The audit log will track:
- ✅ **Event created** - Someone creates an event
- ✅ **Event updated** - Someone edits an event
- ✅ **Event deleted** - Someone deletes an event
- ✅ **Event signup** - Someone signs up for an event
- ✅ **Check-in** - Someone checks in (admin or self)
- ✅ **Check-out** - Someone checks out (admin or self)
- ✅ **Member joined** - Someone joins organization
- ✅ **Role changed** - Someone's role changes
- ✅ **Role assigned** - Someone gets a new role

## How It Works

**Supabase Database Triggers** = Automatic tracking!

Every time something happens in these tables:
- `events` → Logs creation, updates, deletion
- `event_attendees` → Logs signups
- `event_checkins` → Logs check-ins and check-outs
- `organization_members` → Logs joins and role changes
- `user_organization_roles` → Logs role assignments

**The trigger fires automatically and logs to `audit_log` table!**

## Setup (Takes 30 seconds)

### Step 1: Open Supabase
1. Go to your Supabase Dashboard
2. Click **SQL Editor** (left sidebar)
3. Click **New Query**

### Step 2: Copy & Paste
1. Open file: **`SETUP_AUDIT_LOG.sql`**
2. Copy **entire file** (Cmd+A, Cmd+C)
3. Paste into SQL Editor (Cmd+V)

### Step 3: Run
1. Click **RUN** (or press Cmd+Enter)
2. Wait for success message
3. Should see: "✅✅✅ AUDIT LOG SYSTEM CREATED! ✅✅✅"

### Step 4: Verify
1. Refresh your browser at http://localhost:3000
2. Log in as admin
3. Go to **Audit Log** in sidebar
4. Done! 🎉

## Test That It Works

### Test 1: Create Event
1. Create a new event
2. Go to Audit Log
3. **Should see**: "Your Name created event 'Event Title'"
4. **Expand it**: See all event details

### Test 2: Sign Up for Event
1. As a member, sign up for an event
2. Admin checks Audit Log
3. **Should see**: "Member Name signed up for 'Event Title'"

### Test 3: Check In
1. Member checks in to event
2. Admin checks Audit Log
3. **Should see**: "Member Name checked in to 'Event Title'"
4. **Timestamp**: Shows exact time

### Test 4: Check Out
1. Member checks out from event
2. Admin checks Audit Log
3. **Should see**: "Member Name checked out from 'Event Title'"

## What Gets Logged (Automatically)

### Event Actions:
- **Create Event** → "John created event 'Beach Cleanup'" + all details
- **Update Event** → "Sarah updated event 'Food Drive'" + what changed
- **Delete Event** → "Mike deleted event 'Old Event'" + final state

### Attendance Actions:
- **Sign Up** → "Emily signed up for 'Beach Cleanup'"
- **Check In** → "Tom checked in to 'Food Drive'" + timestamp
- **Check Out** → "Lisa checked out from 'Food Drive'" + duration

### Member Actions:
- **Join** → "Alex joined the organization"
- **Role Change** → "Jane's role changed from member to admin"
- **Role Assigned** → "Chris was assigned 'volunteer' role"

## Each Log Entry Contains:

```json
{
  "id": "unique-log-id",
  "organization_id": "org-id",
  "user_id": "user-id",
  "user_name": "John Doe",
  "user_email": "john@example.com",
  "action": "EVENT_CREATED",
  "entity_type": "event",
  "entity_id": "event-id",
  "entity_name": "Beach Cleanup",
  "details": {
    "date": "2025-12-15",
    "time": "09:00",
    "location": "Santa Monica Beach",
    "max_attendees": 50
  },
  "timestamp": "2025-12-04T15:45:32.123Z"
}
```

## The Triggers (Built-In)

These run **automatically** in Supabase:

1. `trigger_audit_event_created` → Fires on INSERT into `events`
2. `trigger_audit_event_updated` → Fires on UPDATE of `events`
3. `trigger_audit_event_deleted` → Fires on DELETE from `events`
4. `trigger_audit_event_signup` → Fires on INSERT into `event_attendees`
5. `trigger_audit_checkin` → Fires on INSERT/UPDATE of `event_checkins`
6. `trigger_audit_member_joined` → Fires on INSERT into `organization_members`
7. `trigger_audit_member_role_changed` → Fires on UPDATE of `organization_members`
8. `trigger_audit_role_assigned` → Fires on INSERT into `user_organization_roles`

**No manual logging needed! It's all automatic!**

## After Running SQL

### You'll Have:
- ✅ `audit_log` table created
- ✅ 8 triggers installed on tables
- ✅ RLS policies set (admin-only)
- ✅ Indexes for fast queries
- ✅ `log_audit_action()` function

### You Can:
- ✅ View all logs in UI
- ✅ Search by user/action/entity
- ✅ Filter by date/action type
- ✅ Export to CSV
- ✅ See real-time updates

### Every Action Tracked:
- ✅ Events (create/update/delete)
- ✅ Signups (who signed up)
- ✅ Check-ins (who checked in)
- ✅ Check-outs (who checked out)
- ✅ Members (who joined)
- ✅ Roles (who got what role)

## Important Notes

### It's Automatic!
- ❌ No need to manually log actions
- ❌ No need to call functions in your code
- ✅ Triggers fire automatically when data changes
- ✅ Everything is connected to Supabase

### It's Secure!
- ✅ Only admins can view logs
- ✅ Logs can't be deleted by users
- ✅ All actions are tracked
- ✅ Timestamps are accurate

### It's Complete!
- ✅ Every action has user name
- ✅ Every action has timestamp
- ✅ Every action has full details
- ✅ Everything is searchable

## Troubleshooting

### "No logs appearing"
**Problem**: SQL not run yet
**Solution**: Run `SETUP_AUDIT_LOG.sql` in Supabase

### "Can't see Audit Log page"
**Problem**: Not an admin
**Solution**: Make sure you're admin in organization

### "Logs not updating"
**Problem**: Old data, need refresh
**Solution**: Click "Refresh" button in Audit Log UI

### "Error in SQL"
**Problem**: Table already exists
**Solution**: Triggers use `IF NOT EXISTS`, safe to re-run

## Summary

**File to run**: `SETUP_AUDIT_LOG.sql`

**Where**: Supabase Dashboard → SQL Editor

**How long**: 30 seconds

**What it does**: Creates automatic logging for EVERYTHING

**Connected to**:
- ✅ Supabase `events` table
- ✅ Supabase `event_attendees` table
- ✅ Supabase `event_checkins` table
- ✅ Supabase `organization_members` table
- ✅ Supabase `user_organization_roles` table

**Result**: Complete audit trail of all actions!

---

## 🎯 Quick Start (30 Seconds)

1. **Open Supabase** → SQL Editor
2. **Copy** `SETUP_AUDIT_LOG.sql`
3. **Paste** into editor
4. **Click RUN**
5. **Refresh browser**
6. **Done!** ✅

**Everything is now connected and tracking automatically!** 🚀

