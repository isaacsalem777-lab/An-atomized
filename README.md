# ANATOMY — Stage 2: Interactive 3D Skull Blockout

A React + TypeScript anatomy-learning prototype with a live WebGL viewport.

## Requirements
- Node.js 20.19+ (or a current LTS release)
- npm

## Run locally
Open a terminal in this folder and run:
```bash
npm install
npm run dev
```
Open the local URL printed by Vite (normally http://localhost:5173).

## What's new in Stage 2
- Replaced the SVG illustration with a real Three.js / React Three Fiber 3D scene.
- Orbit the skull with left-click drag, zoom with the mouse wheel, and pan with right-click drag.
- Click the frontal bone, zygomatic bones, maxilla, or mandible to select the corresponding study structure.
- Selected geometry receives a teal highlight; hover feedback and a wireframe toggle are included.
- Camera reset and zoom controls are available in the viewport.
- Existing application layout and reference panel are retained.

## Important anatomical scope note
The current skull is a hand-built 3D blockout made from separate primitive meshes. It is genuinely 3D and interactive, but its proportions and bone boundaries are approximate. It is **not** a validated anatomical model and must not be used for clinical, diagnostic, or assessment purposes. The dark orbital/nasal insets are visual depth cues rather than true cut-through cavities. The next milestone should replace this blockout with a properly licensed, segmented anatomical mesh and map its mesh identifiers to the anatomy atlas.
