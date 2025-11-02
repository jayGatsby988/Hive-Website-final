# Super Admin Setup Guide

This guide explains how to set up and use the super admin system in the HIVE application.

## Overview

The super admin system provides the highest level of access to the application, allowing you to:
- Create and manage other admin accounts
- View system-wide statistics
- Access all organizations and data
- Perform administrative actions across the entire platform

## Security Features

- **Manual Creation Only**: Super admin accounts cannot be created through the public signup process
- **Elevated Permissions**: Full access to all system features and data
- **Admin Management**: Can create, edit, and delete other admin accounts
- **System Monitoring**: Access to system-wide statistics and logs

## Setup Instructions

### Prerequisites

1. Ensure you have your Supabase project set up with the required environment variables
2. You need the Supabase service role key for elevated permissions

### Method 1: Using Environment Variables (Recommended)

1. Add the service role key to your `.env.local` file:
```env
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

2. Set the super admin details as environment variables:
```bash
SUPER_ADMIN_NAME="Your Name" \
SUPER_ADMIN_EMAIL="admin@yourdomain.com" \
SUPER_ADMIN_PASSWORD="your_secure_password" \
SUPER_ADMIN_JOB_TITLE="Super Administrator" \
SUPER_ADMIN_PHONE="+1234567890" \
node scripts/create-super-admin-env.js
```

### Method 2: Interactive Script

1. Run the interactive script:
```bash
node scripts/create-super-admin.js
```

2. Follow the prompts to enter the super admin details

### Method 3: Direct Database Insertion

If you prefer to create the account directly in Supabase:

1. Go to your Supabase project dashboard
2. Navigate to Authentication > Users
3. Create a new user with email confirmation
4. Go to the SQL Editor and run:

```sql
-- Update the user's role to super_admin
UPDATE users 
SET role = 'super_admin', 
    admin = true, 
    is_verified = true 
WHERE email = 'your_admin_email@example.com';
```

## Accessing the Super Admin Panel

1. Log in with your super admin credentials at `/login`
2. Navigate to `/super-admin` or use the "Super Admin" link in the header
3. You'll see the super admin dashboard with:
   - System statistics
   - Admin user management
   - Quick action buttons

## Super Admin Features

### Admin Management
- **Create Admins**: Add new admin accounts with custom roles
- **Edit Admins**: Modify existing admin details and permissions
- **Delete Admins**: Remove admin accounts (except other super admins)
- **Toggle Status**: Activate/deactivate admin accounts

### System Overview
- **Total Admins**: Count of all admin users
- **Active Admins**: Count of verified admin users
- **Total Users**: Count of all users in the system
- **Organizations**: Count of all organizations

### Quick Actions
- **System Settings**: Access global system configuration
- **Database Management**: Direct database operations
- **System Logs**: View application logs and audit trails

## Security Best Practices

1. **Strong Passwords**: Use complex, unique passwords for super admin accounts
2. **Limited Access**: Only create super admin accounts for trusted personnel
3. **Regular Audits**: Periodically review admin accounts and their activities
4. **Secure Environment**: Run the creation scripts in a secure environment
5. **Clean Up**: Delete the creation scripts after use

## Role Hierarchy

```
super_admin (Highest)
    ├── Can create/edit/delete other admins
    ├── Full system access
    ├── Can manage all organizations
    └── Access to super admin panel

admin
    ├── Can manage organization members
    ├── Can create/edit events
    ├── Can view organization analytics
    └── Access to admin dashboard

volunteer
    ├── Can join events
    ├── Can track volunteer hours
    └── Access to volunteer dashboard

user (Lowest)
    ├── Basic account access
    └── Can view public content
```

## Troubleshooting

### Common Issues

1. **"Access Denied" Error**
   - Ensure the user has `super_admin` role in the database
   - Check that the user is verified (`is_verified = true`)

2. **Script Execution Errors**
   - Verify all environment variables are set correctly
   - Ensure the service role key has proper permissions
   - Check that the Supabase project is accessible

3. **Permission Errors**
   - Verify the service role key is correct
   - Check that the user table has the proper schema
   - Ensure RLS policies allow the operations

### Getting Help

If you encounter issues:
1. Check the browser console for error messages
2. Verify your Supabase configuration
3. Ensure all required environment variables are set
4. Check the application logs for detailed error information

## Maintenance

### Regular Tasks
- Review admin accounts monthly
- Monitor system statistics
- Update admin permissions as needed
- Clean up inactive accounts

### Backup Considerations
- Export admin user data regularly
- Keep backups of system configurations
- Document any custom permissions or settings

## Important Notes

- **Never share super admin credentials**
- **Delete creation scripts after use**
- **Monitor super admin account activity**
- **Use strong, unique passwords**
- **Keep the service role key secure**

The super admin system is designed to give you complete control over your HIVE application while maintaining security and proper access controls.
