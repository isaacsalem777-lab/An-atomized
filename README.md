# ANATOMY — Interactive Skull Explorer

A React + TypeScript anatomy exploration prototype with a live WebGL viewport using six independently selectable BodyParts3D skull meshes.

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

## Explore
- Explore is the default screen and centers the interactive 3D viewport with a synchronized structure reference and index.
- The current model contains only the frontal bone, left and right zygomatic bones, left and right maxillae, and mandible. It is not a complete skull or a full-body anatomy model.
- Structures can be selected in the model or index, searched by name or identifier, hidden/restored, isolated, and made transparent.
- System and region filters are derived from the anatomy records currently available.
- Orbit the model by dragging, zoom with the mouse wheel, and pan with right-drag. Accessible camera reset, zoom, wireframe, and label controls are in the viewport.
- Loading progress, individual asset failures, retry, and WebGL recovery guidance are supported.
- Challenge and Progress are future destinations. Challenge gameplay and result tracking are not implemented; no performance statistics are displayed.
- Anatomy records use stable application-owned IDs and explicit mesh associations. FMA identifiers remain external references.

## Data and rendering foundations
- Anatomy IDs use the application-owned `anatomy:` namespace and are branded
  separately from external identifiers. Catalog construction checks required
  identity fields, duplicate IDs and mesh associations, supported formats, and
  relationship targets.
- A structure can reference multiple mesh associations. Descriptions,
  locations, and functions are optional; missing reference text is presented
  as unavailable rather than invented.
- The 3D viewport is loaded as a separate JavaScript module. Parsed model
  geometries and materials are disposed when the viewport is removed.
- The current runtime still fetches individual OBJ files and parses them on the
  main thread. The six-mesh prototype has not been benchmarked for large
  catalogs; worker-based parsing, progressive asset loading, and accelerated
  picking require measurement before expansion.

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
