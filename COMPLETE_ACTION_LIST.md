# 📋 Complete List of Tracked Actions

## Every Action Tracked by the Audit Log System

### ✅ Event Management Actions

#### 1. EVENT_CREATED
**When**: Admin creates a new event
**Who**: Admin creating the event
**Details Logged**:
- Event date
- Event time
- Location
- Max attendees
- Allowed roles
**Example**: "John Doe created event 'Beach Cleanup'"

#### 2. EVENT_UPDATED
**When**: Admin edits event details (not start/end)
**Who**: Admin making changes
**Details Logged**:
- What changed (before → after)
- Title changes
- Date changes
- Time changes
- Location changes
- Max attendees changes
- Allowed roles changes
**Example**: "Sarah Smith updated event 'Food Drive'"

#### 3. EVENT_STARTED ⭐ NEW!
**When**: Admin clicks "Start Event" button
**Who**: Admin starting the event
**Details Logged**:
- Admin name
- Started timestamp
- Previous status (usually "published")
- New status ("in_progress")
**Example**: "John Doe started event 'Beach Cleanup'"

#### 4. EVENT_ENDED ⭐ NEW!
**When**: Admin clicks "End Event" button
**Who**: Admin ending the event
**Details Logged**:
- Admin name
- Ended timestamp
- Started timestamp
- Duration in minutes
- Previous status ("in_progress")
- New status ("completed")
**Example**: "Sarah Smith ended event 'Food Drive'"

#### 5. EVENT_DELETED
**When**: Admin deletes an event
**Who**: Admin deleting the event
**Details Logged**:
- Event date
- Signup count (how many were registered)
**Example**: "Mike Johnson deleted event 'Old Event'"

---

### ✅ Attendance Actions

#### 6. EVENT_SIGNUP
**When**: User signs up for an event
**Who**: User signing up
**Details Logged**:
- User name
- Status (usually "confirmed")
**Example**: "Emily Chen signed up for 'Beach Cleanup'"

#### 7. EVENT_CHECKIN
**When**: User checks in (admin or self)
**Who**: User being checked in
**Details Logged**:
- User name
- Check-in timestamp
- Whether admin checked them in
- Checked in by admin flag
**Example**: "Tom Jones checked in to 'Food Drive'"

#### 8. EVENT_CHECKOUT
**When**: User checks out (admin or self)
**Who**: User being checked out
**Details Logged**:
- User name
- Check-in timestamp
- Check-out timestamp
- Duration (calculated)
**Example**: "Lisa Wang checked out from 'Food Drive'"

---

### ✅ Member Management Actions

#### 9. MEMBER_JOINED
**When**: New member joins organization
**Who**: New member
**Details Logged**:
- Member role (admin/member)
- Organization name
**Example**: "Alex Brown joined the organization"

#### 10. MEMBER_ROLE_CHANGED
**When**: Admin changes a member's role
**Who**: Member whose role is changing
**Details Logged**:
- Old role
- New role
**Example**: "Jane Smith's role was changed from member to admin"

---

### ✅ Role Assignment Actions

#### 11. ROLE_ASSIGNED
**When**: User selects or is assigned an organizational role
**Who**: User receiving the role
**Details Logged**:
- Role name (e.g., "volunteer", "coordinator")
- Who assigned it (if admin-assigned)
**Example**: "Chris Lee was assigned 'volunteer' role"

---

## Summary of All Tracked Actions

| # | Action | Category | Trigger | Logged Info |
|---|--------|----------|---------|-------------|
| 1 | EVENT_CREATED | Event | INSERT events | Date, time, location, capacity, roles |
| 2 | EVENT_UPDATED | Event | UPDATE events | What changed (before/after) |
| 3 | **EVENT_STARTED** | **Event** | **Status → in_progress** | **Admin, timestamp, duration** |
| 4 | **EVENT_ENDED** | **Event** | **Status → completed** | **Admin, timestamp, duration** |
| 5 | EVENT_DELETED | Event | DELETE events | Date, signup count |
| 6 | EVENT_SIGNUP | Attendance | INSERT event_attendees | User, status |
| 7 | EVENT_CHECKIN | Attendance | INSERT event_checkins | User, time, admin flag |
| 8 | EVENT_CHECKOUT | Attendance | UPDATE event_checkins | User, in/out time, duration |
| 9 | MEMBER_JOINED | Members | INSERT organization_members | Role, organization |
| 10 | MEMBER_ROLE_CHANGED | Members | UPDATE organization_members | Old role, new role |
| 11 | ROLE_ASSIGNED | Roles | INSERT user_organization_roles | Role name, assigned by |

---

## Real-World Example Timeline

