'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, Lock } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import HiveButton from '@/components/common/HiveButton';
import HiveInput from '@/components/common/HiveInput';
import { scaleIn } from '@/lib/animations';
import { useAuth } from '@/contexts/AuthContext';

export default function LoginPage() {
  const router = useRouter();
  const { signIn, loading: authLoading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const { error } = await signIn(email, password);
      
      if (error) {
        setError(error.message || 'Failed to sign in');
      } else {
        // Redirect to main dashboard, which will handle role-based routing
        router.push('/dashboard');
      }
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-hiveYellow/10 via-hiveWhite to-hiveYellow/5 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-hiveYellow"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-hiveYellow/10 via-hiveWhite to-hiveYellow/5 flex items-center justify-center p-4">
      <motion.div
        className="w-full max-w-md"
        {...scaleIn}
      >
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 group mb-6">
            <motion.div
              whileHover={{ rotate: 360 }}
              transition={{ duration: 0.6 }}
            >
              <svg 
                className="w-12 h-12 text-hiveYellow fill-hiveYellow" 
                viewBox="0 0 24 24" 
                xmlns="http://www.w3.org/2000/svg"
              >
                <path d="M12 2L20 7L20 17L12 22L4 17L4 7L12 2Z" />
              </svg>
            </motion.div>
            <span className="text-3xl font-bold text-hiveGray-dark group-hover:text-hiveYellow transition-colors">
              HIVE
            </span>
          </Link>
          <h1 className="text-4xl font-bold text-hiveGray-dark mb-2">
            Welcome Back
          </h1>
          <p className="text-hiveGray">Sign in to continue to your dashboard</p>
        </div>

        <motion.div
          className="bg-hiveWhite rounded-2xl shadow-hive-lift p-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-hiveGray w-5 h-5 pointer-events-none" />
              <HiveInput
                type="email"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-12"
                required
              />
            </div>

            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-hiveGray w-5 h-5 pointer-events-none" />
              <HiveInput
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-12"
                required
              />
            </div>

            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-red-50 text-red-600 p-3 rounded-lg text-sm"
              >
                {error}
              </motion.div>
            )}

            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  className="w-4 h-4 accent-hiveYellow"
                />
                <span className="text-hiveGray">Remember me</span>
              </label>
              <Link
                href="/forgot-password"
                className="text-hiveYellow hover:text-hiveYellow-dark transition-colors"
              >
                Forgot password?
              </Link>
            </div>

            <HiveButton
              type="submit"
              className="w-full"
              size="lg"
              disabled={isLoading}
            >
              {isLoading ? 'Signing in...' : 'Sign In'}
            </HiveButton>
          </form>

          <div className="mt-6 text-center">
            <p className="text-hiveGray">
              Don't have an account?{' '}
              <Link
                href="/signup"
                className="text-hiveYellow hover:text-hiveYellow-dark font-semibold transition-colors"
              >
                Sign up
              </Link>
            </p>
          </div>
        </motion.div>

        <motion.p
          className="text-center text-sm text-hiveGray mt-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          Connect with organizations and track your volunteer hours
        </motion.p>
      </motion.div>
    </div>
  );
}
