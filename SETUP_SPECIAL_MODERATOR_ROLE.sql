-- ============================================
-- SETUP SPECIAL MODERATOR ROLE
-- This creates a private "moderator" role with admin-like permissions
-- except they cannot add/remove members
-- ============================================

-- Step 1: Create the user (if not exists)
DO $$
DECLARE
  v_user_id UUID;
  v_user_exists BOOLEAN;
BEGIN
  -- Check if user already exists
  SELECT EXISTS (
    SELECT 1 FROM auth.users WHERE email = 'poop@gmail.com'
  ) INTO v_user_exists;

  IF NOT v_user_exists THEN
    -- Insert user into auth.users
    INSERT INTO auth.users (
      instance_id,
      id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      recovery_sent_at,
      last_sign_in_at,
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at,
      confirmation_token,
      email_change,
      email_change_token_new,
      recovery_token
    )
    VALUES (
      '00000000-0000-0000-0000-000000000000',
      gen_random_uuid(),
      'authenticated',
      'authenticated',
      'poop@gmail.com',
      crypt('123456', gen_salt('bf')), -- Password: 123456
      NOW(),
      NOW(),
      NOW(),
      '{"provider":"email","providers":["email"]}',
      '{"name":"Moderator User"}',
      NOW(),
      NOW(),
      '',
      '',
      '',
      ''
    )
    RETURNING id INTO v_user_id;

    -- Insert into public users table (handle if already exists)
    INSERT INTO users (id, email, name, role, created_at, updated_at)
    VALUES (
      v_user_id,
      'poop@gmail.com',
      'Moderator User',
      'user', -- Regular user role in public table
      NOW(),
      NOW()
    )
    ON CONFLICT (id) DO UPDATE
    SET email = EXCLUDED.email,
        name = EXCLUDED.name,
        updated_at = NOW();

    RAISE NOTICE '✅ Created user: poop@gmail.com with ID: %', v_user_id;
  ELSE
    SELECT id INTO v_user_id FROM auth.users WHERE email = 'poop@gmail.com';
    RAISE NOTICE '✅ User already exists: poop@gmail.com with ID: %', v_user_id;
  END IF;

  -- Store the user_id for later use
  CREATE TEMP TABLE IF NOT EXISTS temp_moderator_user (user_id UUID);
  DELETE FROM temp_moderator_user;
  INSERT INTO temp_moderator_user VALUES (v_user_id);
END $$;

-- Step 2: Create the "moderator" role type
-- This is a special private role that won't show up in public role selection
DO $$
BEGIN
  -- Drop the existing role check constraint if it exists
  ALTER TABLE organization_members 
  DROP CONSTRAINT IF EXISTS organization_members_role_check;
  
  -- Add a new constraint that includes 'moderator'
  ALTER TABLE organization_members 
  ADD CONSTRAINT organization_members_role_check 
  CHECK (role IN ('admin', 'member', 'moderator'));
  
  RAISE NOTICE '✅ Updated organization_members role constraint to include moderator';
END $$;

-- Step 3: Update RLS policies to support moderator role
-- Moderators get most admin permissions except member management

-- Events: Moderators can create, update, and delete events
DROP POLICY IF EXISTS "Moderators can manage events" ON events;
CREATE POLICY "Moderators can manage events"
ON events
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM organization_members om
    WHERE om.user_id = auth.uid()
      AND om.organization_id = events.organization_id
      AND om.is_active = true
      AND om.role IN ('admin', 'moderator')
  )
);

-- Event attendees: Moderators can manage
DROP POLICY IF EXISTS "Moderators can manage attendees" ON event_attendees;
CREATE POLICY "Moderators can manage attendees"
ON event_attendees
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM organization_members om
    JOIN events e ON e.id = event_attendees.event_id
    WHERE om.user_id = auth.uid()
      AND om.organization_id = e.organization_id
      AND om.is_active = true
      AND om.role IN ('admin', 'moderator')
  )
);

-- Event checkins: Moderators can manage
DROP POLICY IF EXISTS "Moderators can manage checkins" ON event_checkins;
CREATE POLICY "Moderators can manage checkins"
ON event_checkins
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM organization_members om
    JOIN events e ON e.id = event_checkins.event_id
    WHERE om.user_id = auth.uid()
      AND om.organization_id = e.organization_id
      AND om.is_active = true
      AND om.role IN ('admin', 'moderator')
  )
);

-- Audit logs: Moderators can view (but not insert - that's automatic)
DROP POLICY IF EXISTS "Moderators can view audit logs" ON audit_log;
CREATE POLICY "Moderators can view audit logs"
ON audit_log
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM organization_members om
    WHERE om.user_id = auth.uid()
      AND om.organization_id = audit_log.organization_id
      AND om.is_active = true
      AND om.role IN ('admin', 'moderator')
  )
);

-- Organization roles: Moderators can view and assign roles to members
DROP POLICY IF EXISTS "Moderators can manage org roles" ON user_organization_roles;
CREATE POLICY "Moderators can manage org roles"
ON user_organization_roles
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM organization_members om
    WHERE om.user_id = auth.uid()
      AND om.organization_id = user_organization_roles.organization_id
      AND om.is_active = true
      AND om.role IN ('admin', 'moderator')
  )
);

