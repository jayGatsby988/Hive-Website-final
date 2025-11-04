# Fix: Admin Check-In Not Working

## Problem
When admins try to check in users on the website, it doesn't work. The check-in doesn't persist in Supabase.

## Root Cause
Supabase Row Level Security (RLS) policies are blocking the `volunteer_sessions` table inserts from admins.

## Solution

### Step 1: Run RLS Setup Script

1. Open your Supabase Dashboard
2. Go to **SQL Editor**
3. Create a new query
4. Copy and paste the contents of `scripts/setup-all-checkin-rls.sql`
5. Click **Run**

This will:
- ✅ Enable proper RLS policies for `volunteer_sessions`
- ✅ Enable proper RLS policies for `volunteer_hours`
- ✅ Enable proper RLS policies for `admin_checkin_audit`
- ✅ Enable proper RLS policies for `event_checkins`
- ✅ Allow admins to check in/out users in their organization's events
- ✅ Allow users to check themselves in/out

### Step 2: Verify It Worked

After running the script, you should see output like:
```
NOTICE: RLS Policies have been set up successfully!
NOTICE: volunteer_sessions: 6 policies
NOTICE: volunteer_hours: 4 policies
NOTICE: admin_checkin_audit: 2 policies
NOTICE: event_checkins: 3 policies
```

### Step 3: Test Admin Check-In

1. Open the website
2. Navigate to an event detail page
3. Start the event (if not started)
4. Find an attendee who is NOT checked in
5. Click their "Check In" button
6. **Open browser console (F12)** and look for logs:

Expected logs:
```
[adminCheckIn] Starting check-in: { eventId: "...", userId: "...", adminId: "..." }
[adminCheckIn] Existing sessions: [] null
[adminCheckIn] Inserting session: { user_id: "...", event_id: "...", started_at: "...", status: "active" }
[adminCheckIn] Session insert result: [{ id: "...", ... }] null
[adminCheckIn] Logging audit: { event_id: "...", user_id: "...", admin_id: "...", action: "checkin" }
[adminCheckIn] Successfully checked in user
```

If you see errors in the logs, continue to troubleshooting below.

## Troubleshooting

### Issue 1: "Failed to create session: new row violates row-level security policy"

**Cause:** RLS policies not set up correctly or admin role not recognized.

**Solution:**
1. Verify you ran the SQL script in Supabase
2. Check that your user has `admin` or `owner` role in `organization_members` table:
   ```sql
   SELECT * FROM organization_members 
   WHERE user_id = 'YOUR_USER_ID' 
   AND organization_id = 'YOUR_ORG_ID';
   ```
   Should show `role = 'admin'` or `'owner'` and `is_active = true`

3. If not, update your role:
   ```sql
   UPDATE organization_members 
   SET role = 'admin', is_active = true
   WHERE user_id = 'YOUR_USER_ID' 
   AND organization_id = 'YOUR_ORG_ID';
   ```

### Issue 2: "User is already checked in"

**Cause:** User already has an active session in this event.

**Solution:**
1. Check the database:
   ```sql
   SELECT * FROM volunteer_sessions 
   WHERE event_id = 'EVENT_ID' 
   AND user_id = 'USER_ID' 
   AND status = 'active';
   ```

2. If there's a stuck active session, manually complete it:
   ```sql
   UPDATE volunteer_sessions 
   SET status = 'completed', ended_at = NOW()
   WHERE event_id = 'EVENT_ID' 
   AND user_id = 'USER_ID' 
   AND status = 'active';
   ```

3. Then try checking in again.

### Issue 3: Console shows "Failed to check existing sessions"

**Cause:** RLS blocking SELECT on `volunteer_sessions`.

**Solution:**
1. Verify the SELECT policies were created:
   ```sql
   SELECT policyname, cmd FROM pg_policies 
   WHERE tablename = 'volunteer_sessions' 
   AND cmd = 'SELECT';
   ```
   Should show at least 2 policies for SELECT.

2. If missing, re-run the RLS setup script.

### Issue 4: No error but check-in doesn't persist

**Cause:** Session is created but website isn't detecting it.

**Solution:**
1. Check if session was actually created:
   ```sql
   SELECT * FROM volunteer_sessions 
   WHERE event_id = 'EVENT_ID' 
   ORDER BY created_at DESC 
   LIMIT 5;
   ```

2. If session exists, the issue is with real-time updates. Check:
   - Supabase Realtime is enabled for `volunteer_sessions` table
   - Website is subscribed to changes (already implemented)
   - Try refreshing the page

3. Enable Realtime:
   - Go to Supabase Dashboard → Database → Replication
   - Find `volunteer_sessions` table
   - Enable replication

### Issue 5: "Cannot read properties of undefined (reading 'id')"

**Cause:** Event or user data not loaded properly.

**Solution:**
1. Ensure event is fully loaded before clicking check-in
2. Check browser console for earlier errors
3. Verify user is authenticated (`user` object exists)

## Verification Checklist

After applying the fix:

