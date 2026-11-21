# ANATOMY — Interactive Anatomy Atlas

ANATOMY is a React + TypeScript anatomy learning prototype with a live WebGL viewport and an individually selectable, source-attributed 242-structure skeleton.

## Requirements and local development

- Node.js 20.19+ (or a current LTS release)
- npm

```bash
npm install
npm run dev
```

Open the local URL printed by Vite (normally http://localhost:5173).

## Checks

```bash
npm run typecheck
npm run build
npm run test:e2e
```

The browser tests use Playwright and Chromium. Install Chromium once with `npx playwright install chromium` if it is not already available.

## Atlas

- The model has 242 selectable structures: bones, costal cartilages, and intervertebral discs. This is not a count of 242 bones.
- Structures are organized by system, region, and source subgroup, with separate left and right records where the source provides them.
- The skull region exposes 8 cranial-bone and 14 facial-bone records as separate Atlas groups. The hyoid is placed in the Neck region based on its source description; its original source grouping remains in the source metadata.
- Select structures in 3D or in the searchable index. Region filters frame the matching geometry; hide/show, isolation, opacity, camera orbit, zoom, and pan are available.
- The application preserves the six original facial-structure ANATOMY IDs and assigns application-owned stable IDs to the remaining source structures.

## Skull Challenge

- The first playable challenge covers 14 cranial and facial bone names using 22 independently mapped source structures from the bundled GLB.
- Paired left/right bones keep separate geometry and application IDs, highlight together, and accept their shared bone name.
- The session has cranial, major facial, and smaller facial stages, a name-free real-geometry preview of the next target, hints, answer feedback, replay, and keyboard/touch input.
- Results exist only for the current session. No challenge history, accuracy, timing, or persistent progress statistics are recorded or displayed; Progress remains unavailable.
- Challenge geometry is attributed to BodyParts3D 3.0 and its CC BY-SA 2.1 Japan license, with the upstream OrganUI adaptation documented in the bundled asset records.

## Model provenance and scope

The bundled GLB is the pinned OrganUI Skeleton adaptation of BodyParts3D 3.0. It is 5,221,116 bytes and contains 242 manifest-matched mesh nodes. The source subset is simplified to 277,228 triangles and is an adult-male reference model, not patient-specific or expert-reviewed.

The model omits the coccyx, teeth, and ear ossicles; hip bones are combined meshes, foot sesamoids are combined per foot, and the source describes its lower costal-cartilage interpretation as inferred. See [the asset documentation](./public/assets/anatomy/bodyparts3d/skeleton-3.0/README.md), [upstream attribution and modifications](./public/assets/anatomy/bodyparts3d/skeleton-3.0/UPSTREAM-ATTRIBUTION.md), and the [pinned manifest](./public/assets/anatomy/bodyparts3d/skeleton-3.0/manifest.json).

The model is licensed under [CC BY-SA 2.1 Japan](https://creativecommons.org/licenses/by-sa/2.1/jp/deed.en). Required credit: “BodyParts3D, © The Database Center for Life Science licensed under CC Attribution-Share Alike 2.1 Japan.” The catalog descriptions and names are derived from OrganUI metadata under its MIT license, provided separately at [ORGANUI-LICENSE.txt](./public/assets/anatomy/bodyparts3d/skeleton-3.0/ORGANUI-LICENSE.txt). These licenses are distinct; the MIT license does not relicense the model.

The source metadata is retained in [skeleton-structures.json](./src/data/skeleton-structures.json). No anatomy or relationships are inferred for missing source records. Educational use only; not for clinical use.

## Data and rendering foundations

- Catalog identity uses the application-owned `anatomy:` namespace, separate from FMA and BodyParts3D identifiers. Catalog validation checks identity fields, duplicate external identifiers, mesh associations, supported formats, and relationship targets.
- The GLB is requested and parsed once per active Atlas or Challenge session. Its structure IDs and external identifiers are checked against the catalog before meshes become interactive; the Challenge's target and preview share that parsed model.
- Parsed model geometries, materials, and textures are disposed when the viewport is removed. The viewport is a lazy JavaScript module.
- Learning progress and additional anatomical systems remain future work.
