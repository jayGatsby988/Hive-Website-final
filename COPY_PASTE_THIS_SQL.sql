-- COPY ALL OF THIS AND PASTE INTO SUPABASE SQL EDITOR, THEN CLICK RUN

-- Step 1: Remove the bad constraint that's causing the error
ALTER TABLE volunteer_sessions 
DROP CONSTRAINT IF EXISTS volunteer_sessions_user_id_event_id_status_key;

-- Step 2: Add a better constraint (only prevents duplicate ACTIVE sessions)
CREATE UNIQUE INDEX IF NOT EXISTS idx_volunteer_sessions_active_unique
ON volunteer_sessions (user_id, event_id)
WHERE status = 'active';

-- Step 3: Clean up any duplicate active sessions right now
WITH duplicates AS (
  SELECT 
    id,
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

-- Step 4: Verify it worked (this should return 0 rows)
SELECT 
  user_id,
  event_id,
  COUNT(*) as duplicate_count
FROM volunteer_sessions
WHERE status = 'active'
GROUP BY user_id, event_id
HAVING COUNT(*) > 1;

