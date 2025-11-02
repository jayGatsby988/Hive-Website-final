#!/usr/bin/env node

/**
 * Script to create a super admin account using environment variables
 * This is more secure as it doesn't require interactive input
 * 
 * Usage: 
 *   SUPER_ADMIN_NAME="John Doe" \
 *   SUPER_ADMIN_EMAIL="admin@example.com" \
 *   SUPER_ADMIN_PASSWORD="securepassword123" \
 *   node scripts/create-super-admin-env.js
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Get super admin details from environment variables
const superAdminName = process.env.SUPER_ADMIN_NAME;
const superAdminEmail = process.env.SUPER_ADMIN_EMAIL;
const superAdminPassword = process.env.SUPER_ADMIN_PASSWORD;
const superAdminJobTitle = process.env.SUPER_ADMIN_JOB_TITLE || 'Super Administrator';
const superAdminPhone = process.env.SUPER_ADMIN_PHONE || '';

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables:');
  console.error('   - NEXT_PUBLIC_SUPABASE_URL');
  console.error('   - SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

if (!superAdminName || !superAdminEmail || !superAdminPassword) {
  console.error('❌ Missing super admin details:');
  console.error('   - SUPER_ADMIN_NAME');
  console.error('   - SUPER_ADMIN_EMAIL');
  console.error('   - SUPER_ADMIN_PASSWORD');
  console.error('');
  console.error('Example usage:');
  console.error('SUPER_ADMIN_NAME="John Doe" SUPER_ADMIN_EMAIL="admin@example.com" SUPER_ADMIN_PASSWORD="securepassword123" node scripts/create-super-admin-env.js');
  process.exit(1);
}

// Create Supabase client with service role key for elevated permissions
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function createSuperAdmin() {
  try {
    console.log('🔐 Creating Super Admin Account');
    console.log('================================');
    console.log(`Name: ${superAdminName}`);
    console.log(`Email: ${superAdminEmail}`);
    console.log(`Job Title: ${superAdminJobTitle}`);
    console.log('');

    // Check if user already exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('id, email, role')
      .eq('email', superAdminEmail)
      .single();

    if (existingUser) {
      console.log('⚠️  User already exists with this email:');
      console.log(`   ID: ${existingUser.id}`);
      console.log(`   Email: ${existingUser.email}`);
      console.log(`   Role: ${existingUser.role}`);
      
      if (existingUser.role === 'super_admin') {
        console.log('✅ User is already a super admin');
        return;
      } else {
        console.log('🔄 Upgrading user to super admin...');
        
        const { error: updateError } = await supabase
          .from('users')
          .update({
            role: 'super_admin',
            admin: true,
            is_verified: true,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingUser.id);

        if (updateError) {
          throw new Error(`Update error: ${updateError.message}`);
        }

        console.log('✅ User upgraded to super admin successfully');
        return;
      }
    }

    console.log('Creating super admin account...');

    // Create auth user
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: superAdminEmail,
      password: superAdminPassword,
      email_confirm: true,
      user_metadata: {
        name: superAdminName,
        role: 'super_admin'
      }
    });

    if (authError) {
      throw new Error(`Auth error: ${authError.message}`);
    }

    console.log('✅ Auth user created successfully');

    // Create user profile
    const { error: profileError } = await supabase
      .from('users')
      .insert({
        id: authData.user.id,
        email: authData.user.email,
        name: superAdminName,
        role: 'super_admin',
        job_title: superAdminJobTitle,
        phone: superAdminPhone,
        is_verified: true,
        admin: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });

    if (profileError) {
      throw new Error(`Profile error: ${profileError.message}`);
    }

    console.log('✅ User profile created successfully');
    console.log('');
    console.log('🎉 Super Admin account created successfully!');
    console.log('');
    console.log('Account Details:');
    console.log(`  Name: ${superAdminName}`);
    console.log(`  Email: ${superAdminEmail}`);
    console.log(`  Role: super_admin`);
    console.log(`  Job Title: ${superAdminJobTitle}`);
    console.log('');
    console.log('You can now log in with these credentials at /login');
    console.log('The super admin panel will be available at /super-admin');

  } catch (error) {
    console.error('❌ Error creating super admin:', error.message);
    process.exit(1);
  }
}

createSuperAdmin();
