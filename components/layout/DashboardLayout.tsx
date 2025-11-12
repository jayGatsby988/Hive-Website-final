'use client';

import { useState, ReactNode } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';

interface DashboardLayoutProps {
  children: ReactNode;
  userRole?: 'super_admin' | 'admin' | 'user';
}

export default function DashboardLayout({ children, userRole = 'user' }: DashboardLayoutProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <div className="min-h-screen bg-hiveGray-light">
      <Sidebar
        userRole={userRole}
        isCollapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
      />
      <Header withSidebar />

      <div
        className="pt-24 pb-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto transition-all duration-300"
        style={{ marginLeft: sidebarCollapsed ? '72px' : '256px' }}
      >
        {children}
      </div>
    </div>
  );
}
