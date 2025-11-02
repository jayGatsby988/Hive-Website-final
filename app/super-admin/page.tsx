'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Users,
  Shield,
  Settings,
  UserPlus,
  UserMinus,
  Crown,
  Database,
  Activity,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Eye,
  Edit,
  Trash2,
  Building2,
  Plus,
} from 'lucide-react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import HiveCard from '@/components/common/HiveCard';
import HiveButton from '@/components/common/HiveButton';
import HiveModal from '@/components/common/HiveModal';
import HiveInput from '@/components/common/HiveInput';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { User } from '@/lib/types';

interface AdminUser extends User {
  last_login?: string;
  is_active: boolean;
  organizations_count: number;
}

export default function SuperAdminPage() {
  const { user } = useAuth();
  const [adminUsers, setAdminUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isCreateOrgModalOpen, setIsCreateOrgModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [stats, setStats] = useState({
    totalAdmins: 0,
    activeAdmins: 0,
    totalUsers: 0,
    totalOrganizations: 0,
  });

  // Form states
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'admin' as 'admin' | 'super_admin',
    job_title: '',
    phone: '',
  });

  const [orgFormData, setOrgFormData] = useState({
    name: '',
    description: '',
    address: '',
    email: '',
    website: '',
    phone: '',
    logo_url: '',
    category: '',
  });

  useEffect(() => {
    if (user?.role === 'super_admin') {
      loadSuperAdminData();
    }
  }, [user]);

  const loadSuperAdminData = async () => {
    try {
      setLoading(true);
      
      // Load admin users
      const { data: admins, error: adminsError } = await supabase
        .from('users')
        .select('*')
        .in('role', ['admin', 'super_admin'])
        .order('created_at', { ascending: false });

      if (adminsError) throw adminsError;

      // Load stats
      const { data: totalUsers } = await supabase
        .from('users')
        .select('count', { count: 'exact' });

      const { data: totalOrgs } = await supabase
        .from('organizations')
        .select('count', { count: 'exact' });

      setAdminUsers(admins || []);
      setStats({
        totalAdmins: admins?.length || 0,
        activeAdmins: admins?.filter(a => a.is_verified)?.length || 0,
        totalUsers: totalUsers?.[0]?.count || 0,
        totalOrganizations: totalOrgs?.[0]?.count || 0,
      });
    } catch (error) {
      console.error('Error loading super admin data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAdmin = async () => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            name: formData.name,
            role: formData.role,
          },
        },
      });

      if (error) throw error;

      if (data.user) {
        // Check if user profile already exists
        const { data: existingUser } = await supabase
          .from('users')
          .select('id')
          .eq('id', data.user.id)
          .single();

        if (!existingUser) {
          const { error: profileError } = await supabase
            .from('users')
            .insert({
              id: data.user.id,
              email: formData.email,
              name: formData.name,
              role: formData.role,
              job_title: formData.job_title,
              phone: formData.phone,
              is_verified: true,
              admin: true,
            });

          if (profileError) {
            // If it's a duplicate key error, the user might already exist
            if (profileError.code === '23505') {
              console.log('User profile already exists, continuing...');
            } else {
              throw profileError;
            }
          }
        }

        await loadSuperAdminData();
        setIsCreateModalOpen(false);
        setFormData({
          name: '',
          email: '',
          password: '',
          role: 'admin',
          job_title: '',
          phone: '',
        });
      }
    } catch (error) {
      console.error('Error creating admin:', error);
    }
  };

  const handleUpdateAdmin = async () => {
    if (!selectedUser) return;

    try {
      const { error } = await supabase
        .from('users')
        .update({
          name: formData.name,
          role: formData.role,
          job_title: formData.job_title,
          phone: formData.phone,
        })
        .eq('id', selectedUser.id);

      if (error) throw error;

      await loadSuperAdminData();
      setIsEditModalOpen(false);
      setSelectedUser(null);
    } catch (error) {
      console.error('Error updating admin:', error);
    }
  };

  const handleDeleteAdmin = async (userId: string) => {
    if (!confirm('Are you sure you want to delete this admin? This action cannot be undone.')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('users')
        .delete()
        .eq('id', userId);

      if (error) throw error;

      await loadSuperAdminData();
    } catch (error) {
      console.error('Error deleting admin:', error);
    }
  };

  const handleToggleAdminStatus = async (userId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('users')
        .update({ is_verified: !currentStatus })
        .eq('id', userId);

      if (error) throw error;

      await loadSuperAdminData();
    } catch (error) {
      console.error('Error toggling admin status:', error);
    }
  };

  const handleCreateOrganization = async () => {
    try {
      if (!user) return;

      const { data: organization, error: orgError } = await supabase
        .from('organizations')
        .insert({
          name: orgFormData.name,
          description: orgFormData.description,
          address: orgFormData.address,
          email: orgFormData.email,
          website: orgFormData.website,
          phone: orgFormData.phone,
          logo_url: orgFormData.logo_url || null,
          created_by: user.id,
          is_active: true,
        })
        .select()
        .single();

      if (orgError) throw orgError;

      // Join the organization as admin
      const { error: joinError } = await supabase
        .from('organization_members')
        .insert({
          organization_id: organization.id,
          user_id: user.id,
          role: 'admin',
          joined_at: new Date().toISOString(),
          is_active: true,
        });

      if (joinError) throw joinError;

      await loadSuperAdminData();
      setIsCreateOrgModalOpen(false);
      setOrgFormData({
        name: '',
        description: '',
        address: '',
        email: '',
        website: '',
        phone: '',
        logo_url: '',
        category: '',
      });
    } catch (error) {
      console.error('Error creating organization:', error);
    }
  };

  const openEditModal = (admin: AdminUser) => {
    setSelectedUser(admin);
    setFormData({
      name: admin.name,
      email: admin.email,
      password: '',
      role: admin.role as 'admin' | 'super_admin',
      job_title: admin.job_title || '',
      phone: admin.phone || '',
    });
    setIsEditModalOpen(true);
  };

  const filteredAdmins = adminUsers.filter(admin =>
    admin.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    admin.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (user?.role !== 'super_admin') {
    return (
      <DashboardLayout userRole="admin">
        <div className="flex items-center justify-center min-h-96">
          <div className="text-center">
            <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-hiveGray-dark mb-2">Access Denied</h2>
            <p className="text-hiveGray">You don't have permission to access this page.</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (loading) {
    return (
      <DashboardLayout userRole="admin">
        <div className="flex items-center justify-center min-h-96">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-hiveYellow border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-hiveGray">Loading super admin panel...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout userRole="admin">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="mb-8"
      >
        <div className="flex items-center gap-3 mb-4">
          <Crown className="w-8 h-8 text-hiveYellow" />
          <h1 className="text-4xl font-bold text-hiveGray-dark">
            Super Admin Panel
          </h1>
        </div>
        <p className="text-hiveGray text-lg">
          Manage administrators and system-wide settings
        </p>
      </motion.div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <HiveCard>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-hiveGray text-sm mb-1">Total Admins</p>
              <p className="text-3xl font-bold text-hiveGray-dark">{stats.totalAdmins}</p>
            </div>
            <Shield className="w-8 h-8 text-hiveYellow" />
          </div>
        </HiveCard>

        <HiveCard>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-hiveGray text-sm mb-1">Active Admins</p>
              <p className="text-3xl font-bold text-hiveGray-dark">{stats.activeAdmins}</p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-500" />
          </div>
        </HiveCard>

        <HiveCard>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-hiveGray text-sm mb-1">Total Users</p>
              <p className="text-3xl font-bold text-hiveGray-dark">{stats.totalUsers}</p>
            </div>
            <Users className="w-8 h-8 text-blue-500" />
          </div>
        </HiveCard>

        <HiveCard>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-hiveGray text-sm mb-1">Organizations</p>
              <p className="text-3xl font-bold text-hiveGray-dark">{stats.totalOrganizations}</p>
            </div>
            <Database className="w-8 h-8 text-purple-500" />
          </div>
        </HiveCard>
      </div>

      {/* Admin Management */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="lg:col-span-2">
          <HiveCard>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-hiveGray-dark">Admin Users</h2>
              <div className="flex gap-2">
                <HiveButton 
                  variant="outline" 
                  onClick={() => setIsCreateOrgModalOpen(true)}
                >
                  <Building2 className="w-4 h-4 mr-2" />
                  Create Organization
                </HiveButton>
                <HiveButton onClick={() => setIsCreateModalOpen(true)}>
                  <UserPlus className="w-4 h-4 mr-2" />
                  Create Admin
                </HiveButton>
              </div>
            </div>

            <div className="mb-4">
              <HiveInput
                type="text"
                placeholder="Search admins..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <div className="space-y-3 max-h-96 overflow-y-auto">
              {filteredAdmins.map((admin, index) => (
                <motion.div
                  key={admin.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="flex items-center justify-between p-4 rounded-lg border border-hiveGray-light hover:border-hiveYellow hover:bg-hiveYellow/5 transition-all"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-hiveYellow rounded-lg flex items-center justify-center">
                      <span className="text-sm font-bold text-hiveGray-dark">
                        {admin.name.charAt(0)}
                      </span>
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-hiveGray-dark">{admin.name}</p>
                        {admin.role === 'super_admin' && (
                          <Crown className="w-4 h-4 text-hiveYellow" />
                        )}
                        {admin.is_verified ? (
                          <CheckCircle className="w-4 h-4 text-green-500" />
                        ) : (
                          <XCircle className="w-4 h-4 text-red-500" />
                        )}
                      </div>
                      <p className="text-sm text-hiveGray">{admin.email}</p>
                      <p className="text-xs text-hiveGray capitalize">{admin.role.replace('_', ' ')}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <HiveButton
                      variant="outline"
                      size="sm"
                      onClick={() => openEditModal(admin)}
                    >
                      <Edit className="w-4 h-4" />
                    </HiveButton>
                    <HiveButton
                      variant="outline"
                      size="sm"
                      onClick={() => handleToggleAdminStatus(admin.id, admin.is_verified)}
                    >
                      {admin.is_verified ? (
                        <UserMinus className="w-4 h-4" />
                      ) : (
                        <UserPlus className="w-4 h-4" />
                      )}
                    </HiveButton>
                    {admin.role !== 'super_admin' && (
                      <HiveButton
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteAdmin(admin.id)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </HiveButton>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          </HiveCard>
        </div>

        <div>
          <HiveCard>
            <h3 className="text-xl font-bold text-hiveGray-dark mb-4">Quick Actions</h3>
            <div className="space-y-3">
              <HiveButton
                className="w-full justify-start"
                variant="outline"
                onClick={() => console.log('System settings')}
              >
                <Settings className="w-4 h-4 mr-2" />
                System Settings
              </HiveButton>
              <HiveButton
                className="w-full justify-start"
                variant="outline"
                onClick={() => console.log('Database management')}
              >
                <Database className="w-4 h-4 mr-2" />
                Database Management
              </HiveButton>
              <HiveButton
                className="w-full justify-start"
                variant="outline"
                onClick={() => console.log('System logs')}
              >
                <Activity className="w-4 h-4 mr-2" />
                System Logs
              </HiveButton>
            </div>
          </HiveCard>
        </div>
      </div>

      {/* Create Admin Modal */}
      <HiveModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Create New Admin"
        size="md"
      >
        <div className="space-y-4">
          <HiveInput
            label="Full Name"
            placeholder="Enter full name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          />
          <HiveInput
            label="Email"
            type="email"
            placeholder="Enter email address"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          />
          <HiveInput
            label="Password"
            type="password"
            placeholder="Enter password"
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
          />
          <div>
            <label className="block text-sm font-medium text-hiveGray-dark mb-2">
              Role
            </label>
            <select
              className="w-full px-4 py-3 rounded-lg border-2 border-hiveGray-light focus:border-hiveYellow focus:ring-2 focus:ring-hiveYellow focus:ring-opacity-30 focus:outline-none transition-all"
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value as 'admin' | 'super_admin' })}
            >
              <option value="admin">Admin</option>
              <option value="super_admin">Super Admin</option>
            </select>
          </div>
          <HiveInput
            label="Job Title"
            placeholder="Enter job title"
            value={formData.job_title}
            onChange={(e) => setFormData({ ...formData, job_title: e.target.value })}
          />
          <HiveInput
            label="Phone"
            placeholder="Enter phone number"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
          />
          <div className="flex gap-2 pt-4">
            <HiveButton
              className="flex-1"
              onClick={handleCreateAdmin}
            >
              Create Admin
            </HiveButton>
            <HiveButton
              variant="outline"
              onClick={() => setIsCreateModalOpen(false)}
            >
              Cancel
            </HiveButton>
          </div>
        </div>
      </HiveModal>

      {/* Edit Admin Modal */}
      <HiveModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Edit Admin"
        size="md"
      >
        <div className="space-y-4">
          <HiveInput
            label="Full Name"
            placeholder="Enter full name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          />
          <HiveInput
            label="Email"
            type="email"
            placeholder="Enter email address"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            disabled
          />
          <div>
            <label className="block text-sm font-medium text-hiveGray-dark mb-2">
              Role
            </label>
            <select
              className="w-full px-4 py-3 rounded-lg border-2 border-hiveGray-light focus:border-hiveYellow focus:ring-2 focus:ring-hiveYellow focus:ring-opacity-30 focus:outline-none transition-all"
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value as 'admin' | 'super_admin' })}
            >
              <option value="admin">Admin</option>
              <option value="super_admin">Super Admin</option>
            </select>
          </div>
          <HiveInput
            label="Job Title"
            placeholder="Enter job title"
            value={formData.job_title}
            onChange={(e) => setFormData({ ...formData, job_title: e.target.value })}
          />
          <HiveInput
            label="Phone"
            placeholder="Enter phone number"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
          />
          <div className="flex gap-2 pt-4">
            <HiveButton
              className="flex-1"
              onClick={handleUpdateAdmin}
            >
              Update Admin
            </HiveButton>
            <HiveButton
              variant="outline"
              onClick={() => setIsEditModalOpen(false)}
            >
              Cancel
            </HiveButton>
          </div>
        </div>
      </HiveModal>

      {/* Create Organization Modal */}
      <HiveModal
        isOpen={isCreateOrgModalOpen}
        onClose={() => setIsCreateOrgModalOpen(false)}
        title="Create Organization"
        size="lg"
      >
        <div className="space-y-4">
          <HiveInput
            label="Organization Name"
            placeholder="Enter organization name"
            value={orgFormData.name}
            onChange={(e) => setOrgFormData({ ...orgFormData, name: e.target.value })}
          />
          <div>
            <label className="block text-sm font-medium text-hiveGray-dark mb-2">
              Description
            </label>
            <textarea
              className="w-full px-4 py-3 border border-hiveGray-light rounded-lg focus:ring-2 focus:ring-hiveYellow focus:border-transparent resize-none"
              placeholder="Describe the organization's mission and goals"
              rows={3}
              value={orgFormData.description}
              onChange={(e) => setOrgFormData({ ...orgFormData, description: e.target.value })}
            />
          </div>
          <HiveInput
            label="Address"
            placeholder="Enter organization address"
            value={orgFormData.address}
            onChange={(e) => setOrgFormData({ ...orgFormData, address: e.target.value })}
          />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <HiveInput
              label="Email"
              type="email"
              placeholder="contact@organization.com"
              value={orgFormData.email}
              onChange={(e) => setOrgFormData({ ...orgFormData, email: e.target.value })}
            />
            <HiveInput
              label="Phone"
              type="tel"
              placeholder="(555) 123-4567"
              value={orgFormData.phone}
              onChange={(e) => setOrgFormData({ ...orgFormData, phone: e.target.value })}
            />
          </div>
          <HiveInput
            label="Website"
            type="url"
            placeholder="https://www.organization.com"
            value={orgFormData.website}
            onChange={(e) => setOrgFormData({ ...orgFormData, website: e.target.value })}
          />
          <HiveInput
            label="Logo URL"
            type="url"
            placeholder="https://example.com/logo.png"
            value={orgFormData.logo_url}
            onChange={(e) => setOrgFormData({ ...orgFormData, logo_url: e.target.value })}
          />
          <div>
            <label className="block text-sm font-medium text-hiveGray-dark mb-2">
              Category
            </label>
            <select
              className="w-full px-4 py-3 border border-hiveGray-light rounded-lg focus:ring-2 focus:ring-hiveYellow focus:border-transparent"
              value={orgFormData.category}
              onChange={(e) => setOrgFormData({ ...orgFormData, category: e.target.value })}
            >
              <option value="">Select a category</option>
              <option value="environment">Environment</option>
              <option value="education">Education</option>
              <option value="health">Health</option>
              <option value="community">Community</option>
              <option value="animals">Animals</option>
              <option value="social">Social</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div className="flex gap-2 pt-4">
            <HiveButton
              className="flex-1"
              onClick={handleCreateOrganization}
            >
              Create Organization
            </HiveButton>
            <HiveButton
              variant="outline"
              onClick={() => setIsCreateOrgModalOpen(false)}
            >
              Cancel
            </HiveButton>
          </div>
        </div>
      </HiveModal>
    </DashboardLayout>
  );
}
