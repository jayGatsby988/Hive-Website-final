# 🚀 Role System - Quick Start Guide

## ✅ What's Already Done

### Backend & Services
- ✅ SQL setup script created (`SETUP_ROLE_SYSTEM.sql`)
- ✅ Role service methods added to `lib/services.ts`
- ✅ RLS policies defined
- ✅ Helper functions created

### UI Components
- ✅ Role Selector component (`components/organizations/RoleSelector.tsx`)
- ✅ "My Roles" page (`app/organizations/[id]/my-roles/page.tsx`)
- ✅ Sidebar navigation updated with "My Roles" link
- ✅ Breadcrumb support added

## 🎯 What You Need to Do NOW

### Step 1: Run SQL Setup (2 minutes)
1. Open Supabase Dashboard → SQL Editor
2. Open file: `SETUP_ROLE_SYSTEM.sql`
3. Click **Run**
4. Wait for success message

**This creates:**
- `user_organization_roles` table
- `allowed_roles` column in `events` table
- RLS policies
- Helper functions

### Step 2: Create Test Roles (1 minute)
In Supabase SQL Editor, run:
```sql
-- Replace 'YOUR-ORG-ID' with actual organization ID
INSERT INTO organization_roles (organization_id, role_name, is_public, options)
VALUES 
  ('YOUR-ORG-ID', 'volunteer', true, '{}'),
  ('YOUR-ORG-ID', 'team_lead', true, '{}'),
  ('YOUR-ORG-ID', 'coordinator', true, '{}'),
  ('YOUR-ORG-ID', 'everyone', true, '{}')
ON CONFLICT (organization_id, role_name) DO NOTHING;
```

### Step 3: Test Member Role Selection
1. Refresh your website: http://localhost:3000
2. Log in as a member
3. Go to any organization
4. Click **"My Roles"** in sidebar
5. Select some roles
6. Verify they appear in Supabase `user_organization_roles` table

### Step 4: Test Event Filtering (Manual)
For now, manually set `allowed_roles` on an event:
```sql
-- Make an event visible only to volunteers
UPDATE events 
SET allowed_roles = ARRAY['volunteer']
WHERE id = 'YOUR-EVENT-ID';

-- Make an event visible to everyone
UPDATE events 
SET allowed_roles = ARRAY['everyone']
WHERE id = 'YOUR-EVENT-ID';

-- Make an event visible to multiple roles
UPDATE events 
SET allowed_roles = ARRAY['volunteer', 'team_lead']
WHERE id = 'YOUR-EVENT-ID';
```

Then:
1. Log in as member with "volunteer" role
2. Go to Events page
3. You should see volunteer-only events
4. Log in as member without role
5. Should NOT see volunteer-only events

## 📋 Still TODO (Optional Enhancements)

These are working but could be improved:

### TODO #1: Add Role Selector to Event Creation Form
Currently admins must manually set `allowed_roles` in Supabase.
To add UI:
- Update `app/organizations/[id]/events/create/page.tsx`
- Add role selection dropdown/checkboxes
- Pass `allowed_roles` array when creating event

### TODO #2: Show Role Requirements on Event Cards
Add visual indicators on event cards showing which roles can attend:
- Update `EventsPageClient.tsx`
- Show role badges on each event card

### TODO #3: Show Role Requirements on Event Detail Page
Add an info box on event detail page explaining role restrictions:
- Update `EventDetailPageClient.tsx`
- Show "This event is for: volunteer, team_lead" message

## 🎨 Current User Experience

### Members See:
```
Sidebar:
├─ Overview
├─ Events (auto-filtered by roles!)
├─ Stats  
├─ My Roles ⭐ NEW - Click here to select roles
└─ Members
```

### On My Roles Page:
```
┌─────────────────────────────┐
│ Select Your Roles           │
├─────────────────────────────┤
│ ☑ volunteer       Selected  │
│ ☐ team_lead                 │
│ ☐ coordinator               │
└─────────────────────────────┘

Your current roles:
[volunteer]
```

### Event Filtering Works!
- Supabase automatically filters events based on user roles
- No client-side code needed
- Works on mobile app too (same database)

## 🔍 How to Verify It's Working

### Check 1: Role Selection
```sql
-- See all user roles
SELECT 
  u.name,
  uor.role_name,
  o.name as organization
FROM user_organization_roles uor
JOIN users u ON u.id = uor.user_id
JOIN organizations o ON o.id = uor.organization_id
ORDER BY u.name, uor.role_name;
```

### Check 2: Event Filtering
```sql
-- Check which events a user can see
SELECT 
  e.title,
  e.allowed_roles,
  user_can_view_event('USER-ID', e.id) as can_view
FROM events e
WHERE e.organization_id = 'ORG-ID';
```

### Check 3: Console Logs
Open browser console (F12) and look for:
```
[RoleSelector] Loading roles for org: <id>
[RoleSelector] User has X roles
```

## ⚡ Quick Test Script

Run this in Supabase SQL Editor to test everything:

```sql
-- 1. Check if setup completed
SELECT 
  'user_organization_roles table' as check_name,
  CASE WHEN EXISTS (SELECT FROM pg_tables WHERE tablename = 'user_organization_roles') 
    THEN '✅ EXISTS' 
    ELSE '❌ MISSING' 
  END as status
UNION ALL
SELECT 
  'allowed_roles column' as check_name,
  CASE WHEN EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_name = 'events' 
    AND column_name = 'allowed_roles'
  ) 
    THEN '✅ EXISTS' 
    ELSE '❌ MISSING' 
  END as status
UNION ALL
SELECT 
  'user_can_view_event function' as check_name,
  CASE WHEN EXISTS (
    SELECT FROM pg_proc WHERE proname = 'user_can_view_event'
  ) 
    THEN '✅ EXISTS' 
    ELSE '❌ MISSING' 
  END as status;

-- 2. Count roles
SELECT 
  COUNT(*) as total_roles,
  COUNT(DISTINCT organization_id) as organizations_with_roles
FROM organization_roles;

-- 3. Count user role assignments
SELECT 
  COUNT(*) as total_assignments,
  COUNT(DISTINCT user_id) as users_with_roles
FROM user_organization_roles;
```

Expected output:
```
✅ user_organization_roles table EXISTS
✅ allowed_roles column EXISTS
✅ user_can_view_event function EXISTS
```

## 🎉 Success Criteria

You'll know it's working when:
1. ✅ "My Roles" appears in sidebar
2. ✅ Clicking it shows role selection page
3. ✅ Selecting a role updates immediately
4. ✅ Events page shows different events based on selected roles
5. ✅ Supabase `user_organization_roles` table has data

## 🐛 Troubleshooting

### "My Roles" page shows "No Roles Available"
**Fix**: Create roles in `organization_roles` table (Step 2 above)

### Roles don't save when clicked
**Check console for errors**:
- 400 error → RLS policy issue
- 403 error → Permission issue
- Fix: Re-run `SETUP_ROLE_SYSTEM.sql`

### All events still showing (not filtered)
**Possible causes**:
1. Events don't have `allowed_roles` set (empty array = everyone)
2. User is admin (admins always see all events)
3. RLS policy not applied to events table

**Fix**:
```sql
-- Verify RLS is enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'events';
-- Should show rowsecurity = true

-- If false:
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
```

---

**Server Status**: ✅ Running at http://localhost:3000  
**Ready to test**: YES! Just run the SQL setup first.

🚀 **Start with Step 1 now!**

