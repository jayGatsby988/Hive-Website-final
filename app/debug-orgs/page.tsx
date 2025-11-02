'use client';

import { useEffect, useState } from 'react';
import { organizationService } from '@/lib/services';
import { supabase } from '@/lib/supabase';

export default function DebugOrgsPage() {
  const [organizations, setOrganizations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [debugInfo, setDebugInfo] = useState<any>({});

  useEffect(() => {
    runDebug();
  }, []);

  const runDebug = async () => {
    try {
      setLoading(true);
      setError('');

      // Test 1: Direct Supabase query
      console.log('🔍 Testing direct Supabase query...');
      const { data: directData, error: directError } = await supabase
        .from('organizations')
        .select('*')
        .limit(5);

      if (directError) {
        console.error('❌ Direct query error:', directError);
        setError(`Direct query failed: ${directError.message}`);
        return;
      }

      console.log('✅ Direct query successful:', directData);
      setDebugInfo(prev => ({ ...prev, directQuery: { success: true, count: directData?.length || 0 } }));

      // Test 2: Organization service
      console.log('🔍 Testing organization service...');
      const serviceData = await organizationService.getAll();
      console.log('✅ Service query successful:', serviceData);
      setOrganizations(serviceData);
      setDebugInfo(prev => ({ ...prev, serviceQuery: { success: true, count: serviceData?.length || 0 } }));

      // Test 3: Check if user is logged in
      const { data: { session } } = await supabase.auth.getSession();
      setDebugInfo(prev => ({ 
        ...prev, 
        auth: { 
          loggedIn: !!session, 
          userId: session?.user?.id,
          email: session?.user?.email 
        } 
      }));

    } catch (err: any) {
      console.error('❌ Debug error:', err);
      setError(err.message || 'Debug failed');
    } finally {
      setLoading(false);
    }
  };

  const testJoinOrganization = async (orgId: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        alert('Please log in first');
        return;
      }

      console.log('🔍 Testing join organization...');
      await organizationService.joinOrganization(orgId, session.user.id);
      console.log('✅ Join successful');
      alert('Successfully joined organization!');
      
      // Refresh data
      await runDebug();
    } catch (err: any) {
      console.error('❌ Join error:', err);
      alert(`Join failed: ${err.message}`);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold mb-4">Debug Organizations</h1>
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
            <p className="mt-4">Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-4">Debug Organizations</h1>
        
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg mb-6">
            <strong>Error:</strong> {error}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Debug Info</h2>
            <pre className="text-sm bg-gray-100 p-3 rounded overflow-auto">
              {JSON.stringify(debugInfo, null, 2)}
            </pre>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Actions</h2>
            <div className="space-y-2">
              <button
                onClick={runDebug}
                className="w-full bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
              >
                Run Debug Again
              </button>
              <a
                href="/organizations"
                className="block w-full bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 text-center"
              >
                Go to Organizations Page
              </a>
              <a
                href="/config-check"
                className="block w-full bg-yellow-500 text-white px-4 py-2 rounded hover:bg-yellow-600 text-center"
              >
                Check Configuration
              </a>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b">
            <h2 className="text-xl font-semibold">Organizations ({organizations.length})</h2>
          </div>
          
          {organizations.length === 0 ? (
            <div className="p-6 text-center text-gray-500">
              <p>No organizations found.</p>
              <p className="mt-2 text-sm">
                Try running the test data script: <code className="bg-gray-100 px-2 py-1 rounded">node scripts/create-test-data.js</code>
              </p>
            </div>
          ) : (
            <div className="divide-y">
              {organizations.map((org, index) => (
                <div key={org.id || index} className="p-6">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold">{org.name}</h3>
                      <p className="text-gray-600 text-sm mt-1">{org.description}</p>
                      <div className="flex gap-4 mt-2 text-sm text-gray-500">
                        <span>ID: {org.id}</span>
                        <span>Category: {org.category}</span>
                        <span>Active: {org.is_active ? 'Yes' : 'No'}</span>
                      </div>
                    </div>
                    <div className="ml-4">
                      <button
                        onClick={() => testJoinOrganization(org.id)}
                        className="bg-blue-500 text-white px-3 py-1 rounded text-sm hover:bg-blue-600"
                      >
                        Test Join
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
