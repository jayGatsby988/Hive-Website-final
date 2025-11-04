-- SIMPLE EVENT FILTERING FIX
-- Copy and paste this ENTIRE file into Supabase SQL Editor and click RUN

-- ============================================
-- 1. Add allowed_roles column if it doesn't exist
-- ============================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'events' 
    AND column_name = 'allowed_roles'
  ) THEN
    ALTER TABLE events ADD COLUMN allowed_roles TEXT[] DEFAULT '{}';
  END IF;
END $$;

-- ============================================
-- 2. Create the filtering function
-- ============================================
CREATE OR REPLACE FUNCTION user_can_view_event(
  p_user_id UUID,
  p_event_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
DECLARE
  v_allowed_roles TEXT[];
  v_organization_id UUID;
  v_user_roles TEXT[];
  v_is_admin BOOLEAN;
BEGIN
  -- Get event's allowed roles and organization
  SELECT allowed_roles, organization_id
  INTO v_allowed_roles, v_organization_id
  FROM events
  WHERE id = p_event_id;
  
  IF NOT FOUND THEN
    RETURN false;
  END IF;
  
  -- If no roles specified, everyone can view
  IF v_allowed_roles IS NULL OR 
     array_length(v_allowed_roles, 1) IS NULL OR 
     array_length(v_allowed_roles, 1) = 0 THEN
    RETURN true;
  END IF;
  
  -- If 'everyone' is in allowed_roles
  IF 'everyone' = ANY(v_allowed_roles) THEN
    RETURN true;
  END IF;
  
  -- Check if user is admin
  SELECT (role = 'admin')
  INTO v_is_admin
  FROM organization_members
  WHERE user_id = p_user_id
    AND organization_id = v_organization_id
    AND is_active = true;
  
  IF v_is_admin THEN
    RETURN true;
  END IF;
  
  -- Get user's roles
  SELECT array_agg(role_name)
  INTO v_user_roles
  FROM user_organization_roles
  WHERE user_id = p_user_id
    AND organization_id = v_organization_id;
  
  -- Check if user has any required role
  IF v_user_roles IS NOT NULL AND v_allowed_roles && v_user_roles THEN
    RETURN true;
  END IF;
  
  RETURN false;
END;
$$;

-- ============================================
-- 3. Drop old policies
-- ============================================
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN SELECT policyname FROM pg_policies WHERE tablename = 'events'
  LOOP
    EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON events';
  END LOOP;
END $$;

-- ============================================
-- 4. Create new SELECT policy with role filtering
-- ============================================
CREATE POLICY "role_based_event_select"
ON events
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 
    FROM organization_members om
    WHERE om.user_id = auth.uid()
      AND om.organization_id = events.organization_id
      AND om.is_active = true
  )
  AND user_can_view_event(auth.uid(), events.id)
);

-- ============================================
-- 5. Create INSERT policy for admins
-- ============================================
CREATE POLICY "admins_can_insert_events"
ON events
FOR INSERT
TO authenticated
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

-- ============================================
-- 6. Create UPDATE policy for admins
-- ============================================
CREATE POLICY "admins_can_update_events"
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

-- ============================================
-- 7. Enable RLS and grant permissions
-- ============================================
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
GRANT SELECT ON events TO authenticated;
GRANT INSERT ON events TO authenticated;
GRANT UPDATE ON events TO authenticated;

-- ============================================
-- 8. Verify setup
-- ============================================
SELECT 
  'events' as table_name,
  COUNT(*) as policy_count,
  string_agg(policyname, ', ') as policies
FROM pg_policies
WHERE tablename = 'events'
GROUP BY tablename;

-- ============================================
-- DONE! 
-- ============================================
-- Event filtering is now active!
-- 
-- Test it:
-- 1. Update an event: UPDATE events SET allowed_roles = ARRAY['volunteer'] WHERE id = 'your-event-id';
-- 2. Log in as member without role → Event hidden
-- 3. Go to My Roles → Select volunteer
-- 4. Refresh Events page → Event now visible!

