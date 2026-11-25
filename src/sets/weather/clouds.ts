// The weather clouds (Lucide "cloud", the small cloud of "cloud-sun", the open clouds of "cloud-sun-rain",
// "cloud-lightning", "cloud-rain") and their alternative tracings and layouts for the cloud ↔ cloud morphs and the crawl.
import { lucideArc, lucideLine } from '../lucide.ts';

/** Lucide "cloud", clockwise from the bottom right: bottom line, big bump, top line, right bump. */
export const CLOUD = [
  lucideLine(17.5, 19, 9, 19),
  lucideArc(9.0018, 12, 7, 90.0147, 343.3984),
  lucideLine(15.71, 10, 17.5, 10),
  lucideArc(17.5, 14.5, 4.5, -90, 90),
];
/** CLOUD traced from its leftmost point (sunny ↔ cloudy: it slides in from the left, its left side shows last). */
export const CLOUD_FROM_LEFT = [
  lucideArc(9.0018, 12, 7, 180, 343.3984),
  ...CLOUD.slice(2),
  CLOUD[0],
  lucideArc(9.0018, 12, 7, 90.0147, 180),
];
/** Lucide "cloud-sun"'s small cloud, clockwise from the bottom right (the same build as CLOUD). */
export const SMALL_CLOUD = [
  lucideLine(13, 22, 7, 22),
  lucideArc(7.001, 17, 5, 90.0117, 348.463),
  lucideLine(11.9, 16, 13, 16),
  lucideArc(13, 19, 3, -90, 90),
];
/** SMALL_CLOUD traced from its leftmost point (sunny ↔ partly-cloudy: it slides in like the big cloud). */
export const SMALL_CLOUD_FROM_LEFT = [
  lucideArc(7.001, 17, 5, 180, 348.463),
  ...SMALL_CLOUD.slice(2),
  SMALL_CLOUD[0],
  lucideArc(7.001, 17, 5, 90.0117, 180),
];
/** Lucide "cloud-sun-rain"'s cloud: SMALL_CLOUD open at the bottom (where the rain falls), from its lower left end. */
export const OPEN_SMALL_CLOUD = [
  lucideArc(7.0014, 17.0019, 5, 143.1569, 348.4412),
  lucideLine(11.9, 16, 13, 16),
  lucideArc(13.0044, 19, 3, -90.0842, 48.3025),
];
/** Where SMALL_CLOUD's gap (bottom) has its middle: the gap's two halves pull back into its ends from here. */
export const GAP_MIDDLE_X = 8.77;
// partly-cloudy ↔ showers: the closed cloud traced from the gap's middle — 2 segments to the gap's left end, the open
// cloud's part (4 along the big bump, 1 top line, 3 along the right bump), 2 back to the middle; the open cloud gets
// 2 zero-length segments at each end.
export const CLOSED_FOR_OPEN = {
  tracing: 'small-cloud-from-gap-middle',
  breakpoints: [0, 1, 1.2057, 1.4043, 1.6029, 1.8014, 2, 3, 3.2561, 3.5122, 3.7683, 4, 5],
};
export const OPEN_FOR_CLOSED = { breakpoints: [0, 0, 0, 0.25, 0.5, 0.75, 1, 2, 2.3333, 2.6667, 3, 3, 3] };
/** The same gap on the big CLOUD (its bottom, from 143.16° on the big bump to 48.3° on the right bump). */
export const BIG_GAP_MIDDLE_X = 11.65;
// cloudy ↔ showers: the big cloud traced from its gap's middle, split like CLOSED_FOR_OPEN — it shrinks and opens
export const BIG_CLOSED_FOR_OPEN = {
  tracing: 'cloud-from-gap-middle',
  breakpoints: [0, 1, 1.2097, 1.4073, 1.6049, 1.8024, 2, 3, 3.2561, 3.5122, 3.7683, 4, 5],
};

