-- Verify Role-Based Event Filtering
-- Run this in Supabase SQL Editor to check if filtering is set up correctly

-- ============================================
-- 1. Check if allowed_roles column exists
-- ============================================
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'events' 
AND column_name = 'allowed_roles';

-- Expected: Should return one row showing TEXT[] type

-- ============================================
-- 2. Check if user_can_view_event function exists
-- ============================================
SELECT 
  proname as function_name,
  pg_get_functiondef(oid) as definition
FROM pg_proc
WHERE proname = 'user_can_view_event';

-- Expected: Should return the function definition

-- ============================================
-- 3. Check current RLS policies on events table
-- ============================================
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual as using_clause
FROM pg_policies
WHERE tablename = 'events'
ORDER BY policyname;

-- Expected: Should show "Users can view events based on roles" policy

-- ============================================
-- 4. Test the function manually
-- ============================================
-- Replace with your actual user_id and event_id
-- SELECT user_can_view_event('YOUR-USER-ID', 'YOUR-EVENT-ID');

-- ============================================
-- 5. Check if RLS is enabled on events table
-- ============================================
SELECT 
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE tablename = 'events';

-- Expected: rls_enabled should be true

-- ============================================
-- 6. Sample query to see what filtering returns
-- ============================================
-- This simulates what happens when a user queries events
-- Replace 'YOUR-USER-ID' with actual user ID
/*
SELECT 
  e.id,
  e.title,
  e.allowed_roles,
  EXISTS (
    SELECT 1 FROM organization_members om
    WHERE om.user_id = 'YOUR-USER-ID'
    AND om.organization_id = e.organization_id
    AND om.is_active = true
  ) as is_member,
  user_can_view_event('YOUR-USER-ID', e.id) as can_view
FROM events e
WHERE e.organization_id = 'YOUR-ORG-ID'
LIMIT 10;
*/

-- ============================================
-- 7. Check user's roles
-- ============================================
-- Replace 'YOUR-USER-ID' with actual user ID
/*
SELECT 
  uor.role_name,
  uor.assigned_at,
  o.name as organization_name
FROM user_organization_roles uor
JOIN organizations o ON o.id = uor.organization_id
WHERE uor.user_id = 'YOUR-USER-ID';
*/

-- ============================================
-- 8. If filtering not working, DROP and RECREATE the policy
-- ============================================

-- First, drop the old policy
DROP POLICY IF EXISTS "Users can view events in their organizations" ON events;
DROP POLICY IF EXISTS "Users can view events based on roles" ON events;
DROP POLICY IF EXISTS "Enable read for authenticated users" ON events;

-- Create the correct policy
CREATE POLICY "Users can view events based on roles"
ON events
FOR SELECT
TO authenticated
USING (
  -- Must be member of the organization
  EXISTS (
    SELECT 1 FROM organization_members om
    WHERE om.user_id = auth.uid()
    AND om.organization_id = events.organization_id
    AND om.is_active = true
  )
  -- AND must have required role (checked by function)
  AND user_can_view_event(auth.uid(), events.id)
);

-- Make sure RLS is enabled
ALTER TABLE events ENABLE ROW LEVEL SECURITY;

-- Grant SELECT permission
GRANT SELECT ON events TO authenticated;

-- ============================================
-- 9. Test after recreation
-- ============================================
SELECT 
  '✅ Setup complete!' as status,
  'Try querying events now' as message;

-- ============================================
-- 10. Debug: Check what RLS is actually doing
-- ============================================
-- If events still not filtering, enable RLS logging:
-- ALTER TABLE events FORCE ROW LEVEL SECURITY;

-- Then check logs in Supabase Dashboard → Logs → Postgres Logs

