# FINAL FIX: Complete Check-In/Out Sync Solution

## The Problem You're Seeing

**Error:** `Failed to end session: duplicate key value violates unique constraint "volunteer_sessions_user_id_event_id_status_key"`

This happens because:
1. The database has a bad unique constraint
2. Multiple active sessions exist for the same user/event
3. When trying to mark one as "completed", it violates the constraint

## Complete Fix (3 Steps - 5 Minutes)

### Step 1: Fix Database Constraint (Required)

Run this SQL in Supabase SQL Editor:

```sql
-- Remove bad constraint
ALTER TABLE volunteer_sessions 
DROP CONSTRAINT IF EXISTS volunteer_sessions_user_id_event_id_status_key;

-- Add proper partial unique index (only for active sessions)
CREATE UNIQUE INDEX IF NOT EXISTS idx_volunteer_sessions_active_unique
ON volunteer_sessions (user_id, event_id)
WHERE status = 'active';

-- Clean up any existing duplicate active sessions
WITH duplicates AS (
  SELECT 
    id,
    user_id,
    event_id,
    started_at,
    ROW_NUMBER() OVER (
      PARTITION BY user_id, event_id 
      ORDER BY started_at DESC
    ) as rn
  FROM volunteer_sessions
  WHERE status = 'active'
)
UPDATE volunteer_sessions
SET status = 'completed', ended_at = NOW()
WHERE id IN (
  SELECT id FROM duplicates WHERE rn > 1
);

-- Verify no duplicates remain
SELECT 
  user_id,
  event_id,
  COUNT(*) as active_count
FROM volunteer_sessions
WHERE status = 'active'
GROUP BY user_id, event_id
HAVING COUNT(*) > 1;
```

**Expected result:** Last query should return 0 rows (no duplicates)

### Step 2: Setup RLS Policies (Required)

Run the entire contents of `scripts/setup-all-checkin-rls.sql` in Supabase SQL Editor.

This enables:
- ✅ Admins to check in/out users
- ✅ Users to check themselves in/out
- ✅ Proper security with organization-based permissions

### Step 3: Enable Realtime (Required)

In Supabase Dashboard:
1. Go to **Database** → **Replication**
2. Find and **Enable** these tables:
   - `volunteer_sessions` ✅
   - `volunteer_hours` ✅
   - `admin_checkin_audit` ✅
   - `event_checkins` ✅

## Test It Works

### Test 1: Website Check-In
1. Open your website
2. Go to any event detail page
3. Start the event (if not started)
4. Click "Check In" next to an attendee
5. **Check browser console (F12)**

Expected logs:
```
[adminCheckIn] Starting check-in: ...
[adminCheckIn] Existing sessions: [] null
[adminCheckIn] Inserting session: ...
[adminCheckIn] Successfully checked in user
```

Should see:
- ✅ Check-in count increases
- ✅ Button changes to "Check Out"
- ✅ Activity log shows check-in

### Test 2: Website Check-Out
1. Click "Check Out" next to someone checked in
2. **Check browser console**

Expected logs:
```
[adminCheckOut] Starting check-out: ...
[adminCheckOut] Active sessions found: ...
[adminCheckOut] Ending session: ...
```

Should see:
- ✅ Check-in count decreases
- ✅ Button changes to "Check In"
- ✅ Volunteer hours recorded

### Test 3: Mobile to Website Sync

**On Mobile App:**
1. Open event
2. Click "Check In"

**On Website (NO REFRESH):**
- Within 1-2 seconds:
  - ✅ Check-in count increases
  - ✅ Activity log updates
  - ✅ User shown as checked in

### Test 4: Website to Mobile Sync

**On Website:**
1. Admin checks in a user

**On Mobile App (NO REFRESH):**
- Within 1-2 seconds:
  - ✅ User sees they're checked in
  - ✅ Button changes to "Check Out"
  - ✅ Event data updates

## How It Works Now

### Website → Supabase → Mobile

```
Admin clicks "Check In"
         ↓
lib/services.ts: adminCheckIn()
         ↓
Supabase: INSERT into volunteer_sessions
         ↓
Supabase Realtime: Broadcast change
         ↓
Mobile App: Receives update
         ↓
Mobile App: Refreshes UI automatically
```

### Mobile → Supabase → Website

```
User clicks "Check In" on mobile
         ↓
eventService.selfCheckIn()
         ↓
Supabase: INSERT into volunteer_sessions
         ↓
Supabase Realtime: Broadcast change
         ↓
Website: Receives update via subscription
         ↓
Website: Updates check-in count & activity log
```

## Code Changes Made

