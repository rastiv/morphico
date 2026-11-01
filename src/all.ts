// Every built-in set by name — `import { iconSets } from 'morphico/all'` (and `morphico.iconSets` in the classic script).
// Imports every set: for pages that pick sets at run time. Others import single sets (`morphico/sets/<name>`), so a
// bundler only keeps those.
import { iconsCheckbox } from './sets/checkbox.ts';
import { digitsCondensed } from './sets/condensed.ts';
import { iconsFolder } from './sets/folder.ts';
import { digitsHandwritten } from './sets/handwritten.ts';
import { iconsMedia } from './sets/media.ts';
import { iconsRadio } from './sets/radio.ts';
import { iconsMenu } from './sets/menu.ts';
import { digitsRound } from './sets/round.ts';
import { digitsSlim } from './sets/slim.ts';
import { digitsSquare } from './sets/square.ts';
import { iconsTheme } from './sets/theme.ts';
import { iconsWeather } from './sets/weather.ts';
import { iconsEye } from './sets/eye.ts';
import { iconsVolume } from './sets/volume.ts';
import { iconsToggle } from './sets/toggle.ts';
import { iconsLock } from './sets/lock.ts';
import { iconsBell } from './sets/bell.ts';
import { iconsMic } from './sets/mic.ts';
import { iconsChevron } from './sets/chevron.ts';
import { iconsCopy } from './sets/copy.ts';
import { iconsWifi } from './sets/wifi.ts';
import { iconsBattery } from './sets/battery.ts';
import type { IconSet } from './types.ts';

export const iconSets = {
  round: digitsRound,
  square: digitsSquare,
  condensed: digitsCondensed,
  slim: digitsSlim,
  handwritten: digitsHandwritten,
  media: iconsMedia,
  menu: iconsMenu,
  checkbox: iconsCheckbox,
  radio: iconsRadio,
  folder: iconsFolder,
  theme: iconsTheme,
  weather: iconsWeather,
  eye: iconsEye,
  volume: iconsVolume,
  toggle: iconsToggle,
  lock: iconsLock,
  bell: iconsBell,
  mic: iconsMic,
  chevron: iconsChevron,
  copy: iconsCopy,
  wifi: iconsWifi,
  battery: iconsBattery,
} satisfies Record<string, IconSet>;

export type IconSetName = keyof typeof iconSets;

