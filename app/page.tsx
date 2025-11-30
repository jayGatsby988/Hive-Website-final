'use client';

import { useState, useEffect } from 'react';
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion';
import {
  ArrowRight,
  Users,
  Calendar,
  BarChart3,
  Sparkles,
  Heart,
  Globe,
  Zap,
  Shield,
  TrendingUp,
  Check,
  Star,
} from 'lucide-react';
import Link from 'next/link';

function LoadingScreen({ onLoadingComplete }: { onLoadingComplete: () => void }) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onLoadingComplete();
    }, 2500);
    return () => clearTimeout(timer);
  }, [onLoadingComplete]);

  return (
    <motion.div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-gradient-to-br from-yellow-400 via-yellow-500 to-amber-600"
      initial={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 1.1 }}
      transition={{ duration: 0.6 }}
    >
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(30)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-3 h-3 bg-white/40 rounded-full"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              scale: [0, 1.5, 0],
              opacity: [0, 1, 0],
            }}
            transition={{
              duration: 2 + Math.random() * 2,
              repeat: Infinity,
              delay: Math.random() * 2,
            }}
          />
        ))}
      </div>

      <div className="relative text-center">
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ duration: 1, ease: 'easeOut', type: 'spring' }}
          className="mb-8"
        >
          <motion.div
            animate={{
              rotate: 360,
              boxShadow: [
                '0 0 60px rgba(255,255,255,0.3)',
                '0 0 100px rgba(255,255,255,0.6)',
                '0 0 60px rgba(255,255,255,0.3)',
              ],
            }}
            transition={{
              rotate: { duration: 3, repeat: Infinity, ease: 'linear' },
              boxShadow: { duration: 2, repeat: Infinity }
            }}
            className="w-32 h-32 mx-auto bg-white"
            style={{
              clipPath: 'polygon(30% 0%, 70% 0%, 100% 50%, 70% 100%, 30% 100%, 0% 50%)'
            }}
          />
        </motion.div>

        <motion.h1
          className="text-6xl font-bold text-white mb-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.5 }}
        >
          HIVE
        </motion.h1>

        <motion.p
          className="text-xl text-white/90 mb-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.8 }}
        >
          Empowering Communities
        </motion.p>

        <motion.div
          className="flex justify-center gap-2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 1 }}
        >
          {[...Array(3)].map((_, i) => (
            <motion.div
              key={i}
              className="w-3 h-3 bg-white rounded-full"
              animate={{
                scale: [1, 1.5, 1],
                opacity: [0.5, 1, 0.5],
              }}
              transition={{
                duration: 1,
                repeat: Infinity,
                delay: i * 0.2,
              }}
            />
          ))}
        </motion.div>
      </div>
    </motion.div>
  );
}

