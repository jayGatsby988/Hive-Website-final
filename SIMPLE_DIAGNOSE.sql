-- SIMPLE DIAGNOSTIC - Run this in Supabase SQL Editor
-- This version won't fail on missing columns

-- ============================================
-- 1. CHECK TABLE STRUCTURE
-- ============================================
SELECT 
  '1. TABLE COLUMNS' as check_name,
  STRING_AGG(column_name, ', ') as columns_found
FROM information_schema.columns
WHERE table_name = 'volunteer_sessions';

-- ============================================
-- 2. CHECK IF BAD CONSTRAINT EXISTS
-- ============================================
SELECT 
  '2. BAD CONSTRAINT' as check_name,
  CASE 
    WHEN COUNT(*) > 0 THEN '❌ STILL EXISTS - Run COPY_PASTE_THIS_SQL.sql'
    ELSE '✅ Fixed (constraint removed)'
  END as status
FROM pg_constraint
WHERE conrelid = 'volunteer_sessions'::regclass 
AND conname = 'volunteer_sessions_user_id_event_id_status_key';

-- ============================================
-- 3. CHECK IF GOOD INDEX EXISTS
-- ============================================
SELECT 
  '3. GOOD INDEX' as check_name,
  CASE 
    WHEN COUNT(*) > 0 THEN '✅ Exists'
    ELSE '❌ MISSING - Run COPY_PASTE_THIS_SQL.sql'
  END as status
FROM pg_indexes
WHERE tablename = 'volunteer_sessions'
AND indexname = 'idx_volunteer_sessions_active_unique';

-- ============================================
-- 4. CHECK RLS POLICIES
-- ============================================
SELECT 
  '4. RLS POLICIES' as check_name,
  COUNT(*)::text || ' policies' as count,
  CASE 
    WHEN COUNT(*) >= 6 THEN '✅ Good (need 6+)'
    ELSE '❌ Run setup-all-checkin-rls.sql'
  END as status
FROM pg_policies 
WHERE tablename = 'volunteer_sessions';

-- ============================================
-- 5. LIST ALL POLICIES
-- ============================================
SELECT 
  '5. POLICY DETAILS' as info,
  policyname,
  cmd as for_operation
FROM pg_policies 
WHERE tablename = 'volunteer_sessions'
ORDER BY policyname;

-- ============================================
-- 6. CHECK YOUR ADMIN STATUS
-- ============================================
SELECT 
  '6. YOUR ADMIN STATUS' as check_name,
  COUNT(*)::text || ' organizations' as admin_in,
  CASE 
    WHEN COUNT(*) > 0 THEN '✅ You are admin'
    ELSE '❌ NOT ADMIN - Cannot check in others'
  END as status
FROM organization_members 
WHERE user_id = auth.uid() 
AND role IN ('admin', 'owner')
AND is_active = true;

-- ============================================
-- 7. CHECK ACTIVE SESSIONS
-- ============================================
SELECT 
  '7. ACTIVE SESSIONS' as check_name,
  COUNT(*)::text as total_active
FROM volunteer_sessions
WHERE status = 'active';

-- ============================================
-- 8. CHECK FOR DUPLICATES
-- ============================================
SELECT 
  '8. DUPLICATE ACTIVE SESSIONS' as check_name,
  CASE 
    WHEN COUNT(*) > 0 THEN '❌ ' || COUNT(*) || ' users with duplicates'
    ELSE '✅ No duplicates'
  END as status
FROM (
  SELECT user_id, event_id, COUNT(*) as cnt
  FROM volunteer_sessions
  WHERE status = 'active'
  GROUP BY user_id, event_id
  HAVING COUNT(*) > 1
) dups;

-- ============================================
-- SUMMARY
-- ============================================
SELECT 
  '=== WHAT TO DO ===' as summary,
  'Look for ❌ symbols above' as step1,
  'Fix each ❌ issue using the instructions' as step2,
  'Enable Realtime in Dashboard -> Database -> Replication' as step3;

