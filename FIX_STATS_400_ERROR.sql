-- Fix Stats Page 400 Errors
-- Run this in Supabase SQL Editor

-- ============================================
-- 1. Check if volunteer_hours table exists
-- ============================================
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'volunteer_hours') THEN
    -- Create volunteer_hours table if it doesn't exist
    CREATE TABLE volunteer_hours (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      event_id UUID REFERENCES events(id) ON DELETE CASCADE,
      organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
      date DATE NOT NULL,
      hours NUMERIC NOT NULL,
      notes TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );
    
    RAISE NOTICE 'Created volunteer_hours table';
  ELSE
    RAISE NOTICE 'volunteer_hours table already exists';
  END IF;
END $$;

-- ============================================
-- 2. Drop all existing RLS policies
-- ============================================
DROP POLICY IF EXISTS "Users can view own volunteer hours" ON volunteer_hours;
DROP POLICY IF EXISTS "Users can insert own volunteer hours" ON volunteer_hours;
DROP POLICY IF EXISTS "Users can update own volunteer hours" ON volunteer_hours;
DROP POLICY IF EXISTS "Users can delete own volunteer hours" ON volunteer_hours;
DROP POLICY IF EXISTS "Enable read for authenticated users" ON volunteer_hours;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON volunteer_hours;

-- ============================================
-- 3. Create simple RLS policies
-- ============================================

-- Allow users to SELECT their own volunteer hours
CREATE POLICY "Users can view own volunteer hours"
ON volunteer_hours
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Allow users to INSERT their own volunteer hours
CREATE POLICY "Users can insert own volunteer hours"
ON volunteer_hours
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Allow users to UPDATE their own volunteer hours
CREATE POLICY "Users can update own volunteer hours"
ON volunteer_hours
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- ============================================
-- 4. Enable RLS on volunteer_hours
-- ============================================
ALTER TABLE volunteer_hours ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 5. Grant necessary permissions
-- ============================================
GRANT SELECT, INSERT, UPDATE ON volunteer_hours TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated;

-- ============================================
-- 6. Check if events table has proper policies
-- ============================================
DROP POLICY IF EXISTS "Enable read for authenticated users" ON events;
CREATE POLICY "Enable read for authenticated users"
ON events
FOR SELECT
TO authenticated
USING (true);

ALTER TABLE events ENABLE ROW LEVEL SECURITY;
GRANT SELECT ON events TO authenticated;

-- ============================================
-- 7. Check if organizations table has proper policies
-- ============================================
DROP POLICY IF EXISTS "Enable read for authenticated users" ON organizations;
CREATE POLICY "Enable read for authenticated users"
ON organizations
FOR SELECT
TO authenticated
USING (true);

ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
GRANT SELECT ON organizations TO authenticated;

-- ============================================
-- 8. Verify the setup
-- ============================================
SELECT 
  'volunteer_hours' as table_name,
  policyname,
  cmd as operation,
  qual as using_expression,
  with_check as with_check_expression
FROM pg_policies
WHERE tablename = 'volunteer_hours'
ORDER BY policyname;

-- ============================================
-- 9. Test query (should return your hours)
-- ============================================
-- Replace 'YOUR-USER-ID' with actual user ID
-- SELECT * FROM volunteer_hours WHERE user_id = 'YOUR-USER-ID' LIMIT 5;

-- ============================================
-- Success message
-- ============================================
DO $$
BEGIN
  RAISE NOTICE '✅ RLS policies fixed!';
  RAISE NOTICE '✅ volunteer_hours table is ready';
  RAISE NOTICE '✅ Refresh your Stats page now';
END $$;

