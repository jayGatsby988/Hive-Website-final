# Hour Tracking & Stats Verification Guide

## 🎯 What Was Implemented

### 1. Complete Supabase Integration
- ✅ Hours are recorded to `volunteer_hours` table on EVERY check-out (admin or self)
- ✅ Stats page reads directly from `volunteer_hours` table
- ✅ All data flows through Supabase (no local storage)
- ✅ 6 decimal place precision for accurate second tracking
- ✅ Comprehensive console logging for debugging

### 2. Hour Recording Points

#### Admin Check-Out (`adminCheckOut`)
```typescript
Location: lib/services.ts (lines 454-558)
Triggers: When admin clicks "Check Out" button on event detail page
Records to: volunteer_hours table
Includes: user_id, event_id, organization_id, date, hours, notes
Logs: "[adminCheckOut] ✅ Successfully recorded volunteer hours"
```

#### Self Check-Out (`selfCheckOut`)
```typescript
Location: lib/services.ts (lines 572-669)
Triggers: When member clicks "Check Out" button on event detail page
Records to: volunteer_hours table
Includes: user_id, event_id, organization_id, date, hours, notes
Logs: "[selfCheckOut] ✅ Successfully recorded volunteer hours"
```

### 3. Stats Page Data Flow

```
User opens Stats page
    ↓
Query 1: Get organization name
    ↓
Query 2: Get ALL volunteer_hours for user in this org
    ↓
Query 3: Get ALL volunteer_hours for user across ALL orgs
    ↓
Calculate totals, format times (HH:MM:SS)
    ↓
Display on page with refresh button
```

## 🧪 How to Test End-to-End

### Step 1: Check-In to Event
1. Navigate to an event detail page
2. Ensure event is "in_progress" (admin can start it)
3. As member: Look for yellow "Check In" card at top
4. Click "Check In"
5. **Open browser console** (F12)
6. Verify you see: `[selfCheckIn]` or `[adminCheckIn]` logs

### Step 2: Wait (Testing)
- Wait exactly 2 minutes for easy verification
- Or use browser DevTools to advance time (advanced)

### Step 3: Check-Out
1. Click "Check Out" button
2. **Check console logs** for:
   ```
   [selfCheckOut] Recording volunteer hours: {...}
   [selfCheckOut] ✅ Successfully recorded volunteer hours: [...]
   ```
3. If you see "FAILED to record", check the error message

### Step 4: Verify in Stats Page
1. Navigate to organization Stats page
2. Click "Refresh" button
3. **Check console logs** for:
   ```
   [Stats] Loading stats for user: <id> org: <id>
   [Stats] Volunteer hours for this org: X records
   [Stats] Raw hours data: [...]
   [Stats] Total hours decimal: 0.033333
   [Stats] Formatted time: { hours: 0, minutes: 2, seconds: 0 }
   [Stats] ✅ Stats loaded successfully
   ```
4. Verify the time displays correctly on page: `0h 2m 0s`

## 🔍 Debugging Checklist

### If Hours Don't Show Up

#### 1. Check Console Logs
Look for these specific logs in order:

**During Check-Out:**
```
[adminCheckOut] or [selfCheckOut] Starting check-out
[adminCheckOut] or [selfCheckOut] Recording volunteer hours
[adminCheckOut] or [selfCheckOut] ✅ Successfully recorded volunteer hours
```

**On Stats Page:**
```
[Stats] Loading stats for user: <user-id> org: <org-id>
[Stats] Volunteer hours for this org: X records
[Stats] Raw hours data: [array of records]
```

#### 2. Check Supabase Directly
Run this SQL in Supabase SQL Editor:
```sql
-- Check if hours were recorded
SELECT 
  vh.id,
  vh.user_id,
  vh.event_id,
  vh.organization_id,
  vh.date,
  vh.hours,
  vh.notes,
  vh.created_at,
  u.name as user_name,
  e.title as event_title,
  o.name as org_name
FROM volunteer_hours vh
LEFT JOIN users u ON u.id = vh.user_id
LEFT JOIN events e ON e.id = vh.event_id
LEFT JOIN organizations o ON o.id = vh.organization_id
WHERE vh.user_id = 'YOUR-USER-ID'
ORDER BY vh.created_at DESC
LIMIT 10;
```

#### 3. Check event_checkins Table
```sql
-- Verify check-in/out happened
SELECT 
  id,
  event_id,
  user_id,
  check_in_time,
  check_out_time,
  checked_in_by_admin,
  EXTRACT(EPOCH FROM (check_out_time - check_in_time)) / 3600 as calculated_hours
FROM event_checkins
WHERE user_id = 'YOUR-USER-ID'
  AND check_out_time IS NOT NULL
ORDER BY check_in_time DESC
LIMIT 10;
```

#### 4. Common Issues

| Issue | Console Log | Fix |
|-------|-------------|-----|
| Hours not recorded | `[adminCheckOut] FAILED to record volunteer hours` | Check RLS policies on `volunteer_hours` table |
| Stats page empty | `[Stats] Volunteer hours for this org: 0 records` | Verify organization_id matches in both queries |
| NaN or 0h 0m 0s | `[Stats] Total hours decimal: 0` | No volunteer_hours records exist |
| Wrong organization | `[Stats] Raw hours data: []` | User may be viewing wrong organization |

