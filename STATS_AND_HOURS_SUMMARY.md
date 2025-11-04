# Stats Page & Hour Tracking Implementation

## Overview
Implemented a comprehensive volunteer stats page and improved hour tracking precision for testing purposes.

## Changes Made

### 1. Organization Layout Updates
**File**: `app/organizations/[id]/layout.tsx`

#### Added Stats Tab
- Added new "Stats" tab to sidebar navigation (visible to ALL members, not just admins)
- Removed Analytics tab from non-admin members (Analytics only visible if `canViewAnalytics` is true)
- Added BarChart3 icon import for Stats tab
- Updated breadcrumbs to include "Stats" page

#### Sidebar Structure
```typescript
{
  title: 'Main',
  items: [
    { name: 'Overview', icon: Home },
    { name: 'Events', icon: Calendar },
    { name: 'Stats', icon: BarChart3 },        // NEW - For all members
    { name: 'Analytics', icon: TrendingUp }     // Only if canViewAnalytics
  ]
}
```

#### Member Section Renamed
- Changed "Members" section title to "Community" for non-admin members
- Both admins and members can view the Members tab (as requested)

### 2. New Stats Page
**File**: `app/organizations/[id]/stats/page.tsx`

#### Features
1. **Current Organization Stats**
   - Total volunteer hours (HH:MM:SS format)
   - Total events attended
   - Organization name
   - Average hours per event

2. **Recent Events Section**
   - Shows last 10 events attended
   - Displays event title, date, and hours worked (HH:MM:SS)
   - Hover animations for better UX

3. **All Organizations Summary**
   - Shows stats across ALL organizations the user is a member of
   - Displays total hours per organization (HH:MM:SS)
   - Shows event count per organization
   - Beautiful gradient cards with hover effects

#### Time Display Format (For Testing)
All times are shown in **hours, minutes, and seconds** format:
- `2h 34m 45s` instead of just `2.58 hours`
- This provides exact precision for testing volunteer hour tracking

#### Data Source
- Queries `volunteer_hours` table
- Joins with `events` and `organizations` tables
- Calculates precise time from decimal hours stored in database
- Groups by organization and event

### 3. Hour Tracking Improvements
**File**: `lib/services.ts`

#### Precision Enhancement
Updated both `adminCheckOut` and `selfCheckOut` methods:

**Before**:
```typescript
hours: parseFloat(hours.toFixed(2))  // Only 2 decimal places
```

**After**:
```typescript
hours: parseFloat(hours.toFixed(6))  // 6 decimal places for seconds accuracy
```

#### Why 6 Decimal Places?
- 1 hour = 3600 seconds
- To preserve seconds precision: 1 second / 3600 = 0.000278 hours
- 6 decimal places ensures accurate second-level tracking
- Example: 2.5 hours 30 minutes 45 seconds = 2.512500 hours

#### Hour Calculation
Both methods calculate volunteer hours when checking out:
```typescript
const startTime = new Date(checkin.check_in_time).getTime()
const endTime = new Date(checkOutTime).getTime()
const hours = (endTime - startTime) / (1000 * 60 * 60)
```

Then records to `volunteer_hours` table:
```typescript
{
  user_id: userId,
  event_id: eventId,
  organization_id: event.organization_id,
  date: checkin.check_in_time.split('T')[0],
  hours: parseFloat(hours.toFixed(6)),
  notes: 'Checked out by admin' // or 'Self-tracked from check-in'
}
```

## How It Works

### For Members
1. Navigate to any organization
2. Click "Stats" in the sidebar
3. View detailed volunteer statistics:
   - Total hours contributed (with minute/second precision)
   - Number of events attended
   - Recent event history
   - Stats across all organizations

### For Hour Tracking
1. User or admin checks in to event → Creates record in `event_checkins`
2. User or admin checks out → Calculates time difference and records in `volunteer_hours`
3. Hours stored with 6 decimal precision (accurate to the second)
4. Stats page converts decimal hours to HH:MM:SS format for display

## Testing the Feature

### To Test Hour Tracking:
1. Go to an event detail page
2. Check in (self check-in or admin check-in)
3. Wait a specific amount of time (e.g., 1 minute 30 seconds)
4. Check out
5. Go to Stats page
6. Verify the exact time is displayed (should show `0h 1m 30s`)

### Example Time Conversions:
- `0.016667 hours` = 0h 1m 0s
- `0.025000 hours` = 0h 1m 30s
- `2.512500 hours` = 2h 30m 45s

## Database Tables Used

### volunteer_hours
```sql
- id (uuid)
- user_id (uuid) → references users
- event_id (uuid) → references events
- organization_id (uuid) → references organizations
- date (date)
- hours (decimal) ← NOW WITH 6 DECIMAL PRECISION
- notes (text)
- created_at (timestamp)
```

### event_checkins
```sql
- id (uuid)
- event_id (uuid)
- user_id (uuid)
- check_in_time (timestamp)
- check_out_time (timestamp) ← When null, user is still checked in
- checked_in_by_admin (boolean)
- latitude/longitude (optional)
```

## UI/UX Features

### Stats Page Design
- **Gradient cards** with organization branding colors
- **Animated loading states** for better user feedback
- **Responsive grid layout** (1 col mobile, 2 cols tablet, 4 cols desktop)
- **Hover effects** on event cards
- **Empty state** with encouraging message if no activity yet
- **Icons** from lucide-react for visual clarity

### Color Coding
- Blue: Total hours
- Green: Events attended
- Purple: Organization info
- Yellow: Average metrics
- Yellow/Orange: Organization summary cards

## Permissions

### Analytics Tab
- **Visible**: Only if `canViewAnalytics` permission is true (admins)
- **Hidden**: Regular members

### Stats Tab
- **Visible**: ALL members (admins and regular members)
- **Purpose**: Personal volunteer tracking

### Members Tab
- **Visible**: ALL members (as requested)
- **Section**: "Administration" for admins, "Community" for members

## Future Enhancements (Not Implemented Yet)

1. **Export Stats**: Allow users to download their hours as CSV/PDF
2. **Goals & Badges**: Set hour goals and earn achievement badges
3. **Leaderboards**: Organization-wide volunteer hour rankings (opt-in)
4. **Charts**: Visual graphs showing hours over time
5. **Certificates**: Auto-generate volunteer certificates
6. **Notifications**: Remind users to check out if they forget

## Notes

- All times are calculated in UTC but displayed in user's local timezone
- Hour tracking is automatic when users check in/out
- Stats update in real-time (no caching)
- Cross-organization stats help users see their full volunteer impact
- Minute/second precision is for testing; can be simplified later if needed

