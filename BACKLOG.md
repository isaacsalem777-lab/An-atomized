# ANATOMY Development Backlog

Prioritized for a scientifically grounded anatomy platform. Do not silently
reorder priorities; explain any reprioritization in the note below.

## Current state

- Explore is the default screen and uses the Obsidian Atrium visual direction.
- The only bundled anatomy asset is a partial six-bone skull subset from
  BodyParts3D. No relationships are currently asserted in the catalog.
- Anatomy IDs are application-owned, namespaced, and validated separately
  from external identifiers. Mesh associations support multiple meshes per
  structure.
- Catalog construction validates required fields, catalog-wide anatomy and
  external ID uniqueness, mesh associations, supported formats, and
  relationship targets. Optional reference content is shown as unavailable
  when absent; the six current records remain the only anatomy data.
- Asset loading/recovery and interaction controls are implemented for the
  current six meshes. Parsed GPU geometry and materials are disposed when the
  viewport is removed; WebGL support is determined by the actual renderer.
- The six bundled OBJ files total 2,332,482 bytes (about 2.33 MB) and load as
  separate requests; parsing runs on the main thread.
- The viewport is a lazy JavaScript chunk: the application entry is 167.57 kB
  minified (53.04 kB gzip) and the viewport chunk is 858.72 kB minified
  (232.14 kB gzip). The viewport still exceeds Vite's 500 kB advisory
  threshold. A manual vendor split isolated a 696 kB Three.js chunk without
  reducing the combined gzip size, so that experiment was reverted.
- Challenge gameplay and progress tracking are not implemented. Do not add
  simulated performance data.

## Priorities

### 1. Qualify the next anatomical dataset

- **Why it matters:** Any model expansion must be scientifically reviewed and
  legally usable, not assembled from unverified or approximate geometry.
- **Work:** Identify a candidate dataset, then verify its source, license,
  attribution obligations, anatomical coverage, mesh inventory, coordinate
  system, file sizes, and intended redistribution rights before importing it.
- **Verify completion:** Record provenance and review evidence; resolve
  licensing and quality blockers before approval. Do not add unapproved assets.

### 2. Measure and prepare the large-model loading path

- **Why it matters:** The current per-file OBJ fetch and main-thread parsing
  path is suitable only for the small prototype and has not been measured at
  catalog scale.
- **Work:** Benchmark approved candidate assets on desktop and mobile. Based
  on results, implement only the required improvements among progressive or
  on-demand loading, worker-based parsing, GPU-resource budgeting, and
  accelerated picking.
- **Verify completion:** Report reproducible load/interaction measurements,
  preserve failure recovery and selectable IDs, and test cleanup when systems
  or viewport content are unloaded.

### 3. Add source-grounded reference content

- **Why it matters:** Anatomical descriptions and relationships need explicit
  evidence; missing information must remain visibly missing.
- **Work:** Add references and relationship records only after checking them
  against authoritative sources. Preserve optional metadata and external IDs
  without conflating them with application-owned IDs.
- **Verify completion:** Every new claim has a recorded source and review
  status; catalog validation rejects duplicate identities and unresolved
  relationship targets.

### 4. Integrate one reviewed anatomical system at a time

- **Why it matters:** A complete anatomy platform needs broader systems while
  retaining trustworthy segmentation, laterality, and identity mapping.
- **Depends on:** Priorities 1-3.
- **Work:** Add only the approved asset and the structures it can support.
  Keep multiple meshes associated with one anatomy ID when the source
  requires it; do not imply coverage the model does not provide.
- **Verify completion:** Validate mesh coverage, laterality, attribution,
  selected-structure mapping, loading cost, and reference provenance before
  enabling each subset.

### 5. Implement a complete identification-challenge lifecycle

- **Why it matters:** Challenges should test supported structures with
  meaningful correctness feedback, not act as a decorative destination.
- **Depends on:** Reviewed selectable anatomy and accessible structure IDs.
- **Work:** Specify question generation, valid targets, answer handling,
  feedback, advancement, and session completion before implementation.
- **Verify completion:** Tests cover start, correct and incorrect answers,
  unavailable/hidden structures, feedback, and ending or restarting a session.

### 6. Add genuine learning progress

- **Why it matters:** Progress is useful only when derived from actual,
  completed learning sessions.
- **Depends on:** Priority 5 produces reliable result events.
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

This backlog replaces an outdated list that described the current skull asset
as an unapproved blockout and put challenge work ahead of catalog/runtime
readiness. The repository already contains a licensed six-bone BodyParts3D
subset, stable identities, loading recovery, and working interactions. The
Obsidian Atrium direction is implemented. Work is therefore sequenced around
qualifying the next data source and measuring the large-model path before
expanding anatomy or building challenges. No additional anatomy, relationships,
or performance data were invented as part of this reprioritization.
