# Check-In Sync Architecture

## System Overview

```
┌─────────────────┐         ┌─────────────────┐
│   Mobile App    │         │     Website     │
│                 │         │                 │
│  React Native   │         │    Next.js      │
└────────┬────────┘         └────────┬────────┘
         │                           │
         │    Both use same          │
         │    eventService           │
         │    methods                │
         │                           │
         └───────────┬───────────────┘
                     │
                     ▼
         ┌───────────────────────┐
         │   Supabase Backend    │
         │                       │
         │  ┌─────────────────┐  │
         │  │ volunteer_      │  │
         │  │ sessions        │  │ ◄── Primary table for check-ins
         │  └─────────────────┘  │
         │                       │
         │  ┌─────────────────┐  │
         │  │ volunteer_      │  │
         │  │ hours           │  │ ◄── Auto-created on check-out
         │  └─────────────────┘  │
         │                       │
         │  ┌─────────────────┐  │
         │  │ admin_checkin_  │  │
         │  │ audit           │  │ ◄── Audit trail for admins
         │  └─────────────────┘  │
         │                       │
         │  ┌─────────────────┐  │
         │  │ Realtime Engine │  │ ◄── Broadcasts changes
         │  └─────────────────┘  │
         └───────────────────────┘
```

## Check-In Flow (Mobile App)

```
User clicks "Check In"
         │
         ▼
eventService.selfCheckIn(eventId, userId, lat, lon)
         │
         ├──► Check if already checked in
         │    (query volunteer_sessions for active session)
         │
         ├──► If not, insert into volunteer_sessions:
         │    {
         │      user_id: userId,
         │      event_id: eventId,
         │      status: 'active',
         │      started_at: NOW()
         │    }
         │
         └──► Optional: Insert into event_checkins
              (for GPS tracking)
         
         ▼
Supabase Realtime broadcasts INSERT event
         │
         ├──────────────────┬──────────────────┐
         ▼                  ▼                  ▼
    Mobile App         Website           Other Devices
    (if subscribed)    (subscribed)      (if subscribed)
         │                  │                  │
         ▼                  ▼                  ▼
    Refresh UI         Refresh UI         Refresh UI
    - Show "Check Out" - Update count      - Update list
    - Update status    - Add to log        - Show active
```

## Check-Out Flow (Mobile App or Website)

```
User/Admin clicks "Check Out"
         │
         ▼
eventService.selfCheckOut(eventId, userId)
or
eventService.adminCheckOut(eventId, userId, adminId)
         │
         ├──► Find active session:
         │    SELECT * FROM volunteer_sessions
         │    WHERE event_id = ? AND user_id = ?
         │    AND status = 'active'
         │
         ├──► Update session:
         │    {
         │      status: 'completed',
         │      ended_at: NOW()
         │    }
         │
         ├──► Calculate hours:
         │    hours = (ended_at - started_at) / 3600
         │
         ├──► Insert into volunteer_hours:
         │    {
         │      user_id,
         │      event_id,
         │      organization_id,
         │      date: started_at.date,
         │      hours: calculated_hours
         │    }
         │
         └──► If admin: Insert into admin_checkin_audit:
              {
                event_id,
                user_id,
                admin_id,
                action: 'checkout',
                timestamp: NOW()
              }
         
         ▼
Supabase Realtime broadcasts UPDATE + INSERT events
         │
         ├──────────────────┬──────────────────┐
         ▼                  ▼                  ▼
    Mobile App         Website           Other Devices
         │                  │                  │
         ▼                  ▼                  ▼
    Refresh UI         Refresh UI         Refresh UI
    - Show "Check In"  - Update count      - Update list
    - Show hours earned- Add to log        - Show completed
    - Update total     - Update hours      - Show hours
```

## Admin Manual Check-In Flow (Website Only)

```
Admin clicks "Check In" button for attendee
         │
         ▼
eventService.adminCheckIn(eventId, userId, adminId)
         │
         ├──► Insert into volunteer_sessions:
         │    {
         │      user_id: targetUserId,  ◄── Different user!
         │      event_id: eventId,
         │      status: 'active',
         │      started_at: NOW()
         │    }
         │
         └──► Insert into admin_checkin_audit:
              {
                event_id,
                user_id: targetUserId,
                admin_id: adminId,      ◄── Track who did it
                action: 'checkin',
                timestamp: NOW()
              }
         
         ▼
Supabase Realtime broadcasts INSERT events
         │
         ├──────────────────┬──────────────────┐
         ▼                  ▼                  ▼
    Target User's      Other Admins       Other Devices
    Mobile App         Viewing Event      Viewing Event
         │                  │                  │
         ▼                  ▼                  ▼
    Update UI          Update UI          Update UI
    - Show checked in  - Show user active - Update count
    - Can check out    - Add to log       - Update list
```

