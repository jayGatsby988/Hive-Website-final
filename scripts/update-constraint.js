#!/usr/bin/env node

/**
 * Script to update the database constraint to allow super_admin role
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function updateConstraint() {
  try {
    console.log('🔧 Updating database constraint...');

    // First, let's try to drop the existing constraint
    const { error: dropError } = await supabase
      .from('users')
      .select('*')
      .limit(1);

    if (dropError) {
      console.error('❌ Error accessing users table:', dropError.message);
      return;
    }

    // Try to update the constraint by running SQL
    const { error: sqlError } = await supabase.rpc('exec', {
      sql: `
        DO $$ 
        BEGIN
          -- Drop the existing constraint if it exists
          IF EXISTS (
            SELECT 1 FROM information_schema.table_constraints 
            WHERE constraint_name = 'users_role_check' 
            AND table_name = 'users'
          ) THEN
            ALTER TABLE users DROP CONSTRAINT users_role_check;
          END IF;
          
          -- Add the new constraint
          ALTER TABLE users ADD CONSTRAINT users_role_check 
          CHECK (role IN ('super_admin', 'admin', 'volunteer', 'user'));
        END $$;
      `
    });

    if (sqlError) {
      console.error('❌ Error updating constraint:', sqlError.message);
      console.log('📋 You may need to run this SQL manually in your Supabase SQL Editor:');
      console.log('');
      console.log('ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;');
      console.log("ALTER TABLE users ADD CONSTRAINT users_role_check CHECK (role IN ('super_admin', 'admin', 'volunteer', 'user'));");
      console.log('');
      return;
    }

    console.log('✅ Constraint updated successfully!');
    console.log('🎉 You can now create super admin accounts.');

  } catch (error) {
    console.error('❌ Error updating constraint:', error.message);
    console.log('');
    console.log('📋 Manual fix required:');
    console.log('1. Go to your Supabase dashboard');
    console.log('2. Navigate to SQL Editor');
    console.log('3. Run this SQL:');
    console.log('');
    console.log('ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;');
    console.log("ALTER TABLE users ADD CONSTRAINT users_role_check CHECK (role IN ('super_admin', 'admin', 'volunteer', 'user'));");
  }
}

updateConstraint();
