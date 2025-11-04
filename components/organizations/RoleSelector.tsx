'use client';

import { useState, useEffect } from 'react';
import { roleService } from '@/lib/services';
import { useAuth } from '@/contexts/AuthContext';
import HiveCard from '@/components/common/HiveCard';
import HiveButton from '@/components/common/HiveButton';
import { UserCircle, Plus, X, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Role {
  id: string;
  organization_id: string;
  role_name: string;
  is_public: boolean;
  options: string[];
}

interface UserRole {
  id: string;
  user_id: string;
  organization_id: string;
  role_name: string;
  assigned_at: string;
}

interface RoleSelectorProps {
  organizationId: string;
  userId?: string; // If provided, show for specific user (admin view)
  onRolesUpdated?: () => void;
}

export default function RoleSelector({
  organizationId,
  userId: propUserId,
  onRolesUpdated
}: RoleSelectorProps) {
  const { user } = useAuth();
  const targetUserId = propUserId || user?.id;
  
  const [availableRoles, setAvailableRoles] = useState<Role[]>([]);
  const [userRoles, setUserRoles] = useState<UserRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);

  useEffect(() => {
    if (targetUserId && organizationId) {
      loadData();
    }
  }, [targetUserId, organizationId]);

  const loadData = async () => {
    if (!targetUserId) return;

    try {
      setLoading(true);
      
      // Load available roles
      const roles = await roleService.getOrganizationRoles(organizationId);
      setAvailableRoles(roles.filter((r: Role) => r.is_public));

      // Load user's current roles
      const userRoleData = await roleService.getUserRoles(targetUserId, organizationId);
      setUserRoles(userRoleData);
    } catch (error) {
      console.error('Failed to load roles:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleRole = async (roleName: string) => {
    if (!targetUserId || updating) return;

    const hasRole = userRoles.some(r => r.role_name === roleName);

    try {
      setUpdating(roleName);

      if (hasRole) {
        // Remove role
        await roleService.removeRole(targetUserId, organizationId, roleName);
      } else {
        // Add role
        await roleService.assignRole(targetUserId, organizationId, roleName, user?.id);
      }

      // Reload data
      await loadData();
      onRolesUpdated?.();
    } catch (error) {
      console.error('Failed to toggle role:', error);
    } finally {
      setUpdating(null);
    }
  };

  const hasRole = (roleName: string) => {
    return userRoles.some(r => r.role_name === roleName);
  };

  if (loading) {
    return (
      <HiveCard hoverable={false} className="p-6">
        <div className="flex items-center justify-center py-8">
          <div className="w-8 h-8 border-4 border-hiveYellow border-t-transparent rounded-full animate-spin"></div>
        </div>
      </HiveCard>
    );
  }

  if (availableRoles.length === 0) {
    return (
      <HiveCard hoverable={false} className="p-6">
        <div className="text-center py-8">
          <UserCircle className="w-12 h-12 text-hiveGray mx-auto mb-4" />
          <h3 className="text-lg font-bold text-hiveGray-dark mb-2">No Roles Available</h3>
          <p className="text-sm text-hiveGray">
            Ask an admin to create roles for this organization
          </p>
        </div>
      </HiveCard>
    );
  }

  return (
    <HiveCard hoverable={false} className="p-6">
      <div className="flex items-center gap-3 mb-6">
        <UserCircle className="w-6 h-6 text-hiveYellow" />
        <div>
          <h3 className="text-xl font-bold text-hiveGray-dark">Select Your Roles</h3>
          <p className="text-sm text-hiveGray">
            Choose the roles that describe your participation in this organization
          </p>
        </div>
      </div>

      <div className="space-y-3">
        <AnimatePresence>
          {availableRoles.map((role) => {
            const isSelected = hasRole(role.role_name);
            const isUpdating = updating === role.role_name;

            return (
              <motion.div
                key={role.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                <button
                  onClick={() => handleToggleRole(role.role_name)}
                  disabled={isUpdating}
                  className={`w-full flex items-center justify-between p-4 rounded-lg border-2 transition-all ${
                    isSelected
                      ? 'border-hiveYellow bg-hiveYellow/10'
                      : 'border-gray-200 bg-white hover:border-hiveYellow/50'
                  } ${isUpdating ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                      isSelected
                        ? 'border-hiveYellow bg-hiveYellow'
                        : 'border-gray-300'
                    }`}>
                      {isSelected && <Check className="w-4 h-4 text-white" />}
                      {isUpdating && (
                        <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      )}
                    </div>
                    <div className="text-left">
                      <p className={`font-semibold ${
                        isSelected ? 'text-hiveYellow' : 'text-hiveGray-dark'
                      }`}>
                        {role.role_name}
                      </p>
                      {role.options && role.options.length > 0 && (
                        <p className="text-xs text-hiveGray">
                          {role.options.join(', ')}
                        </p>
                      )}
                    </div>
                  </div>
                  {isSelected && !isUpdating && (
                    <span className="px-3 py-1 bg-hiveYellow text-white text-xs font-bold rounded-full">
                      Selected
                    </span>
                  )}
                </button>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {userRoles.length > 0 && (
        <div className="mt-6 pt-6 border-t border-gray-200">
          <p className="text-sm text-hiveGray mb-3">Your current roles:</p>
          <div className="flex flex-wrap gap-2">
            {userRoles.map((ur) => (
              <span
                key={ur.id}
                className="px-3 py-1.5 bg-gradient-to-r from-hiveYellow to-yellow-500 text-white text-sm font-semibold rounded-full flex items-center gap-2"
              >
                {ur.role_name}
              </span>
            ))}
          </div>
        </div>
      )}
    </HiveCard>
  );
}

