# Special Moderator Role Setup

## Overview
A special private "moderator" role has been created that gives admin-like permissions except for member management.

## User Credentials
- **Email**: `poop@gmail.com`
- **Password**: `123456`

## Setup Instructions

### 1. Run the SQL Script
Execute this in your Supabase SQL Editor:

```bash
Run the file: SETUP_SPECIAL_MODERATOR_ROLE.sql
```

**Note**: This script is **idempotent** (safe to run multiple times). If the user or role already exists, it will update them instead of throwing errors.

This will:
- Create the user account (if it doesn't exist) or update it if it does
- Update the `organization_members` table constraint to allow 'moderator' role
- Create the moderator role type
- Set up RLS policies for moderator permissions
- Assign the user to the first available organization as a moderator

### 2. What the Moderator Can Do ✅

- **Events**: Create, edit, delete, start, and end events ✓
- **Event Management**: Manage attendees, check-ins, and check-outs ✓
- **View Members**: Can see all members in the members page ✓
- **Update Members**: Can update member roles (admin/member/moderator) and status (active/inactive) ✓
- **Roles**: View and assign custom roles to members (from the roles tab) ✓
- **Audit Logs**: View all organization audit logs ✓
- **Analytics**: View organization analytics ✓
- **Settings**: View organization settings ✓

### 3. What the Moderator CANNOT Do ❌

- **Add Members**: Cannot add new members to the organization ❌
- **Remove Members**: Cannot remove existing members from the organization ❌
  - Remove buttons are hidden for moderators
  - Bulk remove action is hidden for moderators

### 4. What Admins Can Do (Unchanged)

Admins have all moderator permissions PLUS:
- ✅ Add new members to the organization
- ✅ Remove members from the organization
- ✅ Assign moderator role to other users

## How It Works

### Database Level
- The `moderator` role is added to the `organization_members.role` column
- RLS policies check for `role IN ('admin', 'moderator')` for most admin features
- Member add/remove policies ONLY check for `role = 'admin'`

### Permissions System
- Added `moderator` to `lib/permissions.ts` with all admin permissions except `manage_members`
- `ORG_ROLE_PERMISSIONS.moderator` includes: create/edit/delete events, view analytics, manage settings, etc.
- `isOrgAdmin()` returns true for both 'admin' and 'moderator'

### Frontend Level
- `OrganizationContext`:
  - `isAdmin = userRole === 'admin' || userRole === 'moderator'` (gives admin UI access)
  - `canCreateEvents = true` for moderators (allows event creation)
  - `canManageMembers = true` only for admins, not moderators
- The members page:
  - Shows "Moderator (Private)" option only to existing moderators or admins
  - Hides remove buttons for moderators (both individual and bulk)
  - Moderators can still see all members and update their roles/status
- Event pages: Moderators can create, start, end, and manage events

## TypeScript Updates

The `OrganizationMember` type now includes:
```typescript
role: 'admin' | 'member' | 'moderator'
```

## Testing

1. Log in as `poop@gmail.com` / `123456`
2. Navigate to the organization
3. Verify you can:
   - Create and manage events
   - View and manage attendees
   - Assign roles to members
   - View audit logs
4. Verify you CANNOT:
   - Add new members (no "Add Member" button or it's disabled)
   - Remove members (no remove button for members)

## Notes

- The moderator role is **private** - it won't show up in public role selection
- Only admins can assign the moderator role to other users
- Moderators appear as admins in most of the UI
- This role is stored in `organization_members.role`, not in `user_organization_roles`

## Troubleshooting

### If you get a "check constraint" error:
The script automatically updates the `organization_members_role_check` constraint to include 'moderator'. If you still get errors, manually run:
```sql
ALTER TABLE organization_members DROP CONSTRAINT IF EXISTS organization_members_role_check;
ALTER TABLE organization_members ADD CONSTRAINT organization_members_role_check CHECK (role IN ('admin', 'member', 'moderator'));
```

### If the user can't log in:
1. Check if the user exists in `auth.users` table
2. Verify the password is set correctly
3. Run the SQL script again

### If permissions aren't working:
1. Check `organization_members` table for the moderator role
2. Verify RLS policies are created
3. Check browser console for any permission errors

