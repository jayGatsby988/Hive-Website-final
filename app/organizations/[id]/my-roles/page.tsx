'use client';

import { useParams } from 'next/navigation';
import RoleSelector from '@/components/organizations/RoleSelector';
import { motion } from 'framer-motion';

export default function MyRolesPage() {
  const params = useParams();
  const orgId = params?.id as string;

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-3xl font-bold text-hiveGray-dark mb-2">My Roles</h1>
        <p className="text-hiveGray">
          Select the roles that describe your participation in this organization. 
          This helps us show you relevant events and opportunities.
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <RoleSelector organizationId={orgId} />
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="bg-blue-50 border border-blue-200 rounded-lg p-4"
      >
        <h3 className="font-bold text-blue-900 mb-2">ℹ️ Why select roles?</h3>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• See events that are relevant to your interests</li>
          <li>• Get notified about opportunities that match your roles</li>
          <li>• Help organizers understand the skills available in the community</li>
          <li>• You can change your roles at any time</li>
        </ul>
      </motion.div>
    </div>
  );
}

