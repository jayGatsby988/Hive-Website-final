'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, Key, CheckCircle, XCircle, Users, Calendar, Building2, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import HiveButton from '@/components/common/HiveButton';
import HiveInput from '@/components/common/HiveInput';
import { ProtectedRoute } from '@/components/common/ProtectedRoute';
import { organizationService, userService } from '@/lib/services';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { useOrganization } from '@/contexts/OrganizationContext';
import { useRouter } from 'next/navigation';
import { Organization } from '@/lib/types';

export default function OrganizationsPage() {
  const { user } = useAuth();
  const { refreshOrganizations } = useOrganization();
  const router = useRouter();
  const [joinCode, setJoinCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [joinedOrg, setJoinedOrg] = useState<any>(null);
  const [showJoinForm, setShowJoinForm] = useState(false);
  const [myOrganizations, setMyOrganizations] = useState<Organization[]>([]);
  const [loadingOrgs, setLoadingOrgs] = useState(true);

  useEffect(() => {
    loadMyOrganizations();
  }, [user]);

  const loadMyOrganizations = async () => {
    if (!user) {
      setLoadingOrgs(false);
      return;
    }

    try {
      setLoadingOrgs(true);
      const orgs = await userService.getUserOrganizations(user.id);
      setMyOrganizations(orgs);
    } catch (error) {
      console.error('Error loading organizations:', error);
    } finally {
      setLoadingOrgs(false);
    }
  };

  const handleJoinWithCode = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      setError('You must be logged in to join an organization');
      return;
    }

    if (!joinCode.trim()) {
      setError('Please enter a join code');
      return;
    }

    try {
      setLoading(true);
      setError('');
      setSuccess(false);

      // Find organization by join code
      const { data: org, error: orgError } = await supabase
        .from('organizations')
        .select('*')
        .eq('join_code', joinCode.trim().toUpperCase())
        .eq('is_active', true)
        .single();

      if (orgError || !org) {
        setError('Invalid join code. Please check and try again.');
        setLoading(false);
        return;
      }

      // Check if already a member
      const { data: existingMember } = await supabase
        .from('organization_members')
        .select('id')
        .eq('organization_id', org.id)
        .eq('user_id', user.id)
        .eq('is_active', true)
        .single();

      if (existingMember) {
        setError('You are already a member of this organization');
        setLoading(false);
        return;
      }

      // Join the organization
      await organizationService.joinOrganization(org.id, user.id, 'member');

      // Refresh organization context to update dropdown
      await refreshOrganizations();
      
      // Reload local organizations list
      await loadMyOrganizations();

      setSuccess(true);
      setJoinedOrg(org);
      setJoinCode('');
      setShowJoinForm(false);

      // Small delay to show success message
      setTimeout(() => {
        setSuccess(false);
        setJoinedOrg(null);
      }, 3000);

    } catch (err: any) {
      console.error('Error joining organization:', err);
      setError(err.message || 'Failed to join organization. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (loadingOrgs) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-gradient-to-br from-hiveYellow/5 via-hiveWhite to-hiveYellow/10 pt-20">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="flex items-center justify-center min-h-96">
              <div className="text-center">
                <div className="w-16 h-16 border-4 border-hiveYellow border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-hiveGray">Loading your organizations...</p>
              </div>
            </div>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gradient-to-br from-hiveYellow/5 via-hiveWhite to-hiveYellow/10 pt-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {/* Header */}
          <motion.div
            className="flex items-center justify-between mb-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div>
              <h1 className="text-4xl font-bold text-hiveGray-dark mb-2">
                Your Organizations
              </h1>
              <p className="text-lg text-hiveGray">
                {myOrganizations.length > 0 
                  ? `You're a member of ${myOrganizations.length} organization${myOrganizations.length > 1 ? 's' : ''}`
                  : 'Join an organization to get started'}
              </p>
            </div>
            <HiveButton
              onClick={() => setShowJoinForm(!showJoinForm)}
              className="flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              Join Organization
            </HiveButton>
          </motion.div>

          {/* Success Message */}
          {success && joinedOrg && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-green-50 border-2 border-green-300 text-green-700 px-6 py-4 rounded-xl mb-8 flex items-center gap-3"
            >
              <CheckCircle className="w-6 h-6 flex-shrink-0" />
              <div>
                <p className="font-semibold">Successfully joined {joinedOrg.name}!</p>
                <p className="text-sm">The organization now appears in your sidebar and dashboard.</p>
              </div>
            </motion.div>
          )}

          {/* Join Code Form */}
          {showJoinForm && (
            <motion.div
              className="bg-hiveWhite rounded-2xl shadow-hive-lift p-8 mb-8"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-hiveYellow/20 rounded-full flex items-center justify-center">
                  <Key className="w-6 h-6 text-hiveYellow" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-hiveGray-dark">Join with Code</h2>
                  <p className="text-hiveGray">Enter your organization's join code</p>
                </div>
              </div>

              <form onSubmit={handleJoinWithCode} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-hiveGray-dark mb-2">
                    Organization Join Code
                  </label>
                  <div className="relative">
                    <Key className="absolute left-3 top-1/2 -translate-y-1/2 text-hiveGray w-5 h-5 pointer-events-none" />
                    <HiveInput
                      type="text"
                      placeholder="Enter code (e.g., ABC123)"
                      value={joinCode}
                      onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                      className="pl-12 text-center text-2xl font-mono tracking-widest uppercase"
                      maxLength={10}
                      required
                    />
                  </div>
                  <p className="text-sm text-hiveGray mt-2">
                    Ask your organization admin for the join code
                  </p>
                </div>

                {/* Error Message */}
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg flex items-center gap-2"
                  >
                    <XCircle className="w-5 h-5 flex-shrink-0" />
                    <span>{error}</span>
                  </motion.div>
                )}

                <div className="flex gap-3">
                  <HiveButton
                    type="button"
                    variant="outline"
                    className="flex-1"
                    onClick={() => setShowJoinForm(false)}
                  >
                    Cancel
                  </HiveButton>
                  <HiveButton
                    type="submit"
                    className="flex-1"
                    disabled={loading}
                  >
                    {loading ? 'Joining...' : 'Join Organization'}
                  </HiveButton>
                </div>
              </form>
            </motion.div>
          )}

          {/* My Organizations List */}
          {myOrganizations.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {myOrganizations.map((org, index) => (
                <motion.div
                  key={org.id}
                  className="bg-hiveWhite rounded-xl shadow-hive-card overflow-hidden hover:shadow-hive-lift transition-all duration-300 cursor-pointer"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  whileHover={{ y: -4 }}
                  onClick={() => router.push(`/organizations/${org.id}`)}
                >
                  <div className="h-32 bg-gradient-to-br from-hiveYellow/20 to-hiveYellow/5 flex items-center justify-center relative overflow-hidden">
                    {org.logo_url ? (
                      <img src={org.logo_url} alt={org.name} className="w-20 h-20 object-contain" />
                    ) : (
                      <div className="w-20 h-20 bg-hiveYellow rounded-full flex items-center justify-center">
                        <span className="text-3xl font-bold text-hiveGray-dark">
                          {org.name.charAt(0)}
                        </span>
                      </div>
                    )}
                    <div className="absolute top-3 right-3">
                      <span className="px-3 py-1 bg-hiveWhite rounded-full text-xs font-semibold text-hiveYellow-dark">
                        {(org as any).userRole === 'admin' ? 'Admin' : 'Member'}
                      </span>
                    </div>
                  </div>

                  <div className="p-6">
                    <h3 className="text-xl font-bold text-hiveGray-dark mb-2">{org.name}</h3>
                    <p className="text-sm text-hiveGray mb-4 line-clamp-2">
                      {org.description || 'No description available'}
                    </p>

                    <div className="space-y-2 mb-4">
                      {org.address && (
                        <div className="flex items-center gap-2 text-hiveGray text-sm">
                          <Building2 className="w-4 h-4" />
                          <span className="truncate">{org.address}</span>
                        </div>
                      )}
                    </div>

                    <HiveButton
                      variant="secondary"
                      size="sm"
                      className="w-full flex items-center justify-center gap-2"
                      onClick={(e) => {
                        e.stopPropagation();
                        router.push(`/organizations/${org.id}`);
                      }}
                    >
                      View Organization
                      <ArrowRight className="w-4 h-4" />
                    </HiveButton>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            /* Empty State */
            <motion.div
              className="bg-hiveWhite rounded-2xl shadow-hive-lift p-12 text-center"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <div className="w-20 h-20 bg-hiveYellow/20 rounded-full flex items-center justify-center mx-auto mb-6">
                <Building2 className="w-10 h-10 text-hiveYellow" />
              </div>
              <h2 className="text-2xl font-bold text-hiveGray-dark mb-3">
                No Organizations Yet
              </h2>
              <p className="text-hiveGray mb-6 max-w-md mx-auto">
                Join an organization with a code or create your own to get started with volunteer events
              </p>
              <div className="flex gap-4 justify-center">
                <HiveButton onClick={() => setShowJoinForm(true)} className="flex items-center gap-2">
                  <Key className="w-5 h-5" />
                  Join with Code
                </HiveButton>
                <Link href="/organizations/create">
                  <HiveButton variant="outline" className="flex items-center gap-2">
                    <Plus className="w-5 h-5" />
                    Create Organization
                  </HiveButton>
                </Link>
              </div>
            </motion.div>
          )}

          {/* Information Cards */}
          {myOrganizations.length === 0 && !showJoinForm && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
              <motion.div
                className="bg-hiveWhite rounded-xl shadow-hive-card p-6"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Users className="w-5 h-5 text-blue-600" />
                  </div>
                  <h3 className="font-semibold text-hiveGray-dark">After Joining</h3>
                </div>
                <ul className="space-y-2 text-sm text-hiveGray">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>Access organization events</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>View events on your dashboard</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>See events in your calendar</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>Connect with other members</span>
                  </li>
                </ul>
              </motion.div>

              <motion.div
                className="bg-hiveWhite rounded-xl shadow-hive-card p-6"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.5 }}
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                    <Plus className="w-5 h-5 text-purple-600" />
                  </div>
                  <h3 className="font-semibold text-hiveGray-dark">Create Organization</h3>
                </div>
                <p className="text-sm text-hiveGray mb-4">
                  Want to start your own organization? Create one and get your unique join code to share with members.
                </p>
                <Link href="/organizations/create">
                  <HiveButton variant="outline" size="sm" className="w-full">
                    Create New Organization
                  </HiveButton>
                </Link>
              </motion.div>
            </div>
          )}

          {/* Help Section */}
          {myOrganizations.length === 0 && !showJoinForm && (
            <motion.div
              className="bg-blue-50 border border-blue-200 rounded-xl p-6 mt-8"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.6 }}
            >
              <h3 className="font-semibold text-blue-900 mb-3">Need Help?</h3>
              <ul className="space-y-2 text-sm text-blue-800">
                <li>• Ask your organization admin for the join code</li>
                <li>• Join codes are usually 6 characters (letters and numbers)</li>
                <li>• Make sure you're logged in before entering the code</li>
                <li>• Contact your organization if the code doesn't work</li>
              </ul>
            </motion.div>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}