-- Organization members: RESTRICT moderators from INSERT/DELETE
-- Update the existing policy to ONLY allow admins (not moderators) to add members
DROP POLICY IF EXISTS "Admins can add members" ON organization_members;
CREATE POLICY "Admins can add members"
ON organization_members
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM organization_members om
    WHERE om.user_id = auth.uid()
      AND om.organization_id = organization_members.organization_id
      AND om.is_active = true
      AND om.role = 'admin' -- ONLY admins, not moderators
  )
);

-- Admins can remove members (moderators cannot)
DROP POLICY IF EXISTS "Admins can remove members" ON organization_members;
CREATE POLICY "Admins can remove members"
ON organization_members
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM organization_members om
    WHERE om.user_id = auth.uid()
      AND om.organization_id = organization_members.organization_id
      AND om.is_active = true
      AND om.role = 'admin' -- ONLY admins, not moderators
  )
);

-- Moderators can view members but not add/remove
DROP POLICY IF EXISTS "Moderators can view members" ON organization_members;
CREATE POLICY "Moderators can view members"
ON organization_members
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM organization_members om
    WHERE om.user_id = auth.uid()
      AND om.organization_id = organization_members.organization_id
      AND om.is_active = true
      AND om.role IN ('admin', 'moderator')
  )
  OR
  user_id = auth.uid()
);

-- Moderators can update member roles/status (but not add/remove)
DROP POLICY IF EXISTS "Moderators can update member roles" ON organization_members;
CREATE POLICY "Moderators can update member roles"
ON organization_members
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM organization_members om
    WHERE om.user_id = auth.uid()
      AND om.organization_id = organization_members.organization_id
      AND om.is_active = true
      AND om.role IN ('admin', 'moderator')
  )
);

-- Step 4: Update OrganizationContext to recognize moderator role as having admin-like permissions
-- This will need to be done in the frontend code

-- Step 5: Assign moderator role to the user for a specific organization
-- (You'll need to replace 'YOUR_ORG_ID' with the actual organization ID)
DO $$
DECLARE
  v_user_id UUID;
  v_org_id UUID;
  v_org_exists BOOLEAN;
BEGIN
  -- Get the user_id we created
  SELECT user_id INTO v_user_id FROM temp_moderator_user LIMIT 1;

  -- Get the first organization (or you can specify a specific one)
  SELECT id INTO v_org_id FROM organizations ORDER BY created_at DESC LIMIT 1;

  IF v_org_id IS NOT NULL THEN
    -- Check if membership already exists
    SELECT EXISTS (
      SELECT 1 FROM organization_members 
      WHERE user_id = v_user_id 
      AND organization_id = v_org_id
    ) INTO v_org_exists;

    IF NOT v_org_exists THEN
      -- Add user as moderator to the organization
      INSERT INTO organization_members (
        organization_id,
        user_id,
        role,
        is_active,
        joined_at
      )
      VALUES (
        v_org_id,
        v_user_id,
        'moderator', -- Special moderator role
        true,
        NOW()
      );

      RAISE NOTICE '✅ Added poop@gmail.com as MODERATOR to organization: %', v_org_id;
    ELSE
      -- Update existing membership to moderator
      UPDATE organization_members
      SET role = 'moderator', is_active = true
      WHERE user_id = v_user_id AND organization_id = v_org_id;

      RAISE NOTICE '✅ Updated poop@gmail.com to MODERATOR role in organization: %', v_org_id;
    END IF;
  ELSE
    RAISE NOTICE '⚠️  No organizations found. Please create an organization first.';
  END IF;
END $$;

-- Step 6: Create a helper function to check if user is moderator or admin
CREATE OR REPLACE FUNCTION is_admin_or_moderator(p_user_id UUID, p_org_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM organization_members
    WHERE user_id = p_user_id
      AND organization_id = p_org_id
      AND role IN ('admin', 'moderator')
      AND is_active = true
  );
END;
$$;

-- Step 7: Summary
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '✅✅✅ MODERATOR ROLE SETUP COMPLETE! ✅✅✅';
  RAISE NOTICE '';
  RAISE NOTICE 'Created:';
  RAISE NOTICE '  - User: poop@gmail.com (password: 123456)';
  RAISE NOTICE '  - Special "moderator" role in organization_members';
  RAISE NOTICE '  - RLS policies for moderator permissions';
  RAISE NOTICE '';
  RAISE NOTICE 'Moderator Permissions:';
  RAISE NOTICE '  ✅ Create, edit, delete events';
  RAISE NOTICE '  ✅ Manage event attendees and check-ins';
  RAISE NOTICE '  ✅ View and assign roles to members';
  RAISE NOTICE '  ✅ View audit logs';
  RAISE NOTICE '  ✅ Update member roles/status';
  RAISE NOTICE '  ❌ CANNOT add new members';
  RAISE NOTICE '  ❌ CANNOT remove members';
  RAISE NOTICE '';
  RAISE NOTICE 'Admin Permissions:';
  RAISE NOTICE '  ✅ All moderator permissions';
  RAISE NOTICE '  ✅ Add new members';
  RAISE NOTICE '  ✅ Remove members';
  RAISE NOTICE '';
  RAISE NOTICE 'Login with: poop@gmail.com / 123456';
  RAISE NOTICE '';
END $$;

-- Clean up temp table
DROP TABLE IF EXISTS temp_moderator_user;

