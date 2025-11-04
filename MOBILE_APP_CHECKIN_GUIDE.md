# Mobile App Check-In Integration Guide

## Overview
For check-ins to sync between the mobile app and website, both must write to the same Supabase tables.

## Tables Used

### 1. `volunteer_sessions` (PRIMARY - for hour tracking)
**Used by:** Admin manual check-in/out, mobile app self check-in
**Purpose:** Track active volunteer sessions and calculate hours

**Check-In (Start Session):**
```typescript
const { data, error } = await supabase
  .from('volunteer_sessions')
  .insert({
    user_id: currentUserId,
    event_id: eventId,
    started_at: new Date().toISOString(),
    status: 'active'
  });
```

**Check-Out (End Session):**
```typescript
// 1. Find active session
const { data: sessions } = await supabase
  .from('volunteer_sessions')
  .select('*')
  .eq('event_id', eventId)
  .eq('user_id', currentUserId)
  .eq('status', 'active')
  .order('started_at', { ascending: false })
  .limit(1);

if (sessions && sessions.length > 0) {
  const session = sessions[0];
  const endedAt = new Date().toISOString();
  
  // 2. End the session
  await supabase
    .from('volunteer_sessions')
    .update({
      ended_at: endedAt,
      status: 'completed'
    })
    .eq('id', session.id);
  
  // 3. Calculate and record hours
  const startTime = new Date(session.started_at).getTime();
  const endTime = new Date(endedAt).getTime();
  const hours = (endTime - startTime) / (1000 * 60 * 60);
  
  // Get event org
  const { data: event } = await supabase
    .from('events')
    .select('organization_id')
    .eq('id', eventId)
    .single();
  
  // Record volunteer hours
  if (event) {
    await supabase
      .from('volunteer_hours')
      .insert({
        user_id: currentUserId,
        event_id: eventId,
        organization_id: event.organization_id,
        date: session.started_at.split('T')[0],
        hours: parseFloat(hours.toFixed(2)),
        notes: 'Auto-tracked from mobile app session'
      });
  }
}
```

### 2. `event_checkins` (OPTIONAL - for location tracking)
**Used by:** Location-based check-ins (QR code, geofence)
**Purpose:** Track physical location when checking in

```typescript
await supabase
  .from('event_checkins')
  .insert({
    event_id: eventId,
    user_id: currentUserId,
    latitude: location.latitude,
    longitude: location.longitude,
    checked_in_at: new Date().toISOString()
  });
```

### 3. `admin_checkin_audit` (ADMIN ONLY)
**Used by:** Admin checking in others
**Purpose:** Audit trail for admin actions

```typescript
await supabase
  .from('admin_checkin_audit')
  .insert({
    event_id: eventId,
    user_id: targetUserId,
    admin_id: currentAdminId,
    action: 'checkin', // or 'checkout'
    timestamp: new Date().toISOString()
  });
```

## Real-time Sync

The website subscribes to these tables via Supabase Realtime:
- `volunteer_sessions` - shows in activity log, updates active sessions
- `event_checkins` - shows in activity log
- `admin_checkin_audit` - shows in activity log

### Mobile App Should Subscribe Too:
```typescript
const channel = supabase
  .channel(`event-activity-${eventId}`)
  .on('postgres_changes', { 
    event: '*', 
    schema: 'public', 
    table: 'volunteer_sessions', 
    filter: `event_id=eq.${eventId}` 
  }, (payload) => {
    // Refresh UI when sessions change
    refreshEventData();
  })
  .subscribe();
```

## Complete Check-In Flow for Mobile App

### User Self Check-In:
1. Write to `volunteer_sessions` (status: 'active')
2. Optionally write to `event_checkins` (with GPS coordinates)
3. UI updates via realtime subscription

### User Self Check-Out:
1. Find active session in `volunteer_sessions`
2. Update session (status: 'completed', ended_at)
3. Calculate hours and write to `volunteer_hours`
4. UI updates via realtime subscription

### Admin Check-In Another User:
1. Write to `volunteer_sessions` (status: 'active')
2. Write to `admin_checkin_audit` (action: 'checkin')
3. UI updates via realtime subscription

### Admin Check-Out Another User:
1. Find active session in `volunteer_sessions`
2. Update session (status: 'completed', ended_at)
3. Calculate hours and write to `volunteer_hours`
4. Write to `admin_checkin_audit` (action: 'checkout')
5. UI updates via realtime subscription

## API Endpoints (Use eventService from website)

### Check In:
```typescript
// For admin checking in another user
import { eventService } from './services';
await eventService.adminCheckIn(eventId, userId, adminId);

// For self check-in (create similar method):
await eventService.selfCheckIn(eventId, userId, latitude, longitude);
```

### Check Out:
```typescript
// For admin checking out another user
await eventService.adminCheckOut(eventId, userId, adminId);

// For self check-out (create similar method):
await eventService.selfCheckOut(eventId, userId);
```

## Verification

To verify sync is working:
1. Check-in on mobile app
2. Open website event detail page
3. Should see in "Event Activity" log immediately
4. Should see "active" badge next to user in attendees list

## Common Issues

### Issue: Check-ins don't appear on website
**Solution:** Ensure mobile app writes to `volunteer_sessions`, not just `event_checkins`

### Issue: Hours not calculated
**Solution:** Ensure check-out writes to `volunteer_hours` table

### Issue: Changes not showing immediately
**Solution:** Implement Supabase realtime subscriptions on mobile app

### Issue: 0/0 registered shows
**Solution:** Run the SQL trigger script (`scripts/update-signup-count-trigger.sql`)

## Testing

1. Create test event on website
2. Sign up for event on mobile
3. Start event (admin on website)
4. Check in on mobile app
5. Verify appears on website event detail page
6. Check out on mobile app
7. Verify hours recorded in website volunteer hours page