```
Dec 4, 2025, 10:00 AM
[EVENT_CREATED] John Doe created event "Beach Cleanup"
  Details: {date: "2025-12-15", location: "Santa Monica Beach", max_attendees: 50}

Dec 4, 2025, 11:30 AM
[EVENT_SIGNUP] Sarah Smith signed up for "Beach Cleanup"
  Details: {user: "Sarah Smith", status: "confirmed"}

Dec 4, 2025, 2:00 PM
[EVENT_UPDATED] John Doe updated event "Beach Cleanup"
  Details: {changes: {max_attendees: {old: 50, new: 100}}}

Dec 10, 2025, 3:15 PM
[ROLE_ASSIGNED] Sarah Smith was assigned 'volunteer' role
  Details: {role: "volunteer", assigned_by: "John Doe"}

Dec 15, 2025, 8:55 AM
⭐ [EVENT_STARTED] John Doe started event "Beach Cleanup"
  Details: {admin: "John Doe", started_at: "2025-12-15T08:55:00Z", 
           previous_status: "published", new_status: "in_progress"}

Dec 15, 2025, 9:05 AM
[EVENT_CHECKIN] Sarah Smith checked in to "Beach Cleanup"
  Details: {user: "Sarah Smith", check_in_time: "2025-12-15T09:05:00Z", 
           checked_in_by_admin: false}

Dec 15, 2025, 9:10 AM
[EVENT_CHECKIN] Tom Jones checked in to "Beach Cleanup"
  Details: {user: "Tom Jones", check_in_time: "2025-12-15T09:10:00Z", 
           checked_in_by_admin: true}

Dec 15, 2025, 12:30 PM
[EVENT_CHECKOUT] Sarah Smith checked out from "Beach Cleanup"
  Details: {user: "Sarah Smith", check_in_time: "2025-12-15T09:05:00Z",
           check_out_time: "2025-12-15T12:30:00Z"}

Dec 15, 2025, 12:35 PM
[EVENT_CHECKOUT] Tom Jones checked out from "Beach Cleanup"
  Details: {user: "Tom Jones", check_in_time: "2025-12-15T09:10:00Z",
           check_out_time: "2025-12-15T12:35:00Z"}

Dec 15, 2025, 1:00 PM
⭐ [EVENT_ENDED] John Doe ended event "Beach Cleanup"
  Details: {admin: "John Doe", ended_at: "2025-12-15T13:00:00Z",
           started_at: "2025-12-15T08:55:00Z", duration_minutes: 245,
           previous_status: "in_progress", new_status: "completed"}
```

---

## What's New (EVENT_STARTED & EVENT_ENDED)

### Why These Matter

**Before**: When an admin started or ended an event, it just looked like a status update.

**Now**: These actions are tracked separately with full context!

### EVENT_STARTED Captures:
- ✅ Which admin started the event
- ✅ Exact timestamp when event started
- ✅ Status transition (published → in_progress)
- ✅ Event name and details

**Use Case**: "Who started the event early?" → Check audit log!

### EVENT_ENDED Captures:
- ✅ Which admin ended the event
- ✅ Exact timestamp when event ended
- ✅ How long the event ran (duration in minutes)
- ✅ When it started (for reference)
- ✅ Status transition (in_progress → completed)

**Use Case**: "How long did the event actually run?" → Check audit log!

---

## Automatic vs Manual Logging

### ✅ Automatic (Via Database Triggers)
All 11 actions above are logged **automatically**!
- No code needed
- Triggers fire on database changes
- Always reliable
- Never miss an action

### ⚠️ Manual (If Needed for Custom Actions)
```typescript
// Only for custom actions not listed above
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

---

## Filter by Action Type in UI

In the Audit Log page, you can filter to show only specific actions:

- **All Actions** - See everything
- **Event Created** - Only event creations
- **Event Started** - Only when events were started
- **Event Ended** - Only when events were ended
- **Event Updated** - Only event edits
- **Event Deleted** - Only event deletions
- **Event Signup** - Only signups
- **Checked In** - Only check-ins
- **Checked Out** - Only check-outs
- **Member Joined** - Only new members
- **Role Changed** - Only role changes
- **Role Assigned** - Only role assignments

---

## Action Color Coding

In the UI, each action has a unique color:

| Action | Color | Badge |
|--------|-------|-------|
| EVENT_CREATED | 🟢 Green | Created |
| EVENT_UPDATED | 🔵 Blue | Updated |
| EVENT_DELETED | 🔴 Red | Deleted |
| **EVENT_STARTED** | **🟢 Emerald** | **Started** |
| **EVENT_ENDED** | **⚪ Gray** | **Ended** |
| EVENT_SIGNUP | 🟣 Purple | Signup |
| EVENT_CHECKIN | 🔷 Teal | Checked In |
| EVENT_CHECKOUT | 🟪 Indigo | Checked Out |
| MEMBER_JOINED | 🟢 Green | Joined |
| MEMBER_ROLE_CHANGED | 🟠 Orange | Role Changed |
| ROLE_ASSIGNED | 🟣 Purple | Role Assigned |

---

## Complete Tracking = Complete Transparency

**Everything is tracked. Nothing is hidden.**

Every action an admin takes:
- ✅ Creating events
- ✅ Updating events
- ✅ **Starting events**
- ✅ **Ending events**
- ✅ Deleting events
- ✅ Checking people in
- ✅ Checking people out
- ✅ Changing member roles

Every action a member takes:
- ✅ Signing up for events
- ✅ Checking themselves in
- ✅ Checking themselves out
- ✅ Joining organization
- ✅ Selecting roles

**All automatically logged with:**
- Who did it
- When they did it (to the second)
- What they did
- Full details (JSON)

---

## Ready to Use!

Just run `SETUP_AUDIT_LOG.sql` in Supabase and all 11 actions will be tracked automatically!

**Every admin action, every member action, everything!** 🎉