export default function Home() {
  const [isLoading, setIsLoading] = useState(true);
  const { scrollY } = useScroll();
  const y1 = useTransform(scrollY, [0, 300], [0, -50]);
  const opacity = useTransform(scrollY, [0, 300], [1, 0]);

  const features = [
    {
      icon: <Calendar className="w-10 h-10" />,
      title: 'Smart Events',
      description: 'Create, manage, and track volunteer events with intelligent scheduling and automated reminders.',
    },
    {
      icon: <Users className="w-10 h-10" />,
      title: 'Team Collaboration',
      description: 'Connect volunteers seamlessly. Build communities that drive meaningful social impact.',
    },
    {
      icon: <BarChart3 className="w-10 h-10" />,
      title: 'Real-time Analytics',
      description: 'Track hours, measure impact, and generate comprehensive reports with live insights.',
    },
    {
      icon: <Heart className="w-10 h-10" />,
      title: 'Impact Tracking',
      description: 'Visualize the difference you make with detailed impact metrics and success stories.',
    },
    {
      icon: <Globe className="w-10 h-10" />,
      title: 'Global Reach',
      description: 'Connect with organizations worldwide. Make a difference beyond borders.',
    },
    {
      icon: <Shield className="w-10 h-10" />,
      title: 'Secure & Reliable',
      description: 'Enterprise-grade security ensuring your data is protected and always available.',
    },
  ];

  const stats = [
    { number: '400+', label: 'Active Users' },
    { number: '200+', label: 'Hours Logged' },
    { number: '95%', label: 'Satisfaction' },
  ];

  const benefits = [
    'Track volunteer hours automatically',
    'Manage multiple organizations',
    'Generate impact reports',
    'Real-time team collaboration',
    'Mobile-friendly interface',
    'Advanced analytics dashboard',
  ];

  return (
    <>
      <AnimatePresence mode="wait">
        {isLoading && <LoadingScreen onLoadingComplete={() => setIsLoading(false)} />}
      </AnimatePresence>

      {!isLoading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="min-h-screen bg-white text-gray-900 overflow-hidden"
        >
          <div className="fixed inset-0 z-0">
            <div className="absolute inset-0 bg-gradient-to-br from-yellow-50 via-white to-amber-50" />
            <motion.div
              className="absolute top-0 right-0 w-[800px] h-[800px] bg-gradient-to-br from-yellow-400/30 to-amber-500/30 rounded-full blur-3xl"
              animate={{
                scale: [1, 1.1, 1],
                opacity: [0.3, 0.5, 0.3],
              }}
              transition={{ duration: 8, repeat: Infinity }}
            />
            <motion.div
              className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-gradient-to-tr from-yellow-300/30 to-amber-400/30 rounded-full blur-3xl"
              animate={{
                scale: [1.1, 1, 1.1],
                opacity: [0.3, 0.5, 0.3],
              }}
              transition={{ duration: 8, repeat: Infinity, delay: 1 }}
            />
          </div>

          <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-xl border-b border-yellow-200/50 shadow-sm">
            <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-center gap-3"
              >
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
                  className="w-10 h-10 bg-gradient-to-br from-yellow-400 to-amber-500 shadow-lg shadow-yellow-500/30"
                  style={{
                    clipPath: 'polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)'
                  }}
                />
                <span className="text-2xl font-bold text-gray-900">HIVE</span>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-center gap-4"
              >
                <Link href="/login">
                  <motion.button
                    className="px-6 py-2 rounded-xl text-gray-700 hover:text-gray-900 transition-colors font-medium"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    Sign In
                  </motion.button>
                </Link>
                <Link href="/signup">
                  <motion.button
                    className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-yellow-400 to-amber-500 text-white font-semibold shadow-lg shadow-yellow-500/40 hover:shadow-xl hover:shadow-yellow-500/50 transition-all"
                    whileHover={{ scale: 1.05, y: -1 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    Get Started
                  </motion.button>
                </Link>
              </motion.div>
            </div>
          </nav>

          <section className="relative min-h-screen flex items-center justify-center pt-20 px-6 overflow-hidden">
            <motion.div
              style={{ y: y1, opacity }}
              className="relative z-10 text-center max-w-6xl"
            >
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 1, delay: 0.2 }}
                className="inline-block mb-6"
              >
                <div className="bg-gradient-to-r from-yellow-100 to-amber-100 border border-yellow-300 rounded-full px-6 py-3 shadow-lg">
                  <div className="flex items-center gap-2 text-amber-700">
                    <Zap className="w-5 h-5" />
                    <span className="font-semibold">Trusted by 400+ users and partner of KeyClub</span>
                  </div>
                </div>
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 1, delay: 0.4 }}
                className="text-6xl sm:text-7xl lg:text-8xl font-bold mb-6 leading-tight"
              >
                Volunteer Management{' '}
                <motion.span
                  className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-500 via-amber-500 to-yellow-600"
                  animate={{
                    backgroundPosition: ['0%', '100%', '0%'],
                  }}
                  transition={{ duration: 5, repeat: Infinity }}
                >
                  Reimagined
                </motion.span>
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 1, delay: 0.6 }}
                className="text-xl sm:text-2xl text-gray-600 mb-12 max-w-3xl mx-auto leading-relaxed"
              >
                The modern platform connecting volunteers with meaningful opportunities. Track impact, build communities, and create lasting change.
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 1, delay: 0.8 }}
                className="flex flex-col sm:flex-row gap-4 justify-center mb-16"
              >
                <Link href="/signup">
                  <motion.button
                    className="group px-10 py-4 rounded-2xl bg-gradient-to-r from-yellow-400 via-amber-500 to-yellow-500 text-white font-bold text-lg shadow-2xl shadow-yellow-500/50 hover:shadow-yellow-500/70 transition-all flex items-center gap-2"
                    whileHover={{ scale: 1.05, y: -2 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    Start Free Today
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </motion.button>
                </Link>
                <Link href="/organizations">
                  <motion.button
                    className="px-10 py-4 rounded-2xl bg-white border-2 border-yellow-400 text-gray-900 font-bold text-lg hover:bg-yellow-50 transition-all shadow-lg"
                    whileHover={{ scale: 1.05, y: -2 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    Explore Organizations
                  </motion.button>
                </Link>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 1, delay: 1 }}
                className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-3xl mx-auto"
              >
                {stats.map((stat, index) => (
                  <motion.div
                    key={stat.label}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 1.2 + index * 0.1 }}
                    className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-lg border border-yellow-200/50 text-center"
                  >
                    <div className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-500 to-amber-600 mb-1">
                      {stat.number}
                    </div>
                    <div className="text-sm text-gray-600 font-medium">{stat.label}</div>
                  </motion.div>
                ))}
              </motion.div>
            </motion.div>

            <motion.div
              className="absolute bottom-10 left-1/2 -translate-x-1/2"
              animate={{ y: [0, 10, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <div className="w-6 h-10 border-2 border-yellow-500 rounded-full flex items-start justify-center p-2">
                <motion.div
                  className="w-1.5 h-1.5 bg-yellow-500 rounded-full"
                  animate={{ y: [0, 12, 0] }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
              </div>
            </motion.div>
          </section>

          <section className="relative py-32 px-6 bg-gradient-to-b from-white to-yellow-50">
            <div className="max-w-7xl mx-auto">
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8 }}
                className="text-center mb-20"
              >
                <h2 className="text-5xl sm:text-6xl font-bold mb-6 text-gray-900">
                  Everything You Need,{' '}
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-500 to-amber-600">
                    All in One Place
                  </span>
                </h2>
                <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                  Powerful features designed to streamline volunteer management and maximize your impact
                </p>
              </motion.div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {features.map((feature, index) => (
                  <motion.div
                    key={feature.title}
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6, delay: index * 0.1 }}
                    whileHover={{ y: -8, scale: 1.02 }}
                    className="group relative"
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-yellow-400/20 to-amber-500/20 rounded-3xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    <div className="relative h-full bg-white rounded-3xl p-8 shadow-xl border border-yellow-200/50 hover:shadow-2xl hover:border-yellow-300 transition-all duration-300">
                      <div className="w-16 h-16 bg-gradient-to-br from-yellow-400 to-amber-500 rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-yellow-500/30 text-white">
                        {feature.icon}
                      </div>
                      <h3 className="text-2xl font-bold mb-4 text-gray-900">{feature.title}</h3>
                      <p className="text-gray-600 leading-relaxed">{feature.description}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </section>

          <section className="relative py-32 px-6 bg-white">
            <div className="max-w-7xl mx-auto">
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8 }}
                className="text-center mb-16"
              >
                <h2 className="text-5xl sm:text-6xl font-bold mb-6 text-gray-900">
                  Trusted by{' '}
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-500 to-amber-600">
                    400+ Users
                  </span>
                </h2>
                <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-8">
                  Partner of KeyClub, empowering communities through volunteering
                </p>
                <div className="flex flex-wrap justify-center items-center gap-8 mt-12">
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6, delay: 0.1 }}
                    className="bg-gradient-to-br from-yellow-50 to-amber-50 rounded-2xl px-8 py-6 border-2 border-yellow-200"
                  >
                    <p className="text-2xl font-bold text-gray-900">KeyClub</p>
                  </motion.div>
                </div>
              </motion.div>
            </div>
          </section>

          <section className="relative py-32 px-6 bg-gradient-to-br from-yellow-400 via-amber-500 to-yellow-600">
            <div className="absolute inset-0 overflow-hidden">
              {[...Array(20)].map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute w-2 h-2 bg-white/20 rounded-full"
                  style={{
                    left: `${Math.random() * 100}%`,
                    top: `${Math.random() * 100}%`,
                  }}
                  animate={{
                    scale: [0, 1, 0],
                    opacity: [0, 1, 0],
                  }}
                  transition={{
                    duration: 3 + Math.random() * 2,
                    repeat: Infinity,
                    delay: Math.random() * 2,
                  }}
                />
              ))}
            </div>

            <div className="max-w-6xl mx-auto relative z-10">
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8 }}
                className="text-center mb-16"
              >
                <h2 className="text-5xl sm:text-6xl font-bold mb-6 text-white">
                  Why Choose HIVE?
                </h2>
                <p className="text-xl text-white/90 max-w-2xl mx-auto">
                  Partner of KeyClub, trusted by 400+ users
                </p>
              </motion.div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {benefits.map((benefit, index) => (
                  <motion.div
                    key={benefit}
                    initial={{ opacity: 0, x: index % 2 === 0 ? -20 : 20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6, delay: index * 0.1 }}
                    className="flex items-center gap-4 bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20"
                  >
                    <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg">
                      <Check className="w-6 h-6 text-yellow-500" />
                    </div>
                    <span className="text-lg font-semibold text-white">{benefit}</span>
                  </motion.div>
                ))}
              </div>
            </div>
          </section>

          <section className="relative py-32 px-6 bg-white">
            <div className="max-w-5xl mx-auto">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8 }}
                className="relative"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-yellow-400/30 to-amber-500/30 rounded-3xl blur-3xl" />
                <div className="relative bg-gradient-to-br from-yellow-400 to-amber-500 rounded-3xl p-16 text-center shadow-2xl">
                  <motion.div
                    animate={{
                      rotate: 360,
                      scale: [1, 1.1, 1],
                    }}
                    transition={{
                      rotate: { duration: 8, repeat: Infinity, ease: 'linear' },
                      scale: { duration: 3, repeat: Infinity }
                    }}
                    className="w-24 h-24 bg-white mx-auto mb-8 shadow-2xl"
                    style={{
                      clipPath: 'polygon(30% 0%, 70% 0%, 100% 50%, 70% 100%, 30% 100%, 0% 50%)'
                    }}
                  />
                  <h2 className="text-5xl sm:text-6xl font-bold mb-6 text-white">
                    Ready to Make an Impact?
                  </h2>
                  <p className="text-xl text-white/95 mb-10 max-w-2xl mx-auto leading-relaxed">
                    Join 400+ users as a partner of KeyClub, making a difference in their communities every day.
                  </p>
                  <Link href="/signup">
                    <motion.button
                      className="group px-10 py-5 rounded-2xl bg-white text-gray-900 font-bold text-lg shadow-2xl hover:shadow-3xl transition-all flex items-center gap-3 mx-auto"
                      whileHover={{ scale: 1.05, y: -3 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      Get Started Free
                      <ArrowRight className="w-6 h-6 group-hover:translate-x-2 transition-transform" />
                    </motion.button>
                  </Link>
                </div>
              </motion.div>
            </div>
          </section>

          <footer className="relative py-16 px-6 bg-gradient-to-br from-gray-900 to-gray-800 text-white">
            <div className="max-w-7xl mx-auto">
              <div className="flex flex-col items-center text-center mb-8">
                <div className="flex items-center gap-3 mb-4">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
                    className="w-12 h-12 bg-gradient-to-br from-yellow-400 to-amber-500 shadow-lg"
                    style={{
                      clipPath: 'polygon(30% 0%, 70% 0%, 100% 50%, 70% 100%, 30% 100%, 0% 50%)'
                    }}
                  />
                  <span className="text-3xl font-bold">HIVE</span>
                </div>
                <p className="text-gray-400 text-lg">
                  Empowering communities through volunteering
                </p>
              </div>
              <div className="border-t border-gray-700 pt-8 text-center">
                <p className="text-gray-400">
                  &copy; 2025 HIVE. All rights reserved.
                </p>
              </div>
            </div>
          </footer>
        </motion.div>
      )}
    </>
  );
}
