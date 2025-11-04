-- Complete RLS setup for all check-in related tables
-- Run this in Supabase SQL Editor to enable proper permissions

-- =========================================
-- 1. VOLUNTEER_SESSIONS TABLE
-- =========================================

ALTER TABLE volunteer_sessions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own sessions" ON volunteer_sessions;
DROP POLICY IF EXISTS "Users can create own sessions" ON volunteer_sessions;
DROP POLICY IF EXISTS "Users can update own sessions" ON volunteer_sessions;
DROP POLICY IF EXISTS "Admins can read org event sessions" ON volunteer_sessions;
DROP POLICY IF EXISTS "Admins can create org event sessions" ON volunteer_sessions;
DROP POLICY IF EXISTS "Admins can update org event sessions" ON volunteer_sessions;

-- Users can read their own sessions
CREATE POLICY "Users can read own sessions"
ON volunteer_sessions FOR SELECT
USING (auth.uid() = user_id);

-- Users can create their own sessions (self check-in)
CREATE POLICY "Users can create own sessions"
ON volunteer_sessions FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update their own active sessions (self check-out)
CREATE POLICY "Users can update own sessions"
ON volunteer_sessions FOR UPDATE
USING (auth.uid() = user_id);

-- Admins can read all sessions for their org events
CREATE POLICY "Admins can read org event sessions"
ON volunteer_sessions FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM events e
    INNER JOIN organization_members om ON om.organization_id = e.organization_id
    WHERE e.id = volunteer_sessions.event_id
    AND om.user_id = auth.uid()
    AND om.role IN ('admin', 'owner')
    AND om.is_active = true
  )
);

-- Admins can create sessions for any user in their org events
CREATE POLICY "Admins can create org event sessions"
ON volunteer_sessions FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM events e
    INNER JOIN organization_members om ON om.organization_id = e.organization_id
    WHERE e.id = event_id
    AND om.user_id = auth.uid()
    AND om.role IN ('admin', 'owner')
    AND om.is_active = true
  )
);

-- Admins can update sessions for their org events
CREATE POLICY "Admins can update org event sessions"
ON volunteer_sessions FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM events e
    INNER JOIN organization_members om ON om.organization_id = e.organization_id
    WHERE e.id = volunteer_sessions.event_id
    AND om.user_id = auth.uid()
    AND om.role IN ('admin', 'owner')
    AND om.is_active = true
  )
);

-- =========================================
-- 2. VOLUNTEER_HOURS TABLE
-- =========================================

ALTER TABLE volunteer_hours ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own hours" ON volunteer_hours;
DROP POLICY IF EXISTS "Users can insert own hours" ON volunteer_hours;
DROP POLICY IF EXISTS "Admins can read org hours" ON volunteer_hours;
DROP POLICY IF EXISTS "Admins can insert org hours" ON volunteer_hours;

-- Users can read their own volunteer hours
CREATE POLICY "Users can read own hours"
ON volunteer_hours FOR SELECT
USING (auth.uid() = user_id);

-- Users can insert their own hours (auto-created on check-out)
CREATE POLICY "Users can insert own hours"
ON volunteer_hours FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Admins can read volunteer hours for their organization
CREATE POLICY "Admins can read org hours"
ON volunteer_hours FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM organization_members om
    WHERE om.organization_id = volunteer_hours.organization_id
    AND om.user_id = auth.uid()
    AND om.role IN ('admin', 'owner')
    AND om.is_active = true
  )
);

-- Admins can insert hours for users in their organization
CREATE POLICY "Admins can insert org hours"
ON volunteer_hours FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM organization_members om
    WHERE om.organization_id = organization_id
    AND om.user_id = auth.uid()
    AND om.role IN ('admin', 'owner')
    AND om.is_active = true
  )
);

-- =========================================
-- 3. ADMIN_CHECKIN_AUDIT TABLE
-- =========================================

ALTER TABLE admin_checkin_audit ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can read org audit logs" ON admin_checkin_audit;
DROP POLICY IF EXISTS "Admins can insert audit logs" ON admin_checkin_audit;

-- Admins can read audit logs for their organization's events
CREATE POLICY "Admins can read org audit logs"
ON admin_checkin_audit FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM events e
    INNER JOIN organization_members om ON om.organization_id = e.organization_id
    WHERE e.id = admin_checkin_audit.event_id
    AND om.user_id = auth.uid()
    AND om.role IN ('admin', 'owner')
    AND om.is_active = true
  )
);

-- Admins can insert audit logs for their organization's events
CREATE POLICY "Admins can insert audit logs"
ON admin_checkin_audit FOR INSERT
WITH CHECK (
  auth.uid() = admin_id
  AND EXISTS (
    SELECT 1 FROM events e
    INNER JOIN organization_members om ON om.organization_id = e.organization_id
    WHERE e.id = event_id
    AND om.user_id = auth.uid()
    AND om.role IN ('admin', 'owner')
    AND om.is_active = true
  )
);

-- =========================================
-- 4. EVENT_CHECKINS TABLE (Optional)
-- =========================================

ALTER TABLE event_checkins ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own checkins" ON event_checkins;
DROP POLICY IF EXISTS "Users can insert own checkins" ON event_checkins;
DROP POLICY IF EXISTS "Admins can read org event checkins" ON event_checkins;

-- Users can read their own check-ins
CREATE POLICY "Users can read own checkins"
ON event_checkins FOR SELECT
USING (auth.uid() = user_id);

-- Users can insert their own check-ins
CREATE POLICY "Users can insert own checkins"
ON event_checkins FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Admins can read check-ins for their organization's events
CREATE POLICY "Admins can read org event checkins"
ON event_checkins FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM events e
    INNER JOIN organization_members om ON om.organization_id = e.organization_id
    WHERE e.id = event_checkins.event_id
    AND om.user_id = auth.uid()
    AND om.role IN ('admin', 'owner')
    AND om.is_active = true
  )
);

-- =========================================
-- VERIFICATION QUERIES
-- =========================================

-- List all policies for check-in tables
SELECT 
  tablename, 
  policyname,
  cmd as operation,
  CASE 
    WHEN qual IS NOT NULL THEN 'USING clause exists'
    ELSE 'No USING clause'
  END as has_using,
  CASE 
    WHEN with_check IS NOT NULL THEN 'WITH CHECK exists'
    ELSE 'No WITH CHECK'
  END as has_check
FROM pg_policies 
WHERE tablename IN ('volunteer_sessions', 'volunteer_hours', 'admin_checkin_audit', 'event_checkins')
ORDER BY tablename, policyname;

-- Test if current user can perform operations
DO $$
BEGIN
  RAISE NOTICE 'RLS Policies have been set up successfully!';
  RAISE NOTICE 'volunteer_sessions: % policies', (SELECT COUNT(*) FROM pg_policies WHERE tablename = 'volunteer_sessions');
  RAISE NOTICE 'volunteer_hours: % policies', (SELECT COUNT(*) FROM pg_policies WHERE tablename = 'volunteer_hours');
  RAISE NOTICE 'admin_checkin_audit: % policies', (SELECT COUNT(*) FROM pg_policies WHERE tablename = 'admin_checkin_audit');
  RAISE NOTICE 'event_checkins: % policies', (SELECT COUNT(*) FROM pg_policies WHERE tablename = 'event_checkins');
END $$;

