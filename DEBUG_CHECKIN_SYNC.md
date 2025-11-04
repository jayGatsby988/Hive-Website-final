# Debug: Why Mobile App and Website Aren't Syncing

## Quick Test to See What's Happening

### 1. Check if Website Check-In Saves to Database

**Do this:**
1. Open website
2. Check someone in
3. Open browser console (F12)
4. Look for logs starting with `[adminCheckIn]`

**What you should see:**
```
[adminCheckIn] Starting check-in: { eventId: "...", userId: "...", adminId: "..." }
[adminCheckIn] Existing sessions: [] null
[adminCheckIn] Inserting session: { ... }
[adminCheckIn] Session insert result: [{ id: "..." }] null
[adminCheckIn] Successfully checked in user
```

**If you see errors instead:**
- Copy the error message
- It's probably an RLS (permissions) issue

### 2. Check if Data Actually Saved to Supabase

**Go to Supabase Dashboard:**
1. Click "Table Editor"
2. Find table: `volunteer_sessions`
3. Look for recent entries
4. Filter by `status = 'active'`

**What you should see:**
- Rows with the user_id you just checked in
- `status` should be `'active'`
- `started_at` should be recent (within last few minutes)

**If you DON'T see the data:**
- The insert failed (probably RLS blocking it)
- Need to run the RLS policies SQL

### 3. Check if Mobile App is Reading from Same Table

**On Mobile App:**
The app MUST be using this code:

```typescript
// To check in
await eventService.selfCheckIn(eventId, userId, latitude, longitude);

// To check out
await eventService.selfCheckOut(eventId, userId);

// To listen for changes
const channel = supabase
  .channel(`event-${eventId}`)
  .on('postgres_changes', { 
    event: '*', 
    schema: 'public', 
    table: 'volunteer_sessions',  // ← MUST BE THIS TABLE
    filter: `event_id=eq.${eventId}` 
  }, () => {
    refreshEventData();
  })
  .subscribe();
```

**If mobile app is using different code or different table:**
- It won't see website check-ins
- They're reading from different places

### 4. Check if Realtime is Enabled

**Go to Supabase Dashboard:**
1. Click "Database" → "Replication"
2. Find row: `volunteer_sessions`
3. Check if toggle is GREEN (enabled)

**If it's OFF (gray):**
- Click to enable it
- Wait 30 seconds
- Try again

## Most Common Issue: RLS Policies Not Set Up

If website check-ins don't save to database, you need to run this:

**Open Supabase SQL Editor, paste and run:**

```sql
-- Enable RLS
ALTER TABLE volunteer_sessions ENABLE ROW LEVEL SECURITY;

-- Drop old policies
DROP POLICY IF EXISTS "Users can read own sessions" ON volunteer_sessions;
DROP POLICY IF EXISTS "Users can create own sessions" ON volunteer_sessions;
DROP POLICY IF EXISTS "Users can update own sessions" ON volunteer_sessions;
DROP POLICY IF EXISTS "Admins can read org event sessions" ON volunteer_sessions;
DROP POLICY IF EXISTS "Admins can create org event sessions" ON volunteer_sessions;
DROP POLICY IF EXISTS "Admins can update org event sessions" ON volunteer_sessions;

-- Users can read their own sessions
CREATE POLICY "Users can read own sessions"
ON volunteer_sessions FOR SELECT
USING (auth.uid() = user_id);

-- Users can create their own sessions
CREATE POLICY "Users can create own sessions"
ON volunteer_sessions FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update their own sessions
CREATE POLICY "Users can update own sessions"
ON volunteer_sessions FOR UPDATE
USING (auth.uid() = user_id);

-- ADMINS can read all sessions for their org events
CREATE POLICY "Admins can read org event sessions"
ON volunteer_sessions FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM events e
    INNER JOIN organization_members om ON om.organization_id = e.organization_id
    WHERE e.id = volunteer_sessions.event_id
    AND om.user_id = auth.uid()
    AND om.role IN ('admin', 'owner')
    AND om.is_active = true
  )
);

-- ADMINS can create sessions for any user in their org events
CREATE POLICY "Admins can create org event sessions"
ON volunteer_sessions FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM events e
    INNER JOIN organization_members om ON om.organization_id = e.organization_id
    WHERE e.id = event_id
    AND om.user_id = auth.uid()
    AND om.role IN ('admin', 'owner')
    AND om.is_active = true
  )
);

-- ADMINS can update sessions in their org events
CREATE POLICY "Admins can update org event sessions"
ON volunteer_sessions FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM events e
    INNER JOIN organization_members om ON om.organization_id = e.organization_id
    WHERE e.id = volunteer_sessions.event_id
    AND om.user_id = auth.uid()
    AND om.role IN ('admin', 'owner')
    AND om.is_active = true
  )
);

-- Verify policies created
SELECT policyname, cmd FROM pg_policies 
WHERE tablename = 'volunteer_sessions';
```

