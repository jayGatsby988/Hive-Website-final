# Mobile App Implementation Checklist

Use this checklist to ensure the mobile app is correctly integrated for check-in sync.

## ✅ Setup Phase

### 1. Import Required Modules
- [ ] Import `eventService` from `@/lib/services`
- [ ] Import `supabase` from `@/lib/supabase`
- [ ] Verify Supabase URL and anon key match the website's

### 2. Verify Database Access
- [ ] Test query: `await supabase.from('volunteer_sessions').select('*').limit(1)`
- [ ] Test query: `await supabase.from('events').select('*').limit(1)`
- [ ] No "permission denied" errors

---

## ✅ Check-In Implementation

### 3. Replace Old Check-In Code
- [ ] Remove any direct Supabase inserts to `event_checkins` only
- [ ] Remove custom check-in logic
- [ ] Use `eventService.selfCheckIn()` instead

### 4. Implement Check-In Button Handler
```typescript
const handleCheckIn = async () => {
  try {
    setLoading(true);
    
    // Get current location (optional)
    const location = await getCurrentLocation(); // Your location logic
    
    await eventService.selfCheckIn(
      event.id,
      user.id,
      location?.latitude,
      location?.longitude
    );
    
    // Show success message
    showSuccessToast('Checked in successfully!');
    
    // Refresh event data
    await refreshEventData();
    
  } catch (error) {
    if (error.message.includes('already has an active session')) {
      showErrorToast('You are already checked in');
    } else {
      showErrorToast('Failed to check in. Please try again.');
      console.error('Check-in error:', error);
    }
  } finally {
    setLoading(false);
  }
};
```
- [ ] Implemented and tested

### 5. Test Check-In Flow
- [ ] Button shows "Check In" when not checked in
- [ ] Button disabled when event not started
- [ ] Clicking button calls `selfCheckIn()`
- [ ] Success toast appears
- [ ] Button changes to "Check Out"
- [ ] Can't check in twice (error shown)

---

## ✅ Check-Out Implementation

### 6. Replace Old Check-Out Code
- [ ] Remove any custom check-out logic
- [ ] Use `eventService.selfCheckOut()` instead

### 7. Implement Check-Out Button Handler
```typescript
const handleCheckOut = async () => {
  try {
    setLoading(true);
    
    await eventService.selfCheckOut(
      event.id,
      user.id
    );
    
    // Show success with hours earned (fetch from volunteer_hours)
    const { data: hours } = await supabase
      .from('volunteer_hours')
      .select('hours')
      .eq('event_id', event.id)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();
    
    showSuccessToast(`Checked out! You earned ${hours?.hours || 0} hours.`);
    
    // Refresh event data
    await refreshEventData();
    
  } catch (error) {
    if (error.message.includes('No active session')) {
      showErrorToast('You are not checked in');
    } else {
      showErrorToast('Failed to check out. Please try again.');
      console.error('Check-out error:', error);
    }
  } finally {
    setLoading(false);
  }
};
```
- [ ] Implemented and tested

### 8. Test Check-Out Flow
- [ ] Button shows "Check Out" when checked in
- [ ] Clicking button calls `selfCheckOut()`
- [ ] Success toast shows hours earned
- [ ] Button changes back to "Check In"
- [ ] Can't check out without checking in first (error shown)

---

## ✅ Real-Time Updates Implementation

### 9. Subscribe to Volunteer Sessions
```typescript
useEffect(() => {
  if (!event?.id) return;
  
  const channel = supabase
    .channel(`event-${event.id}`)
    .on('postgres_changes', { 
      event: '*', 
      schema: 'public', 
      table: 'volunteer_sessions', 
      filter: `event_id=eq.${event.id}` 
    }, (payload) => {
      console.log('Session change:', payload);
      
      // Check if it affects current user
      if (payload.new?.user_id === user.id || payload.old?.user_id === user.id) {
        // Refresh current user's check-in status
        checkUserStatus();
      }
      
      // Refresh event data (attendee count, etc.)
      refreshEventData();
    })
    .subscribe((status) => {
      console.log('Subscription status:', status);
    });
  
  return () => {
    supabase.removeChannel(channel);
  };
}, [event?.id, user?.id]);
```
- [ ] Implemented
- [ ] Console logs show "SUBSCRIBED" status
- [ ] Console logs show changes when check-ins happen

### 10. Test Real-Time Updates
- [ ] Open event on mobile
- [ ] Check in on website (as admin for this user)
- [ ] Mobile app updates within 2 seconds
- [ ] Button state changes automatically
- [ ] No page refresh needed

---

## ✅ UI/UX Implementation

### 11. Button States
- [ ] "Check In" - Green button, enabled when event started
- [ ] "Check Out" - Orange/Gray button, enabled when checked in
- [ ] "Event Not Started" - Disabled gray button
- [ ] "Completed" - Shows hours earned, disabled
- [ ] Loading spinner during check-in/out operations

### 12. Status Indicators
- [ ] Badge/icon shows if user is checked in
- [ ] Timestamp shows when user checked in
- [ ] Hours counter updates after check-out
- [ ] Attendee count updates in real-time

