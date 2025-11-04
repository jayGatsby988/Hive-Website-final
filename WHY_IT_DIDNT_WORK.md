# 🚨 WHY CHECK-IN DOESN'T SYNC BETWEEN APP & WEBSITE

## The Problem

### ❌ Mobile App (OLD CODE):
```typescript
// Uses event_checkins table
await supabase
  .from('event_checkins')  // ❌ WRONG TABLE!
  .insert({
    event_id: eventId,
    user_id: userId,
    check_in_time: new Date().toISOString(),
    checked_in_by_admin: false
  });
```

### ✅ Website:
```typescript
// Uses volunteer_sessions table
await supabase
  .from('volunteer_sessions')  // ✅ CORRECT TABLE!
  .insert({
    event_id: eventId,
    user_id: userId,
    started_at: new Date().toISOString(),
    status: 'active'
  });
```

## Why It Doesn't Sync

```
Mobile App → writes to → event_checkins table
                           ↓
                           (isolated data)

Website    → writes to → volunteer_sessions table
                           ↓
                           (isolated data)

They never see each other's data! ❌
```

---

## The Solution

### ✅ Mobile App (NEW CODE):
```typescript
// NOW uses volunteer_sessions table (SAME AS WEBSITE!)
await supabase
  .from('volunteer_sessions')  // ✅ SAME TABLE!
  .insert({
    event_id: eventId,
    user_id: userId,
    started_at: new Date().toISOString(),
    status: 'active'
  });
```

## How It Syncs Now

```
Mobile App → writes to → volunteer_sessions ← reads from ← Website
                              ↕
                    (shared data, syncs!)
                              ↕
                    Auto-refresh every 3 seconds
                              ↕
                    Both see the same data! ✅
```

---

## What to Change in Mobile App

### File to Update:
Find your check-in/check-out functions in the mobile app

### Replace With:
Copy ALL the code from `MOBILE_APP_FIX.ts`

### Key Changes:

**1. Table Name:**
- ❌ OLD: `event_checkins`
- ✅ NEW: `volunteer_sessions`

**2. Column Names:**
- ❌ OLD: `check_in_time`, `check_out_time`
- ✅ NEW: `started_at`, `ended_at`, `status`

**3. Status Field:**
- ✅ NEW: Add `status: 'active'` when checking in
- ✅ NEW: Update to `status: 'completed'` when checking out

**4. Hours Calculation:**
- ✅ NEW: Calculate hours on check-out
- ✅ NEW: Insert into `volunteer_hours` table

---

## Testing After Fix

### 1. Check-In on Mobile:
```
Mobile App → volunteer_sessions table → active
               ↓
         Within 3 seconds
               ↓
Website refreshes → sees the check-in ✅
```

### 2. Check-Out on Mobile:
```
Mobile App → volunteer_sessions table → completed
           → volunteer_hours table → hours recorded
               ↓
         Within 3 seconds
               ↓
Website refreshes → sees check-out + hours ✅
```

### 3. Admin Check-In on Website:
```
Website → volunteer_sessions table → active
               ↓
         Within 3 seconds
               ↓
Mobile App refreshes → sees the check-in ✅
```

---

## Quick Comparison

| Feature | OLD Mobile Code | NEW Mobile Code | Website Code |
|---------|----------------|-----------------|--------------|
| **Table** | `event_checkins` ❌ | `volunteer_sessions` ✅ | `volunteer_sessions` ✅ |
| **Check-in Column** | `check_in_time` | `started_at` ✅ | `started_at` ✅ |
| **Check-out Column** | `check_out_time` | `ended_at` ✅ | `ended_at` ✅ |
| **Status Field** | None ❌ | `status` ✅ | `status` ✅ |
| **Hours Calculation** | None ❌ | Auto ✅ | Auto ✅ |
| **Hours Table** | Not used ❌ | `volunteer_hours` ✅ | `volunteer_hours` ✅ |
| **Syncs?** | ❌ NO | ✅ YES | ✅ YES |

---

## Implementation Steps

### 1. Update Mobile App Code:
- Copy code from `MOBILE_APP_FIX.ts`
- Replace your existing `selfCheckIn` and `selfCheckOut` functions
- Update any imports

### 2. Test Locally:
- Check in on mobile
- Open website
- **Within 3 seconds:** Should see check-in appear

### 3. Test Reverse:
- Check in on website (as admin)
- Open mobile app
- **Within 3 seconds:** Should see check-in appear

### 4. Test Hours:
- Check in on mobile
- Wait 5 minutes
- Check out on mobile
- Check `volunteer_hours` table in Supabase
- **Should see:** ~0.08 hours recorded (5 minutes)

---

## Debugging

### If still not syncing after update:

**1. Check mobile app is using new code:**
```typescript
console.log('Using table:', 'volunteer_sessions'); // Should say volunteer_sessions
```

**2. Check Supabase database:**
```sql
-- Run in Supabase SQL Editor
SELECT * FROM volunteer_sessions 
WHERE status = 'active' 
ORDER BY started_at DESC 
LIMIT 10;
```
Should show check-ins from BOTH mobile and website.

**3. Check both are using same Supabase project:**
- Mobile app Supabase URL should match website URL
- Check `.env` or config files

**4. Verify auto-refresh is working:**
- Open browser console on website
- Should see `[Auto-refresh]` logs every 3 seconds

---

## Success Criteria

After updating mobile app:

✅ Mobile check-in → appears on website within 3 seconds  
✅ Website admin check-in → appears on mobile within 3 seconds  
✅ Mobile check-out → hours recorded in database  
✅ Both read from `volunteer_sessions` table  
✅ No more separate `event_checkins` usage  

---

**Update the mobile app with the code from `MOBILE_APP_FIX.ts` and it will sync perfectly!** 🚀

