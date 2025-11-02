export const motionConfig = {
  spring: { type: 'spring', stiffness: 400, damping: 30 },
  springBounce: { type: 'spring', stiffness: 500, damping: 25, bounce: 0.4 },
  ease: [0.25, 0.1, 0.25, 1] as const,
  easeOut: [0, 0, 0.2, 1] as const,
  easeInOut: [0.4, 0, 0.2, 1] as const,
};

export const fadeUp = {
  initial: { opacity: 0, y: 30, filter: 'blur(10px)' },
  animate: { opacity: 1, y: 0, filter: 'blur(0px)' },
  exit: { opacity: 0, y: -30, filter: 'blur(10px)' },
  transition: { duration: 0.4, ease: motionConfig.easeOut },
};

export const fadeIn = {
  initial: { opacity: 0, scale: 0.9, filter: 'blur(8px)' },
  animate: { opacity: 1, scale: 1, filter: 'blur(0px)' },
  exit: { opacity: 0, scale: 0.9, filter: 'blur(8px)' },
  transition: { duration: 0.3, ease: motionConfig.easeOut },
};

export const scaleIn = {
  initial: { opacity: 0, scale: 0.8, filter: 'blur(5px)' },
  animate: { opacity: 1, scale: 1, filter: 'blur(0px)' },
  exit: { opacity: 0, scale: 0.8, filter: 'blur(5px)' },
  transition: { duration: 0.25, ease: motionConfig.easeOut },
};

export const slideInRight = {
  initial: { x: 100, opacity: 0 },
  animate: { x: 0, opacity: 1 },
  exit: { x: -100, opacity: 0 },
  transition: { duration: 0.3, ease: motionConfig.easeOut },
};

export const slideInLeft = {
  initial: { x: -100, opacity: 0 },
  animate: { x: 0, opacity: 1 },
  exit: { x: 100, opacity: 0 },
  transition: { duration: 0.3, ease: motionConfig.easeOut },
};

export const slideInBottom = {
  initial: { y: 100, opacity: 0 },
  animate: { y: 0, opacity: 1 },
  exit: { y: -100, opacity: 0 },
  transition: { duration: 0.3, ease: motionConfig.easeOut },
};

export const staggerFast = {
  animate: {
    transition: {
      staggerChildren: 0.03,
      delayChildren: 0.05,
    },
  },
};

export const staggerChildren = {
  animate: {
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.1,
    },
  },
};

export const hoverLift = {
  scale: 1.02,
  y: -4,
  boxShadow: '0 20px 40px rgba(0, 0, 0, 0.15)',
  transition: { duration: 0.2, ease: motionConfig.easeOut },
};

export const hoverScale = {
  scale: 1.05,
  transition: { duration: 0.2, type: 'spring', stiffness: 400 },
};

export const tapScale = {
  scale: 0.97,
  transition: { duration: 0.1 },
};

export const shimmer = {
  initial: { backgroundPosition: '200% 0' },
  animate: {
    backgroundPosition: '-200% 0',
    transition: {
      duration: 2,
      ease: 'linear',
      repeat: Infinity,
    },
  },
};

export const pulse = {
  scale: [1, 1.05, 1],
  transition: {
    duration: 2,
    ease: 'easeInOut',
    repeat: Infinity,
  },
};

export const float = {
  y: [0, -10, 0],
  transition: {
    duration: 3,
    ease: 'easeInOut',
    repeat: Infinity,
  },
};

export const glow = {
  boxShadow: [
    '0 0 20px rgba(255, 199, 0, 0.5)',
    '0 0 40px rgba(255, 199, 0, 0.8)',
    '0 0 20px rgba(255, 199, 0, 0.5)',
  ],
  transition: {
    duration: 2,
    ease: 'easeInOut',
    repeat: Infinity,
  },
};