### 13. Error Handling
- [ ] Network errors show friendly message
- [ ] "Already checked in" error handled gracefully
- [ ] "Not checked in" error handled gracefully
- [ ] Generic errors logged and shown to user

---

## ✅ Testing Phase

### 14. Self Check-In Testing
- [ ] Can check in to started event
- [ ] Cannot check in to event that hasn't started
- [ ] Cannot check in twice
- [ ] Check-in appears on website within 2 seconds
- [ ] Check-in increases attendee count on mobile

### 15. Self Check-Out Testing
- [ ] Can check out after checking in
- [ ] Cannot check out without checking in
- [ ] Hours calculated correctly (matches duration)
- [ ] Check-out appears on website within 2 seconds
- [ ] Check-out decreases attendee count on mobile

### 16. Admin Check-In Testing (Website → Mobile)
- [ ] Admin checks in user on website
- [ ] Mobile app shows user as checked in within 2 seconds
- [ ] Button changes to "Check Out" automatically
- [ ] No errors in console

### 17. Multi-User Testing
- [ ] Two users check in simultaneously
- [ ] Both appear on each other's devices
- [ ] Attendee counts are accurate
- [ ] No duplicate entries

### 18. Edge Case Testing
- [ ] App backgrounds during check-in → resumes successfully
- [ ] Poor network during check-in → retries or shows error
- [ ] User force-closes app while checked in → state persists
- [ ] User checks in on mobile, checks out on website → syncs correctly

---

## ✅ Data Verification

### 19. Database Checks
Run these queries in Supabase SQL Editor:

**Check volunteer_sessions:**
```sql
SELECT * FROM volunteer_sessions
WHERE event_id = 'YOUR_TEST_EVENT_ID'
ORDER BY created_at DESC;
```
- [ ] Status is 'active' when checked in
- [ ] Status is 'completed' when checked out
- [ ] `started_at` is set correctly
- [ ] `ended_at` is set on check-out

**Check volunteer_hours:**
```sql
SELECT * FROM volunteer_hours
WHERE event_id = 'YOUR_TEST_EVENT_ID';
```
- [ ] Hours match session duration
- [ ] Created automatically on check-out
- [ ] One record per completed session

**Check for duplicates:**
```sql
SELECT user_id, COUNT(*) as active_count
FROM volunteer_sessions
WHERE event_id = 'YOUR_TEST_EVENT_ID'
  AND status = 'active'
GROUP BY user_id
HAVING COUNT(*) > 1;
```
- [ ] Returns 0 rows (no duplicate active sessions)

---

## ✅ Performance Testing

### 20. Response Times
- [ ] Check-in completes in < 2 seconds
- [ ] Check-out completes in < 2 seconds
- [ ] Real-time updates arrive in < 2 seconds
- [ ] No UI freezing during operations

### 21. Offline Handling
- [ ] Show appropriate error when offline
- [ ] Queue operations for retry (optional)
- [ ] Don't crash or hang

---

## ✅ Code Quality

### 22. Code Review
- [ ] No console.errors in production build
- [ ] Proper error handling throughout
- [ ] Loading states implemented
- [ ] No memory leaks (subscriptions cleaned up)
- [ ] TypeScript types used correctly

### 23. Logging
- [ ] Log check-in attempts
- [ ] Log check-out attempts
- [ ] Log subscription status changes
- [ ] Log errors with context

---

## ✅ Documentation

### 24. Code Comments
- [ ] Comment complex logic
- [ ] Document function parameters
- [ ] Explain error handling

### 25. User Documentation
- [ ] Update user guide with check-in instructions
- [ ] Add troubleshooting section
- [ ] Include screenshots/videos

---

## ✅ Final Verification

### 26. Complete End-to-End Test
1. [ ] Create new event on website
2. [ ] Sign up for event on mobile
3. [ ] Admin starts event on website
4. [ ] User checks in on mobile
5. [ ] Verify appears on website immediately
6. [ ] User checks out on mobile
7. [ ] Verify hours recorded correctly
8. [ ] Check volunteer hours page on website

### 27. Production Readiness
- [ ] Tested on iOS (if applicable)
- [ ] Tested on Android (if applicable)
- [ ] Tested on various network speeds
- [ ] No blocking bugs or crashes
- [ ] Stakeholder sign-off received

---

## 📋 Sign-Off

| Role | Name | Date | Signature |
|------|------|------|-----------|
| Mobile Developer | | | |
| QA Tester | | | |
| Backend Developer | | | |
| Product Manager | | | |

---

## 🐛 Known Issues (if any)

List any issues that need to be addressed before production:

1. _None_

---

## 📞 Support Contacts

- **Backend/Supabase Issues**: [Contact Info]
- **Mobile App Issues**: [Contact Info]
- **Testing Issues**: [Contact Info]

---

## 📚 Reference Documentation

- `MOBILE_APP_CHECKIN_GUIDE.md` - Implementation details
- `TESTING_MOBILE_SYNC.md` - Testing procedures
- `QUICK_REFERENCE_CHECKIN_SYNC.md` - Quick reference
- `SYNC_ARCHITECTURE.md` - System architecture
- `MOBILE_WEBSITE_SYNC_SUMMARY.md` - Technical summary

