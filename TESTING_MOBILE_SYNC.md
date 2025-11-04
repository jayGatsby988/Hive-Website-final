# Testing Mobile App & Website Sync

## Overview
This guide will help you verify that check-ins from the mobile app appear instantly on the website.

## Prerequisites
1. Mobile app updated to use `eventService.selfCheckIn()` and `eventService.selfCheckOut()`
2. Website running and connected to Supabase
3. Test user account that can access both mobile app and website
4. Test event that is "in_progress" (started)

## Test Scenario 1: Self Check-In from Mobile App

### Steps:
1. **On Website:**
   - Navigate to an event detail page
   - Click "Start Event" (if admin)
   - Note the current "Checked In" count
   - Keep the page open

2. **On Mobile App:**
   - Open the same event
   - Click "Check In" button
   - Verify you see confirmation on mobile

3. **Back on Website (NO REFRESH NEEDED):**
   - Within 1-2 seconds, you should see:
     - ✅ "Checked In" count increases by 1
     - ✅ New entry in "Event Activity" log showing the check-in
     - ✅ If you're the one who checked in, your name should show in activity

### Expected Activity Log Entry:
```
✅ [Your Name] checked in
Just now
```

## Test Scenario 2: Self Check-Out from Mobile App

### Steps:
1. **On Mobile App (while checked in):**
   - Click "Check Out" button
   - Verify you see confirmation on mobile

2. **On Website (NO REFRESH NEEDED):**
   - Within 1-2 seconds, you should see:
     - ✅ "Checked In" count decreases by 1
     - ✅ New entry in "Event Activity" log showing the check-out
     - ✅ New entry in volunteer hours (check `/volunteer-hours` page)

### Expected Activity Log Entry:
```
🔄 [Your Name] checked out
Just now
```

## Test Scenario 3: Admin Check-In from Website

### Steps:
1. **On Website (as admin):**
   - Go to event detail page
   - Find an attendee who is NOT checked in
   - Click their "Check In" button

2. **On Mobile App (NO REFRESH NEEDED):**
   - If the mobile app has realtime subscriptions (per guide)
   - The attendee should see they are now checked in
   - Activity log should update

3. **On Website:**
   - Should see "Check Out" button for that user
   - Activity log shows admin check-in

## Test Scenario 4: Multiple Users Simultaneously

### Steps:
1. **Setup:**
   - Have 2-3 test users with mobile apps
   - Have 1 admin viewing website

2. **Execute:**
   - User 1: Check in on mobile
   - User 2: Check in on mobile
   - User 3: Check in on mobile
   - (All within 10 seconds)

3. **Verify on Website:**
   - All 3 check-ins should appear in activity log
   - "Checked In" count should be accurate (3)
   - No duplicate entries

## Debugging Checklist

### If check-ins DON'T appear on website:

#### 1. Verify Mobile App is Writing to Correct Table
```typescript
// Mobile app should be calling:
await eventService.selfCheckIn(eventId, userId, latitude, longitude);

// NOT just:
await supabase.from('event_checkins').insert(...)
```

#### 2. Check Supabase Realtime is Enabled
In Supabase Dashboard:
- Go to Database → Replication
- Ensure `volunteer_sessions` table has replication enabled
- Ensure RLS policies allow SELECT on `volunteer_sessions`

#### 3. Verify Mobile App Supabase Config
```typescript
// Mobile app should use SAME Supabase project URL and anon key
const supabaseUrl = 'https://your-project.supabase.co'
const supabaseAnonKey = 'your-anon-key'
```

#### 4. Check Browser Console (Website)
Open DevTools → Console, look for:
- ✅ `[EventActivity] Loading activity for event: ...`
- ✅ `[EventActivity] volunteer_sessions: X`
- ❌ Any errors about permissions or RLS

#### 5. Check Supabase Logs (Real-time)
In Supabase Dashboard:
- Go to Logs → Realtime
- Filter for your event's subscription
- Verify messages are being sent when mobile app checks in

### If check-in count is wrong:

#### Verify Session Status
Run this in Supabase SQL Editor:
```sql
SELECT 
  event_id,
  user_id,
  status,
  started_at,
  ended_at
FROM volunteer_sessions
WHERE event_id = 'YOUR_EVENT_ID'
ORDER BY started_at DESC;
```

Should see:
- `status = 'active'` for checked-in users
- `status = 'completed'` for checked-out users

### If activity log is empty:

