-- Fix: Remove problematic unique constraint and add proper one
-- This constraint was preventing proper check-outs

-- Drop the old constraint that's causing issues
ALTER TABLE volunteer_sessions 
DROP CONSTRAINT IF EXISTS volunteer_sessions_user_id_event_id_status_key;

-- Add a partial unique constraint that only applies to active sessions
-- This allows multiple completed sessions but only one active session per user per event
CREATE UNIQUE INDEX IF NOT EXISTS idx_volunteer_sessions_active_unique
ON volunteer_sessions (user_id, event_id)
WHERE status = 'active';

-- Verify the constraint is gone and new index is created
SELECT 
  indexname,
  indexdef
FROM pg_indexes
WHERE tablename = 'volunteer_sessions'
AND indexname = 'idx_volunteer_sessions_active_unique';

-- Clean up any duplicate active sessions before the constraint takes effect
WITH duplicates AS (
  SELECT 
    id,
    user_id,
    event_id,
    started_at,
    ROW_NUMBER() OVER (
      PARTITION BY user_id, event_id 
      ORDER BY started_at DESC
    ) as rn
  FROM volunteer_sessions
  WHERE status = 'active'
)
UPDATE volunteer_sessions
SET status = 'completed', ended_at = NOW()
WHERE id IN (
  SELECT id FROM duplicates WHERE rn > 1
);

-- Show any remaining active sessions
SELECT 
  user_id,
  event_id,
  COUNT(*) as active_count
FROM volunteer_sessions
WHERE status = 'active'
GROUP BY user_id, event_id
HAVING COUNT(*) > 1;

-- Should return 0 rows (no duplicates)