## Real-Time Subscription Architecture

### Website (EventDetailPageClient.tsx)

```typescript
// Subscribes to 3 tables for comprehensive updates
supabase
  .channel(`event-activity-${eventId}`)
  
  // Table 1: Main check-in/out tracking
  .on('postgres_changes', { 
    table: 'volunteer_sessions',
    filter: `event_id=eq.${eventId}`
  }, () => {
    // Updates:
    // - Check-in count (count active sessions)
    // - Activity log (check-ins and check-outs)
    // - Active session badges
    // - Check In/Out button states
  })
  
  // Table 2: Admin audit trail
  .on('postgres_changes', { 
    table: 'admin_checkin_audit',
    filter: `event_id=eq.${eventId}`
  }, () => {
    // Updates:
    // - Activity log (admin actions)
  })
  
  // Table 3: Optional GPS check-ins
  .on('postgres_changes', { 
    table: 'event_checkins',
    filter: `event_id=eq.${eventId}`
  }, () => {
    // Updates:
    // - Activity log (location-based check-ins)
  })
  
  .subscribe();
```

### Mobile App (Should Implement)

```typescript
// Subscribe to sessions for real-time updates
supabase
  .channel(`event-${eventId}`)
  
  .on('postgres_changes', { 
    table: 'volunteer_sessions',
    filter: `event_id=eq.${eventId}`
  }, (payload) => {
    // When any user checks in/out:
    // - Refresh event attendee list
    // - Update check-in count
    // - Update user's own status if affected
    refreshEventData();
  })
  
  .subscribe();
```

## Data Consistency Rules

### 1. One Active Session Per User Per Event
```sql
-- Enforced by application logic
SELECT COUNT(*) FROM volunteer_sessions
WHERE user_id = ? 
  AND event_id = ?
  AND status = 'active'
-- Should always return 0 or 1 (never > 1)
```

### 2. Session Must Exist Before Hours
```sql
-- volunteer_hours always references a completed session
SELECT vh.*, vs.started_at, vs.ended_at
FROM volunteer_hours vh
JOIN volunteer_sessions vs 
  ON vh.event_id = vs.event_id 
  AND vh.user_id = vs.user_id
WHERE vs.status = 'completed'
-- All volunteer_hours should have matching completed session
```

### 3. Check-In Count = Active Sessions
```typescript
// Website counts active sessions, not event_checkins
const checkinCount = await supabase
  .from('volunteer_sessions')
  .select('*', { count: 'exact' })
  .eq('event_id', eventId)
  .eq('status', 'active');
// This is the source of truth for "X checked in"
```

## State Transitions

### volunteer_sessions.status

```
             Check In
    ┌──────────────────────┐
    │                      │
    ▼                      │
┌────────┐            ┌────────┐
│ (none) │────────────│ active │
└────────┘            └────┬───┘
                           │
                           │ Check Out
                           │
                           ▼
                      ┌───────────┐
                      │ completed │
                      └───────────┘
```

- **No record**: User hasn't checked in yet
- **active**: User is currently checked in
- **completed**: User has checked out, hours calculated

### User Button States

```
Event not started
       │
       ▼
  ┌─────────┐
  │ Hidden  │  (No check-in button shown)
  └─────────┘
       │
       │ Admin starts event
       ▼
  ┌──────────────┐
  │  Check In    │ ◄── User can check in
  └──────┬───────┘
         │
         │ User checks in
         ▼
  ┌──────────────┐
  │  Check Out   │ ◄── User can check out
  └──────┬───────┘
         │
         │ User checks out
         ▼
  ┌──────────────┐
  │  Completed   │ ◄── Shows hours earned
  └──────────────┘
```

### Admin Button States (for each attendee)

```
Event started
       │
       ▼
┌──────────────────┐
│ Is user active?  │
└────┬────────┬────┘
     │        │
     No       Yes
     │        │
     ▼        ▼
┌─────────┐  ┌──────────┐
│Check In │  │Check Out │
└─────────┘  └──────────┘
```

## Error Handling

### Mobile App Check-In Failures

```typescript
try {
  await eventService.selfCheckIn(eventId, userId);
} catch (error) {
  if (error.message.includes('already has an active session')) {
    // Show: "You're already checked in"
    // Action: Show check-out button instead
  }
  else if (error.message.includes('not started')) {
    // Show: "Event hasn't started yet"
    // Action: Disable check-in until started
  }
  else {
    // Show: "Failed to check in. Please try again."
    // Log error for debugging
  }
}
```