#### Check RLS Policies
Run this in Supabase SQL Editor:
```sql
-- Check volunteer_sessions
SELECT * FROM volunteer_sessions 
WHERE event_id = 'YOUR_EVENT_ID'
LIMIT 5;

-- Check admin_checkin_audit
SELECT * FROM admin_checkin_audit
WHERE event_id = 'YOUR_EVENT_ID'
LIMIT 5;

-- Check event_checkins
SELECT * FROM event_checkins
WHERE event_id = 'YOUR_EVENT_ID'
LIMIT 5;
```

If any query returns "permission denied", update RLS policies to allow SELECT.

## Performance Verification

### Expected Response Times:
- Mobile check-in to website update: **< 2 seconds**
- Website admin check-in to mobile update: **< 2 seconds**
- Activity log update: **< 1 second**

### If slower than expected:
1. Check internet connection on mobile device
2. Verify Supabase project region (closer = faster)
3. Check if mobile app is subscribed to realtime (per guide)

## Data Integrity Checks

### After 5+ check-ins/outs, verify:

#### 1. No Duplicate Sessions
```sql
SELECT user_id, COUNT(*) as active_count
FROM volunteer_sessions
WHERE event_id = 'YOUR_EVENT_ID' 
  AND status = 'active'
GROUP BY user_id
HAVING COUNT(*) > 1;
```
Should return 0 rows (no duplicates).

#### 2. Hours Are Recorded
```sql
SELECT 
  vh.user_id,
  vh.hours,
  vh.date,
  vs.started_at,
  vs.ended_at
FROM volunteer_hours vh
JOIN volunteer_sessions vs ON vh.event_id = vs.event_id AND vh.user_id = vs.user_id
WHERE vh.event_id = 'YOUR_EVENT_ID'
  AND vs.status = 'completed';
```
Should show calculated hours matching session duration.

#### 3. Activity Log is Complete
Count should match:
```sql
-- Count check-ins from volunteer_sessions
SELECT COUNT(*) FROM volunteer_sessions 
WHERE event_id = 'YOUR_EVENT_ID';

-- Count admin audits
SELECT COUNT(*) FROM admin_checkin_audit
WHERE event_id = 'YOUR_EVENT_ID';

-- Count event_checkins (if used)
SELECT COUNT(*) FROM event_checkins
WHERE event_id = 'YOUR_EVENT_ID';
```

## Success Criteria

✅ Mobile check-in appears on website within 2 seconds  
✅ Website admin check-in appears on mobile within 2 seconds  
✅ Check-in count updates in real-time  
✅ Activity log shows all events in chronological order  
✅ User names appear in activity log (not just IDs)  
✅ Volunteer hours are calculated and recorded on check-out  
✅ No duplicate active sessions per user  
✅ "Check In"/"Check Out" buttons show correct state  

## Troubleshooting Commands

### Force reload on website:
Click the refresh icon or press `Cmd/Ctrl + R`

### Clear Supabase cache on mobile:
```typescript
await supabase.auth.signOut()
await supabase.auth.signInWithPassword({ email, password })
```

### Restart realtime subscription on mobile:
```typescript
await supabase.removeAllChannels()
// Then re-subscribe to events
```

### Reset test data:
```sql
-- WARNING: This deletes all check-ins for an event
DELETE FROM volunteer_sessions WHERE event_id = 'YOUR_EVENT_ID';
DELETE FROM admin_checkin_audit WHERE event_id = 'YOUR_EVENT_ID';
DELETE FROM event_checkins WHERE event_id = 'YOUR_EVENT_ID';
DELETE FROM volunteer_hours WHERE event_id = 'YOUR_EVENT_ID';
```

## Common Issues & Solutions

### Issue: "No active session found"
**Cause:** User tried to check out without checking in first  
**Solution:** Check in first, then check out

### Issue: Check-in count shows 0 despite active sessions
**Cause:** Website counting wrong table  
**Solution:** Already fixed - now counts `volunteer_sessions` with `status='active'`

### Issue: Names showing as "User abc123..."
**Cause:** RLS blocking user profile reads  
**Solution:** Update RLS policy on `profiles` or `users` table to allow SELECT

### Issue: Volunteer hours not recording
**Cause:** Mobile app not calling `selfCheckOut` (only checking in)  
**Solution:** Ensure mobile app calls `eventService.selfCheckOut()`

### Issue: Real-time not working
**Cause:** Supabase realtime not enabled or blocked by firewall  
**Solution:** Enable in Supabase Dashboard, check network/firewall settings

## Contact for Support

If tests fail after following all steps:
1. Export Supabase logs (Database → Logs)
2. Screenshot website console errors
3. Screenshot mobile app errors
4. Note which specific test scenario failed

