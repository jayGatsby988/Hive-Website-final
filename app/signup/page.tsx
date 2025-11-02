'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, Lock, User } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import HiveButton from '@/components/common/HiveButton';
import HiveInput from '@/components/common/HiveInput';
import { scaleIn } from '@/lib/animations';
import { useAuth } from '@/contexts/AuthContext';

export default function SignupPage() {
  const router = useRouter();
  const { signUp, loading: authLoading } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState<'user' | 'admin'>('user');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    setIsLoading(true);

    try {
      const { error } = await signUp(email, password, name, role);
      
      if (error) {
        // Handle specific error messages
        if (error.message?.includes('duplicate key value violates unique constraint')) {
          setError('An account with this email already exists. Please try signing in instead.');
        } else if (error.message?.includes('User already registered')) {
          setError('An account with this email already exists. Please try signing in instead.');
        } else {
          setError(error.message || 'Failed to create account');
        }
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
            Join HIVE
          </h1>
          <p className="text-hiveGray">Create your account to get started</p>
        </div>

        <motion.div
          className="bg-hiveWhite rounded-2xl shadow-hive-lift p-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 text-hiveGray w-5 h-5 pointer-events-none" />
              <HiveInput
                type="text"
                placeholder="Full name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="pl-12"
                required
              />
            </div>

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

            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-hiveGray w-5 h-5 pointer-events-none" />
              <HiveInput
                type="password"
                placeholder="Confirm password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="pl-12"
                required
              />
            </div>

            <div className="space-y-3">
              <label className="block text-sm font-medium text-hiveGray-dark">
                I am a:
              </label>
              <div className="flex gap-4">
                <motion.button
                  type="button"
                  className={`flex-1 py-3 px-4 rounded-lg border-2 transition-all ${
                    role === 'user'
                      ? 'border-hiveYellow bg-hiveYellow/10 text-hiveGray-dark font-semibold'
                      : 'border-hiveGray-light text-hiveGray hover:border-hiveYellow/50'
                  }`}
                  onClick={() => setRole('user')}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Volunteer
                </motion.button>
                <motion.button
                  type="button"
                  className={`flex-1 py-3 px-4 rounded-lg border-2 transition-all ${
                    role === 'admin'
                      ? 'border-hiveYellow bg-hiveYellow/10 text-hiveGray-dark font-semibold'
                      : 'border-hiveGray-light text-hiveGray hover:border-hiveYellow/50'
                  }`}
                  onClick={() => setRole('admin')}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Organization
                </motion.button>
              </div>
            </div>

            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-red-50 text-red-600 p-3 rounded-lg text-sm"
              >
                {error}
                {error.includes('already exists') && (
                  <div className="mt-2">
                    <Link
                      href="/login"
                      className="text-blue-600 hover:text-blue-800 underline font-semibold"
                    >
                      Go to Sign In
                    </Link>
                  </div>
                )}
              </motion.div>
            )}

            <div className="flex items-start gap-2">
              <input
                type="checkbox"
                id="terms"
                className="w-4 h-4 mt-1 accent-hiveYellow"
                required
              />
              <label htmlFor="terms" className="text-sm text-hiveGray">
                I agree to the{' '}
                <Link href="/terms" className="text-hiveYellow hover:text-hiveYellow-dark">
                  Terms of Service
                </Link>{' '}
                and{' '}
                <Link href="/privacy" className="text-hiveYellow hover:text-hiveYellow-dark">
                  Privacy Policy
                </Link>
              </label>
            </div>

            <HiveButton
              type="submit"
              className="w-full"
              size="lg"
              disabled={isLoading}
            >
              {isLoading ? 'Creating account...' : 'Create Account'}
            </HiveButton>
          </form>

          <div className="mt-6 text-center">
            <p className="text-hiveGray">
              Already have an account?{' '}
              <Link
                href="/login"
                className="text-hiveYellow hover:text-hiveYellow-dark font-semibold transition-colors"
              >
                Sign in
              </Link>
            </p>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}
