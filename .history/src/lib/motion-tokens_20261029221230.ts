export const motionTokens = {
  duration: {
    fast: 0.15,
    base: 0.25,
    exit: 0.2,
  },
  ease: {
    enter: [0.16, 1, 0.3, 1],
    standard: [0.4, 0, 0.2, 1],
  },
  spring: {
    snappy: { type: "spring", stiffness: 520, damping: 34, mass: 1 },
    smooth: { type: "spring", stiffness: 260, damping: 30, mass: 1 },
  },
} as const;