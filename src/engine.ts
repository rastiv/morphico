// Animation engine: easings and one shared requestAnimationFrame loop for every running morph.
// The loop only runs while something moves; nothing touches the DOM at import time (SSR-safe).

/** Maps linear progress (0…1) to eased progress. */
export type Easing = (progress: number) => number;

export const easings = {
  linear: (progress) => progress,
  easeInOutCubic: (progress) => (progress < 0.5 ? 4 * progress ** 3 : 1 - (-2 * progress + 2) ** 3 / 2),
  easeOutBack: (progress) => 1 + 2.70158 * (progress - 1) ** 3 + 1.70158 * (progress - 1) ** 2,
  easeOutElastic: (progress) => (progress === 0 || progress === 1
    ? progress
    : 2 ** (-10 * progress) * Math.sin((progress * 10 - 0.75) * ((2 * Math.PI) / 3)) + 1),
} satisfies Record<string, Easing>;

/** Called on every animation frame with the frame time; returns true while it wants more frames. */
export type FrameCallback = (frameTime: number) => boolean;

const frameCallbacks = new Set<FrameCallback>();
let animationFrameId = 0;

const runFrame = (frameTime: number): void => {
  for (const callback of frameCallbacks) if (!callback(frameTime)) frameCallbacks.delete(callback);
  animationFrameId = frameCallbacks.size ? requestAnimationFrame(runFrame) : 0;
};

/** Adds a callback to the shared loop. Returns a function that removes it again. */
export const animate = (onFrame: FrameCallback): (() => void) => {
  frameCallbacks.add(onFrame);
  animationFrameId ||= requestAnimationFrame(runFrame);
  return () => { frameCallbacks.delete(onFrame); };
};
