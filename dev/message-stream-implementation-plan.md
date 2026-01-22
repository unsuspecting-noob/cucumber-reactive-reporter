# Event-Driven Input Implementation Plan

## Scope and Inputs
1. Add support for `inputFormat: "message"` (NDJSON event stream).
2. Keep `legacy-json` path unchanged; keep `auto` to route to message/legacy.
3. Document minimum cucumber-js versions for message envelopes.

## Implementation Steps
1. Create `src/parser/cucumberMessageAdapter.mjs` with the standard header and a
   public API like `prepareStoreStateFromMessages(source, options)`.
2. Decide on message mapping strategy:
   - Preferred: use `@cucumber/query` for correlation.
   - Alternative: build explicit maps for gherkin, pickle, testCase, testStep,
     step results, and attachments.
3. Stream NDJSON in `index.mjs` using `readline`; feed envelopes to the adapter
   in order (no full-file load).
4. Build stable feature/scenario IDs that preserve the invariant:
   `scenarioId.startsWith(featureId)` (used by selectors).
5. Map pickles and gherkin nodes into scenario metadata: `name`, `keyword`,
   `line`, `tags`, `type`, `uri`.
6. Map test steps to UI steps with `keyword`, `name`, `line`, `location`,
   `status`, `duration`, `error_message`, `args`, `embeddings`.
7. Normalize attachments:
   - Convert message attachments into the embedding shape expected by
     `Embedding.jsx`.
   - Respect `contentEncoding` and reuse JSON adapter decoding helpers.
8. Finalize counts and totals:
   - `numFailedScenarios`, `numSkippedScenarios`
   - per-scenario `passedSteps`, `skippedSteps`, `failedSteps`
   - `steps.totalDurationNanoSec`
9. Integrate `inputFormat` routing in `prepareStoreState` or add a new entry
   point used by `index.mjs`.
10. Update README/dev docs with message formatter usage.

## Data Shape Targets
- Output must match `prepareStoreState` in `src/parser/cucumberJsonAdapter.mjs`.
- Required step fields: `args`, `embeddings`, `error_message`, `keyword`, `line`,
  `location`, `name`, `status`, `duration`.

## Failure Modes and Mitigations
- Out-of-order or missing envelopes: buffer by ID and finalize at end; emit a
  warning summary.
- Unknown status values: map to `failed` (and keep raw for debugging).
- Attachments with unsupported encoding: keep raw `data`, avoid decoding.
- Hook steps: mark as `Before`/`After` and set `hidden` if needed.
- Large runs: stream input, avoid retaining all envelopes.

## Test Plan
- NDJSON parsing: valid lines + malformed line handling.
- Scenario outline mapping via pickles.
- Hook step mapping with correct step counts.
- Attachments for `BASE64` and `IDENTITY`.
- `inputFormat: "auto"` routing for message vs legacy JSON.
