'use client';

import { motion } from 'framer-motion';
import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface HiveCardProps {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
  hoverable?: boolean;
  delay?: number;
}

export default function HiveCard({
  children,
  className,
  onClick,
  hoverable = true,
  delay = 0,
}: HiveCardProps) {
  return (
    <motion.div
      className={cn(
        'bg-white/70 backdrop-blur-lg rounded-2xl shadow-lg p-6 transition-all duration-300 border border-white/20',
        'hover:bg-white/90 hover:shadow-2xl',
        hoverable && 'cursor-pointer card-hover',
        onClick && 'cursor-pointer',
        className
      )}
      initial={{ opacity: 0, y: 30, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ 
        duration: 0.5, 
        ease: [0.4, 0, 0.2, 1], 
        delay,
        type: "spring",
        stiffness: 100
      }}
      whileHover={
        hoverable
          ? {
              y: -12,
              scale: 1.02,
              boxShadow: '0 20px 60px rgba(250, 204, 21, 0.3)',
              transition: { duration: 0.3, ease: [0.4, 0, 0.2, 1] },
            }
          : undefined
      }
      whileTap={onClick ? { scale: 0.98 } : undefined}
      onClick={onClick}
    >
      {children}
    </motion.div>
  );
}
