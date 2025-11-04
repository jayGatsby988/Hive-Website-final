# Quick Reference: Mobile & Website Check-In Sync

## 🚀 For Mobile App Developers

### Check-In (User Self Check-In)
```typescript
import { eventService } from '@/lib/services';

// When user clicks "Check In" button
try {
  await eventService.selfCheckIn(
    eventId,           // UUID of the event
    userId,            // UUID of current user
    latitude,          // Optional: GPS latitude
    longitude          // Optional: GPS longitude
  );
  // Show success message
} catch (error) {
  // Handle error (e.g., already checked in, event not started)
  console.error(error.message);
}
```

### Check-Out (User Self Check-Out)
```typescript
// When user clicks "Check Out" button
try {
  await eventService.selfCheckOut(
    eventId,           // UUID of the event
    userId             // UUID of current user
  );
  // Show success message + hours earned
} catch (error) {
  // Handle error (e.g., not checked in)
  console.error(error.message);
}
```

### Real-Time Updates
```typescript
import { supabase } from '@/lib/supabase';

// Subscribe to changes for a specific event
const channel = supabase
  .channel(`event-${eventId}`)
  .on('postgres_changes', { 
    event: '*',                    // Listen to INSERT, UPDATE, DELETE
    schema: 'public', 
    table: 'volunteer_sessions',   // Main table for check-ins
    filter: `event_id=eq.${eventId}` 
  }, (payload) => {
    // Refresh event data when someone checks in/out
    refreshEventData();
  })
  .subscribe();

// Clean up when leaving screen
useEffect(() => {
  return () => {
    supabase.removeChannel(channel);
  };
}, []);
```

---

## 🌐 For Website Developers

### Admin Check-In (Admin Checking In Another User)
```typescript
import { eventService } from '@/lib/services';

// When admin clicks "Check In" button for an attendee
try {
  await eventService.adminCheckIn(
    eventId,           // UUID of the event
    targetUserId,      // UUID of the user being checked in
    adminUserId        // UUID of the admin performing the action
  );
  // Success - UI will update via realtime subscription
} catch (error) {
  console.error(error.message);
}
```

### Admin Check-Out (Admin Checking Out Another User)
```typescript
// When admin clicks "Check Out" button for an attendee
try {
  await eventService.adminCheckOut(
    eventId,           // UUID of the event
    targetUserId,      // UUID of the user being checked out
    adminUserId        // UUID of the admin performing the action
  );
  // Success - hours are auto-calculated and recorded
} catch (error) {
  console.error(error.message);
}
```

### Real-Time Subscriptions (Already Implemented)
```typescript
// EventDetailPageClient.tsx already subscribes to:
// - volunteer_sessions (check-ins/outs)
// - admin_checkin_audit (admin actions)
// - event_checkins (optional GPS check-ins)
//
// No additional code needed - updates are automatic
```

---

## 📊 Database Tables

### volunteer_sessions (Primary Table)
```typescript
{
  id: string;              // UUID
  user_id: string;         // Who is checked in
  event_id: string;        // Which event
  started_at: string;      // ISO timestamp when checked in
  ended_at: string | null; // ISO timestamp when checked out (null if active)
  status: 'active' | 'completed';
  created_at: string;
  updated_at: string;
}
```

### volunteer_hours (Auto-Created on Check-Out)
```typescript
{
  id: string;              // UUID
  user_id: string;         // Who earned hours
  event_id: string;        // Which event
  organization_id: string; // Which organization
  date: string;            // Date (YYYY-MM-DD)
  hours: number;           // Calculated hours (e.g., 2.50)
  notes: string;           // "Self-tracked from session" or "Auto-tracked from event session"
  created_at: string;
  updated_at: string;
}
```

### admin_checkin_audit (Admin Actions Only)
```typescript
{
  id: string;              // UUID
  event_id: string;        // Which event
  user_id: string;         // Who was checked in/out
  admin_id: string;        // Which admin did it
  action: 'checkin' | 'checkout';
  timestamp: string;       // ISO timestamp
  notes: string | null;    // Optional notes
}
```

---

## 🔍 Common Queries

### Get Active Check-Ins for an Event
```typescript
const { data, error } = await supabase
  .from('volunteer_sessions')
  .select('*')
  .eq('event_id', eventId)
  .eq('status', 'active');

// Returns array of currently checked-in users
```

### Get User's Hours for an Event
```typescript
const { data, error } = await supabase
  .from('volunteer_hours')
  .select('*')
  .eq('user_id', userId)
  .eq('event_id', eventId);

// Returns array of hour records (should be 1 per event usually)
```

### Check if User is Currently Checked In
```typescript
const { data, error } = await supabase
  .from('volunteer_sessions')
  .select('id')
  .eq('event_id', eventId)
  .eq('user_id', userId)
  .eq('status', 'active')
  .limit(1);

const isCheckedIn = data && data.length > 0;
```

---

## ⚠️ Common Errors

### "User already has an active session for this event"
**Cause:** Trying to check in when already checked in  
**Solution:** Check status first, show "Check Out" button instead

### "No active session found for this user"
**Cause:** Trying to check out when not checked in  
**Solution:** Check status first, show "Check In" button instead

### "Event is not started"
**Cause:** Trying to check in before admin starts event  
**Solution:** Check `event.status === 'in_progress'` before allowing check-in

### "Permission denied" or RLS error
**Cause:** Supabase RLS policy blocking the operation  
**Solution:** Check RLS policies in Supabase Dashboard (see main docs)

---

## ✅ Testing Checklist

### Mobile App:
- [ ] Can check in to started event
- [ ] Cannot check in twice
- [ ] Can check out after checking in
- [ ] Cannot check out without checking in first
- [ ] Check-in appears on website within 2 seconds
- [ ] Check-out appears on website within 2 seconds

### Website:
- [ ] Admin can check in attendee
- [ ] Admin can check out attendee
- [ ] Check-in count updates in real-time
- [ ] Activity log shows all events
- [ ] Buttons show correct state (Check In vs Check Out)
- [ ] Mobile check-ins appear automatically

---

## 📚 Full Documentation

- **`MOBILE_APP_CHECKIN_GUIDE.md`** - Complete implementation guide
- **`TESTING_MOBILE_SYNC.md`** - Comprehensive testing procedures
- **`MOBILE_WEBSITE_SYNC_SUMMARY.md`** - Technical summary and architecture

---

## 🆘 Quick Debug

```typescript
// Log active sessions for debugging
const { data } = await supabase
  .from('volunteer_sessions')
  .select('*')
  .eq('event_id', eventId);

console.table(data);
// Should show: user_id, status, started_at, ended_at
```

```typescript
// Log volunteer hours for debugging
const { data } = await supabase
  .from('volunteer_hours')
  .select('*')
  .eq('event_id', eventId);

console.table(data);
// Should show: user_id, hours, date
```

```typescript
// Check if realtime is working
const channel = supabase
  .channel('test')
  .on('postgres_changes', { 
    event: '*', 
    schema: 'public', 
    table: 'volunteer_sessions' 
  }, (payload) => {
    console.log('Realtime working!', payload);
  })
  .subscribe((status) => {
    console.log('Subscription status:', status);
    // Should log: "SUBSCRIBED"
  });
```

---

## 📞 Need Help?

1. Check the debugging section in `TESTING_MOBILE_SYNC.md`
2. Verify Supabase Realtime is enabled (Dashboard → Database → Replication)
3. Check RLS policies allow necessary operations
4. Look at Supabase logs (Dashboard → Logs → Realtime)
5. Ensure mobile and web use same Supabase project URL and keys