### Website Admin Check-In Failures

```typescript
try {
  await eventService.adminCheckIn(eventId, userId, adminId);
} catch (error) {
  if (error.message.includes('already has an active session')) {
    // Show: "User is already checked in"
    // Action: Reload to sync button state
  }
  else {
    // Show: "Failed to check in user"
    // Log error and notify admin
  }
}
```

## Performance Considerations

### Realtime Subscriptions
- ✅ One subscription per event detail page
- ✅ Automatically cleaned up on unmount
- ✅ Filters by event_id (not entire table)
- ⚠️ Mobile app should unsubscribe when app backgrounds

### Query Optimization
```typescript
// Good: Count only
const { count } = await supabase
  .from('volunteer_sessions')
  .select('*', { count: 'exact', head: true })
  .eq('event_id', eventId)
  .eq('status', 'active');

// Bad: Fetch all data just to count
const { data } = await supabase
  .from('volunteer_sessions')
  .select('*')
  .eq('event_id', eventId)
  .eq('status', 'active');
const count = data.length;  // Wastes bandwidth
```

### Indexing Strategy
```sql
-- Applied in Supabase for fast queries
CREATE INDEX idx_sessions_event_status 
  ON volunteer_sessions(event_id, status);

CREATE INDEX idx_sessions_user_event 
  ON volunteer_sessions(user_id, event_id);
```

## Security Model (RLS)

```
┌─────────────┐
│    Users    │
└──────┬──────┘
       │
       ├──► Can INSERT own volunteer_sessions
       ├──► Can UPDATE own active volunteer_sessions
       ├──► Can SELECT own volunteer_sessions
       └──► Can SELECT own volunteer_hours

┌─────────────┐
│   Admins    │
└──────┬──────┘
       │
       ├──► Can INSERT any volunteer_sessions (their org events)
       ├──► Can UPDATE any volunteer_sessions (their org events)
       ├──► Can SELECT any volunteer_sessions (their org events)
       ├──► Can INSERT admin_checkin_audit
       └──► Can SELECT volunteer_hours (their org)
```

## Monitoring & Debugging

### Key Metrics to Track

1. **Real-time Latency**
   - Time from check-in to website update
   - Target: < 2 seconds

2. **Active Session Accuracy**
   - Compare count in UI vs database
   - Should always match

3. **Orphaned Sessions**
   - Active sessions > 24 hours old
   - Indicates user didn't check out properly

4. **Hour Calculation Accuracy**
   - Volunteer hours match session duration
   - No negative or excessive hours (> 24)

### Debug Queries

```sql
-- Find events with most active check-ins
SELECT 
  e.title,
  COUNT(vs.id) as active_count
FROM events e
LEFT JOIN volunteer_sessions vs 
  ON vs.event_id = e.id 
  AND vs.status = 'active'
GROUP BY e.id, e.title
ORDER BY active_count DESC;

-- Find stuck active sessions
SELECT 
  vs.*,
  e.title,
  u.name
FROM volunteer_sessions vs
JOIN events e ON e.id = vs.event_id
JOIN auth.users u ON u.id = vs.user_id
WHERE vs.status = 'active'
  AND vs.started_at < NOW() - INTERVAL '24 hours';

-- Verify hour calculations
SELECT 
  vh.hours,
  EXTRACT(EPOCH FROM (vs.ended_at - vs.started_at)) / 3600 as calculated_hours,
  ABS(vh.hours - EXTRACT(EPOCH FROM (vs.ended_at - vs.started_at)) / 3600) as difference
FROM volunteer_hours vh
JOIN volunteer_sessions vs 
  ON vh.event_id = vs.event_id 
  AND vh.user_id = vs.user_id
WHERE ABS(vh.hours - EXTRACT(EPOCH FROM (vs.ended_at - vs.started_at)) / 3600) > 0.1;
-- Should return 0 rows (all hours match)
```

## Troubleshooting Decision Tree

```
Check-in not appearing?
         │
         ├──► Mobile app using selfCheckIn()?
         │    └──► No: Update to use eventService.selfCheckIn()
         │    └──► Yes: Continue
         │
         ├──► Writing to volunteer_sessions?
         │    └──► No: Fix service method
         │    └──► Yes: Continue
         │
         ├──► Realtime enabled in Supabase?
         │    └──► No: Enable in Dashboard → Database → Replication
         │    └──► Yes: Continue
         │
         ├──► Website subscribed to volunteer_sessions?
         │    └──► No: Already implemented in EventDetailPageClient
         │    └──► Yes: Continue
         │
         └──► RLS policies allow SELECT?
              └──► No: Update policies (see docs)
              └──► Yes: Check Supabase logs for errors
```

