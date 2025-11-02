#!/usr/bin/env node

/**
 * Script to fix the database schema to allow super_admin role
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

async function fixDatabaseSchema() {
  try {
    console.log('🔧 Fixing database schema...');

    // Drop the existing check constraint
    const { error: dropError } = await supabase.rpc('exec_sql', {
      sql: 'ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;'
    });

    if (dropError) {
      console.log('ℹ️  Constraint may not exist yet:', dropError.message);
    } else {
      console.log('✅ Dropped existing constraint');
    }

    // Add the new check constraint
    const { error: addError } = await supabase.rpc('exec_sql', {
      sql: "ALTER TABLE users ADD CONSTRAINT users_role_check CHECK (role IN ('super_admin', 'admin', 'volunteer', 'user'));"
    });

    if (addError) {
      console.error('❌ Error adding constraint:', addError.message);
      process.exit(1);
    }

    console.log('✅ Added new constraint with super_admin role');
    console.log('🎉 Database schema updated successfully!');
    console.log('');
    console.log('You can now run the super admin creation script again.');

  } catch (error) {
    console.error('❌ Error fixing database schema:', error.message);
    process.exit(1);
  }
}

fixDatabaseSchema();