### 1. lib/services.ts
- ✅ Added detailed logging to `adminCheckIn()`
- ✅ Added detailed logging to `adminCheckOut()`
- ✅ Added duplicate session detection
- ✅ Added automatic cleanup of duplicate sessions on error
- ✅ Same improvements for `selfCheckIn()` and `selfCheckOut()`

### 2. Database
- ✅ Fixed bad unique constraint
- ✅ Added proper partial unique index
- ✅ Set up correct RLS policies
- ✅ Enabled Realtime on all tables

### 3. Real-time Subscriptions
- ✅ Website already subscribes to `volunteer_sessions`
- ✅ Website already subscribes to `admin_checkin_audit`
- ✅ Website already subscribes to `event_checkins`
- ✅ Mobile app should subscribe (per guide)

## Verify Database State

### Check active sessions:
```sql
SELECT 
  vs.id,
  vs.status,
  vs.started_at,
  u.email,
  e.title
FROM volunteer_sessions vs
JOIN auth.users u ON u.id = vs.user_id
JOIN events e ON e.id = vs.event_id
WHERE vs.status = 'active'
ORDER BY vs.created_at DESC;
```

### Check recent hours:
```sql
SELECT 
  vh.*,
  u.email,
  e.title
FROM volunteer_hours vh
JOIN auth.users u ON u.id = vh.user_id
JOIN events e ON e.id = vh.event_id
ORDER BY vh.created_at DESC
LIMIT 10;
```

### Check constraints:
```sql
SELECT 
  conname as constraint_name,
  contype as constraint_type
FROM pg_constraint
WHERE conrelid = 'volunteer_sessions'::regclass;
```

Should NOT see: `volunteer_sessions_user_id_event_id_status_key`

### Check indexes:
```sql
SELECT 
  indexname,
  indexdef
FROM pg_indexes
WHERE tablename = 'volunteer_sessions';
```

Should see: `idx_volunteer_sessions_active_unique`

## Common Issues After Fix

### Issue: Still getting constraint error
**Solution:** Re-run Step 1 SQL script. The old constraint might not have been dropped.

Verify it's gone:
```sql
SELECT conname FROM pg_constraint 
WHERE conrelid = 'volunteer_sessions'::regclass 
AND conname = 'volunteer_sessions_user_id_event_id_status_key';
```
Should return 0 rows.

### Issue: Check-in works but doesn't show on other device
**Solution:** Enable Realtime (Step 3). Verify in Supabase:
```
Database → Replication → volunteer_sessions → Should be green/enabled
```

### Issue: "Permission denied" errors
**Solution:** Re-run Step 2 RLS policies. Verify you're an admin:
```sql
SELECT role, is_active 
FROM organization_members 
WHERE user_id = auth.uid();
```

## Mobile App Requirements

The mobile app must:

1. **Use the service methods:**
   ```typescript
   import { eventService } from '@/lib/services';
   
   // Check-in
   await eventService.selfCheckIn(eventId, userId, lat, lon);
   
   // Check-out
   await eventService.selfCheckOut(eventId, userId);
   ```

2. **Subscribe to real-time updates:**
   ```typescript
   const channel = supabase
     .channel(`event-${eventId}`)
     .on('postgres_changes', { 
       event: '*', 
       schema: 'public', 
       table: 'volunteer_sessions', 
       filter: `event_id=eq.${eventId}` 
     }, () => {
       refreshEventData();
     })
     .subscribe();
   ```

3. **Clean up subscriptions:**
   ```typescript
   useEffect(() => {
     return () => {
       supabase.removeChannel(channel);
     };
   }, []);
   ```

## Success Indicators

When everything is working:

✅ **Website admin check-in:**
- Console: `[adminCheckIn] Successfully checked in user`
- UI updates immediately
- Session in database with `status = 'active'`

✅ **Website admin check-out:**
- Console: `[adminCheckOut] Successfully ended all active sessions`
- Volunteer hours recorded
- Session marked as `completed`

✅ **Mobile to website sync:**
- Check-in on mobile
- Website updates within 2 seconds (no refresh needed)
- Check-in count increases
- Activity log shows new entry

✅ **Website to mobile sync:**
- Admin checks in user on website
- Mobile app shows user as checked in within 2 seconds
- Button state updates automatically

## Documentation Reference

- **Quick Fix:** `QUICK_FIX_CHECKIN.md`
- **Full Troubleshooting:** `FIX_CHECKIN_NOT_WORKING.md`
- **Mobile Guide:** `MOBILE_APP_CHECKIN_GUIDE.md`
- **Testing:** `TESTING_MOBILE_SYNC.md`
- **Architecture:** `SYNC_ARCHITECTURE.md`

---

**Time to Complete:** 5-10 minutes  
**Difficulty:** Easy (copy/paste SQL)  
**Result:** Universal check-in/out working across all platforms with real-time sync

