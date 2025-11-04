-- Complete Role-Based Event System Setup
-- Run this in Supabase SQL Editor

-- ============================================
-- 1. Add allowed_roles column to events table
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
    RAISE NOTICE '✅ Added allowed_roles column to events table';
  ELSE
    RAISE NOTICE 'ℹ️ allowed_roles column already exists';
  END IF;
END $$;

-- ============================================
-- 2. Create user_organization_roles table (if not exists)
-- ============================================
CREATE TABLE IF NOT EXISTS user_organization_roles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  role_name TEXT NOT NULL,
  assigned_at TIMESTAMPTZ DEFAULT NOW(),
  assigned_by UUID REFERENCES users(id),
  UNIQUE(user_id, organization_id, role_name)
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_user_org_roles_user_org 
ON user_organization_roles(user_id, organization_id);

CREATE INDEX IF NOT EXISTS idx_user_org_roles_org 
ON user_organization_roles(organization_id);

-- ============================================
-- 3. Enable RLS on user_organization_roles
-- ============================================
ALTER TABLE user_organization_roles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view roles in their organizations" ON user_organization_roles;
DROP POLICY IF EXISTS "Users can view own roles" ON user_organization_roles;
DROP POLICY IF EXISTS "Users can update own roles" ON user_organization_roles;
DROP POLICY IF EXISTS "Admins can manage roles" ON user_organization_roles;

-- Users can view roles in organizations they're members of
CREATE POLICY "Users can view roles in their organizations"
ON user_organization_roles
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM organization_members om
    WHERE om.user_id = auth.uid()
    AND om.organization_id = user_organization_roles.organization_id
    AND om.is_active = true
  )
);

-- Users can insert their own roles (for self-selection)
CREATE POLICY "Users can select own roles"
ON user_organization_roles
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = user_id
  AND EXISTS (
    SELECT 1 FROM organization_members om
    WHERE om.user_id = auth.uid()
    AND om.organization_id = user_organization_roles.organization_id
    AND om.is_active = true
  )
  AND EXISTS (
    SELECT 1 FROM organization_roles oroles
    WHERE oroles.organization_id = user_organization_roles.organization_id
    AND oroles.role_name = user_organization_roles.role_name
    AND oroles.is_public = true
  )
);

-- Users can delete their own role assignments
CREATE POLICY "Users can remove own roles"
ON user_organization_roles
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Admins can manage all roles in their organization
CREATE POLICY "Admins can manage roles"
ON user_organization_roles
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM organization_members om
    WHERE om.user_id = auth.uid()
    AND om.organization_id = user_organization_roles.organization_id
    AND om.role = 'admin'
    AND om.is_active = true
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM organization_members om
    WHERE om.user_id = auth.uid()
    AND om.organization_id = user_organization_roles.organization_id
    AND om.role = 'admin'
    AND om.is_active = true
  )
);

-- ============================================
-- 4. Enable RLS on organization_roles
-- ============================================
ALTER TABLE organization_roles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Members can view organization roles" ON organization_roles;
DROP POLICY IF EXISTS "Admins can manage organization roles" ON organization_roles;

-- Members can view roles in their organizations
CREATE POLICY "Members can view organization roles"
ON organization_roles
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM organization_members om
    WHERE om.user_id = auth.uid()
    AND om.organization_id = organization_roles.organization_id
    AND om.is_active = true
  )
);

-- Admins can manage roles
CREATE POLICY "Admins can manage organization roles"
ON organization_roles
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM organization_members om
    WHERE om.user_id = auth.uid()
    AND om.organization_id = organization_roles.organization_id
    AND om.role = 'admin'
    AND om.is_active = true
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM organization_members om
    WHERE om.user_id = auth.uid()
    AND om.organization_id = organization_roles.organization_id
    AND om.role = 'admin'
    AND om.is_active = true
  )
);

-- ============================================
-- 5. Grant permissions
-- ============================================
GRANT SELECT, INSERT, DELETE ON user_organization_roles TO authenticated;
GRANT SELECT ON organization_roles TO authenticated;
GRANT UPDATE(allowed_roles) ON events TO authenticated;

-- ============================================
-- 6. Create helper function to check if user has role
-- ============================================
CREATE OR REPLACE FUNCTION user_has_role(
  p_user_id UUID,
  p_organization_id UUID,
  p_role_name TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM user_organization_roles
    WHERE user_id = p_user_id
    AND organization_id = p_organization_id
    AND role_name = p_role_name
  );
END;
$$;

-- ============================================
-- 7. Create function to check if user can view event
-- ============================================
CREATE OR REPLACE FUNCTION user_can_view_event(
  p_user_id UUID,
  p_event_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_allowed_roles TEXT[];
  v_organization_id UUID;
  v_user_roles TEXT[];
BEGIN
  -- Get event's allowed roles and organization
  SELECT allowed_roles, organization_id
  INTO v_allowed_roles, v_organization_id
  FROM events
  WHERE id = p_event_id;
  
  -- If no roles specified or array is empty, everyone can view
  IF v_allowed_roles IS NULL OR array_length(v_allowed_roles, 1) IS NULL THEN
    RETURN true;
  END IF;
  
  -- If 'everyone' is in allowed_roles, everyone can view
  IF 'everyone' = ANY(v_allowed_roles) THEN
    RETURN true;
  END IF;
  
  -- Check if user is admin (admins can always view)
  IF EXISTS (
    SELECT 1 FROM organization_members
    WHERE user_id = p_user_id
    AND organization_id = v_organization_id
    AND role = 'admin'
    AND is_active = true
  ) THEN
    RETURN true;
  END IF;
  
  -- Get user's roles
  SELECT array_agg(role_name)
  INTO v_user_roles
  FROM user_organization_roles
  WHERE user_id = p_user_id
  AND organization_id = v_organization_id;
  
  -- Check if user has any of the required roles
  IF v_user_roles IS NOT NULL THEN
    RETURN v_allowed_roles && v_user_roles; -- Array overlap operator
  END IF;
  
  RETURN false;
END;
$$;

-- ============================================
-- 8. Update events RLS policy to respect roles
-- ============================================
DROP POLICY IF EXISTS "Users can view events in their organizations" ON events;

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

-- ============================================
-- 9. Verify setup
-- ============================================
DO $$
BEGIN
  RAISE NOTICE '✅ Role system setup complete!';
  RAISE NOTICE '';
  RAISE NOTICE '📋 Summary:';
  RAISE NOTICE '  - added_roles column added to events table';
  RAISE NOTICE '  - user_organization_roles table created';
  RAISE NOTICE '  - RLS policies configured';
  RAISE NOTICE '  - Helper functions created';
  RAISE NOTICE '';
  RAISE NOTICE '🎯 Next steps:';
  RAISE NOTICE '  1. Members can now select their roles';
  RAISE NOTICE '  2. Admins can create events with role restrictions';
  RAISE NOTICE '  3. Events will only show to users with matching roles';
END $$;

-- ============================================
-- 10. Example: Create some default roles
-- ============================================
-- Uncomment and modify for your organizations
/*
INSERT INTO organization_roles (organization_id, role_name, is_public, options)
VALUES
  ('YOUR-ORG-ID', 'volunteer', true, '{}'),
  ('YOUR-ORG-ID', 'team_lead', true, '{}'),
  ('YOUR-ORG-ID', 'coordinator', true, '{}')
ON CONFLICT (organization_id, role_name) DO NOTHING;
*/

