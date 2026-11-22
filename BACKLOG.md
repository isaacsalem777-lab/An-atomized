# An-Atomized Development Backlog

Prioritized for a scientifically grounded anatomy platform. Do not silently
reorder priorities; explain any reprioritization in the note below.

## Current state

- Atlas uses the Obsidian Atrium visual direction and the BodyParts3D 3.0
  skeleton adaptation.
- The pinned model contains 242 selectable structures, including bones,
  costal cartilages, and intervertebral discs. Source identifiers, names,
  regions, notes, attribution, and license details are retained.
- The model is loaded and parsed once as a GLB; all 242 node IDs and external
  identifiers are checked against the application catalog before display.
  Selection, highlighting, hover, visibility, isolation, opacity, search,
  filtering, and camera controls operate on individual structure records.
- The six facial structures from the prototype retain their original
  application-owned IDs. Left/right records remain distinct where present in
  the source. No unsupported relationships have been added.
- The Atlas index groups structures by region and source subgroup. Its skull
  region contains 8 cranial-bone records and 14 facial-bone records. The hyoid
  is placed in the Neck region based on the source description; its original
  source grouping is retained in the source metadata.
- The skull identification session is playable end to end across three stages:
  14 answer targets cover all 22 cataloged cranial and facial structures.
  Paired source meshes highlight independently but accept a shared answer;
  results remain session-only and are not presented as saved learning progress.
- The source subset is incomplete and simplified: it omits the coccyx, teeth,
  and ear ossicles; hip bones and foot sesamoids are combined meshes; the
  lower costal-cartilage interpretation is inferred by the source. It is an
  adult-male reference model without expert review.
- Progress tracking is not implemented. Do not add simulated performance data.

## Priorities

### Completed milestone: skull identification challenge

- **Delivered:** Three ordered stages, 14 canonical answers mapped to 22 real
  skull records, paired-structure highlighting, next-target preview, hints,
  answer feedback, completion, replay, and responsive on-screen keyboard.
- **Verification:** End-to-end tests exercise every target, incorrect-answer
  retention, paired mappings, keyboard input, mobile width, and full replay.
  The viewport and preview share the validated GLB parse; no progress metrics
  are persisted or fabricated.

### 1. Add source-grounded reference content

- **Why it matters:** Descriptions, functions, and relationships need
  traceable evidence; missing information must remain visibly missing.
- **Work:** Add reference records only after checking authoritative sources.
  Record source and review status and keep external identifiers distinct from
  application-owned identity.
- **Verify completion:** Tests validate provenance fields, duplicate
  identities, and relationship targets; every new anatomical claim has an
  attributable source.

### 2. Qualify additional anatomical coverage

- **Why it matters:** The current 242-structure model is a curated partial
  skeleton, not a complete skeleton or full-body model.
- **Work:** Evaluate candidate datasets for licensing, attribution,
  segmentation, coordinate system, completeness, and expert review before
  importing them. Do not fill source omissions with invented geometry.
- **Verify completion:** Document provenance and limitations, validate
  identity mappings, and preserve separate left/right structures and
  multi-mesh associations where the source supports them.

### 3. Expand Atlas to additional anatomical systems

- **Why it matters:** The eventual Atlas must support the systems listed in
  the product specification, not imply that skeletal coverage is complete.
- **Work:** Integrate real, licensed geometry and source-grounded metadata
  system by system, retaining missing-data boundaries.
- **Verify completion:** Each system has validated geometry-to-structure
  associations, attribution, and honest coverage documentation.

### 4. Add genuine learning progress

- **Why it matters:** Progress is useful only when derived from actual,
  completed learning sessions.
- **Depends on:** Priority 1 produces reliable result events.
- **Work:** Define which results to retain and how users can clear them before
  adding persistence or metrics.
- **Verify completion:** Tests prove every displayed value derives from real
  results and survives the documented lifecycle; no placeholder metrics.

### 5. Measure viewport performance when evidence warrants it

- **Why it matters:** The model has 242 meshes and approximately 277,228
  triangles; optimize only against a demonstrated bottleneck.
- **Work:** Record reproducible startup, rendering, selection, and memory
  measurements on desktop and a representative mobile device.
- **Verify completion:** Confirm viewport framing, recovery, navigation, and
  GPU-resource cleanup. Do not reduce anatomical detail without evidence.

## Verification policy

After each code milestone, run `npm run typecheck`, `npm run build`,
`npm run test:e2e`, and `git diff --check`. Inspect visual changes at desktop
and mobile sizes. Stop and resolve a failed check before starting another
implementation milestone.

## Reprioritization note

The product specification prioritizes actual anatomical content and complete
learning experiences. The skull challenge is now complete against the
integrated geometry; the next highest-value work is to improve source-grounded
reference content and qualify additional real skeletal coverage. Documented
omissions remain explicit rather than being filled with unverified anatomy.
