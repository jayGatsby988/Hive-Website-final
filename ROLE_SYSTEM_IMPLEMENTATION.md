# 🎯 Role-Based Event System - Implementation Guide

## Overview
Complete implementation of role-based event filtering using Supabase. Members can select their roles, and admins can create events restricted to specific roles.

## 📋 What Was Implemented

### 1. SQL Setup (`SETUP_ROLE_SYSTEM.sql`)
Run this SQL in Supabase to set up the complete backend:

**Tables Created/Modified:**
- ✅ `events` table: Added `allowed_roles TEXT[]` column
- ✅ `user_organization_roles` table: Stores which roles each user has
- ✅ `organization_roles` table: RLS policies enabled

**Functions Created:**
- ✅ `user_can_view_event(user_id, event_id)` - Checks if user can see an event
- ✅ `user_has_role(user_id, org_id, role_name)` - Helper to check user roles

**RLS Policies:**
- ✅ Users can view/select roles in their organizations
- ✅ Admins can manage all roles
- ✅ Events filtered based on user roles automatically

### 2. Service Methods (`lib/services.ts`)
Added `roleService` with complete CRUD operations:

```typescript
export const roleService = {
  // Get all roles for an organization
  getOrganizationRoles(organizationId)
  
  // Get user's roles
  getUserRoles(userId, organizationId)
  
  // Assign/remove roles
  assignRole(userId, organizationId, roleName, assignedBy?)
  removeRole(userId, organizationId, roleName)
  
  // Manage organization roles (admin)
  createOrganizationRole(organizationId, roleName, isPublic, options)
  deleteOrganizationRole(organizationId, roleName)
  
  // Check event visibility
  canUserViewEvent(userId, eventId)
}
```

### 3. UI Components

#### Role Selector (`components/organizations/RoleSelector.tsx`)
Beautiful role selection component with:
- ✅ Checkbox-style role selection
- ✅ Shows selected roles with badges
- ✅ Loading states and animations
- ✅ Can be used standalone or embedded

#### My Roles Page (`app/organizations/[id]/my-roles/page.tsx`)
Dedicated page for members to manage their roles:
- ✅ Clean, intuitive interface
- ✅ Info box explaining why roles matter
- ✅ Accessible from sidebar

### 4. Navigation Updates
Added "My Roles" to organization sidebar:
- ✅ Visible to all members (not just admins)
- ✅ Icon: UserCircle
- ✅ Breadcrumb support

## 🎯 How It Works

### For Members (Selecting Roles)

1. **Navigate to My Roles**
   ```
   Organizations → Select Org → My Roles (sidebar)
   ```

2. **Select Roles**
   - Click on any role to select it
   - Click again to deselect
   - Changes saved immediately to Supabase

3. **See Filtered Events**
   - Events page now only shows events you're allowed to see
   - Based on your selected roles + admin override

### For Admins (Creating Role-Restricted Events)

1. **Create Event**
   - Go to Events → Create Event
   - Fill in event details

2. **Set Allowed Roles**
   - Select which roles can see this event
   - Options:
     - `everyone` - All members can see it
     - `volunteer` - Only volunteers
     - `team_lead` - Only team leads
     - Multiple roles - Users with ANY of the selected roles

3. **Publish Event**
   - Event automatically filtered for members
   - Admins always see all events

## 📊 Database Structure

### user_organization_roles
```sql
CREATE TABLE user_organization_roles (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  organization_id UUID REFERENCES organizations(id),
  role_name TEXT NOT NULL,
  assigned_at TIMESTAMPTZ DEFAULT NOW(),
  assigned_by UUID REFERENCES users(id),
  UNIQUE(user_id, organization_id, role_name)
);
```

### events (updated)
```sql
ALTER TABLE events 
ADD COLUMN allowed_roles TEXT[] DEFAULT '{}';

-- Examples:
-- allowed_roles = '{}'                    → Everyone
-- allowed_roles = '{everyone}'            → Everyone (explicit)
-- allowed_roles = '{volunteer}'           → Only volunteers
-- allowed_roles = '{volunteer,team_lead}' → Volunteers OR team leads
```

### organization_roles (existing)
```sql
-- Already exists in your Supabase
-- Defines available roles for each organization
id, organization_id, role_name, is_public, options
```

## 🔒 Security (RLS Policies)

### user_organization_roles
```sql
-- Users can view roles in organizations they belong to
SELECT: member of organization

-- Users can select public roles for themselves
INSERT: is self + role is public + is member

-- Users can remove their own roles
DELETE: is self

-- Admins can manage all roles
ALL: is admin of organization
```

### events
```sql
-- Users see events based on roles
SELECT: is member AND user_can_view_event(user_id, event_id)
```

## 🎨 UI Flow

### Member Experience
```
1. Join organization
2. Go to "My Roles" 
3. Select relevant roles (volunteer, coordinator, etc.)
4. Go to "Events"
5. See only events matching their roles
```

### Admin Experience
```
1. Create event
2. Select "Allowed Roles" (NEW FIELD)
3. Choose:
   - Everyone
   - Specific roles
   - Multiple roles
4. Publish
5. Event auto-filtered for members
```

## 🚀 Next Steps to Complete

### TODO: Add Role Selector to Event Creation Form

Update `app/organizations/[id]/events/create/page.tsx`:

```typescript
// Add to EventFormData interface
interface EventFormData {
  // ... existing fields
  allowed_roles: string[]  // NEW
}

// Add to form state
const [formData, setFormData] = useState<EventFormData>({
  // ... existing fields
  allowed_roles: [],  // NEW
})

// In the form JSX (add after tags section)
<div>
  <label className="block text-sm font-semibold text-gray-700 mb-2">
    Allowed Roles
  </label>
  <RoleMultiSelect
    organizationId={selectedOrg.id}
    selectedRoles={formData.allowed_roles}
    onChange={(roles) => setFormData(prev => ({ ...prev, allowed_roles: roles }))}
    includeEveryone={true}
  />
  <p className="text-xs text-gray-500 mt-1">
    Leave empty or select "Everyone" to show event to all members
  </p>
</div>

// Update eventData in handleSubmit
const eventData = {
  // ... existing fields
  allowed_roles: formData.allowed_roles,  // NEW
}
```

### TODO: Update Event List to Filter by Roles

Update `app/organizations/[id]/events/EventsPageClient.tsx`:

```typescript
// The filtering is now automatic via RLS!
// Supabase will only return events the user can see

// But add visual indicator for role-restricted events
{event.allowed_roles && event.allowed_roles.length > 0 && (
  <div className="flex flex-wrap gap-1 mt-2">
    {event.allowed_roles.map(role => (
      <span key={role} className="px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded-full">
        {role}
      </span>
    ))}
  </div>
)}
```

### TODO: Show Role Requirements on Event Detail Page

Update `app/organizations/[id]/events/[eventId]/EventDetailPageClient.tsx`:

```typescript
// Add to event display
{event.allowed_roles && event.allowed_roles.length > 0 && (
  <HiveCard hoverable={false} className="bg-purple-50 border-purple-200">
    <div className="flex items-center gap-3">
      <UserCircle className="w-6 h-6 text-purple-600" />
      <div>
        <h3 className="font-bold text-purple-900">Role Requirements</h3>
        <p className="text-sm text-purple-700">
          This event is for: {event.allowed_roles.join(', ')}
        </p>
      </div>
    </div>
  </HiveCard>
)}
```

## 📝 Testing Checklist

### Setup (Run Once)
- [ ] Run `SETUP_ROLE_SYSTEM.sql` in Supabase SQL Editor
- [ ] Verify no errors in SQL execution
- [ ] Check that `user_organization_roles` table exists
- [ ] Check that `events.allowed_roles` column exists

### Create Test Roles (Admin)
- [ ] Go to Supabase Table Editor
- [ ] Open `organization_roles` table
- [ ] Insert test roles:
  ```sql
  INSERT INTO organization_roles (organization_id, role_name, is_public)
  VALUES 
    ('YOUR-ORG-ID', 'volunteer', true),
    ('YOUR-ORG-ID', 'team_lead', true),
    ('YOUR-ORG-ID', 'coordinator', true);
  ```

### Test Member Role Selection
- [ ] Log in as a member
- [ ] Go to organization → My Roles
- [ ] Select "volunteer" role
- [ ] Verify badge appears at bottom
- [ ] Check Supabase `user_organization_roles` table for new row

### Test Event Creation (Admin)
- [ ] Log in as admin
- [ ] Create new event
- [ ] Set `allowed_roles` to `['volunteer']` (manually in Supabase for now)
- [ ] Publish event

### Test Event Filtering (Member)
- [ ] Log in as member with "volunteer" role
- [ ] Go to Events page
- [ ] Should see the volunteer-only event
- [ ] Log in as member without role
- [ ] Should NOT see the volunteer-only event

### Test "Everyone" Events
- [ ] Create event with `allowed_roles = []` or `['everyone']`
- [ ] All members should see it regardless of roles

## 🔧 Troubleshooting

### Issue: Members can't select roles
**Check:**
1. RLS policies on `user_organization_roles` table
2. Roles exist in `organization_roles` with `is_public = true`
3. User is a member of the organization

**Fix:** Re-run RLS section of `SETUP_ROLE_SYSTEM.sql`

### Issue: Events not filtered correctly
**Check:**
1. `user_can_view_event()` function exists
2. RLS policy on `events` table uses the function
3. `allowed_roles` column exists and has data

**Fix:** 
```sql
-- Recreate the function
SELECT user_can_view_event('test-user-id', 'test-event-id');
```

### Issue: Everyone can see role-restricted events
**Check:**
1. Event has `allowed_roles` set (not empty array)
2. Event doesn't include 'everyone' in allowed_roles
3. RLS is enabled on events table

**Fix:**
```sql
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
```

## 🎉 What Members Will See

### Before Roles:
```
My Organization
├─ Overview
├─ Events (shows all events)
└─ Stats
```

### After Roles:
```
My Organization
├─ Overview
├─ Events (filtered by my roles! 🎯)
├─ Stats
└─ My Roles ⭐ NEW!
    ├─ Select roles
    └─ See filtered events
```

## 📱 Mobile App Integration

The role system works seamlessly with mobile apps because:
1. ✅ All logic is in Supabase (RLS + Functions)
2. ✅ No client-side filtering needed
3. ✅ Same queries work everywhere
4. ✅ Role selection syncs automatically

Mobile app just needs to:
```typescript
// Get user's roles
const { data: roles } = await supabase
  .from('user_organization_roles')
  .select('role_name')
  .eq('user_id', userId)
  .eq('organization_id', orgId);

// Get events (auto-filtered by Supabase RLS!)
const { data: events } = await supabase
  .from('events')
  .select('*')
  .eq('organization_id', orgId);
```

## 🔮 Future Enhancements

- [ ] Role management UI for admins (create/delete roles)
- [ ] Role-based notifications
- [ ] Role hierarchy (admin > coordinator > volunteer)
- [ ] Custom role permissions beyond event visibility
- [ ] Role badges on member profiles
- [ ] Analytics on role distribution

---

**Status**: Core system complete! UI components ready. Just need to:
1. Run SQL setup
2. Add role selector to event creation form
3. Test and deploy!

🚀 **Ready to implement!**

