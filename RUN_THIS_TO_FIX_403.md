# 🚨 FIX 403 ERROR WHEN CREATING EVENTS

## The Problem
When creating an event with `allowed_roles`, you get:
```
Error creating event
Failed to load resource: 403 Forbidden
new row violates row-level security policy for table "events"
```

## Why It Happens
After creating an event, the code tries to SELECT it back (`.select().single()`). But the SELECT policy checks if you can view the event based on roles. If you don't have the role you just assigned to the event, the SELECT fails!

## The Solution

### Run `COMPLETE_RLS_FIX.sql` in Supabase

This script:
1. ✅ Disables RLS temporarily
2. ✅ Drops ALL old policies
3. ✅ Creates new clean policies:
   - **SELECT**: Admins see ALL events (no role check)
   - **SELECT**: Members see events based on their roles
   - **INSERT**: Admins only (no role check on new row)
   - **UPDATE**: Admins only
   - **DELETE**: Admins only
4. ✅ Re-enables RLS

### Key Fix
```sql
-- Admins see ALL events (checked FIRST)
EXISTS (
  SELECT 1 FROM organization_members 
  WHERE user_id = auth.uid() 
  AND role = 'admin'
)
OR
-- Then check roles for regular members
(user has required role...)
```

## Steps to Fix

1. **Open Supabase Dashboard** → SQL Editor
2. **Copy entire `COMPLETE_RLS_FIX.sql` file**
3. **Paste and click RUN**
4. **Refresh your browser** at http://localhost:3000
5. **Try creating event again**

## After Running

You should see output:
```
Policies created: 4
Policy names:
- select_events_with_role_filter (SELECT)
- insert_events_admin_only (INSERT)
- update_events_admin_only (UPDATE)
- delete_events_admin_only (DELETE)
```

## Test It

1. **As Admin**: Create event with `allowed_roles = ['volunteer']`
2. **Should work!** No more 403 error
3. **As Member without role**: Go to Events → Don't see volunteer event
4. **As Member with volunteer role**: Go to Events → See volunteer event!

## What This Fixes

| Action | Before | After |
|--------|--------|-------|
| Admin creates event | ❌ 403 error | ✅ Works |
| Admin views all events | ❌ Blocked by role check | ✅ Sees all |
| Member views filtered events | ❌ Not implemented | ✅ Filtered by role |
| Member creates event | ✅ Blocked (correct) | ✅ Still blocked |

---

**Run `COMPLETE_RLS_FIX.sql` now to fix the 403 error!** 🚀

