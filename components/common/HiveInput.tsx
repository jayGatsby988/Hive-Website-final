'use client';

import { InputHTMLAttributes, forwardRef, useState } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface HiveInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

const HiveInput = forwardRef<HTMLInputElement, HiveInputProps>(
  ({ className, label, error, ...props }, ref) => {
    const [isFocused, setIsFocused] = useState(false);

    return (
      <div className="w-full">
        {label && (
          <motion.label
            className="block text-sm font-medium text-hiveGray-dark mb-2"
            animate={{
              color: isFocused ? '#FFD83D' : '#2C2C2C',
              scale: isFocused ? 1.02 : 1,
            }}
            transition={{ duration: 0.2 }}
          >
            {label}
          </motion.label>
        )}
        <motion.div
          animate={{
            scale: isFocused ? 1.01 : 1,
          }}
          transition={{ duration: 0.2 }}
        >
          <input
            ref={ref}
            className={cn(
              'w-full px-4 py-3 rounded-lg border-2 bg-hiveWhite transition-all duration-200',
              'focus:outline-none focus:border-hiveYellow focus:ring-2 focus:ring-hiveYellow focus:ring-opacity-30',
              'placeholder:text-hiveGray placeholder:transition-opacity',
              error
                ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
                : 'border-hiveGray-light',
              className
            )}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            {...props}
          />
        </motion.div>
        {error && (
          <motion.p
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-2 text-sm text-red-500"
          >
            {error}
          </motion.p>
        )}
      </div>
    );
  }
);

HiveInput.displayName = 'HiveInput';

export default HiveInput;
