-- COMPLETE FIX FOR EVENT CREATION RLS ISSUE
-- This removes ALL restrictive policies and creates simple ones

-- ============================================
-- Step 1: Disable RLS temporarily to clean up
-- ============================================
ALTER TABLE events DISABLE ROW LEVEL SECURITY;

-- ============================================
-- Step 2: Drop ALL existing policies
-- ============================================
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN 
    SELECT policyname 
    FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'events'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON events', r.policyname);
    RAISE NOTICE 'Dropped policy: %', r.policyname;
  END LOOP;
END $$;

-- ============================================
-- Step 3: Create SIMPLE policies that work
-- ============================================

-- SELECT: Members see events based on roles, ADMINS SEE ALL
CREATE POLICY "select_events_with_role_filter"
ON events
FOR SELECT
TO authenticated
USING (
  -- Must be member of organization
  EXISTS (
    SELECT 1 
    FROM organization_members om
    WHERE om.user_id = auth.uid()
      AND om.organization_id = events.organization_id
      AND om.is_active = true
  )
  -- Admins see ALL events (no role check)
  AND (
    EXISTS (
      SELECT 1 
      FROM organization_members om
      WHERE om.user_id = auth.uid()
        AND om.organization_id = events.organization_id
        AND om.role = 'admin'
        AND om.is_active = true
    )
    -- OR if allowed_roles is empty/null, everyone can see
    OR (allowed_roles IS NULL OR allowed_roles = '{}' OR array_length(allowed_roles, 1) IS NULL)
    -- OR if 'everyone' is in the array
    OR ('everyone' = ANY(allowed_roles))
    -- OR if user has one of the required roles
    OR EXISTS (
      SELECT 1
      FROM user_organization_roles uor
      WHERE uor.user_id = auth.uid()
        AND uor.organization_id = events.organization_id
        AND uor.role_name = ANY(allowed_roles)
    )
  )
);

-- INSERT: Only admins, NO role check on new row
CREATE POLICY "insert_events_admin_only"
ON events
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 
    FROM organization_members om
    WHERE om.user_id = auth.uid()
      AND om.organization_id = organization_id
      AND om.role = 'admin'
      AND om.is_active = true
  )
);

-- UPDATE: Only admins, NO role check
CREATE POLICY "update_events_admin_only"
ON events
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 
    FROM organization_members om
    WHERE om.user_id = auth.uid()
      AND om.organization_id = events.organization_id
      AND om.role = 'admin'
      AND om.is_active = true
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 
    FROM organization_members om
    WHERE om.user_id = auth.uid()
      AND om.organization_id = events.organization_id
      AND om.role = 'admin'
      AND om.is_active = true
  )
);

-- DELETE: Only admins
CREATE POLICY "delete_events_admin_only"
ON events
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 
    FROM organization_members om
    WHERE om.user_id = auth.uid()
      AND om.organization_id = events.organization_id
      AND om.role = 'admin'
      AND om.is_active = true
  )
);

-- ============================================
-- Step 4: Re-enable RLS
-- ============================================
ALTER TABLE events ENABLE ROW LEVEL SECURITY;

-- ============================================
-- Step 5: Grant permissions
-- ============================================
GRANT SELECT, INSERT, UPDATE, DELETE ON events TO authenticated;

-- ============================================
-- Step 6: Verify
-- ============================================
SELECT 
  'Policies created:' as message,
  COUNT(*) as count
FROM pg_policies
WHERE tablename = 'events';

SELECT 
  policyname as policy_name,
  cmd as operation
FROM pg_policies
WHERE tablename = 'events'
ORDER BY cmd, policyname;

-- ============================================
-- DONE!
-- ============================================
-- Now try creating an event with allowed_roles!
-- It should work because:
-- 1. INSERT policy only checks if you're an admin
-- 2. INSERT policy does NOT check the allowed_roles value
-- 3. SELECT policy filters for members based on their roles

