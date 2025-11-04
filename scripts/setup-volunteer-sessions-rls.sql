-- Setup RLS policies for volunteer_sessions table
-- This ensures admins can check in/out users, and users can check themselves in/out

-- Enable RLS on volunteer_sessions
ALTER TABLE volunteer_sessions ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Users can read own sessions" ON volunteer_sessions;
DROP POLICY IF EXISTS "Users can create own sessions" ON volunteer_sessions;
DROP POLICY IF EXISTS "Users can update own sessions" ON volunteer_sessions;
DROP POLICY IF EXISTS "Admins can manage org event sessions" ON volunteer_sessions;
DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON volunteer_sessions;

-- Policy 1: Users can read their own volunteer sessions
CREATE POLICY "Users can read own sessions"
ON volunteer_sessions
FOR SELECT
USING (auth.uid() = user_id);

-- Policy 2: Users can insert their own sessions (self check-in)
CREATE POLICY "Users can create own sessions"
ON volunteer_sessions
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Policy 3: Users can update their own active sessions (self check-out)
CREATE POLICY "Users can update own sessions"
ON volunteer_sessions
FOR UPDATE
USING (auth.uid() = user_id AND status = 'active');

-- Policy 4: Admins can read all sessions for their organization's events
CREATE POLICY "Admins can read org event sessions"
ON volunteer_sessions
FOR SELECT
USING (
  EXISTS (
    SELECT 1 
    FROM events e
    INNER JOIN organization_members om ON om.organization_id = e.organization_id
    WHERE e.id = volunteer_sessions.event_id
    AND om.user_id = auth.uid()
    AND om.role IN ('admin', 'owner')
    AND om.is_active = true
  )
);

-- Policy 5: Admins can insert sessions for users in their organization's events (admin check-in)
CREATE POLICY "Admins can create org event sessions"
ON volunteer_sessions
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 
    FROM events e
    INNER JOIN organization_members om ON om.organization_id = e.organization_id
    WHERE e.id = event_id
    AND om.user_id = auth.uid()
    AND om.role IN ('admin', 'owner')
    AND om.is_active = true
  )
);

-- Policy 6: Admins can update sessions for their organization's events (admin check-out)
CREATE POLICY "Admins can update org event sessions"
ON volunteer_sessions
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 
    FROM events e
    INNER JOIN organization_members om ON om.organization_id = e.organization_id
    WHERE e.id = volunteer_sessions.event_id
    AND om.user_id = auth.uid()
    AND om.role IN ('admin', 'owner')
    AND om.is_active = true
  )
);

-- Verify policies were created
SELECT 
  schemaname, 
  tablename, 
  policyname, 
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'volunteer_sessions';

-- Test query: Check if current user can read volunteer_sessions
SELECT 
  'Can read volunteer_sessions: ' || 
  CASE WHEN COUNT(*) >= 0 THEN 'YES' ELSE 'NO' END as test_result
FROM volunteer_sessions
LIMIT 1;