Should show 6 policies.

## Step-by-Step Sync Test

### Test 1: Website → Database

1. Open website
2. Open browser console (F12)
3. Check someone in
4. Look at console logs
5. Go to Supabase Table Editor → volunteer_sessions
6. **Verify the row was created** ✅

If NOT created → RLS blocking it → Run SQL above

### Test 2: Database → Mobile App

1. Keep mobile app open on event page
2. Go to Supabase Table Editor → volunteer_sessions
3. Manually insert a row:
   ```sql
   INSERT INTO volunteer_sessions (user_id, event_id, started_at, status)
   VALUES ('USER_ID', 'EVENT_ID', NOW(), 'active');
   ```
4. **Within 2 seconds, mobile app should update** ✅

If NOT updating:
- Realtime not enabled → Enable in Replication
- Mobile not subscribed → Add subscription code
- Mobile using wrong table → Check code

### Test 3: Mobile App → Database

1. Check in on mobile app
2. Go to Supabase Table Editor → volunteer_sessions
3. Refresh the table
4. **Verify new row with status='active'** ✅

If NOT created:
- Mobile not using `eventService.selfCheckIn()`
- Mobile using different table
- RLS blocking mobile inserts

### Test 4: Database → Website

1. Keep website open on event page
2. Go to Supabase Table Editor → volunteer_sessions
3. Manually insert a row (same as Test 2)
4. **Within 2 seconds, website check-in count should increase** ✅

If NOT updating:
- Realtime not enabled
- Website subscription broken (check console for errors)

## What to Send Me for Help

If still not working, send me:

1. **Browser console logs** when you check someone in on website
2. **Supabase Table Editor screenshot** of volunteer_sessions table
3. **Mobile app code** for check-in (the part that calls Supabase)
4. **Answer these questions:**
   - Did you run the constraint fix SQL? (yes/no)
   - Did you run the RLS policies SQL? (yes/no)
   - Is Realtime enabled for volunteer_sessions? (yes/no)
   - Does website console show `[adminCheckIn] Successfully checked in user`? (yes/no)
   - Does the row appear in Supabase volunteer_sessions table? (yes/no)
   - Is mobile app using `eventService.selfCheckIn()`? (yes/no)

## Quick Checklist

Run through this:

- [ ] Ran `COPY_PASTE_THIS_SQL.sql` to fix constraint
- [ ] Ran RLS policies SQL (6 policies created)
- [ ] Enabled Realtime for `volunteer_sessions` table
- [ ] Website console shows successful check-in logs
- [ ] Check-in data appears in Supabase table
- [ ] Mobile app uses `eventService.selfCheckIn()` from the guide
- [ ] Mobile app subscribes to `volunteer_sessions` table changes
- [ ] Mobile app and website use SAME Supabase project URL

If ALL boxes checked and still not working → send me the info above and I'll debug further.

