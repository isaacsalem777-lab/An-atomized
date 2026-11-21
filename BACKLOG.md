# ANATOMY Development Backlog

Prioritized toward a medically grounded, interactive anatomy challenge
simulator. Keep this list editable; do not silently reorder it. Explain any
reprioritization before changing the order.

## Priorities

### 1. Qualify and approve the first segmented cranial asset

- **Why it matters:** Anatomical interaction and challenge accuracy depend on
  reviewed structures, not the current primitive blockout.
- **Depends on:** Initial source research is complete; the specific source and
  asset still need selection and approval.
- **Files/systems:** No application code or asset files until approval. Record
  source, exact license, required attribution, mesh inventory, provenance, and
  review results with the chosen asset.
- **Verify completion:** Confirm the license covers intended use and
  redistribution; review anatomical boundaries and mesh names; measure file
  size and render cost; document unresolved quality or licensing concerns.

### 2. Replace the skull blockout with the approved asset and stable mapping

- **Why it matters:** A stable mapping from atlas IDs to segmented meshes is
  the foundation for accurate selection, highlighting, and anatomy questions.
- **Depends on:** Priority 1 is approved and its mesh inventory is available.
- **Files/systems:** `src/data/anatomy.ts`,
  `src/components/Viewport.tsx`, the approved model under `public/`, and
  focused browser tests. Add a shared loader only if the existing structure
  cannot support the asset cleanly.
- **Verify completion:** Every displayed structure resolves to its stable ID
  and one or more named meshes; clicking each represented structure updates
  the correct atlas record; no required mapping is missing or ambiguous.

### 3. Add explicit model loading and failure states

- **Why it matters:** Users need clear feedback when an asset fails to load or
  WebGL is unavailable; a broken model must not look like a successful session.
- **Depends on:** Priority 2 establishes the actual model-loading path.
- **Files/systems:** `src/components/Viewport.tsx` and focused browser tests;
  add a small fallback component only if needed.
- **Verify completion:** Tests cover loading, load failure, and unavailable
  WebGL behavior, with a clear recovery or explanation for each failure.

### 4. Make structure selection accessible and consistent

- **Why it matters:** Reliable identification practice must work beyond
  pointer clicks and keep the model, atlas panel, and selected ID in sync.
- **Depends on:** Priority 2 provides stable structure IDs and mesh mapping.
- **Files/systems:** `src/App.tsx`, `src/components/Viewport.tsx`,
  `src/data/anatomy.ts`, and browser tests.
- **Verify completion:** Keyboard and atlas-panel selection resolve to the
  same structure as 3D picking; selected structure and details remain
  synchronized.

### 5. Implement the challenge question and answer lifecycle

- **Why it matters:** This turns the current visual challenge into a usable
  learning feature with meaningful correctness feedback.
- **Depends on:** Priorities 2 and 4; questions must reference selectable,
  accessible anatomy IDs.
- **Files/systems:** `src/App.tsx`, anatomy data, and focused browser tests.
  Keep logic in the existing structure unless a concrete need requires
  extraction.
- **Verify completion:** Tests cover question start, valid target selection,
  correct and incorrect answers, feedback, and advancing or ending a session.

### 6. Replace placeholder statistics with real progress

- **Why it matters:** Scores, streaks, and timing are useful only when derived
  from completed challenge results.
- **Depends on:** Priority 5 produces reliable answer and timing events.
- **Files/systems:** Challenge state in `src/App.tsx`, progress display, and
  tests; add persistence only with the first real progress workflow.
- **Verify completion:** Tests verify score, streak, and elapsed-time updates,
  plus persistence and reload behavior if progress is stored locally.

### 7. Expand to muscles, organs, and cardiovascular anatomy

- **Why it matters:** Broader systems are necessary for the complete simulator,
  but each must retain trustworthy segmentation and structure-level selection.
- **Depends on:** Priorities 1-4 establish the asset review, mapping, runtime,
  and selection foundation.
- **Scheduling note:** Although it does not technically depend on the challenge
  and progress features, it follows them so the first anatomy system has one
  complete learning loop before the atlas expands.
- **Files/systems:** Approved system-specific assets and attribution records,
  `src/data/anatomy.ts`, the model-loading path, and system-specific tests.
- **Verify completion:** Add one reviewed system at a time; verify its license,
  mesh-to-ID coverage, anatomical review, selection behavior, and measured
  runtime cost before adding it to challenges.

## Verification policy

After each code feature, run `npm run typecheck`, `npm run build`, and
`npm run test:e2e`, plus focused visual checks where the 3D scene changes.
Stop on a failed check before starting another backlog item. Avoid polishing
placeholder UI that a higher-priority feature will replace.

## Reprioritization note

This revision explicitly moves asset qualification and replacement of the
primitive blockout ahead of improving mappings for the temporary model. The
previous challenge, statistics, and accessibility items are retained but are
sequenced after the stable asset and selection foundations. No anatomy feature
or asset has been implemented or imported by this backlog update.
