# Playwright BDD Support Upgrade Plan

## Goal
Improve `cucumber-reactive-reporter` so it handles `playwright-bdd` output cleanly without requiring custom patches in the upstream runner or in this reporter's consumers.

This plan is based on a real compatibility spike using `playwright-bdd` Cucumber JSON output and a generated `cucumber-reactive-reporter` report.

## Current Findings

### What already works
- Legacy Cucumber JSON emitted by `playwright-bdd` is already compatible enough to generate a report successfully.
- Screenshot attachments survive end-to-end and render correctly.
- Standard feature/scenario/step fields look like ordinary Cucumber JSON.

### What is unusual in the sample
- Useful runtime artifacts are often attached to hidden `Before` and `After` hook steps.
- Hidden `Before` steps may contain repeated `application/vnd.allure.message+json` attachments.
- Hidden `After` steps may contain the most useful failure artifacts:
  - `image/png`
  - `text/html`
  - `application/json`
  - `text/x.cucumber.log+plain`

### Main compatibility gap
The issue is not core schema compatibility. The issue is that the reporter currently treats several `playwright-bdd`-adjacent attachment patterns as generic or noisy data:
- vendor JSON subtypes such as `application/*+json`
- log-like text attachments such as `text/x.cucumber.log+plain`
- hidden hook steps that contain real artifacts, not just boilerplate

## Desired Outcome
Support a "works well by default" experience for `playwright-bdd` users:
- readable artifact rendering
- less hook metadata noise
- no loss of useful failure screenshots, logs, HTML, or JSON
- sane step counts even when hidden hooks carry attachments

## Non-Goals
- Do not add a dedicated "Playwright BDD mode" unless implementation proves it is truly needed.
- Do not fork behavior so heavily that ordinary Cucumber JSON becomes second-class.
- Do not solve true live-streaming here. Stock `playwright-bdd` message output is still end-batched at the adapter layer.

## Proposed Work

### Phase 1: Attachment decoding and rendering
Improve attachment handling so `playwright-bdd` outputs become readable without extra configuration.

#### Changes
1. Extend JSON and message adapters to treat `application/*+json` as JSON-like content.
2. Decode and pretty-print vendor JSON subtypes in the same way as `application/json`.
3. Render any `image/*` attachment, not just `image/png`.
4. Add a dedicated display treatment for `text/x.cucumber.log+plain`.

#### Primary touchpoints
- `src/parser/cucumberJsonAdapter.mjs`
- `src/parser/cucumberMessageAdapter.mjs`
- `src/components/Embedding.jsx`

#### Why this matters
This makes `application/vnd.allure.message+json` inspectable instead of opaque base64 noise and makes hook-generated logs easier to read.

### Phase 2: Hidden hook artifact behavior
Refine how hidden `Before` and `After` steps interact with the UI.

#### Changes
1. Distinguish hook boilerplate from hook artifacts.
2. Keep the existing ability to show full hook steps.
3. When hooks are hidden, continue surfacing meaningful artifacts from hidden hook steps.
4. Prefer showing failure artifacts in a scenario-level artifact area even when the hook row itself is hidden.

#### Primary touchpoints
- `src/store/steps.js`
- `src/components/StepsList.jsx`
- `src/components/StepContainer.jsx`
- `src/components/ScenarioContainer.jsx`
- `src/components/TopBar.jsx`

#### Why this matters
`playwright-bdd` often stores the screenshot and debug payloads on an `After` hook. Hiding hooks should not hide the most important failure evidence.

### Phase 3: Step counting and summary accuracy
Avoid misleading scenario counts when hidden hooks carry attachments or metadata.

#### Changes
1. Review how hidden hook steps contribute to `passedSteps`, `skippedSteps`, and `failedSteps`.
2. Exclude hidden hook metadata steps from user-facing step counts by default.
3. Ensure a failing hidden hook still marks the scenario as failed.
4. Decide whether artifact-bearing hidden hooks should affect visible step totals or only artifact presentation.

#### Primary touchpoints
- `src/parser/cucumberJsonAdapter.mjs`
- `src/parser/cucumberMessageAdapter.mjs`
- selectors under `src/store/`

#### Why this matters
At the moment, hidden steps with embeddings can affect counts even when users are looking at visible Gherkin steps only.

### Phase 4: Optional noise suppression
Reduce clutter from metadata-heavy hook attachments.

#### Changes
1. Detect Allure metadata attachments such as `application/vnd.allure.message+json`.
2. Either collapse them by default or move them into a secondary "metadata" view.
3. Consider a config option to suppress known metadata-only attachments from the UI while retaining them in the underlying result data.

#### Possible option
- `hideMetadataAttachments: boolean`

#### Why this matters
Playwright BDD stacks that also use Allure can generate many metadata blobs that are technically valid but not very useful in the main failure-reading flow.

## Recommended Order
1. Phase 1
2. Phase 2
3. Phase 3
4. Phase 4

This order delivers the biggest usability gains first with the lowest risk to the core report model.

## Suggested Implementation Notes

### MIME handling
- Introduce a shared helper for "JSON-like" MIME types:
  - `application/json`
  - `application/*+json`
- Introduce a shared helper for "image-like" MIME types:
  - any `image/*`
- Treat `text/x.cucumber.log+plain` as text, but with a clearer label in the UI.

### Hook artifact model
Prefer a model like this:
- visible Gherkin step rows remain the primary scenario timeline
- hidden hook artifacts are available in the scenario details pane
- hook rows can still be shown explicitly via the existing toggle

This keeps the report readable while preserving debug data.

### Backward compatibility
All improvements should preserve behavior for existing `legacy-json` and `message` users who do not produce Playwright-style attachments.

## Testing Plan

### Parser coverage
Add or extend Node tests for:
1. `application/*+json` attachments in legacy JSON
2. `application/*+json` attachments in message NDJSON
3. `image/jpeg` or another non-PNG image attachment
4. `text/x.cucumber.log+plain` attachment normalization
5. hidden `After` hook with screenshot + HTML + JSON
6. hidden `Before` hook with metadata-only attachments

### UI coverage
Add focused component tests for:
1. image rendering for non-PNG images
2. JSON-like vendor MIME rendering
3. hidden hooks disabled while scenario artifacts remain visible
4. hooks enabled with metadata attachments collapsed or grouped

### Regression coverage
Re-run current examples to ensure:
1. ordinary Cucumber JSON still renders as before
2. message input still behaves the same aside from improved MIME handling
3. scenario and feature counters do not regress

## Suggested Fixtures
Add small fixtures under `test/fixtures/` or similar for:
- plain cucumber JSON
- `playwright-bdd` success sample
- `playwright-bdd` failure sample with screenshot
- `playwright-bdd` sample containing Allure metadata attachments

If possible, keep the fixtures trimmed to the smallest shape that still reproduces the behavior.

## Open Questions
1. Should metadata-only hook attachments be hidden by default or merely collapsed?
2. Should hidden hook failures appear as synthetic visible artifacts, or should the hook row auto-open on failure?
3. Is the right product decision to expose vendor MIME type names to users, or should the UI relabel them into friendlier names such as "Allure metadata" or "Runner log"?

## Recommended First Slice
If this is implemented incrementally, start with:
1. JSON-like MIME support for `application/*+json`
2. generic `image/*` rendering
3. preserve artifacts from hidden `After` steps even when hooks are hidden

That slice gives the biggest real improvement for `playwright-bdd` users without redesigning the whole report flow.
