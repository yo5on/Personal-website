// Timeline anchors: one per Maker node (Maker.jsx sets data-point on each node's card).
// Single source of truth for the node count — Scene.tsx derives the frame ranges from it
// (node k sits at frame (k+1)·FRAMES_PER_NODE) and its STOPS list needs the opening stop plus one stop per node.
// Adding/removing a node: change this list, content.js's maker.nodes, and Scene.tsx's STOPS together.
export const FOCUS_POINTS = ['focus-1', 'focus-2', 'focus-3', 'focus-4', 'focus-5'] as const

// Frames each timeline node occupies on the camera path.
export const FRAMES_PER_NODE = 50
