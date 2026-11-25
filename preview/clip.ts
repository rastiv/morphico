// Clip tab of the preview page: the library's clip() on two elements, an <img> and a <div> (any element can be cut
// out). clip-tab/clips.ts holds the clips and what they show, the panels add their controls: shape-buttons.ts,
// placement-controls.ts (motion, rotation, element proportions, position), look-controls.ts.
import { elementSize, fittingSize, imageStage, jumpTo, showControls } from './clip-tab/clips.ts';
import './clip-tab/shape-buttons.ts';
import './clip-tab/placement-controls.ts';
import './clip-tab/look-controls.ts';

// the tab starts hidden (size 0): once the elements have a size, fit the shape and show the controls
let fittedYet = false;
new ResizeObserver(() => {
  if (!elementSize().width) return;
  if (!fittedYet) {
    fittedYet = true;
    jumpTo({ size: fittingSize() });
  }
  showControls();
}).observe(imageStage);
showControls();
