#!/usr/bin/env node

/**
 * Script to create a super admin account
 * This script should be run manually and securely
 * 
 * Usage: node scripts/create-super-admin.js
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // You'll need to add this to your .env.local

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables:');
  console.error('   - NEXT_PUBLIC_SUPABASE_URL');
  console.error('   - SUPABASE_SERVICE_ROLE_KEY');
  console.error('');
  console.error('Please add SUPABASE_SERVICE_ROLE_KEY to your .env.local file');
  console.error('You can find this key in your Supabase project settings under API > service_role key');
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
  const readline = require('readline');
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  const question = (query) => new Promise((resolve) => rl.question(query, resolve));

  try {
    console.log('🔐 Creating Super Admin Account');
    console.log('================================');
    console.log('');

    const name = await question('Enter super admin name: ');
    const email = await question('Enter super admin email: ');
    const password = await question('Enter super admin password: ');
    const jobTitle = await question('Enter job title (optional): ') || 'Super Administrator';
    const phone = await question('Enter phone number (optional): ') || '';

    console.log('');
    console.log('Creating super admin account...');

    // Create auth user
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        name,
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
        name,
        role: 'super_admin',
        job_title: jobTitle,
        phone,
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
    console.log(`  Name: ${name}`);
    console.log(`  Email: ${email}`);
    console.log(`  Role: super_admin`);
    console.log(`  Job Title: ${jobTitle}`);
    console.log('');
    console.log('You can now log in with these credentials at /login');
    console.log('The super admin panel will be available at /super-admin');

  } catch (error) {
    console.error('❌ Error creating super admin:', error.message);
    process.exit(1);
  } finally {
    rl.close();
  }
}

// Security check
console.log('⚠️  WARNING: This script creates a super admin account with full system access.');
console.log('   Only run this script in a secure environment.');
console.log('   Make sure to delete this script after use for security.');
console.log('');

const readline = require('readline');
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

rl.question('Do you want to continue? (yes/no): ', (answer) => {
  if (answer.toLowerCase() === 'yes' || answer.toLowerCase() === 'y') {
    createSuperAdmin();
  } else {
    console.log('Operation cancelled.');
    rl.close();
  }
});
