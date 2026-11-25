// Blinking of face(): the eyes close and open again on top of any expression — on blink() and, if asked, by themselves
// every few seconds. Openness 1 = open as drawn, 0 = shut (transforms.ts `blinked` draws it).
import { animate } from '../engine.ts';
import { prefersReducedMotion } from '../morph.ts';

const BLINK_CLOSING = 90;
const BLINK_SHUT = 50;
const BLINK_OPENING = 150;
const AUTO_BLINK_MIN_PAUSE = 2500;
const AUTO_BLINK_EXTRA_PAUSE = 3500;

export interface Blinking {
  readonly openness: number;
  /** Closes the eyes and opens them again (nothing when they are shut already or with reduced motion). */
  blink(): Promise<void>;
  /** Opens the eyes at once and stops blinking by themselves. */
  stop(): void;
}

interface BlinkingOptions {
  /** Blink every few seconds without being asked (off with reduced motion). */
  blinksByItself: boolean;
  /** Whether the eyes are open now: an expression with shut eyes doesn't blink. */
  eyesOpen: () => boolean;
  /** Called on every change of the openness, to redraw the face. */
  onChange: () => void;
}

export const createBlinking = ({ blinksByItself, eyesOpen, onChange }: BlinkingOptions): Blinking => {
  let openness = 1;
  let stopBlink: (() => void) | null = null;
  let finishBlink: (() => void) | null = null;

  const endBlink = (): void => {
    stopBlink?.();
    stopBlink = null;
    if (openness < 1) {
      openness = 1;
      onChange();
    }
    finishBlink?.();
    finishBlink = null;
  };

  const blink = (): Promise<void> => {
    if (!eyesOpen() || prefersReducedMotion()) return Promise.resolve();
    endBlink();
    let startTime: number | null = null;
    return new Promise((resolve) => {
      finishBlink = resolve;
      stopBlink = animate((frameTime) => {
        startTime ??= frameTime;
        const elapsed = frameTime - startTime;
        if (elapsed < BLINK_CLOSING) openness = 1 - elapsed / BLINK_CLOSING;
        else if (elapsed < BLINK_CLOSING + BLINK_SHUT) openness = 0;
        else openness = Math.min((elapsed - BLINK_CLOSING - BLINK_SHUT) / BLINK_OPENING, 1);
        onChange();
        if (openness < 1 || elapsed < BLINK_CLOSING) return true;
        stopBlink = null;
        finishBlink = null;
        resolve();
        return false;
      });
    });
  };

  let autoBlinkTimer: ReturnType<typeof setTimeout> | undefined;
  const scheduleAutoBlink = (): void => {
    autoBlinkTimer = setTimeout(() => {
      if (typeof document === 'undefined' || !document.hidden) void blink();
      scheduleAutoBlink();
    }, AUTO_BLINK_MIN_PAUSE + Math.random() * AUTO_BLINK_EXTRA_PAUSE);
  };
  if (blinksByItself && !prefersReducedMotion()) scheduleAutoBlink();

  return {
    get openness() { return openness; },
    blink,
    stop() {
      clearTimeout(autoBlinkTimer);
      endBlink();
    },
  };
};
