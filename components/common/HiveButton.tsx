'use client';

import { motion, HTMLMotionProps } from 'framer-motion';
import { forwardRef } from 'react';
import { cn } from '@/lib/utils';
import { hoverLift, tapScale } from '@/lib/animations';

interface HiveButtonProps extends Omit<HTMLMotionProps<'button'>, 'ref'> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
}

const HiveButton = forwardRef<HTMLButtonElement, HiveButtonProps>(
  ({ className, variant = 'primary', size = 'md', children, disabled, ...props }, ref) => {
    const baseStyles =
      'relative font-semibold rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-hiveYellow focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';

    const variants = {
      primary:
        'bg-gradient-to-r from-yellow-400 via-yellow-500 to-yellow-600 text-white font-bold shadow-lg hover:shadow-xl hover:from-yellow-500 hover:via-yellow-600 hover:to-yellow-700 transition-all duration-300',
      secondary:
        'bg-gradient-to-r from-gray-700 via-gray-800 to-gray-900 text-white shadow-lg hover:shadow-xl hover:from-gray-800 hover:via-gray-900 hover:to-black transition-all duration-300',
      outline:
        'border-2 border-yellow-400 text-yellow-600 hover:bg-gradient-to-r hover:from-yellow-400 hover:via-yellow-500 hover:to-yellow-600 hover:text-white transition-all duration-300',
      ghost:
        'text-gray-700 hover:bg-gray-100 hover:text-gray-900 transition-all duration-300',
    };

    const sizes = {
      sm: 'px-4 py-2 text-sm',
      md: 'px-6 py-3 text-base',
      lg: 'px-8 py-4 text-lg',
    };

    return (
      <motion.button
        ref={ref}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        whileHover={!disabled ? { 
          scale: 1.05, 
          y: -2,
          transition: { duration: 0.2, ease: [0.4, 0, 0.2, 1] }
        } : undefined}
        whileTap={!disabled ? { 
          scale: 0.95,
          transition: { duration: 0.1 }
        } : undefined}
        disabled={disabled}
        {...props}
      >
        <span className="relative z-10">{children as React.ReactNode}</span>
      </motion.button>
    );
  }
);

HiveButton.displayName = 'HiveButton';

export default HiveButton;
