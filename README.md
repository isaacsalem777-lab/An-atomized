# ANATOMY — Interactive Skeleton Explorer

ANATOMY is a React + TypeScript anatomy exploration prototype with a live WebGL viewport and an individually selectable 242-structure human skeleton.

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

## Explore

- The model has 242 selectable structures: bones, costal cartilages, and intervertebral discs. This is not a count of 242 bones.
- Structures are organized into skull, spine, thorax, pelvis, upper-limb, and lower-limb regions, with separate left and right records where the source provides them.
- Select structures in 3D or in the searchable index. Hide/show, isolation, opacity, region filtering, camera orbit, zoom, and pan are available.
- The application preserves the six original facial-structure ANATOMY IDs and assigns application-owned stable IDs to the remaining source structures.
- Challenge and Progress are unavailable destinations. Challenge gameplay and result tracking are not implemented; no performance statistics are displayed.

## Model provenance and scope

The bundled GLB is the pinned OrganUI Skeleton adaptation of BodyParts3D 3.0. It is 5,221,116 bytes and contains 242 manifest-matched mesh nodes. The source subset is simplified to 277,228 triangles and is an adult-male reference model, not patient-specific or expert-reviewed.

The model omits the coccyx, teeth, and ear ossicles; hip bones are combined meshes, foot sesamoids are combined per foot, and the source describes its lower costal-cartilage interpretation as inferred. See [the asset documentation](./public/assets/anatomy/bodyparts3d/skeleton-3.0/README.md), [upstream attribution and modifications](./public/assets/anatomy/bodyparts3d/skeleton-3.0/UPSTREAM-ATTRIBUTION.md), and the [pinned manifest](./public/assets/anatomy/bodyparts3d/skeleton-3.0/manifest.json).

The model is licensed under [CC BY-SA 2.1 Japan](https://creativecommons.org/licenses/by-sa/2.1/jp/deed.en). Required credit: “BodyParts3D, © The Database Center for Life Science licensed under CC Attribution-Share Alike 2.1 Japan.” The catalog descriptions and names are derived from OrganUI metadata under its MIT license, provided separately at [ORGANUI-LICENSE.txt](./public/assets/anatomy/bodyparts3d/skeleton-3.0/ORGANUI-LICENSE.txt). These licenses are distinct; the MIT license does not relicense the model.

The source metadata is retained in [skeleton-structures.json](./src/data/skeleton-structures.json). No anatomy or relationships are inferred for missing source records. Educational exploration only; not for clinical use.

## Data and rendering foundations

- Catalog identity uses the application-owned `anatomy:` namespace, separate from FMA and BodyParts3D identifiers. Catalog validation checks identity fields, duplicate external identifiers, mesh associations, supported formats, and relationship targets.
- The GLB is requested and parsed once. Its structure IDs and external identifiers are checked against the catalog before the 242 meshes become interactive.
- Parsed model geometries, materials, and textures are disposed when the viewport is removed. The viewport is a lazy JavaScript module.
- Challenge gameplay, learning progress, and additional anatomical systems remain future work.
