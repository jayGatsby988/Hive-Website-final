# 🚨 RUN THIS NOW - Fix Check-In/Out Error

## The Error You're Getting:
```
Failed to end session: duplicate key value violates unique constraint 
"volunteer_sessions_user_id_event_id_status_key"
```

## Fix It (Copy/Paste This SQL)

### Open Supabase Dashboard → SQL Editor → Paste This:

```sql
-- 1. Remove bad constraint
ALTER TABLE volunteer_sessions 
DROP CONSTRAINT IF EXISTS volunteer_sessions_user_id_event_id_status_key;

-- 2. Add proper constraint (only prevents duplicate ACTIVE sessions)
CREATE UNIQUE INDEX IF NOT EXISTS idx_volunteer_sessions_active_unique
ON volunteer_sessions (user_id, event_id)
WHERE status = 'active';

-- 3. Clean up any existing duplicate active sessions
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

-- 4. Verify it worked (should return 0 rows)
SELECT 
  user_id,
  event_id,
  COUNT(*) as active_count
FROM volunteer_sessions
WHERE status = 'active'
GROUP BY user_id, event_id
HAVING COUNT(*) > 1;
```

### Click **Run** (Cmd/Ctrl + Enter)

---

## ✅ Success = You Should See:
- "Success. No rows returned" message
- Last query returns **0 rows**

---

## Then Test:
1. Go to event page on website
2. Click "Check In" on someone
3. Should work now! ✅

---

## If Still Not Working:

### Also run the RLS policies (required once):

**Open new SQL query in Supabase, paste entire contents of:**
`scripts/setup-all-checkin-rls.sql`

**Then run it.**

---

## What This Does:

**Before:**
- Constraint prevents marking sessions as "completed"
- Can't check out users
- Error on every check-out attempt

**After:**
- ✅ Users can have multiple completed sessions (history)
- ✅ Users can only have ONE active session at a time
- ✅ Check-out works properly
- ✅ Syncs between website and mobile app

---

## Real-Time Sync Working:

Once this is done, the website code I updated will:
- ✅ Detect mobile app check-ins (via Supabase realtime)
- ✅ Detect mobile app check-outs (via Supabase realtime)
- ✅ Update UI automatically (no refresh needed)
- ✅ Show accurate check-in counts
- ✅ Display activity log in real-time

And vice versa:
- ✅ Mobile app sees website check-ins instantly
- ✅ Mobile app sees website check-outs instantly

---

**Time:** 2 minutes  
**Required:** YES (or check-ins won't work)  
**Difficulty:** Copy/paste