## 🔐 Supabase RLS Policies

Ensure these policies exist on `volunteer_hours` table:

```sql
-- Allow users to read their own volunteer hours
CREATE POLICY "Users can view own hours"
ON volunteer_hours
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Allow users to insert their own hours
CREATE POLICY "Users can insert own hours"
ON volunteer_hours
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);
```

Run this to check:
```sql
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
WHERE tablename = 'volunteer_hours';
```

## 📊 Expected Data Flow

### When Admin Checks Out User

```mermaid
Admin clicks "Check Out" button
    ↓
eventService.adminCheckOut(eventId, userId, adminId)
    ↓
1. Find active check-in in event_checkins
2. Update check_out_time
3. Calculate hours (end - start) / 3600000
4. Get event.organization_id
5. INSERT into volunteer_hours table ✅
6. Log to admin_checkin_audit
    ↓
Stats page queries volunteer_hours
    ↓
Displays: "2h 15m 30s"
```

### When User Self Checks Out

```mermaid
User clicks "Check Out" button
    ↓
eventService.selfCheckOut(eventId, userId)
    ↓
1. Find active check-in in event_checkins
2. Update check_out_time
3. Calculate hours (end - start) / 3600000
4. Get event.organization_id
5. INSERT into volunteer_hours table ✅
    ↓
Stats page queries volunteer_hours
    ↓
Displays: "2h 15m 30s"
```

## 🎨 Console Log Reference

### Success Logs (What You Want to See)

```
✅ [adminCheckOut] ✅ Successfully recorded volunteer hours: [{...}]
✅ [selfCheckOut] ✅ Successfully recorded volunteer hours: [{...}]
✅ [Stats] ✅ Stats loaded successfully
```

### Error Logs (Need Investigation)

```
❌ [adminCheckOut] FAILED to record volunteer hours: <error>
❌ [selfCheckOut] FAILED to record volunteer hours: <error>
❌ [Stats] Error fetching hours: <error>
❌ [Stats] ❌ Failed to load stats: <error>
```

## 📱 Mobile App Sync

Both website and mobile app now use the same table structure:
- `event_checkins` - for check-in/out records
- `volunteer_hours` - for hour tracking
- Same Supabase database

When mobile app checks someone out, website stats page will show it after refresh.
When website checks someone out, mobile app will show it after sync.

## 🧮 Time Calculation

### Stored in Database
```
Hours are stored as decimal with 6 precision:
0.033333 = 2 minutes
2.258333 = 2 hours 15 minutes 30 seconds
```

### Displayed on Stats Page
```javascript
const hours = Math.floor(decimalHours)
const remainingMinutes = (decimalHours - hours) * 60
const minutes = Math.floor(remainingMinutes)
const seconds = Math.floor((remainingMinutes - minutes) * 60)

// Display: "2h 15m 30s"
```

## 🚀 Testing Script

Copy/paste into browser console on Stats page:

```javascript
// Quick test - verify stats are loading
console.log('=== STATS PAGE TEST ===');
console.log('User ID:', window.localStorage.getItem('supabase.auth.token'));
console.log('Current path:', window.location.pathname);

// Trigger refresh
const refreshButton = document.querySelector('button:has(.lucide-refresh-cw)');
if (refreshButton) {
  console.log('Found refresh button, clicking...');
  refreshButton.click();
  setTimeout(() => {
    console.log('Check logs above for [Stats] messages');
  }, 2000);
} else {
  console.log('❌ Refresh button not found - are you on stats page?');
}
```

## 📋 Quick Verification Checklist

- [ ] Console shows hour recording logs during check-out
- [ ] Supabase `volunteer_hours` table has new records
- [ ] Stats page console shows data being loaded
- [ ] Stats page displays correct hours (HH:MM:SS format)
- [ ] Refresh button works and updates data
- [ ] Time matches what was expected (check-out time - check-in time)
- [ ] Works for both admin check-out and self check-out
- [ ] Works across multiple organizations
- [ ] Mobile app check-outs appear on website stats (and vice versa)

## 🎯 Expected Console Output (Full Flow)

```
// During check-out
[selfCheckOut] Starting check-out: {eventId, userId}
[selfCheckOut] Recording volunteer hours: {userId, eventId, organizationId, hours: 0.033333}
[selfCheckOut] ✅ Successfully recorded volunteer hours: [{id: "...", hours: 0.033333, ...}]

// When viewing stats page
[Stats] Loading stats for user: <uuid> org: <uuid>
[Stats] Organization: {name: "Green Organization"}
[Stats] Volunteer hours for this org: 3 records
[Stats] Raw hours data: [{hours: 2.5, ...}, {hours: 1.25, ...}, {hours: 0.033333, ...}]
[Stats] All volunteer hours across orgs: 8 records
[Stats] Total hours decimal: 3.783333
[Stats] Formatted time: {hours: 3, minutes: 47, seconds: 0}
[Stats] ✅ Stats loaded successfully
```

---

**Everything is connected to Supabase! 🎉**

All hour tracking flows through the `volunteer_hours` table, and the stats page reads directly from Supabase with no caching or local storage.

