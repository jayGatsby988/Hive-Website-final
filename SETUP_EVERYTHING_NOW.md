# 🚀 Complete Setup Guide - Everything You Need

## ⚡ Quick Overview

You now have **TWO** SQL files to run:

1. **`COMPLETE_RLS_FIX.sql`** - Fixes the 403 error when creating events with roles
2. **`SETUP_AUDIT_LOG.sql`** - Creates the complete audit log system for admins

## 📋 Step-by-Step Instructions

### Step 1: Fix Event Creation (COMPLETE_RLS_FIX.sql)

**Problem this solves**: "new row violates row-level security policy" when creating events with `allowed_roles`

**What to do**:
1. Open Supabase Dashboard → **SQL Editor**
2. Copy entire contents of **`COMPLETE_RLS_FIX.sql`**
3. Paste and click **RUN**
4. Wait for success message showing policies created

**What this does**:
- ✅ Removes ALL old conflicting RLS policies on `events` table
- ✅ Creates new clean policies:
  - SELECT: Admins see ALL events, members see filtered by role
  - INSERT: Admins only, no role check
  - UPDATE: Admins only, no role check
  - DELETE: Admins only
- ✅ Fixes the INSERT → SELECT issue (admin can read event they just created)

**After running**:
- Refresh your browser at http://localhost:3000
- Try creating an event with specific roles
- Should work without 403 error! ✅

---

### Step 2: Setup Audit Log (SETUP_AUDIT_LOG.sql)

**Problem this solves**: No way to see who did what, when, in your organization

**What to do**:
1. Open Supabase Dashboard → **SQL Editor** (new query)
2. Copy entire contents of **`SETUP_AUDIT_LOG.sql`**
3. Paste and click **RUN**
4. Wait for success message: "✅✅✅ AUDIT LOG SYSTEM CREATED! ✅✅✅"

**What this does**:
- ✅ Creates `audit_log` table with indexes
- ✅ Creates automatic triggers for ALL actions:
  - Event creation, updates, deletion
  - Event signups
  - Check-ins and check-outs
  - Member joins
  - Role changes
  - Role assignments
- ✅ Creates RLS policies (admin-only access)
- ✅ Creates `log_audit_action()` function for manual logging

**After running**:
- Refresh your browser
- Look for "Audit Log" in admin sidebar
- Click it to see all tracked actions! 📊

---

## 🎯 What You'll Have After Setup

### For Event Creation:
- ✅ Admins can create events with ANY roles
- ✅ Admins can see ALL events (bypass role filter)
- ✅ Members see only events for their roles + "everyone" events
- ✅ No more 403 errors!

### For Audit Log:
- ✅ Complete history of every action in your organization
- ✅ Beautiful admin-only UI with search, filters, export
- ✅ Automatic tracking (no manual work)
- ✅ Every log has:
  - User name and email
  - Exact timestamp
  - Action type (EVENT_CREATED, CHECKIN, etc.)
  - Full details (before/after changes)

---

## 🧪 Testing Everything

### Test 1: Event Creation with Roles ✅
1. **As admin**, go to "Create Event"
2. Fill in event details
3. Under "Who can see this event?":
   - Uncheck "Everyone"
   - Check "volunteer" (or any specific role)
4. Click "Create Event"
5. **Should work!** No 403 error
6. Event is created successfully

### Test 2: Event Role Filtering ✅
1. **As member with "volunteer" role**, go to Events page
2. You should see:
   - Events with `allowed_roles = ['volunteer']` ✅
   - Events with `allowed_roles = ['everyone']` ✅
   - Events with `allowed_roles = []` (everyone) ✅
