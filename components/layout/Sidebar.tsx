'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Home,
  Calendar,
  Building2,
  Settings,
  LogOut,
  ChevronDown,
  ChevronsLeft,
  ChevronsRight,
  Shield,
  Users,
  Sparkles,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useOrganization } from '@/contexts/OrganizationContext';
import { usePermissions } from '@/components/common/ProtectedRoute';

interface SidebarProps {
  userRole?: 'super_admin' | 'admin' | 'user';
  onLogout?: () => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

export default function Sidebar({
  userRole = 'user',
  onLogout,
  isCollapsed = false,
  onToggleCollapse,
}: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [isOrgMenuOpen, setIsOrgMenuOpen] = useState(false);
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
  const { selectedOrg, setSelectedOrg, organizations, isAdmin, canCreateEvents, canManageMembers, canViewAnalytics } = useOrganization();
  const { isSuperAdmin } = usePermissions();

  // Dynamic navigation items based on permissions
  const navItems = [
    {
      icon: Home,
      label: 'Dashboard',
      href: isSuperAdmin ? '/super-admin' : 
            isAdmin ? '/dashboard/admin' : '/dashboard/user',
    },
    { icon: Calendar, label: 'Calendar', href: '/calendar' },
    { icon: Building2, label: 'Organizations', href: '/organizations' },
    ...(canViewAnalytics ? [{ icon: Sparkles, label: 'Analytics', href: `/organizations/${selectedOrg?.id}/analytics` }] : []),
    { icon: Settings, label: 'Settings', href: '/settings' },
  ];

  // Add super admin specific navigation
  if (isSuperAdmin) {
    navItems.splice(1, 0, {
      icon: Shield,
      label: 'Admin Management',
      href: '/super-admin',
    });
  }

  // Add organization-specific admin navigation
  if (selectedOrg && isAdmin) {
    const orgAdminItems = [
      { icon: Users, label: 'Members', href: `/organizations/${selectedOrg?.id}/members` },
      { icon: Calendar, label: 'Events', href: `/organizations/${selectedOrg?.id}/events` },
      { icon: Settings, label: 'Settings', href: `/organizations/${selectedOrg?.id}/settings` },
    ];
    
    // Insert organization admin items after Organizations
    const orgIndex = navItems.findIndex(item => item.label === 'Organizations');
    if (orgIndex !== -1) {
      navItems.splice(orgIndex + 1, 0, ...orgAdminItems);
    }
  }

  const handleOrgSelect = (org: typeof selectedOrg) => {
    if (!org) return;
    setSelectedOrg(org);
    setIsOrgMenuOpen(false);
    router.push(`/organizations/${org.id}`);
  };

  return (
    <motion.aside
      className="fixed left-0 top-0 h-screen bg-white text-gray-800 flex flex-col z-40 border-r border-yellow-200 shadow-xl"
      initial={{ width: 256 }}
      animate={{ width: isCollapsed ? 72 : 256 }}
      transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
    >
      <div className="p-5 border-b border-yellow-200 flex items-center justify-center relative overflow-hidden bg-gradient-to-br from-yellow-50 to-white">
        {!isCollapsed ? (
          <Link href="/" className="flex items-center gap-3 group relative z-10">
            <motion.div
              whileHover={{ rotate: 180, scale: 1.1 }}
              transition={{ duration: 0.5, ease: 'easeInOut' }}
              className="relative"
            >
              <svg 
                className="w-9 h-9 text-yellow-500 fill-yellow-500/20 drop-shadow-md" 
                viewBox="0 0 24 24" 
                xmlns="http://www.w3.org/2000/svg"
              >
                <path d="M12 2L20 7L20 17L12 22L4 17L4 7L12 2Z" />
              </svg>
              <Sparkles className="w-4 h-4 text-yellow-600 absolute top-0 right-0 opacity-0 group-hover:opacity-100 transition-opacity" />
            </motion.div>
            <span className="text-2xl font-bold bg-gradient-to-r from-yellow-500 to-yellow-600 bg-clip-text text-transparent group-hover:from-yellow-600 group-hover:to-yellow-500 transition-all">
              HIVE
            </span>
          </Link>
        ) : (
          <Link href="/" className="mx-auto relative z-10">
            <motion.div
              whileHover={{ rotate: 180, scale: 1.15 }}
              transition={{ duration: 0.5, ease: 'easeInOut' }}
            >
              <svg 
                className="w-9 h-9 text-yellow-500 fill-yellow-500/20 drop-shadow-md" 
                viewBox="0 0 24 24" 
                xmlns="http://www.w3.org/2000/svg"
              >
                <path d="M12 2L20 7L20 17L12 22L4 17L4 7L12 2Z" />
              </svg>
            </motion.div>
          </Link>
        )}
      </div>

      {!isCollapsed && (
        <div className="px-3 py-3">
          <Link
            href={userRole === 'super_admin' ? '/super-admin' : 
                  userRole === 'admin' ? '/dashboard/admin' : '/dashboard/user'}
            className="w-full"
          >
            <motion.button
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-gradient-to-r from-yellow-400 to-yellow-500 hover:from-yellow-500 hover:to-yellow-600 text-white font-semibold shadow-lg shadow-yellow-500/30 transition-all"
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98 }}
            >
              <Home className="w-5 h-5" />
              <span className="text-sm">Back to Dashboard</span>
            </motion.button>
          </Link>
        </div>
      )}

