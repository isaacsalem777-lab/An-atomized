# ANATOMY — Stage 2: Interactive Segmented Skull

A React + TypeScript anatomy-learning prototype with a live WebGL viewport using six independently selectable BodyParts3D skull meshes.

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

## Checks
Run the TypeScript check and production build with:
```bash
npm run typecheck
npm run build
```

The browser smoke tests use Playwright and Chromium. Install the browser once with
`npx playwright install chromium`, then run:
```bash
npm run test:e2e
```

## What's new in Stage 2
- Replaced the primitive skull blockout with the frontal bone, left and right zygomatic bones, left and right maxillae, and mandible.
- Each source mesh remains independently selectable, with hover and teal selection highlights.
- Application-owned anatomy IDs are independent of source meshes; FMA identifiers remain external references in the structure panel.
- Each anatomy record declares its mesh associations, including source, source mesh ID, format, and URL; association lookup does not depend on array position.
- Anatomy records include laterality, system, region, descriptions, and optional relationship and educational metadata without placeholder records.
- Source mesh IDs and FMA identifiers are shown in the structure reference panel.
- The viewport reports model-loading progress and isolates missing, invalid, or failed OBJ assets; failed meshes can be retried.
- WebGL 2 availability is checked before rendering, with recovery guidance if the renderer cannot start.
- Orbit the skull with left-click drag, zoom with the mouse wheel, and pan with right-click drag.
- Camera reset and zoom controls are available in the viewport.
- Existing application layout and reference panel are retained.

## Asset provenance and scope
The six unmodified OBJ source meshes are from BodyParts3D release 4.0. They are centered, rotated, and scaled at render time only; the source geometry is not destructively modified.

| Structure | FMA identifier | BodyParts3D mesh |
| --- | --- | --- |
| Frontal bone | FMA52734 | FJ3200 |
| Left zygomatic bone | FMA52893 | FJ3287 |
| Right zygomatic bone | FMA52892 | FJ3392 |
| Left maxilla | FMA53650 | FJ3269 |
| Right maxilla | FMA53649 | FJ3375 |
| Mandible | FMA52748 | FJ3289 |

BodyParts3D, © The Database Center for Life Science licensed under CC Attribution 4.0 International. See [the bundled attribution file](./public/assets/anatomy/bodyparts3d/ATTRIBUTION.txt) and [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/).

This is a partial skull subset from a 2013 dataset release. It supports broad educational identification of these six bones only; it is not a complete skull, does not guarantee fine anatomical landmarks, and must not be used for clinical, diagnostic, or assessment purposes.
