'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { useOrganization } from '@/contexts/OrganizationContext';

export default function TestMembershipPage() {
  const { user } = useAuth();
  const { organizations, selectedOrg, loading } = useOrganization();
  const [memberships, setMemberships] = useState<any[]>([]);
  const [dbOrgs, setDbOrgs] = useState<any[]>([]);

  const checkMemberships = useCallback(async () => {
    if (!user) return;

    // Check raw memberships
    const { data: rawMemberships, error: memberError } = await supabase
      .from('organization_members')
      .select('*')
      .eq('user_id', user.id);

    console.log('Raw memberships:', rawMemberships);
    setMemberships(rawMemberships || []);

    // Check organizations
    const { data: orgs, error: orgError } = await supabase
      .from('organizations')
      .select('*');

    console.log('All organizations:', orgs);
    setDbOrgs(orgs || []);
  }, [user]);

  useEffect(() => {
    if (user) {
      checkMemberships();
    }
  }, [user, checkMemberships]);

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Membership Debug</h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">User Info</h2>
            <pre className="text-sm bg-gray-100 p-3 rounded overflow-auto">
              {JSON.stringify({ 
                id: user?.id, 
                email: user?.email, 
                name: user?.name 
              }, null, 2)}
            </pre>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Context State</h2>
            <pre className="text-sm bg-gray-100 p-3 rounded overflow-auto">
              {JSON.stringify({ 
                loading,
                orgCount: organizations.length,
                selectedOrgId: selectedOrg?.id,
                selectedOrgName: selectedOrg?.name
              }, null, 2)}
            </pre>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Raw DB Memberships ({memberships.length})</h2>
            <div className="space-y-2 text-sm max-h-96 overflow-auto">
              {memberships.map(m => (
                <div key={m.id} className="bg-gray-100 p-2 rounded">
                  <div><strong>Org ID:</strong> {m.organization_id}</div>
                  <div><strong>Role:</strong> {m.role}</div>
                  <div><strong>Active:</strong> {m.is_active ? 'Yes' : 'No'}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Context Organizations ({organizations.length})</h2>
            <div className="space-y-2 text-sm max-h-96 overflow-auto">
              {organizations.map(org => (
                <div key={org.id} className="bg-gray-100 p-2 rounded">
                  <div><strong>Name:</strong> {org.name}</div>
                  <div><strong>ID:</strong> {org.id}</div>
                  <div><strong>Role:</strong> {org.role}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow col-span-2">
            <h2 className="text-xl font-semibold mb-4">All DB Organizations ({dbOrgs.length})</h2>
            <div className="space-y-2 text-sm max-h-96 overflow-auto">
              {dbOrgs.map(org => (
                <div key={org.id} className="bg-gray-100 p-2 rounded">
                  <div><strong>Name:</strong> {org.name}</div>
                  <div><strong>ID:</strong> {org.id}</div>
                  <div><strong>Join Code:</strong> {org.join_code}</div>
                  <div><strong>Active:</strong> {org.is_active ? 'Yes' : 'No'}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-6">
          <button
            onClick={checkMemberships}
            className="bg-blue-500 text-white px-6 py-2 rounded hover:bg-blue-600"
          >
            Refresh Data
          </button>
        </div>
      </div>
    </div>
  );
}
