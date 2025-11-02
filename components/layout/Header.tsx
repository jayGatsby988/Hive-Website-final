'use client';

import { motion } from 'framer-motion';
import { Menu, X } from 'lucide-react';
import { useState } from 'react';
import Link from 'next/link';
import HiveButton from '../common/HiveButton';
import { useAuth } from '@/contexts/AuthContext';

interface HeaderProps {
  withSidebar?: boolean;
}

export default function Header({
  withSidebar = false,
}: HeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, signOut } = useAuth();

  const handleLogout = async () => {
    await signOut();
  };

  return (
    <motion.header
      className={`fixed top-0 right-0 z-30 bg-hiveWhite/90 backdrop-blur-md border-b border-hiveGray-light ${
        withSidebar ? 'left-64' : 'left-0'
      }`}
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-2 group">
            <motion.div
              whileHover={{ rotate: 360, scale: 1.1 }}
              transition={{ duration: 0.6 }}
            >
              <svg 
                className="w-8 h-8 text-hiveYellow fill-hiveYellow" 
                viewBox="0 0 24 24" 
                xmlns="http://www.w3.org/2000/svg"
              >
                <path d="M12 2L20 7L20 17L12 22L4 17L4 7L12 2Z" />
              </svg>
            </motion.div>
            <span className="text-2xl font-bold text-hiveGray-dark group-hover:text-hiveYellow transition-colors">
              HIVE
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-8">
            {user ? (
              <>
                <Link
                  href="/dashboard"
                  className="text-hiveGray-dark hover:text-hiveYellow transition-colors font-medium"
                >
                  Dashboard
                </Link>
                <Link
                  href="/organizations"
                  className="text-hiveGray-dark hover:text-hiveYellow transition-colors font-medium"
                >
                  Organizations
                </Link>
                <Link
                  href="/calendar"
                  className="text-hiveGray-dark hover:text-hiveYellow transition-colors font-medium"
                >
                  Calendar
                </Link>
                {user.role === 'super_admin' && (
                  <Link
                    href="/super-admin"
                    className="text-hiveGray-dark hover:text-hiveYellow transition-colors font-medium"
                  >
                    Super Admin
                  </Link>
                )}
                {user.role === 'admin' && (
                  <Link
                    href="/admin"
                    className="text-hiveGray-dark hover:text-hiveYellow transition-colors font-medium"
                  >
                    Admin
                  </Link>
                )}
                <div className="flex items-center gap-3">
                  <span className="text-sm text-hiveGray-dark">
                    {user.name}
                  </span>
                  <HiveButton variant="outline" size="sm" onClick={handleLogout}>
                    Logout
                  </HiveButton>
                </div>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className="text-hiveGray-dark hover:text-hiveYellow transition-colors font-medium"
                >
                  Login
                </Link>
                <Link href="/signup">
                  <HiveButton size="sm">Sign Up</HiveButton>
                </Link>
              </>
            )}
          </nav>

          <button
            className="md:hidden text-hiveGray-dark"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {mobileMenuOpen && (
        <motion.div
          className="md:hidden bg-hiveWhite border-t border-hiveGray-light"
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
        >
          <div className="px-4 py-4 space-y-3">
            {user ? (
              <>
                <Link
                  href="/dashboard"
                  className="block py-2 text-hiveGray-dark hover:text-hiveYellow transition-colors font-medium"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Dashboard
                </Link>
                <Link
                  href="/organizations"
                  className="block py-2 text-hiveGray-dark hover:text-hiveYellow transition-colors font-medium"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Organizations
                </Link>
                <Link
                  href="/calendar"
                  className="block py-2 text-hiveGray-dark hover:text-hiveYellow transition-colors font-medium"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Calendar
                </Link>
                {user.role === 'super_admin' && (
                  <Link
                    href="/super-admin"
                    className="block py-2 text-hiveGray-dark hover:text-hiveYellow transition-colors font-medium"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Super Admin
                  </Link>
                )}
                {user.role === 'admin' && (
                  <Link
                    href="/admin"
                    className="block py-2 text-hiveGray-dark hover:text-hiveYellow transition-colors font-medium"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Admin
                  </Link>
                )}
                <div className="pt-3 border-t border-hiveGray-light">
                  <p className="text-sm text-hiveGray-dark mb-2">
                    Signed in as {user.name}
                  </p>
                  <HiveButton
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={handleLogout}
                  >
                    Logout
                  </HiveButton>
                </div>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className="block py-2 text-hiveGray-dark hover:text-hiveYellow transition-colors font-medium"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Login
                </Link>
                <Link href="/signup" onClick={() => setMobileMenuOpen(false)}>
                  <HiveButton size="sm" className="w-full">
                    Sign Up
                  </HiveButton>
                </Link>
              </>
            )}
          </div>
        </motion.div>
      )}
    </motion.header>
  );
}