      {!isCollapsed && (
        <div className="px-3 py-4 border-b border-yellow-200">
          <motion.button
            className="w-full flex items-center justify-between p-3 rounded-xl bg-yellow-50 hover:bg-yellow-100 transition-all duration-200 border border-yellow-200 hover:border-yellow-300 shadow-sm"
            onClick={() => setIsOrgMenuOpen(!isOrgMenuOpen)}
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.98 }}
          >
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div className="w-9 h-9 bg-gradient-to-br from-yellow-400 to-yellow-500 rounded-lg flex items-center justify-center flex-shrink-0 shadow-md">
                <span className="text-white font-bold text-sm">
                  {selectedOrg?.name?.charAt(0) || 'O'}
                </span>
              </div>
              <div className="flex-1 min-w-0 text-left">
                <p className="text-sm font-semibold truncate text-gray-800">{selectedOrg?.name || 'Select Organization'}</p>
                <p className="text-xs text-gray-600 flex items-center gap-1.5 mt-0.5">
                  {selectedOrg?.role === 'admin' ? (
                    <>
                      <Shield className="w-3 h-3 text-yellow-600" />
                      <span>Admin</span>
                    </>
                  ) : (
                    <>
                      <Users className="w-3 h-3 text-yellow-600" />
                      <span>Member</span>
                    </>
                  )}
                </p>
              </div>
            </div>
            <motion.div
              animate={{ rotate: isOrgMenuOpen ? 180 : 0 }}
              transition={{ duration: 0.25 }}
            >
              <ChevronDown className="w-4 h-4 flex-shrink-0 text-gray-500" />
            </motion.div>
          </motion.button>

