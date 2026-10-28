// The built-in icon sets, by name. `round` is the default.
import { checkboxIcons } from './sets/checkbox.ts';
import { condensedDigits } from './sets/condensed.ts';
import { folderIcons } from './sets/folder.ts';
import { handwrittenDigits } from './sets/handwritten.ts';
import { mediaIcons } from './sets/media.ts';
import { radioIcons } from './sets/radio.ts';
import { menuIcons } from './sets/menu.ts';
import { roundDigits } from './sets/round.ts';
import { slimDigits } from './sets/slim.ts';
import { squareDigits } from './sets/square.ts';
import { themeIcons } from './sets/theme.ts';
import { weatherIcons } from './sets/weather.ts';
import { eyeIcons } from './sets/eye.ts';
import { volumeIcons } from './sets/volume.ts';
import { toggleIcons } from './sets/toggle.ts';
import { lockIcons } from './sets/lock.ts';
import { bellIcons } from './sets/bell.ts';
import { micIcons } from './sets/mic.ts';
import { chevronIcons } from './sets/chevron.ts';
import { copyIcons } from './sets/copy.ts';
import { wifiIcons } from './sets/wifi.ts';
import { batteryIcons } from './sets/battery.ts';
import type { IconSet } from './types.ts';

export const iconSets = {
  round: roundDigits,
  square: squareDigits,
  condensed: condensedDigits,
  slim: slimDigits,
  handwritten: handwrittenDigits,
  media: mediaIcons,
  menu: menuIcons,
  checkbox: checkboxIcons,
  radio: radioIcons,
  folder: folderIcons,
  theme: themeIcons,
  weather: weatherIcons,
  eye: eyeIcons,
  volume: volumeIcons,
  toggle: toggleIcons,
  lock: lockIcons,
  bell: bellIcons,
  mic: micIcons,
  chevron: chevronIcons,
  copy: copyIcons,
  wifi: wifiIcons,
  battery: batteryIcons,
} satisfies Record<string, IconSet>;

export type IconSetName = keyof typeof iconSets;

// sets with sharper corners, built once per set and roundness (so their shapes are computed once too)
const setsByRoundness = new WeakMap<IconSet, Map<number, IconSet>>();

/** A set given by name or as a set object, optionally with sharper corners (`roundness` 0 = sharp … 1 = own). */
export const resolveIconSet = (set: IconSetName | IconSet = 'round', roundness?: number): IconSet => {
  if (typeof set === 'string' && !(set in iconSets)) {
    throw new Error(`morphico: unknown icon set "${set}" (known: ${Object.keys(iconSets).join(', ')})`);
  }
  const iconSet = typeof set === 'string' ? iconSets[set] : set;
  if (roundness === undefined || roundness >= 1) return iconSet; // the own corners are the roundest
  if (!iconSet.withRoundness) throw new Error('morphico: this icon set has no adjustable roundness');
  const clamped = Math.max(0, roundness);
  let byRoundness = setsByRoundness.get(iconSet);
  if (!byRoundness) setsByRoundness.set(iconSet, byRoundness = new Map());
  let sharper = byRoundness.get(clamped);
  if (!sharper) byRoundness.set(clamped, sharper = iconSet.withRoundness(clamped));
  return sharper;
};
