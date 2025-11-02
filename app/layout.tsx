import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { OrganizationProvider } from '@/contexts/OrganizationContext';
import { AuthProvider } from '@/contexts/AuthContext';
import FloatingCreateEventButton from '@/components/common/FloatingCreateEventButton';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'HIVE - Volunteer Management',
  description: 'Manage your volunteer activities across multiple organizations',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthProvider>
          <OrganizationProvider>
            {children}
            <FloatingCreateEventButton />
          </OrganizationProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