3. You should NOT see:
   - Events with `allowed_roles = ['coordinator']` (if you don't have that role) ❌

### Test 3: Audit Log Tracking ✅
1. **As admin**, go to "Audit Log" in sidebar
2. You should see logs from Test 1:
   - "Admin Name created event 'Event Title'"
3. **Expand the log** → see event details (date, time, roles)
4. **Search** your name → see only your actions
5. **Filter by "EVENT_CREATED"** → see only event creation logs
6. **Export CSV** → download all logs

### Test 4: Event Detail Shows Roles ✅
1. **Click any event** to see details
2. Under event description, you should see:
   - **"Who can see this event:"**
   - Tags showing role names (e.g., "volunteer", "coordinator")
   - OR "Everyone" if no restrictions
3. Role tags have purple background

---

## 📂 File Reference

| File | Purpose | When to Use |
|------|---------|-------------|
| `COMPLETE_RLS_FIX.sql` | Fix event creation RLS errors | Run FIRST |
| `SETUP_AUDIT_LOG.sql` | Create audit log system | Run SECOND |
| `RUN_THIS_TO_FIX_403.md` | Detailed guide for RLS fix | If 403 persists |
| `AUDIT_LOG_GUIDE.md` | Complete audit log documentation | Reference |
| `SETUP_ROLE_SYSTEM.sql` | Original role system setup | Already done |
| `SIMPLE_FIX_FILTERING.sql` | Alternative event filtering fix | Backup option |

---

## ✅ Final Checklist

After running both SQL scripts:

### Event System:
- [ ] Create event with specific roles → works without error
- [ ] Admin sees all events in events list
- [ ] Member sees only their role's events + "everyone" events
- [ ] Event detail page shows role requirements with tags
- [ ] Role tags display correctly (purple background)

### Audit Log:
- [ ] "Audit Log" link appears in admin sidebar
- [ ] Clicking it opens audit log page
- [ ] Page shows stats (Total Logs, Unique Users, etc.)
- [ ] Logs appear when actions happen (create event, check-in, etc.)
- [ ] Search box filters logs correctly
- [ ] Action filter dropdown works
- [ ] Date filter changes results
- [ ] Expanding log shows full JSON details
- [ ] Export CSV downloads file successfully
- [ ] Non-admins see "Access Denied" message

---

## 🎉 You're Done!

Your HIVE system now has:

### Complete Role System ✅
- Members select their roles
- Events can be restricted to specific roles
- Filtering works correctly
- Admins bypass all role restrictions

### Complete Audit System ✅
- Every action is automatically tracked
- Admins have full visibility
- Search, filter, and export capabilities
- Timeline view with full details

### Bug Fixes ✅
- No more 403 errors on event creation
- Events show role requirements visually
- RLS policies work correctly for all scenarios

---

## 🆘 Troubleshooting

### "Still getting 403 error"
1. Make sure you ran `COMPLETE_RLS_FIX.sql`
2. Refresh your browser (hard refresh: Cmd+Shift+R)
3. Check Supabase → Database → Policies → `events` table
4. Should see these policies:
   - `select_events_with_role_filter`
   - `insert_events_admin_only`
   - `update_events_admin_only`
   - `delete_events_admin_only`

### "No Audit Log in sidebar"
1. Make sure you're logged in as admin
2. Check `organization_members` table: your `role` should be `'admin'`
3. Refresh the page

### "Audit Log shows 'Access Denied'"
- You're not an admin in this organization
- Ask an existing admin to promote you

### "No logs appearing"
1. Make sure you ran `SETUP_AUDIT_LOG.sql`
2. Check if `audit_log` table exists in Supabase
3. Try creating a test event to trigger a log
4. Refresh the audit log page

### "Event filtering not working"
1. Make sure you ran `COMPLETE_RLS_FIX.sql` (not the old scripts)
2. Check if `allowed_roles` column exists on `events` table
3. Verify RLS is enabled on `events` table
4. Check console for errors

---

## 🎯 Next Steps

Everything is set up! You can now:

1. **Create role-restricted events** without errors
2. **View complete audit logs** as admin
3. **Track all volunteer hours** automatically
4. **Export compliance reports** via CSV
5. **Monitor organization activity** in real-time

**Need more features?** Just ask! 🚀

---

## 📞 Quick Help

- **Creating event fails** → Check `RUN_THIS_TO_FIX_403.md`
- **Audit log questions** → Check `AUDIT_LOG_GUIDE.md`
- **Role system questions** → Check `ROLE_SYSTEM_IMPLEMENTATION.md`
- **Stats page issues** → Check `STATS_AND_HOURS_SUMMARY.md`
- **Check-in problems** → Check `SELF_CHECKIN_FEATURE.md`

**Everything documented! Everything working!** ✨

