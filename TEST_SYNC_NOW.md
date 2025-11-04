# Test Sync Between Website and Mobile App RIGHT NOW

## Test #1: Does Website Save to Supabase?

### Do This:
1. Open website
2. Press F12 (open console)
3. Go to an event
4. Click "Check In" on someone
5. **Look at console - what does it say?**

### Copy/Paste What You See:
```
[adminCheckIn] ... (copy everything here)
```

### Then Check Supabase:
1. Go to Supabase Dashboard
2. Click "Table Editor"
3. Open table: `volunteer_sessions`
4. Sort by `created_at` (newest first)
5. **Do you see a new row?** YES / NO

---

## Test #2: Does Mobile App Use Correct Code?

### Check Mobile App Code - Find Where Check-In Happens

**It MUST look like this:**
```typescript
await eventService.selfCheckIn(eventId, userId, latitude, longitude);
```

**It should NOT look like this:**
```typescript
await supabase.from('event_checkins').insert(...);  // ❌ WRONG TABLE
await supabase.from('checkins').insert(...);         // ❌ WRONG TABLE
```

### Does your mobile app code match? YES / NO

---

## Test #3: Does Mobile App Subscribe to Changes?

### Check Mobile App Code - Find Subscription Code

**It MUST look like this:**
```typescript
supabase
  .channel(`event-${eventId}`)
  .on('postgres_changes', { 
    table: 'volunteer_sessions',  // ← MUST SAY THIS
    filter: `event_id=eq.${eventId}` 
  }, () => {
    // Refresh data here
  })
  .subscribe();
```

### Does your mobile app have this subscription? YES / NO

---

## Test #4: Is Realtime Enabled?

1. Go to Supabase Dashboard
2. Click "Database" → "Replication"
3. Find row: `volunteer_sessions`
4. Is it enabled (green)? YES / NO

---

## Test #5: Quick Manual Test

### In Supabase SQL Editor, Run This:

```sql
-- Insert a test check-in manually
INSERT INTO volunteer_sessions (user_id, event_id, started_at, status)
VALUES (
  'PASTE_A_REAL_USER_ID_HERE',
  'PASTE_A_REAL_EVENT_ID_HERE',
  NOW(),
  'active'
);

-- Check if it worked
SELECT * FROM volunteer_sessions 
ORDER BY created_at DESC 
LIMIT 1;
```

### What Happens?

**On Website (keep it open during test):**
- Does check-in count increase? YES / NO
- Does activity log show it? YES / NO

**On Mobile App (keep it open during test):**
- Does it show the user as checked in? YES / NO
- Does event data refresh? YES / NO

---

## Based on Your Answers:

### If Website Console Shows Errors:
→ Run the RLS policies SQL (in `scripts/setup-all-checkin-rls.sql`)

### If No Row in Supabase Table:
→ RLS is blocking it. Run the RLS policies SQL.

### If Mobile App Code is Different:
→ Mobile team needs to use the guide: `MOBILE_APP_CHECKIN_GUIDE.md`

### If Mobile App Doesn't Subscribe:
→ Mobile team needs to add subscription code from guide

### If Realtime Not Enabled:
→ Enable it in Supabase Dashboard → Database → Replication

### If Manual Test Doesn't Update Website/Mobile:
→ Subscription not working. Check browser/mobile console for errors.

---

## Quick Fix Checklist:

Run these in order until sync works:

1. **Run in Supabase SQL Editor:**
   ```sql
   -- Copy all from COPY_PASTE_THIS_SQL.sql
   ```

2. **Run in Supabase SQL Editor:**
   ```sql
   -- Copy all from scripts/setup-all-checkin-rls.sql
   ```

3. **Enable Realtime:**
   - Supabase → Database → Replication → volunteer_sessions → ON

4. **Mobile App Must Use:**
   - `eventService.selfCheckIn()` for check-ins
   - `eventService.selfCheckOut()` for check-outs
   - Subscribe to `volunteer_sessions` table

5. **Test Again:**
   - Check in on website → appears on mobile?
   - Check in on mobile → appears on website?

---

## Still Not Working?

Tell me EXACTLY which tests FAILED:

- [ ] Test #1: Website console shows success?
- [ ] Test #1: Row appears in Supabase?
- [ ] Test #2: Mobile uses correct code?
- [ ] Test #3: Mobile has subscription?
- [ ] Test #4: Realtime enabled?
- [ ] Test #5: Manual insert updates website?
- [ ] Test #5: Manual insert updates mobile?

And send me:
1. Screenshot of browser console when checking in
2. Screenshot of Supabase volunteer_sessions table
3. Mobile app check-in code (the function that checks in user)

