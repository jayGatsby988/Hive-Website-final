'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  User,
  Bell,
  Shield,
  Palette,
  Globe,
  Mail,
  Phone,
  Lock,
  Save,
} from 'lucide-react';
import Header from '@/components/layout/Header';
import Sidebar from '@/components/layout/Sidebar';
import HiveCard from '@/components/common/HiveCard';
import HiveButton from '@/components/common/HiveButton';
import HiveInput from '@/components/common/HiveInput';
import { useToast } from '@/hooks/use-toast';

export default function SettingsPage() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const { toast } = useToast();

  const [profile, setProfile] = useState({
    name: 'John Doe',
    email: 'john.doe@example.com',
    phone: '+1 (555) 123-4567',
    bio: 'Passionate volunteer dedicated to making a positive impact in the community.',
  });

  const [notifications, setNotifications] = useState({
    emailNotifications: true,
    pushNotifications: true,
    eventReminders: true,
    weeklyDigest: false,
  });

  const handleSaveProfile = () => {
    toast({
      title: 'Profile Updated',
      description: 'Your profile has been successfully updated.',
    });
  };

  const handleSaveNotifications = () => {
    toast({
      title: 'Notifications Updated',
      description: 'Your notification preferences have been saved.',
    });
  };

  return (
    <div className="min-h-screen bg-hiveGray-light">
      <Sidebar
        userRole="user"
        isCollapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
      />
      <Header
        withSidebar
      />

      <motion.div
        className="pt-24 pb-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto transition-all duration-300"
        style={{ marginLeft: sidebarCollapsed ? '80px' : '256px' }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6 }}
      >
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-hiveGray-dark mb-2">Settings</h1>
          <p className="text-lg text-hiveGray">
            Manage your account settings and preferences
          </p>
        </div>

        <div className="space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            <HiveCard>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-hiveYellow/20 rounded-lg flex items-center justify-center">
                  <User className="w-5 h-5 text-hiveYellow" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-hiveGray-dark">
                    Profile Information
                  </h2>
                  <p className="text-sm text-hiveGray">
                    Update your personal details
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-hiveGray-dark mb-2">
                    Full Name
                  </label>
                  <HiveInput
                    value={profile.name}
                    onChange={(e) =>
                      setProfile({ ...profile, name: e.target.value })
                    }
                    placeholder="Enter your name"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-hiveGray-dark mb-2">
                      Email Address
                    </label>
                    <HiveInput
                      type="email"
                      value={profile.email}
                      onChange={(e) =>
                        setProfile({ ...profile, email: e.target.value })
                      }
                      placeholder="your.email@example.com"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-hiveGray-dark mb-2">
                      Phone Number
                    </label>
                    <HiveInput
                      value={profile.phone}
                      onChange={(e) =>
                        setProfile({ ...profile, phone: e.target.value })
                      }
                      placeholder="+1 (555) 123-4567"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-hiveGray-dark mb-2">
                    Bio
                  </label>
                  <textarea
                    className="w-full px-4 py-2 border border-hiveGray-light rounded-lg focus:ring-2 focus:ring-hiveYellow focus:border-transparent transition-all resize-none"
                    rows={4}
                    value={profile.bio}
                    onChange={(e) =>
                      setProfile({ ...profile, bio: e.target.value })
                    }
                    placeholder="Tell us about yourself..."
                  />
                </div>

                <div className="flex justify-end">
                  <HiveButton onClick={handleSaveProfile}>
                    <Save className="w-4 h-4" />
                    Save Profile
                  </HiveButton>
                </div>
              </div>
            </HiveCard>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <HiveCard>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-hiveYellow/20 rounded-lg flex items-center justify-center">
                  <Bell className="w-5 h-5 text-hiveYellow" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-hiveGray-dark">
                    Notifications
                  </h2>
                  <p className="text-sm text-hiveGray">
                    Manage how you receive updates
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                {[
                  {
                    key: 'emailNotifications',
                    label: 'Email Notifications',
                    description: 'Receive updates via email',
                  },
                  {
                    key: 'pushNotifications',
                    label: 'Push Notifications',
                    description: 'Get instant alerts on your device',
                  },
                  {
                    key: 'eventReminders',
                    label: 'Event Reminders',
                    description: 'Reminders for upcoming events',
                  },
                  {
                    key: 'weeklyDigest',
                    label: 'Weekly Digest',
                    description: 'Summary of your activity each week',
                  },
                ].map((item) => (
                  <div
                    key={item.key}
                    className="flex items-center justify-between p-4 rounded-lg hover:bg-hiveGray-light/50 transition-colors"
                  >
                    <div>
                      <p className="font-medium text-hiveGray-dark">
                        {item.label}
                      </p>
                      <p className="text-sm text-hiveGray">{item.description}</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={
                          notifications[item.key as keyof typeof notifications]
                        }
                        onChange={(e) =>
                          setNotifications({
                            ...notifications,
                            [item.key]: e.target.checked,
                          })
                        }
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-hiveGray-light rounded-full peer peer-checked:bg-hiveYellow peer-focus:ring-4 peer-focus:ring-hiveYellow/20 transition-all">
                        <div className="w-4 h-4 bg-white rounded-full shadow-md transform transition-transform peer-checked:translate-x-6 translate-x-1 translate-y-1" />
                      </div>
                    </label>
                  </div>
                ))}

                <div className="flex justify-end pt-4">
                  <HiveButton onClick={handleSaveNotifications}>
                    <Save className="w-4 h-4" />
                    Save Preferences
                  </HiveButton>
                </div>
              </div>
            </HiveCard>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            <HiveCard>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-hiveYellow/20 rounded-lg flex items-center justify-center">
                  <Lock className="w-5 h-5 text-hiveYellow" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-hiveGray-dark">
                    Security
                  </h2>
                  <p className="text-sm text-hiveGray">
                    Update your password and security settings
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-hiveGray-dark mb-2">
                    Current Password
                  </label>
                  <HiveInput
                    type="password"
                    placeholder="Enter current password"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-hiveGray-dark mb-2">
                    New Password
                  </label>
                  <HiveInput
                    type="password"
                    placeholder="Enter new password"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-hiveGray-dark mb-2">
                    Confirm New Password
                  </label>
                  <HiveInput
                    type="password"
                    placeholder="Confirm new password"
                  />
                </div>

                <div className="flex justify-end pt-4">
                  <HiveButton>
                    <Shield className="w-4 h-4" />
                    Update Password
                  </HiveButton>
                </div>
              </div>
            </HiveCard>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}
