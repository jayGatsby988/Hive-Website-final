# HIVE Platform - Quick Start Guide

## 🚀 Getting Started in 5 Minutes

### Step 1: Test Organizations are Ready!

I've created 3 test organizations with join codes:

| Organization Name | Join Code | Description |
|-------------------|-----------|-------------|
| **Green Earth Volunteers** | `GREEN1` | Environmental conservation |
| **Community Food Bank** | `FOOD99` | Food assistance programs |
| **Youth Education Center** | `YOUTH7` | Educational mentorship |

### Step 2: Create Your Account

1. Visit: `http://localhost:3002/signup`
2. Fill in your details:
   - Name: Your name
   - Email: your_email@example.com
   - Password: (at least 8 characters)
   - Role: Select "Volunteer"
3. Click "Create Account"

### Step 3: Join an Organization

1. After logging in, go to: `http://localhost:3002/organizations`
2. You'll see a join code input field
3. Enter one of the test codes:
   - `GREEN1` for Green Earth Volunteers
   - `FOOD99` for Community Food Bank
   - `YOUTH7` for Youth Education Center
4. Click "Join Organization"
5. You'll be redirected to the organization page!

### Step 4: View Events on Dashboard

1. Go to: `http://localhost:3002/dashboard`
2. You'll see events from your organization(s)
3. Events are automatically synced from your joined organizations

### Step 5: View Events on Calendar

1. Go to: `http://localhost:3002/calendar`
2. All events from your organizations appear here
3. Click on dates with events to see details

## 📝 Creating Events (For Admins)

If you create an organization, you become an admin and can:

1. Go to your organization page
2. Click "Events" tab
3. Click "Create Event"
4. Fill in event details
5. Members of your organization will see it on their dashboard and calendar!

## 🔑 Sharing Your Organization's Join Code

If you created an organization:

1. Go to: `/organizations/{your-org-id}/settings`
2. Click "General" tab
3. Your join code is displayed at the top in a yellow box
4. Click "Copy" to copy it to clipboard
5. Share the code with people you want to join!

## 🎯 Complete User Flow

```
1. Sign Up → Create Account
2. Organizations Page → Enter Join Code
3. Join Organization → Become Member
4. Dashboard → See Organization Events
5. Calendar → See All Events
6. Join Events → Track Hours
```

## 🐛 Debugging

If something doesn't work:

### Check Configuration
Visit: `http://localhost:3002/config-check`
- Verifies Supabase connection
- Tests database access
- Shows authentication status

### Debug Organizations
Visit: `http://localhost:3002/debug-orgs`
- Tests organization loading
- Shows detailed debug info
- Allows testing join functionality

### Common Issues

**Problem: "Loading..." forever**
- Wait up to 10 seconds (timeout will kick in)
- Check browser console for errors
- Visit `/config-check` to diagnose

**Problem: "Invalid join code"**
- Codes are case-insensitive but must be exact
- Try: `GREEN1`, `FOOD99`, or `YOUTH7`
- Make sure organization is active

**Problem: "Already a member"**
- You can only join each organization once
- Try a different organization's code

**Problem: "No events on dashboard"**
- Organizations need to create events first
- As an admin, create events in the organization
- Events must be "published" status to show

## 🎨 Test Join Codes

Use these codes to test the join functionality:

```
GREEN1  → Green Earth Volunteers
FOOD99  → Community Food Bank
YOUTH7  → Youth Education Center
```

## 📍 Important URLs

- **Home**: `http://localhost:3002/`
- **Sign Up**: `http://localhost:3002/signup`
- **Login**: `http://localhost:3002/login`
- **Organizations** (Join): `http://localhost:3002/organizations`
- **Dashboard**: `http://localhost:3002/dashboard`
- **Calendar**: `http://localhost:3002/calendar`
- **Config Check**: `http://localhost:3002/config-check`
- **Debug**: `http://localhost:3002/debug-orgs`

## ✨ Features Now Working

✅ User registration (no duplicate errors)
✅ Join organizations with codes
✅ Create organizations (auto-generates join code)
✅ View join code in settings (for admins)
✅ Copy join code to share
✅ Events from organizations show on dashboard
✅ Events from organizations show on calendar
✅ Join events within organizations
✅ Navigate between organizations
✅ Create events within organizations
✅ Track volunteer hours

## 🎉 You're Ready to Go!

Everything is set up and working. Start by:
1. Creating an account
2. Using join code `GREEN1` to join Green Earth Volunteers
3. Exploring the dashboard and calendar

Enjoy your HIVE volunteer management platform!
