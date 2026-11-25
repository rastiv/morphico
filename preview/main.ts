// Preview page (dev only, not published). Served as JavaScript by tools/serve.ts.
// Four tabs: Digits (digit sets + the text line), Icons (icon families), Clip (clip.ts: an element cut out by a
// morphing shape) and Face (face.ts). The Digits / Icons tabs: sets.ts (tabs and set chips), stage.ts (the big icon,
// state buttons, Motion panel), style-panel.ts (overrides the set's own look the same way the library options do:
// strokeWidth, lineCap, lineJoin, fill, roundness), text-line.ts (text()); current.ts holds what they show.
import './clip.ts';
import './face.ts';
import type { Tab } from './current.ts';
import { settings } from './page.ts';
import { loadIconSet, selectTab } from './sets.ts';
import { whenRoundnessChanges } from './style-panel.ts';

whenRoundnessChanges(() => loadIconSet(true));

// the address (#digits / #icons / #clip / #face) wins over the remembered tab
const TABS: Tab[] = ['digits', 'icons', 'clip', 'face'];
const startTab = location.hash.slice(1) || settings.read('tab');
selectTab(TABS.find((someTab) => someTab === startTab) ?? 'digits');