- [ ] Ran `scripts/setup-all-checkin-rls.sql` in Supabase
- [ ] Verified 6 policies exist for `volunteer_sessions`
- [ ] Confirmed user has `admin` role in organization
- [ ] Tested admin check-in - no errors in console
- [ ] Verified session appears in `volunteer_sessions` table
- [ ] Confirmed check-in count updates on website
- [ ] Tested admin check-out - no errors
- [ ] Verified hours recorded in `volunteer_hours` table
- [ ] Tested self check-in (mobile/user) - works
- [ ] Tested self check-out (mobile/user) - works

## Database Schema Verification

Ensure these tables exist with correct structure:

### volunteer_sessions
```sql
-- Check table exists
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'volunteer_sessions';
```

Required columns:
- `id` (uuid, primary key)
- `user_id` (uuid, references auth.users)
- `event_id` (uuid, references events)
- `started_at` (timestamptz)
- `ended_at` (timestamptz, nullable)
- `status` (text: 'active' or 'completed')
- `created_at` (timestamptz)
- `updated_at` (timestamptz)

### Create table if missing:
```sql
CREATE TABLE IF NOT EXISTS volunteer_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  started_at TIMESTAMPTZ NOT NULL,
  ended_at TIMESTAMPTZ,
  status TEXT NOT NULL CHECK (status IN ('active', 'completed')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_volunteer_sessions_event ON volunteer_sessions(event_id);
CREATE INDEX idx_volunteer_sessions_user ON volunteer_sessions(user_id);
CREATE INDEX idx_volunteer_sessions_status ON volunteer_sessions(status);
CREATE INDEX idx_volunteer_sessions_event_user ON volunteer_sessions(event_id, user_id);
```

### volunteer_hours
```sql
CREATE TABLE IF NOT EXISTS volunteer_hours (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  hours NUMERIC(5, 2) NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_volunteer_hours_user ON volunteer_hours(user_id);
CREATE INDEX idx_volunteer_hours_event ON volunteer_hours(event_id);
CREATE INDEX idx_volunteer_hours_org ON volunteer_hours(organization_id);
```

### admin_checkin_audit
```sql
CREATE TABLE IF NOT EXISTS admin_checkin_audit (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  admin_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action TEXT NOT NULL CHECK (action IN ('checkin', 'checkout')),
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  notes TEXT
);

CREATE INDEX idx_admin_audit_event ON admin_checkin_audit(event_id);
CREATE INDEX idx_admin_audit_user ON admin_checkin_audit(user_id);
CREATE INDEX idx_admin_audit_admin ON admin_checkin_audit(admin_id);
```

## Quick Test Query

Run this to test if you can insert a session as an admin:

```sql
-- Replace with your actual IDs
INSERT INTO volunteer_sessions (user_id, event_id, started_at, status)
VALUES (
  'USER_ID_HERE',
  'EVENT_ID_HERE',
  NOW(),
  'active'
);

-- If successful, you'll see: "INSERT 0 1"
-- If failed, you'll see an RLS error

-- Clean up test
DELETE FROM volunteer_sessions WHERE event_id = 'EVENT_ID_HERE' AND started_at > NOW() - INTERVAL '1 minute';
```

## Still Not Working?

If check-ins still don't work after following all steps:

1. **Export Supabase logs:**
   - Dashboard → Logs → Postgres
   - Look for INSERT errors related to `volunteer_sessions`

2. **Check browser console:**
   - Look for `[adminCheckIn]` logs
   - Copy any error messages

3. **Verify organization membership:**
   ```sql
   SELECT 
     om.role,
     om.is_active,
     o.name as org_name,
     e.title as event_title
   FROM organization_members om
   JOIN organizations o ON o.id = om.organization_id
   JOIN events e ON e.organization_id = om.organization_id
   WHERE om.user_id = auth.uid()
   AND e.id = 'YOUR_EVENT_ID';
   ```

4. **Test with SQL directly:**
   ```sql
   -- This should work if policies are correct
   SELECT 
     'Can insert:' as test,
     EXISTS (
       SELECT 1 FROM events e
       JOIN organization_members om ON om.organization_id = e.organization_id
       WHERE e.id = 'YOUR_EVENT_ID'
       AND om.user_id = auth.uid()
       AND om.role IN ('admin', 'owner')
     ) as result;
   ```

5. **Last resort - Temporarily disable RLS (NOT RECOMMENDED FOR PRODUCTION):**
   ```sql
   ALTER TABLE volunteer_sessions DISABLE ROW LEVEL SECURITY;
   ```
   Then test if check-in works. If it does, the issue is definitely with RLS policies.
   **Remember to re-enable RLS after testing!**

## Success Indicators

When working correctly:

✅ Browser console shows: `[adminCheckIn] Successfully checked in user`  
✅ No errors in Supabase logs  
✅ Session appears in `volunteer_sessions` table with `status = 'active'`  
✅ Website check-in count increases immediately  
✅ Activity log shows the check-in  
✅ "Check In" button changes to "Check Out"  

## Next Steps

Once admin check-in is working:
1. Test admin check-out
2. Test user self check-in (mobile app)
3. Verify real-time sync between platforms
4. Follow `TESTING_MOBILE_SYNC.md` for complete testing

---

**Need Help?** Check the browser console and Supabase logs, then refer to the specific error in the troubleshooting section above.

