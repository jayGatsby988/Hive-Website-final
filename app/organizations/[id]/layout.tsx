'use client';

import { useState, useEffect } from 'react';
import { usePathname, useRouter, useParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Home,
  Calendar,
  Bell,
  ChevronDown,
  Users,
  ArrowLeft,
  Settings,
  Menu,
  X,
  TrendingUp,
  Hexagon,
  Plus,
} from 'lucide-react';
import Link from 'next/link';
import { useOrganization } from '@/contexts/OrganizationContext';
import { usePermissions } from '@/components/common/ProtectedRoute';

export default function OrganizationLayout({ children }: { children: React.ReactNode }) {
  const { selectedOrg, setSelectedOrg, organizations, loading, isAdmin, canCreateEvents, canManageMembers, canViewAnalytics } = useOrganization();
  const { isSuperAdmin } = usePermissions();
  const [isOrgMenuOpen, setIsOrgMenuOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const pathname = usePathname();
  const router = useRouter();
  const params = useParams();
  const urlOrgId = params?.id as string;

  // Auto-select organization based on URL if not already selected
  useEffect(() => {
    if (!loading && urlOrgId && organizations.length > 0) {
      const orgFromUrl = organizations.find(org => org.id === urlOrgId);
      if (orgFromUrl && (!selectedOrg || selectedOrg.id !== urlOrgId)) {
        setSelectedOrg(orgFromUrl);
      }
    }
  }, [urlOrgId, organizations, loading, selectedOrg, setSelectedOrg]);

  // Show loading state if organizations are still loading
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-hiveYellow/5 via-hiveWhite to-hiveYellow/10 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-hiveYellow border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-hiveGray">Loading organization...</p>
        </div>
      </div>
    );
  }

  // If selectedOrg is still null after loading, show error
  if (!selectedOrg) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-hiveYellow/5 via-hiveWhite to-hiveYellow/10 flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <X className="w-8 h-8 text-red-500" />
          </div>
          <h2 className="text-2xl font-bold text-hiveGray-dark mb-2">Organization Not Found</h2>
          <p className="text-hiveGray mb-6">You may not be a member of this organization or it doesn't exist.</p>
          <Link href="/organizations">
            <button className="px-6 py-2 bg-hiveYellow text-white rounded-lg hover:bg-hiveYellow-dark transition-colors">
              Back to Organizations
            </button>
          </Link>
        </div>
      </div>
    );
  }

  const orgId = selectedOrg?.id;

  // Role-based sidebar sections
  const sidebarSections = [
    {
      title: 'Main',
      items: [
        { name: 'Overview', icon: Home, path: `/organizations/${orgId}`, badge: null },
        { name: 'Events', icon: Calendar, path: `/organizations/${orgId}/events`, badge: null },
        ...(canViewAnalytics ? [{ name: 'Analytics', icon: TrendingUp, path: `/organizations/${orgId}/analytics`, badge: null }] : []),
      ],
    },
    ...(isAdmin ? [{
      title: 'Administration',
      items: [
        { name: 'Members', icon: Users, path: `/organizations/${orgId}/members`, badge: null },
        { name: 'Settings', icon: Settings, path: `/organizations/${orgId}/settings`, badge: null },
      ],
    }] : [{
      title: 'Members',
      items: [
        { name: 'All Members', icon: Users, path: `/organizations/${orgId}/members`, badge: null },
      ],
    }]),
  ];

  const notifications = [
    // This would be loaded from a notifications service in a real implementation
    { id: 1, title: 'Welcome!', message: 'You have joined this organization', time: 'Just now', unread: true },
  ];

  const unreadCount = notifications.filter(n => n.unread).length;

  const getBreadcrumbs = () => {
    const parts = pathname.split('/').filter(Boolean);
    const breadcrumbs = [{ name: 'Dashboard', path: '/dashboard/user' }];

    if (parts.includes('organizations')) {
      breadcrumbs.push({ name: 'Organizations', path: '/organizations' });
      breadcrumbs.push({ name: selectedOrg?.name || 'Organization', path: `/organizations/${orgId}` });

      const pageName = parts[parts.length - 1];
      const pageMap: Record<string, string> = {
        events: 'Events',
        members: 'Members',
        settings: 'Settings',
      };

      if (pageMap[pageName]) {
        breadcrumbs.push({ name: pageMap[pageName], path: pathname });
      }
    }

    return breadcrumbs;
  };

  const breadcrumbs = getBreadcrumbs();

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.aside
            initial={{ x: -300 }}
            animate={{ x: 0 }}
            exit={{ x: -300 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            className="fixed left-0 top-0 h-screen w-72 bg-white shadow-xl z-50 flex flex-col border-r border-yellow-200"
          >
            <div className="p-5 border-b border-yellow-200 bg-gradient-to-br from-yellow-50 to-white">
              <div className="flex items-center justify-between mb-4">
                <Link href="/" className="flex items-center gap-2 group">
                  <motion.div whileHover={{ rotate: 180, scale: 1.1 }} transition={{ duration: 0.5 }}>
                    <Hexagon className="w-7 h-7 text-yellow-500 fill-yellow-500/20" />
                  </motion.div>
                  <span className="text-xl font-bold bg-gradient-to-r from-yellow-500 to-yellow-600 bg-clip-text text-transparent">
                    HIVE
                  </span>
                </Link>
                <button
                  onClick={() => setIsSidebarOpen(false)}
                  className="p-2 hover:bg-yellow-100 rounded-lg transition-colors lg:hidden"
                >
                  <X className="w-5 h-5 text-gray-600" />
                </button>
              </div>

              <Link href="/dashboard/user">
                <motion.button
                  className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl bg-gradient-to-r from-yellow-400 to-yellow-500 hover:from-yellow-500 hover:to-yellow-600 text-white font-semibold shadow-lg shadow-yellow-500/20 transition-all"
                  whileHover={{ scale: 1.02, y: -1 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span className="text-sm">Back to Dashboard</span>
                </motion.button>
              </Link>
            </div>

            <div className="p-4 border-b border-yellow-200">
              <motion.button
                onClick={() => setIsOrgMenuOpen(!isOrgMenuOpen)}
                className="w-full flex items-center gap-3 p-3 rounded-xl bg-yellow-50 hover:bg-yellow-100 transition-all border border-yellow-200"
                whileHover={{ scale: 1.01 }}
              >
                <div className="w-10 h-10 bg-gradient-to-br from-yellow-400 to-yellow-500 rounded-lg flex items-center justify-center shadow-md">
                  <span className="text-lg font-bold text-white">
                    {selectedOrg.name.charAt(0)}
                  </span>
                </div>
                <div className="flex-1 text-left">
                  <p className="text-sm font-bold truncate text-gray-800">{selectedOrg.name}</p>
                  <div className="flex items-center gap-2">
                    <p className="text-xs text-gray-600 capitalize">{selectedOrg.role}</p>
                    {isAdmin && (
                      <span className="px-2 py-0.5 bg-gradient-to-r from-purple-100 to-blue-100 text-purple-700 text-xs font-semibold rounded-full">
                        Admin
                      </span>
                    )}
                    {isSuperAdmin && (
                      <span className="px-2 py-0.5 bg-gradient-to-r from-yellow-100 to-orange-100 text-orange-700 text-xs font-semibold rounded-full">
                        Super Admin
                      </span>
                    )}
                  </div>
                </div>
                <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform ${isOrgMenuOpen ? 'rotate-180' : ''}`} />
              </motion.button>

              <AnimatePresence>
                {isOrgMenuOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="mt-2 space-y-1 overflow-hidden"
                  >
                    {organizations.map((org) => (
                      <motion.button
                        key={org.id}
                        onClick={() => {
                          setSelectedOrg(org);
                          setIsOrgMenuOpen(false);
                          router.push(`/organizations/${org.id}`);
                        }}
                        className={`w-full flex items-center gap-3 p-2.5 rounded-lg transition-all text-left ${
                          selectedOrg?.id === org.id
                            ? 'bg-gradient-to-r from-yellow-100 to-yellow-50 text-yellow-800 border border-yellow-300'
                            : 'hover:bg-gray-50 text-gray-700 border border-transparent'
                        }`}
                        whileHover={{ x: 4 }}
                      >
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center shadow-sm ${
                          selectedOrg?.id === org.id ? 'bg-gradient-to-br from-yellow-400 to-yellow-500' : 'bg-gray-200'
                        }`}>
                          <span className={`text-sm font-bold ${
                            selectedOrg?.id === org.id ? 'text-white' : 'text-gray-600'
                          }`}>
                            {org.name.charAt(0)}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{org.name}</p>
                          <p className="text-xs text-gray-500 capitalize">{org.role}</p>
                        </div>
                      </motion.button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <nav className="flex-1 overflow-y-auto p-4 scrollbar-thin scrollbar-thumb-yellow-300">
              {sidebarSections.map((section, sectionIndex) => (
                <div key={section.title} className="mb-6">
                  <h3 className="text-xs font-bold text-gray-500 uppercase mb-3 px-3 tracking-wider">
                    {section.title}
                  </h3>
                  <div className="space-y-1">
                    {section.items.map((item, itemIndex) => {
                      const isActive = pathname === item.path;
                      return (
                        <motion.button
                          key={item.path}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: (sectionIndex * 0.1) + (itemIndex * 0.05) }}
                          onClick={() => router.push(item.path)}
                          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all ${
                            isActive
                              ? 'bg-gradient-to-r from-yellow-400 to-yellow-500 text-white shadow-lg shadow-yellow-500/20 font-semibold'
                              : 'text-gray-700 hover:bg-yellow-50 hover:text-gray-900'
                          }`}
                          whileHover={{ x: isActive ? 0 : 4 }}
                        >
                          <item.icon className="w-5 h-5 flex-shrink-0" />
                          <span className="text-sm flex-1 text-left">{item.name}</span>
                          {item.badge !== null && (
                            <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                              isActive
                                ? 'bg-white text-yellow-600'
                                : 'bg-yellow-100 text-yellow-700'
                            }`}>
                              {item.badge}
                            </span>
                          )}
                        </motion.button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </nav>

            <div className="p-4 border-t border-yellow-200 bg-yellow-50/50">
              <div className="p-4 bg-gradient-to-br from-yellow-100 to-white rounded-xl border border-yellow-200">
                <div className="flex items-center gap-2 mb-3">
                  <TrendingUp className="w-5 h-5 text-yellow-600" />
                  <span className="text-sm font-bold text-gray-800">Monthly Progress</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3 mb-2 overflow-hidden">
                  <motion.div
                    className="bg-gradient-to-r from-yellow-400 to-yellow-500 h-3 rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: '68%' }}
                    transition={{ duration: 1, ease: 'easeOut' }}
                  />
                </div>
                <p className="text-xs text-gray-600 font-medium">68% of goal reached</p>
              </div>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      <div className={`flex-1 transition-all duration-300 ${isSidebarOpen ? 'lg:ml-72' : ''}`}>
        <div className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-40">
          <div className="px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <motion.button
                  onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                  className="p-2 hover:bg-yellow-50 rounded-lg transition-colors border border-transparent hover:border-yellow-200"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Menu className="w-5 h-5 text-gray-700" />
                </motion.button>

                <div className="flex items-center gap-2">
                  {breadcrumbs.map((crumb, index) => (
                    <div key={crumb.path} className="flex items-center gap-2">
                      <button
                        onClick={() => router.push(crumb.path)}
                        className={`text-sm whitespace-nowrap hover:text-yellow-600 transition-colors ${
                          index === breadcrumbs.length - 1
                            ? 'font-bold text-gray-900'
                            : 'text-gray-500'
                        }`}
                      >
                        {crumb.name}
                      </button>
                      {index < breadcrumbs.length - 1 && (
                        <span className="text-gray-400">/</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-3">
                {/* Create Event Button for Admins */}
                {isAdmin && canCreateEvents && (
                  <motion.button
                    onClick={() => router.push(`/organizations/${selectedOrg?.id}/events/create`)}
                    className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 }}
                  >
                    <Plus className="w-4 h-4" />
                    <span className="font-semibold text-sm">Create Event</span>
                  </motion.button>
                )}
                
                <div className="relative">
                  <motion.button
                    onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                    className="relative p-2 hover:bg-yellow-50 rounded-lg transition-colors"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Bell className="w-5 h-5 text-gray-700" />
                    {unreadCount > 0 && (
                      <span className="absolute top-0 right-0 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                        {unreadCount}
                      </span>
                    )}
                  </motion.button>

                  <AnimatePresence>
                    {isNotificationsOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: -10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -10, scale: 0.95 }}
                        transition={{ duration: 0.2 }}
                        className="absolute top-full right-0 mt-2 w-80 bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden"
                      >
                        <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-yellow-50 to-white">
                          <h3 className="font-bold text-gray-900">Notifications</h3>
                        </div>
                        <div className="max-h-96 overflow-y-auto">
                          {notifications.map((notification) => (
                            <div
                              key={notification.id}
                              className={`p-4 border-b border-gray-100 hover:bg-gray-50 transition-colors cursor-pointer ${
                                notification.unread ? 'bg-yellow-50/50' : ''
                              }`}
                            >
                              <div className="flex items-start gap-3">
                                {notification.unread && (
                                  <div className="w-2 h-2 bg-yellow-500 rounded-full mt-2 flex-shrink-0" />
                                )}
                                <div className="flex-1">
                                  <h4 className="font-semibold text-sm text-gray-900 mb-1">
                                    {notification.title}
                                  </h4>
                                  <p className="text-sm text-gray-600 mb-1">{notification.message}</p>
                                  <p className="text-xs text-gray-500">{notification.time}</p>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                        <div className="p-3 border-t border-gray-200 bg-gray-50 text-center">
                          <button className="text-sm text-yellow-600 hover:text-yellow-700 font-semibold">
                            View all notifications
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <div className="flex items-center gap-2 px-4 py-2 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <Users className="w-5 h-5 text-yellow-600" />
                  <span className="text-sm font-semibold text-gray-800">
                    {selectedOrg.members} members
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}
