const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables');
  console.error('Please ensure .env.local contains:');
  console.error('NEXT_PUBLIC_SUPABASE_URL=your_supabase_url');
  console.error('SUPABASE_SERVICE_ROLE_KEY=your_service_role_key');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function createTestData() {
  try {
    console.log('🔧 Creating test data...');

    // Create test organizations with join codes
    const testOrganizations = [
      {
        name: 'Green Earth Volunteers',
        description: 'Dedicated to environmental conservation and sustainability initiatives in our community.',
        address: '123 Green Street, Eco City, EC 12345',
        email: 'contact@greenearth.org',
        website: 'https://greenearth.org',
        phone: '+1-555-0123',
        is_active: true,
        created_by: null,
        join_code: 'GREEN1' // Test join code
      },
      {
        name: 'Community Food Bank',
        description: 'Providing food assistance and support to families in need throughout the city.',
        address: '456 Help Avenue, Care City, CC 67890',
        email: 'info@foodbank.org',
        website: 'https://foodbank.org',
        phone: '+1-555-0456',
        is_active: true,
        created_by: null,
        join_code: 'FOOD99' // Test join code
      },
      {
        name: 'Youth Education Center',
        description: 'Supporting educational programs and mentorship for young people in underserved communities.',
        address: '789 Learning Lane, Education City, EC 11111',
        email: 'hello@youtheducation.org',
        website: 'https://youtheducation.org',
        phone: '+1-555-0789',
        is_active: true,
        created_by: null,
        join_code: 'YOUTH7' // Test join code
      }
    ];

    console.log('Creating test organizations...');
    const { data: orgs, error: orgError } = await supabase
      .from('organizations')
      .insert(testOrganizations)
      .select();

    if (orgError) {
      console.error('❌ Error creating organizations:', orgError);
      return;
    }

    console.log(`✅ Created ${orgs.length} test organizations`);

    // Create test events for each organization
    for (const org of orgs) {
      const testEvents = [
        {
          title: `${org.name} Monthly Meeting`,
          description: `Join us for our monthly meeting to discuss upcoming projects and volunteer opportunities.`,
          date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 7 days from now
          time: '18:00',
          end_time: '20:00',
          location: org.address,
          max_attendees: 50,
          capacity: 50,
          status: 'published',
          event_type: 'meeting',
          is_private: false,
          requires_approval: false,
          is_active: true,
          start_type: 'manual',
          auto_start_enabled: false,
          tags: ['meeting', 'monthly'],
          signup_count: 0,
          organization_id: org.id,
          created_by: org.created_by || '00000000-0000-0000-0000-000000000000' // Dummy UUID for events
        },
        {
          title: `${org.name} Volunteer Day`,
          description: `A day of community service and volunteer activities. All skill levels welcome!`,
          date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 14 days from now
          time: '09:00',
          end_time: '17:00',
          location: org.address,
          max_attendees: 100,
          capacity: 100,
          status: 'published',
          event_type: 'volunteer',
          is_private: false,
          requires_approval: false,
          is_active: true,
          start_type: 'manual',
          auto_start_enabled: false,
          tags: ['volunteer', 'community'],
          signup_count: 0,
          organization_id: org.id,
          created_by: org.created_by || '00000000-0000-0000-0000-000000000000' // Dummy UUID for events
        }
      ];

      const { error: eventError } = await supabase
        .from('events')
        .insert(testEvents);

      if (eventError) {
        console.error(`❌ Error creating events for ${org.name}:`, eventError);
      } else {
        console.log(`✅ Created test events for ${org.name}`);
      }
    }

    console.log('');
    console.log('🎉 Test data created successfully!');
    console.log('');
    console.log('📋 JOIN CODES FOR TEST ORGANIZATIONS:');
    console.log('=====================================');
    if (orgs && orgs.length > 0) {
      orgs.forEach(org => {
        console.log(`${org.name}: ${org.join_code}`);
      });
    }
    console.log('');
    console.log('🚀 Next Steps:');
    console.log('1. Create a user account at /signup');
    console.log('2. Visit /organizations');
    console.log('3. Enter one of the join codes above');
    console.log('4. View your organization events on dashboard and calendar!');

  } catch (error) {
    console.error('❌ Error creating test data:', error);
  }
}

createTestData();
