-- RUN THIS IN SUPABASE SQL EDITOR TO DIAGNOSE THE ISSUE
-- Copy ALL of this, paste in Supabase SQL Editor, then click RUN

-- ============================================
-- 1. CHECK IF BAD CONSTRAINT STILL EXISTS
-- ============================================
SELECT 
  'BAD CONSTRAINT CHECK' as test,
  CASE 
    WHEN COUNT(*) > 0 THEN '❌ BAD CONSTRAINT STILL EXISTS - Run COPY_PASTE_THIS_SQL.sql'
    ELSE '✅ Constraint fixed'
  END as result
FROM pg_constraint
WHERE conrelid = 'volunteer_sessions'::regclass 
AND conname = 'volunteer_sessions_user_id_event_id_status_key';

-- ============================================
-- 2. CHECK IF GOOD INDEX EXISTS
-- ============================================
SELECT 
  'GOOD INDEX CHECK' as test,
  CASE 
    WHEN COUNT(*) > 0 THEN '✅ Good index exists'
    ELSE '❌ MISSING INDEX - Run COPY_PASTE_THIS_SQL.sql'
  END as result
FROM pg_indexes
WHERE tablename = 'volunteer_sessions'
AND indexname = 'idx_volunteer_sessions_active_unique';

-- ============================================
-- 3. CHECK RLS POLICIES
-- ============================================
SELECT 
  'RLS POLICIES CHECK' as test,
  CASE 
    WHEN COUNT(*) >= 6 THEN '✅ ' || COUNT(*) || ' policies exist (good)'
    ELSE '❌ ONLY ' || COUNT(*) || ' policies - Need 6! Run setup-all-checkin-rls.sql'
  END as result
FROM pg_policies 
WHERE tablename = 'volunteer_sessions';

-- ============================================
-- 4. CHECK IF YOU'RE AN ADMIN
-- ============================================
SELECT 
  'YOUR ROLE CHECK' as test,
  CASE 
    WHEN COUNT(*) > 0 THEN '✅ You are an admin in ' || COUNT(*) || ' organization(s)'
    ELSE '❌ YOU ARE NOT AN ADMIN - Cannot check in others'
  END as result
FROM organization_members 
WHERE user_id = auth.uid() 
AND role IN ('admin', 'owner')
AND is_active = true;

-- ============================================
-- 5. CHECK RECENT SESSIONS
-- ============================================
SELECT 
  'RECENT SESSIONS' as info,
  COUNT(*) as total_sessions,
  COUNT(*) FILTER (WHERE status = 'active') as active_sessions,
  COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '1 hour') as last_hour
FROM volunteer_sessions;

-- ============================================
-- 6. CHECK FOR DUPLICATE ACTIVE SESSIONS
-- ============================================
SELECT 
  'DUPLICATE CHECK' as test,
  CASE 
    WHEN COUNT(*) > 0 THEN '❌ ' || COUNT(*) || ' users have duplicate active sessions - PROBLEM!'
    ELSE '✅ No duplicates'
  END as result
FROM (
  SELECT user_id, event_id, COUNT(*) as cnt
  FROM volunteer_sessions
  WHERE status = 'active'
  GROUP BY user_id, event_id
  HAVING COUNT(*) > 1
) dups;

-- ============================================
-- 7. TEST IF YOU CAN INSERT (as admin)
-- ============================================
DO $$
DECLARE
  test_user_id uuid;
  test_event_id uuid;
  can_insert boolean := false;
BEGIN
  -- Get a real user and event to test with
  SELECT id INTO test_user_id FROM auth.users LIMIT 1;
  SELECT e.id INTO test_event_id 
  FROM events e
  INNER JOIN organization_members om ON om.organization_id = e.organization_id
  WHERE om.user_id = auth.uid()
  AND om.role IN ('admin', 'owner')
  LIMIT 1;
  
  IF test_user_id IS NOT NULL AND test_event_id IS NOT NULL THEN
    -- Try to insert a test session
    BEGIN
      INSERT INTO volunteer_sessions (user_id, event_id, started_at, status)
      VALUES (test_user_id, test_event_id, NOW(), 'active');
      
      can_insert := true;
      
      -- Clean up test
      DELETE FROM volunteer_sessions 
      WHERE user_id = test_user_id 
      AND event_id = test_event_id 
      AND started_at > NOW() - INTERVAL '1 minute';
      
      RAISE NOTICE '✅ INSERT TEST PASSED - You can create sessions';
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE '❌ INSERT TEST FAILED - Error: %', SQLERRM;
    END;
  ELSE
    RAISE NOTICE '⚠️  Cannot test insert - No users or events found';
  END IF;
END $$;

-- ============================================
-- SUMMARY
-- ============================================
SELECT 
  '=== SUMMARY ===' as section,
  'Check results above' as instructions,
  'If you see ❌ anywhere, follow the fix instructions' as action_needed;

