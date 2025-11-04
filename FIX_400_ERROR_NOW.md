# 🚨 Fix 400 Error on Stats Page - RIGHT NOW

## The Problem
Your Stats page is getting **400 Bad Request** errors when trying to fetch volunteer hours from Supabase. This is an RLS (Row Level Security) policy issue.

## The Fix (2 Minutes)

### Step 1: Go to Supabase SQL Editor
1. Open https://supabase.com
2. Select your project
3. Go to **SQL Editor** in the left sidebar
4. Click **New Query**

### Step 2: Run This SQL
Copy and paste `FIX_STATS_400_ERROR.sql` into the SQL editor and click **Run**.

Or copy this quick fix:

```sql
-- Quick Fix for Stats Page 400 Errors

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view own volunteer hours" ON volunteer_hours;
DROP POLICY IF EXISTS "Users can insert own volunteer hours" ON volunteer_hours;

-- Create new simple policies
CREATE POLICY "Users can view own volunteer hours"
ON volunteer_hours
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own volunteer hours"
ON volunteer_hours
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Enable RLS
ALTER TABLE volunteer_hours ENABLE ROW LEVEL SECURITY;

-- Grant permissions
GRANT SELECT, INSERT ON volunteer_hours TO authenticated;

-- Fix events table (for joins)
DROP POLICY IF EXISTS "Enable read for authenticated users" ON events;
CREATE POLICY "Enable read for authenticated users"
ON events FOR SELECT TO authenticated USING (true);

ALTER TABLE events ENABLE ROW LEVEL SECURITY;
GRANT SELECT ON events TO authenticated;

-- Fix organizations table (for joins)
DROP POLICY IF EXISTS "Enable read for authenticated users" ON organizations;
CREATE POLICY "Enable read for authenticated users"
ON organizations FOR SELECT TO authenticated USING (true);

ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
GRANT SELECT ON organizations TO authenticated;
```

### Step 3: Refresh Stats Page
1. Go back to your HIVE app at http://localhost:3000
2. Navigate to any organization
3. Click "Stats" in sidebar
4. Click the "Refresh" button
5. **Check the console** - you should now see:
   ```
   [Stats] Volunteer hours for this org: X records
   [Stats] ✅ Stats loaded successfully
   ```

## Why This Happened

The 400 error means Supabase rejected the query because:
1. RLS policies were blocking the SELECT query
2. The policies didn't match `auth.uid() = user_id`
3. Or policies didn't exist at all

## What the Fix Does

1. ✅ Creates simple RLS policies that let users see their own hours
2. ✅ Allows users to insert their own hours (for check-out functionality)
3. ✅ Enables RLS on volunteer_hours, events, and organizations tables
4. ✅ Grants proper permissions to authenticated users

## Verify It Worked

### In Console (F12)
Before fix:
```
❌ [Stats] Error fetching hours: {...}
❌ Failed to load resource: 400 ()
```

After fix:
```
✅ [Stats] Volunteer hours for this org: X records
✅ [Stats] ✅ Stats loaded successfully
```

### In Supabase
Run this to see your hours:
```sql
SELECT 
  id,
  user_id,
  event_id,
  organization_id,
  hours,
  date,
  notes,
  created_at
FROM volunteer_hours
WHERE user_id = auth.uid()
ORDER BY created_at DESC
LIMIT 10;
```

## If Still Not Working

### Check 1: Does the table exist?
```sql
SELECT * FROM volunteer_hours LIMIT 1;
```

If error says "table doesn't exist", create it:
```sql
CREATE TABLE volunteer_hours (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id),
  event_id UUID REFERENCES events(id),
  organization_id UUID REFERENCES organizations(id),
  date DATE NOT NULL,
  hours NUMERIC NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Check 2: Do you have volunteer_hours records?
```sql
SELECT COUNT(*) FROM volunteer_hours WHERE user_id = auth.uid();
```

If returns 0, you need to check in/out of an event first to create hours.

### Check 3: Are policies active?
```sql
SELECT * FROM pg_policies WHERE tablename = 'volunteer_hours';
```

Should show at least 2 policies for SELECT and INSERT.

## Code Changes Already Made

I've also updated the Stats page code to:
1. ✅ Avoid problematic JOIN queries
2. ✅ Fetch data in separate queries (simpler, more reliable)
3. ✅ Better error handling
4. ✅ More detailed console logging

## Next Steps After Fix

1. ✅ Run the SQL fix in Supabase
2. ✅ Refresh Stats page
3. ✅ Check console for success logs
4. ✅ Test check-in/out to generate new hours
5. ✅ Verify hours appear on Stats page

---

**The fix is ready in `FIX_STATS_400_ERROR.sql` - just run it in Supabase! 🚀**

