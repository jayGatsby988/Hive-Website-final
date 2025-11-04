-- FIX: Allow admins to create events with allowed_roles
-- This fixes the "new row violates row-level security policy" error

-- ============================================
-- Drop and recreate the INSERT policy
-- ============================================

-- Drop the old INSERT policy
DROP POLICY IF EXISTS "admins_can_insert_events" ON events;

-- Create new INSERT policy that allows setting allowed_roles
CREATE POLICY "admins_can_insert_events"
ON events
FOR INSERT
TO authenticated
WITH CHECK (
  -- Admin check
  EXISTS (
    SELECT 1 
    FROM organization_members om
    WHERE om.user_id = auth.uid()
      AND om.organization_id = events.organization_id
      AND om.role = 'admin'
      AND om.is_active = true
  )
  -- No additional checks on allowed_roles - admins can set any roles
);

-- ============================================
-- Also update the UPDATE policy to be safe
-- ============================================

DROP POLICY IF EXISTS "admins_can_update_events" ON events;

CREATE POLICY "admins_can_update_events"
ON events
FOR UPDATE
TO authenticated
USING (
  -- Can update if admin
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
  -- Can set any values if admin
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
-- Verify
-- ============================================
SELECT 
  policyname,
  cmd as operation,
  'Fixed!' as status
FROM pg_policies
WHERE tablename = 'events'
  AND policyname IN ('admins_can_insert_events', 'admins_can_update_events');

-- ============================================
-- DONE!
-- ============================================
-- You can now create events with any allowed_roles setting!
-- The SELECT policy still filters based on roles for regular members.

