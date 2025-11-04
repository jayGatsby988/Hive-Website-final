# 🔧 Fix Event Filtering - Complete Guide

## The Problem
Members are seeing ALL events regardless of their selected roles. The filtering should work automatically through Supabase RLS but isn't.

## The Solution
Run the SQL fix to ensure RLS policies are properly configured.

## 🚀 Quick Fix (2 Minutes)

### Step 1: Run the SQL Fix
1. Open Supabase Dashboard
2. Go to **SQL Editor**
3. Open file: `FIX_EVENT_FILTERING_NOW.sql`
4. Click **Run**
5. Wait for success messages

**This script does:**
- ✅ Ensures `allowed_roles` column exists
- ✅ Creates `user_can_view_event()` function
- ✅ Removes old/conflicting RLS policies
- ✅ Creates ONE correct RLS policy
- ✅ Enables RLS on events table
- ✅ Grants proper permissions

### Step 2: Test Manually in Supabase
After running the fix, test with SQL:

```sql
-- 1. Create a test event with role restriction
UPDATE events 
SET allowed_roles = ARRAY['volunteer']
WHERE title = 'YOUR-EVENT-NAME';

-- 2. Check if function works
SELECT 
  id,
  title,
  allowed_roles,
  user_can_view_event('YOUR-USER-ID', id) as can_user_view
FROM events
WHERE organization_id = 'YOUR-ORG-ID';

-- Expected: 
-- Events with allowed_roles = ['volunteer'] should return false for users without that role
-- Events with allowed_roles = [] or ['everyone'] should return true for all users
```

