// Layer 2b: a countdown — to a moment (a Date or a date string) or for a number of seconds — shown with text(), so
// every changed digit morphs. The format (mm:ss, hh:mm:ss or days:hh:mm:ss) is chosen once from the time left at the
// start, so the line never changes width while it counts. Ticks follow the clock (a throttled background tab catches
// up on its next tick).
import { text } from './text.ts';
import type { TextOptions } from './text.ts';

/** What a countdown counts to: a `Date` or a date string (`'2026-12-31T00:00'`) = until that moment, a number = that
 * many seconds from now. */
export type CountdownTarget = Date | string | number;
/** How the time left is shown: `'auto'` (default) picks `'d:hh:mm:ss'` from a day left, `'hh:mm:ss'` from an hour,
 * else `'mm:ss'`. The largest part is not capped (`'mm:ss'` shows 90 minutes as 90:00). */
export type CountdownFormat = 'auto' | 'mm:ss' | 'hh:mm:ss' | 'd:hh:mm:ss';

export interface CountdownOptions extends TextOptions {
  format?: CountdownFormat;
  /** Called once when the countdown reaches 0 (right away if the moment has passed). */
  onEnd?: () => void;
}

export interface Countdown {
  /** Starts again, counting to a new moment or for a new number of seconds (also after the end or a pause). */
  to(until: CountdownTarget): void;
  /** Stops counting; the time shown stays. */
  pause(): void;
  /**
   * Counts on: a number of seconds goes on from where it paused; a moment keeps its moment (the time left jumps to
   * what it really is).
   */
  resume(): void;
  /** Stops counting and removes the line from the page. */
  destroy(): void;
}

const SECONDS_PER_MINUTE = 60;
const SECONDS_PER_HOUR = 3600;
const SECONDS_PER_DAY = 86400;
/** A tick lands this many ms after the second has changed, so it never comes a hair too early. */
const TICK_MARGIN = 5;

const endTimeOf = (until: CountdownTarget): { endTime: number; isMoment: boolean } => {
  if (typeof until === 'number') {
    if (!Number.isFinite(until) || until < 0) throw new Error(`morphico: countdown() seconds must be 0 or more — got ${until}`);
    return { endTime: Date.now() + until * 1000, isMoment: false };
  }
  const date = until instanceof Date ? until : typeof until === 'string' ? new Date(until) : null;
  if (!date || Number.isNaN(date.getTime())) {
    throw new Error(`morphico: countdown() counts to a Date, a date string or a number of seconds — got ${String(until)}`);
  }
  return { endTime: date.getTime(), isMoment: true };
};

/** Whole seconds left, rounded up: 4.2 s left shows as 5 until it is 4. */
const secondsLeft = (endTime: number): number => Math.max(0, Math.ceil((endTime - Date.now()) / 1000));

const formatFor = (seconds: number): Exclude<CountdownFormat, 'auto'> =>
  (seconds >= SECONDS_PER_DAY ? 'd:hh:mm:ss' : seconds >= SECONDS_PER_HOUR ? 'hh:mm:ss' : 'mm:ss');

const twoDigits = (value: number): string => String(value).padStart(2, '0');

/** The time left as text; days are padded to `dayDigits` so the line keeps its width while they count down. */
const formatted = (seconds: number, format: Exclude<CountdownFormat, 'auto'>, dayDigits: number): string => {
  const minutesAndSeconds = (totalMinutes: number) => `${twoDigits(totalMinutes)}:${twoDigits(seconds % SECONDS_PER_MINUTE)}`;
  if (format === 'mm:ss') return minutesAndSeconds(Math.floor(seconds / SECONDS_PER_MINUTE));
  const minutes = Math.floor(seconds / SECONDS_PER_MINUTE) % SECONDS_PER_MINUTE;
  if (format === 'hh:mm:ss') return `${twoDigits(Math.floor(seconds / SECONDS_PER_HOUR))}:${minutesAndSeconds(minutes)}`;
  const hours = Math.floor(seconds / SECONDS_PER_HOUR) % 24;
  const days = String(Math.floor(seconds / SECONDS_PER_DAY)).padStart(dayDigits, '0');
  return `${days}:${twoDigits(hours)}:${minutesAndSeconds(minutes)}`;
};

/** Adds a counting line of morphing digits to `element`, counting to (or for) `until`. */
export const countdown = (element: Element, until: CountdownTarget, options: CountdownOptions): Countdown => {
  const { format: chosenFormat = 'auto', onEnd, ...textOptions } = options;
  let { endTime, isMoment } = endTimeOf(until);
  let format = formatFor(0);
  let dayDigits = 1;
  /** Picks the format from the time left now (see CountdownFormat). */
  const fixFormat = (): void => {
    const seconds = secondsLeft(endTime);
    format = chosenFormat === 'auto' ? formatFor(seconds) : chosenFormat;
    dayDigits = Math.max(1, String(Math.floor(seconds / SECONDS_PER_DAY)).length);
  };
  fixFormat();

  let shown = formatted(secondsLeft(endTime), format, dayDigits);
  const line = text(element, shown, textOptions);
  let timer: ReturnType<typeof setTimeout> | undefined;
  let pausedTimeLeft: number | null = null;
  let ended = false;
  let destroyed = false;

  const tick = (): void => {
    timer = undefined;
    const seconds = secondsLeft(endTime);
    const value = formatted(seconds, format, dayDigits);
    if (value !== shown) {
      shown = value;
      void line.to(value);
    }
    if (seconds === 0) {
      ended = true;
      // after the caller has its countdown (the moment may have passed already)
      queueMicrotask(() => { if (!destroyed) onEnd?.(); });
      return;
    }
    // the next whole second: when the time left drops to seconds − 1
    timer = setTimeout(tick, endTime - Date.now() - (seconds - 1) * 1000 + TICK_MARGIN);
  };

  const stop = (): void => {
    clearTimeout(timer);
    timer = undefined;
  };

  tick();

  return {
    to(nextUntil) {
      ({ endTime, isMoment } = endTimeOf(nextUntil));
      stop();
      pausedTimeLeft = null;
      ended = false;
      fixFormat();
      tick();
    },
    pause() {
      if (pausedTimeLeft !== null || ended) return;
      stop();
      pausedTimeLeft = endTime - Date.now();
    },
    resume() {
      if (pausedTimeLeft === null) return;
      if (!isMoment) endTime = Date.now() + pausedTimeLeft;
      pausedTimeLeft = null;
      tick();
    },
    destroy() {
      destroyed = true;
      stop();
      line.destroy();
    },
  };
};