/** Lucide "cloud-lightning"'s cloud: CLOUD 2 units higher, open at the bottom (where the bolt strikes), from its
 * lower left end. */
export const THUNDER_CLOUD = [
  lucideArc(9.0026, 10.0027, 7, 115.4004, 343.3756),
  lucideLine(15.71, 8, 17.5, 8),
  lucideArc(17.5079, 12.5, 4.5, -90.1, 83.7212),
];
/** The middle of CLOUD's part that is missing in THUNDER_CLOUD (its bottom, from 115.4° to 83.7°). */
export const THUNDER_GAP_MIDDLE_X = 11.94;
// cloudy ↔ thunder: CLOUD traced from that middle — 2 segments to the gap's left end, 4 along the big bump, 1 top line,
// 3 along the right bump, 2 back to the middle; the open cloud gets 2 zero-length segments at each end (OPEN_FOR_CLOSED).
export const CLOUD_FROM_THUNDER_GAP_MIDDLE = [
  lucideLine(THUNDER_GAP_MIDDLE_X, 19, 9, 19),
  ...CLOUD.slice(1),
  lucideLine(17.5, 19, THUNDER_GAP_MIDDLE_X, 19),
];
export const CLOUD_FOR_THUNDER = {
  tracing: 'cloud-from-thunder-gap-middle',
  breakpoints: [0, 1, 1.1002, 1.3252, 1.5501, 1.7751, 2, 3, 3.3217, 3.6434, 3.9651, 4, 5],
};
/** sunny ↔ thunder: THUNDER_CLOUD split at its leftmost point — the rest (from there over the top), and its lower
 * left end (from there down), each running away from the left side so the crawl shows one stretch of it. */
export const THUNDER_CLOUD_FROM_LEFT = [
  lucideArc(9.0026, 10.0027, 7, 180, 343.3756),
  ...THUNDER_CLOUD.slice(1),
];
export const THUNDER_CLOUD_LEFT_END = [lucideArc(9.0026, 10.0027, 7, 180, 115.4004)];
/** Lucide "cloud-rain"'s cloud (also "cloud-snow", "cloud-drizzle"): THUNDER_CLOUD with a wider gap, from its lower
 * left end. */
export const RAIN_CLOUD = [
  lucideArc(9.0026, 10.0027, 7, 135.615, 343.3757),
  lucideLine(15.71, 8, 17.5, 8),
  lucideArc(17.5005, 12.5, 4.5, -90.0065, 56.2589),
];
/** The middle of CLOUD's part that is missing in RAIN_CLOUD (its bottom, from 135.6° to 56.3°). */
export const RAIN_GAP_MIDDLE_X = 11.79;
export const CLOUD_FROM_RAIN_GAP_MIDDLE = [
  lucideLine(RAIN_GAP_MIDDLE_X, 19, 9, 19),
  ...CLOUD.slice(1),
  lucideLine(17.5, 19, RAIN_GAP_MIDDLE_X, 19),
];
// cloudy ↔ rain: split like CLOUD_FOR_THUNDER (2 | 4 big bump | 1 | 3 right bump | 2), RAIN_CLOUD with OPEN_FOR_CLOSED
export const CLOUD_FOR_RAIN = {
  tracing: 'cloud-from-rain-gap-middle',
  breakpoints: [0, 1, 1.18, 1.385, 1.59, 1.795, 2, 3, 3.2709, 3.5417, 3.8126, 4, 5],
};
/** sunny ↔ rain: RAIN_CLOUD split at its leftmost point, like THUNDER_CLOUD_FROM_LEFT / THUNDER_CLOUD_LEFT_END. */
export const RAIN_CLOUD_FROM_LEFT = [lucideArc(9.0026, 10.0027, 7, 180, 343.3757), ...RAIN_CLOUD.slice(1)];
export const RAIN_CLOUD_LEFT_END = [lucideArc(9.0026, 10.0027, 7, 180, 135.615)];