### Step 3: Test in the App
1. **Refresh your browser** (http://localhost:3000)
2. **Open Console** (F12)
3. **Log in as a member** (not admin)
4. **Go to Events page**
5. **Check console logs**:
   ```
   [EventsPage] Loading events for org: <org-id>
   [EventsPage] Current user: <user-id>
   [EventsPage] ✅ Loaded events from Supabase: [...]
   [EventsPage] Event count: X
   [EventsPage] Event "Event Name": { allowed_roles: [...], status: '...' }
   ```

6. **Go to "My Roles"**
7. **Select "volunteer" role**
8. **Go back to Events**
9. **You should now see different events!**

## 🔍 How to Verify It's Working

### Test Scenario 1: Everyone Event
```sql
-- Set event to show to everyone
UPDATE events 
SET allowed_roles = ARRAY['everyone']
WHERE id = 'event-id';

-- OR
UPDATE events 
SET allowed_roles = '{}'
WHERE id = 'event-id';
```

**Expected Result:**
- ALL members see this event
- Doesn't matter what roles they have

### Test Scenario 2: Volunteer-Only Event
```sql
-- Set event to show only to volunteers
UPDATE events 
SET allowed_roles = ARRAY['volunteer']
WHERE id = 'event-id';
```

**Expected Result:**
- Members with "volunteer" role: ✅ See event
- Members without role: ❌ Don't see event
- Admins: ✅ Always see event

### Test Scenario 3: Multiple Roles
```sql
-- Set event to show to volunteers OR team leads
UPDATE events 
SET allowed_roles = ARRAY['volunteer', 'team_lead']
WHERE id = 'event-id';
```

**Expected Result:**
- Members with "volunteer": ✅ See event
- Members with "team_lead": ✅ See event
- Members with BOTH: ✅ See event
- Members with NEITHER: ❌ Don't see event
- Admins: ✅ Always see event

## 🐛 Troubleshooting

### Issue: Still seeing all events

**Check 1: Is RLS enabled?**
```sql
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'events';
```
Should show `rowsecurity = true`

**Fix:**
```sql
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
```

**Check 2: Does function exist?**
```sql
SELECT proname FROM pg_proc WHERE proname = 'user_can_view_event';
```
Should return one row

**Fix:** Re-run `FIX_EVENT_FILTERING_NOW.sql`

**Check 3: Are policies active?**
```sql
SELECT policyname FROM pg_policies WHERE tablename = 'events';
```
Should show `role_based_event_select` and others

**Fix:** Re-run `FIX_EVENT_FILTERING_NOW.sql`

### Issue: Not seeing ANY events (even "everyone" events)

**Check: Do you have user_organization_roles entries?**
```sql
SELECT * FROM user_organization_roles 
WHERE user_id = 'YOUR-USER-ID';
```

**Problem:** Function might be too strict

**Fix:** The function now checks:
1. If `allowed_roles` is empty/null → Show to everyone ✅
2. If `allowed_roles` contains 'everyone' → Show to everyone ✅
3. If user is admin → Show to everyone ✅
4. Otherwise → Check user roles

### Issue: Admins don't see all events

**Check: Is user actually an admin?**
```sql
SELECT * FROM organization_members 
WHERE user_id = 'YOUR-USER-ID' 
AND organization_id = 'YOUR-ORG-ID';
```
Check that `role = 'admin'`

**Fix:** The function has admin bypass built-in

### Issue: Events with no allowed_roles set aren't showing

**Problem:** Null vs empty array handling

**Fix:**
```sql
-- Set all events without allowed_roles to show to everyone
UPDATE events 
SET allowed_roles = ARRAY['everyone']
WHERE allowed_roles IS NULL 
   OR allowed_roles = '{}' 
   OR array_length(allowed_roles, 1) IS NULL;
```

## 📊 How the Function Works

```sql
user_can_view_event(user_id, event_id)
  ↓
1. Get event's allowed_roles
  ↓
2. IF allowed_roles is empty/null
   THEN return TRUE (everyone can see)
  ↓
3. IF 'everyone' in allowed_roles
   THEN return TRUE
  ↓
4. Check if user is admin
   IF yes, THEN return TRUE
  ↓
5. Get user's roles from user_organization_roles
  ↓
6. IF user has ANY role that matches allowed_roles
   THEN return TRUE
  ↓
7. ELSE return FALSE (hide event)
```

## 🎯 Testing Checklist

### Setup (One Time)
- [ ] Run `FIX_EVENT_FILTERING_NOW.sql`
- [ ] Verify no SQL errors
- [ ] Check RLS is enabled: `SELECT rowsecurity FROM pg_tables WHERE tablename = 'events';`
- [ ] Check function exists: `SELECT proname FROM pg_proc WHERE proname = 'user_can_view_event';`

### Test as Member Without Roles
- [ ] Log in as regular member
- [ ] Don't select any roles
- [ ] Go to Events page
- [ ] Should see ONLY events with `allowed_roles = []` or `['everyone']`
- [ ] Should NOT see events with specific role requirements

### Test as Member With Volunteer Role
- [ ] Go to "My Roles"
- [ ] Select "volunteer"
- [ ] Go to Events page
- [ ] Should see volunteer-only events NOW
- [ ] Should STILL see "everyone" events
- [ ] Should NOT see "team_lead" only events

### Test as Admin
- [ ] Log in as admin
- [ ] Should see ALL events (regardless of allowed_roles)
- [ ] "My Roles" tab should be hidden

### Test Console Logs
- [ ] Open Console (F12)
- [ ] Go to Events page
- [ ] Should see logs showing:
  ```
  [EventsPage] Loaded events from Supabase: [...]
  [EventsPage] Event "Name": { allowed_roles: [...] }
  ```
- [ ] Event count should change when you select/deselect roles

## 🔄 If Nothing Works: Complete Reset

```sql
-- NUCLEAR OPTION: Reset everything

-- 1. Drop everything
DROP POLICY IF EXISTS "role_based_event_select" ON events;
DROP FUNCTION IF EXISTS user_can_view_event(UUID, UUID);
ALTER TABLE events DROP COLUMN IF EXISTS allowed_roles;

-- 2. Run fresh setup
-- Copy and paste entire contents of SETUP_ROLE_SYSTEM.sql
-- OR
-- Copy and paste entire contents of FIX_EVENT_FILTERING_NOW.sql

-- 3. Verify
SELECT 
  'allowed_roles exists' as check_name,
  EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'events' AND column_name = 'allowed_roles') as result
UNION ALL
SELECT 
  'function exists',
  EXISTS (SELECT FROM pg_proc WHERE proname = 'user_can_view_event')
UNION ALL
SELECT 
  'RLS enabled',
  (SELECT rowsecurity FROM pg_tables WHERE tablename = 'events');
```

## 💡 Quick Debug Commands

```sql
-- See what a specific user can see
SET session.user_id = 'YOUR-USER-ID'; -- Not actually used, just for reference
SELECT 
  e.title,
  e.allowed_roles,
  user_can_view_event('YOUR-USER-ID', e.id) as can_view
FROM events e
WHERE e.organization_id = 'YOUR-ORG-ID';

-- See user's current roles
SELECT role_name 
FROM user_organization_roles 
WHERE user_id = 'YOUR-USER-ID' 
AND organization_id = 'YOUR-ORG-ID';

-- Force an event to be visible to everyone
UPDATE events 
SET allowed_roles = ARRAY['everyone']
WHERE id = 'event-id';

-- Force an event to be volunteer-only
UPDATE events 
SET allowed_roles = ARRAY['volunteer']
WHERE id = 'event-id';
```

---

**MOST IMPORTANT:** Run `FIX_EVENT_FILTERING_NOW.sql` first!

This script ensures everything is set up correctly from scratch.