          <AnimatePresence>
            {isOrgMenuOpen && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="mt-2 space-y-1 max-h-64 overflow-y-auto scrollbar-thin scrollbar-thumb-yellow-300 scrollbar-track-transparent">
                  {organizations.map((org, idx) => (
                    <motion.button
                      key={org.id}
                      className={cn(
                        'w-full flex items-center gap-3 p-2.5 rounded-lg transition-all text-left relative overflow-hidden',
                        selectedOrg?.id === org.id
                          ? 'bg-gradient-to-r from-yellow-100 to-yellow-50 text-yellow-800 border border-yellow-300'
                          : 'hover:bg-gray-50 text-gray-700 hover:text-gray-900 border border-transparent'
                      )}
                      onClick={() => handleOrgSelect(org)}
                      whileHover={{ x: 4, scale: 1.02 }}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.2, delay: idx * 0.05 }}
                    >
                      <div
                        className={cn(
                          'w-7 h-7 rounded-md flex items-center justify-center flex-shrink-0 shadow-sm',
                          selectedOrg?.id === org.id
                            ? 'bg-gradient-to-br from-yellow-400 to-yellow-500'
                            : 'bg-gray-200'
                        )}
                      >
                        <span
                          className={cn(
                            'text-xs font-bold',
                            selectedOrg?.id === org.id
                              ? 'text-white'
                              : 'text-gray-600'
                          )}
                        >
                          {org.name.charAt(0)}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{org.name}</p>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {org.role === 'admin' ? 'Admin' : 'Member'}
                        </p>
                      </div>
                    </motion.button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      <nav className="flex-1 px-3 py-6 overflow-y-auto scrollbar-thin scrollbar-thumb-yellow-300 scrollbar-track-transparent">
        <div className="space-y-1.5">
          {navItems.map((item, index) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
            return (
              <motion.div
                key={item.href}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.2, delay: index * 0.05 }}
                onHoverStart={() => setHoveredItem(item.href)}
                onHoverEnd={() => setHoveredItem(null)}
              >
                <Link
                  href={item.href}
                  className={cn(
                    'flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 group relative overflow-hidden',
                    isActive
                      ? 'bg-gradient-to-r from-yellow-400 to-yellow-500 text-white font-semibold shadow-lg shadow-yellow-500/20'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-yellow-50',
                    isCollapsed && 'justify-center'
                  )}
                  title={isCollapsed ? item.label : undefined}
                >
                  {isActive && (
                    <motion.div
                      layoutId="activeTab"
                      className="absolute inset-0 bg-gradient-to-r from-yellow-400 to-yellow-500 rounded-xl"
                      transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                    />
                  )}
                  <item.icon
                    className={cn(
                      'w-5 h-5 relative z-10 transition-transform',
                      isActive ? 'text-white' : 'text-gray-500 group-hover:text-gray-900 group-hover:scale-110'
                    )}
                  />
                  {!isCollapsed && (
                    <span className="text-sm relative z-10">{item.label}</span>
                  )}
                  {!isCollapsed && hoveredItem === item.href && !isActive && (
                    <motion.div
                      className="ml-auto"
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -10 }}
                      transition={{ duration: 0.2 }}
                    >
                      <div className="w-1.5 h-1.5 bg-yellow-500 rounded-full" />
                    </motion.div>
                  )}
                </Link>
              </motion.div>
            );
          })}
        </div>
      </nav>

      <div className="p-3 border-t border-yellow-200 space-y-2 bg-yellow-50/50">
        <motion.button
          className={cn(
            'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 hover:text-red-700 transition-all duration-200 group border border-red-200 hover:border-red-300',
            isCollapsed && 'justify-center'
          )}
          onClick={onLogout}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          title={isCollapsed ? 'Logout' : undefined}
        >
          <LogOut className="w-5 h-5 group-hover:rotate-12 transition-transform" />
          {!isCollapsed && <span className="text-sm font-medium">Logout</span>}
        </motion.button>

        <motion.button
          className={cn(
            'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-600 hover:text-gray-900 transition-all duration-200 border border-gray-200 hover:border-gray-300',
            isCollapsed && 'justify-center'
          )}
          onClick={onToggleCollapse}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          title={isCollapsed ? 'Expand' : 'Collapse'}
        >
          {isCollapsed ? (
            <ChevronsRight className="w-5 h-5" />
          ) : (
            <>
              <ChevronsLeft className="w-5 h-5" />
              <span className="text-sm font-medium">Collapse</span>
            </>
          )}
        </motion.button>
      </div>
    </motion.aside>
  );
}
