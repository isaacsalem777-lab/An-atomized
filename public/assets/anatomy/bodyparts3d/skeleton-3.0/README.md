# BodyParts3D 3.0 skeleton asset

This directory contains the pinned OrganUI Skeleton adaptation of BodyParts3D 3.0 and its source manifest. The model contains **242 selectable structures**: bones, costal cartilages, and intervertebral discs. It is not a count of 242 bones.

## Provenance and licenses

- Original dataset: BodyParts3D 3.0 (20110915), from The Database Center for Life Science.
- The model and its adaptations are licensed under [CC BY-SA 2.1 Japan](https://creativecommons.org/licenses/by-sa/2.1/jp/deed.en). Required credit: “BodyParts3D, © The Database Center for Life Science licensed under CC Attribution-Share Alike 2.1 Japan.”
- OrganUI's pinned upstream revision is `120fc17278559057b37aff516eee89d263b604c6`. Its model provenance, modification history, upstream credit, and source dataset commit are recorded in [UPSTREAM-ATTRIBUTION.md](./UPSTREAM-ATTRIBUTION.md).
- The structure names and descriptions in `src/data/skeleton-structures.json` are derived from OrganUI's `src/anatomy.ts`. That metadata is provided under the upstream project's MIT license, included as [ORGANUI-LICENSE.txt](./ORGANUI-LICENSE.txt). This MIT license does not apply to the model.
- The checked-in `manifest.json` identifies all 242 model nodes, external identifiers, source names, per-input checksums, and the transformed asset checksum. `selected-parts.tsv` is the source selection table.

OrganUI selected and converted source meshes, welded duplicate vertices, simplified the model from approximately 2,135,400 to 277,228 triangles, centered and scaled it, converted the axes to Y-up, recalculated smooth normals, and assigned illustrative colors. ANATOMY retains the geometry and source identifiers but displays it with a neutral ivory material. The bundled GLB is 5,221,116 bytes with SHA-256 `c68b05d97d70c4d33363bf71d9885c191eb25f61a82dbba935a726ddd8e60ac8`.

## Coverage and limitations

- The source subset omits the coccyx, teeth, and ear ossicles.
- Each hip bone is represented by a combined mesh. Foot sesamoids are combined per foot.
- The source describes its lower costal-cartilage interpretation as inferred.
- This is a simplified single adult-male reference model, not an expert-reviewed or patient-specific model. It is for educational exploration, not clinical use.

Do not infer missing anatomy or relationships from this subset. The ANATOMY catalog preserves the source's identifiers and notes and assigns separate application-owned IDs.
