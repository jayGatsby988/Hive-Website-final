-- FIX EVENT FILTERING - Run this NOW
-- This ensures role-based filtering works immediately

-- ============================================
-- Step 1: Make sure allowed_roles column exists
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
    RAISE NOTICE '✅ Added allowed_roles column';
  ELSE
    RAISE NOTICE 'ℹ️ allowed_roles column already exists';
  END IF;
END $$;

-- ============================================
-- Step 2: Create or replace the filtering function
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
  
  -- If event not found, deny access
  IF NOT FOUND THEN
    RETURN false;
  END IF;
  
  -- If no roles specified or array is empty or null, everyone can view
  IF v_allowed_roles IS NULL OR 
     array_length(v_allowed_roles, 1) IS NULL OR 
     array_length(v_allowed_roles, 1) = 0 THEN
    RETURN true;
  END IF;
  
  -- If 'everyone' is in allowed_roles, everyone can view
  IF 'everyone' = ANY(v_allowed_roles) THEN
    RETURN true;
  END IF;
  
  -- Check if user is admin (admins can always view)
  SELECT (role = 'admin')
  INTO v_is_admin
  FROM organization_members
  WHERE user_id = p_user_id
    AND organization_id = v_organization_id
    AND is_active = true;
  
  IF v_is_admin THEN
    RETURN true;
  END IF;
  
  -- Get user's roles in this organization
  SELECT array_agg(role_name)
  INTO v_user_roles
  FROM user_organization_roles
  WHERE user_id = p_user_id
    AND organization_id = v_organization_id;
  
  -- Check if user has any of the required roles
  IF v_user_roles IS NOT NULL AND v_allowed_roles && v_user_roles THEN
    RETURN true;
  END IF;
  
  -- Default: deny access
  RETURN false;
END;
$$;

DO $$
BEGIN
  RAISE NOTICE '✅ Created user_can_view_event function';
END $$;

-- ============================================
-- Step 3: Drop ALL existing event policies
-- ============================================
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN SELECT policyname FROM pg_policies WHERE tablename = 'events'
  LOOP
    EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON events';
    RAISE NOTICE 'Dropped policy: %', r.policyname;
  END LOOP;
END $$;

-- ============================================
-- Step 4: Create ONE simple RLS policy for SELECT
-- ============================================
CREATE POLICY "role_based_event_select"
ON events
FOR SELECT
TO authenticated
USING (
  -- User must be a member of the organization
  EXISTS (
    SELECT 1 
    FROM organization_members om
    WHERE om.user_id = auth.uid()
      AND om.organization_id = events.organization_id
      AND om.is_active = true
  )
  -- AND must pass the role check
  AND user_can_view_event(auth.uid(), events.id)
);

DO $$
BEGIN
  RAISE NOTICE '✅ Created role_based_event_select policy';
END $$;

-- ============================================
-- Step 5: Create INSERT policy for admins
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

DO $$
BEGIN
  RAISE NOTICE '✅ Created admins_can_insert_events policy';
END $$;

-- ============================================
-- Step 6: Create UPDATE policy for admins
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

DO $$
BEGIN
  RAISE NOTICE '✅ Created admins_can_update_events policy';
END $$;

-- ============================================
-- Step 7: Enable RLS
-- ============================================
ALTER TABLE events ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  RAISE NOTICE '✅ RLS enabled on events table';
END $$;

-- ============================================
-- Step 8: Grant permissions
-- ============================================
GRANT SELECT ON events TO authenticated;
GRANT INSERT ON events TO authenticated;
GRANT UPDATE ON events TO authenticated;

DO $$
BEGIN
  RAISE NOTICE '✅ Permissions granted';
END $$;

-- ============================================
-- Step 9: Verify the setup
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
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '✅✅✅ EVENT FILTERING IS NOW SET UP! ✅✅✅';
  RAISE NOTICE '';
  RAISE NOTICE 'What happens now:';
  RAISE NOTICE '1. Events with allowed_roles = [] or NULL → Everyone sees them';
  RAISE NOTICE '2. Events with allowed_roles = ["everyone"] → Everyone sees them';
  RAISE NOTICE '3. Events with allowed_roles = ["volunteer"] → Only volunteers see them';
  RAISE NOTICE '4. Admins → Always see ALL events';
  RAISE NOTICE '';
  RAISE NOTICE 'Test it:';
  RAISE NOTICE '1. Set some event allowed_roles';
  RAISE NOTICE '2. Log in as member';
  RAISE NOTICE '3. Go to My Roles and select roles';
  RAISE NOTICE '4. Go to Events - you should see filtered list!';
  RAISE NOTICE '';
END $$;

