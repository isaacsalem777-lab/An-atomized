# ANATOMY Development Backlog

Prioritized for a scientifically grounded anatomy platform. Do not silently
reorder priorities; explain any reprioritization in the note below.

## Current state

- Explore uses the Obsidian Atrium visual direction and the BodyParts3D 3.0
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
- The source subset is incomplete and simplified: it omits the coccyx, teeth,
  and ear ossicles; hip bones and foot sesamoids are combined meshes; the
  lower costal-cartilage interpretation is inferred by the source. It is an
  adult-male reference model without expert review.
- Challenge gameplay and Progress tracking are not implemented. Do not add
  simulated performance data.

## Priorities

### 1. Measure the skeleton viewport on desktop and mobile

- **Why it matters:** The new model has 242 meshes and approximately 277,228
  triangles; verify actual startup, rendering, selection, and memory behavior
  before expanding the catalog.
- **Work:** Record reproducible load and interaction measurements on desktop
  and a representative mobile device. Investigate lazy GLTF parsing, resource
  budgeting, and raycast cost only if measurements identify a bottleneck.
- **Verify completion:** Test large and small viewport framing, repeated
  Explore navigation, failure recovery, and GPU-resource cleanup. Do not
  trade away anatomical detail without evidence.

### 2. Add source-grounded reference content

- **Why it matters:** Descriptions, functions, and relationships need
  traceable evidence; missing information must remain visibly missing.
- **Work:** Add reference records only after checking authoritative sources.
  Record source and review status and keep external identifiers distinct from
  application-owned identity.
- **Verify completion:** Tests validate provenance fields, duplicate
  identities, and relationship targets; every new anatomical claim has an
  attributable source.

### 3. Qualify additional anatomical coverage

- **Why it matters:** The current 242-structure model is a curated partial
  skeleton, not a complete skeleton or full-body model.
- **Work:** Evaluate candidate datasets for licensing, attribution,
  segmentation, coordinate system, completeness, and expert review before
  importing them. Do not fill source omissions with invented geometry.
- **Verify completion:** Document provenance and limitations, validate
  identity mappings, and preserve separate left/right structures and
  multi-mesh associations where the source supports them.

### 4. Implement a complete identification-challenge lifecycle

- **Why it matters:** Challenges should test supported structures with
  meaningful correctness feedback, not act as a decorative destination.
- **Depends on:** Reviewed selectable anatomy and accessible structure IDs.
- **Work:** Specify question generation, valid targets, answer handling,
  feedback, advancement, and session completion before implementation.
- **Verify completion:** Tests cover start, correct and incorrect answers,
  unavailable/hidden structures, feedback, and ending or restarting a session.

### 5. Add genuine learning progress

- **Why it matters:** Progress is useful only when derived from actual,
  completed learning sessions.
- **Depends on:** Priority 4 produces reliable result events.
- **Work:** Define which results to retain and how users can clear them before
  adding persistence or metrics.
- **Verify completion:** Tests prove every displayed value derives from real
  results and survives the documented lifecycle; no placeholder metrics.

## Verification policy

After each code milestone, run `npm run typecheck`, `npm run build`,
`npm run test:e2e`, and `git diff --check`. Inspect visual changes at desktop
and mobile sizes. Stop and resolve a failed check before starting another
implementation milestone.

## Reprioritization note

The previously approved full-skeleton integration supersedes the earlier
six-bone-only catalog and dataset-qualification priorities. The selected
BodyParts3D adaptation has been pinned and its license, source metadata,
manifest, and actual GLB contents were verified before import. The next
highest-value work is to measure the integrated viewport and establish
source-backed reference coverage; the model's documented omissions remain
explicit rather than being filled with unverified anatomy.
