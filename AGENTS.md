# Repository Guidelines

## Project Structure & Module Organization
- `src/` holds the React app entry (`index.js`, `App.js`) plus styles.
- `src/components/` contains UI components; `src/store/` Redux state; `src/parser/`
  cucumber JSON parsing and adapter logic.
- `public/` provides CRA static assets; `docs/` contains project notes.
- `test/` stores Node test files (for example, `cucumberJsonAdapter.test.mjs`).
- `dist/`, `build/`, and `react/` are generated build outputs; do not edit by hand.
- `py/` contains the Python wrapper/package for the reporter.

## Build, Test, and Development Commands
- `npm start` runs the CRA dev server with `PUBLIC_URL=./` for relative assets.
- `npm run build` builds the JS library via Rollup into `dist/`.
- `npm run buildreact` builds the CRA app, then runs the Rollup build.
- `npm run generatedist` produces a full distributable (build + prep + install).
- `npm test` runs React Testing Library tests in watch mode.
- `npm run test:node` runs Node's test runner for `test/*.test.mjs`.
- `npm run testinstall` generates a sample report in `test/` via `devtest.mjs`.

## Coding Style & Naming Conventions
- JavaScript/React; use 2-space indentation, semicolons, and double quotes to match
  existing files.
- Components are `PascalCase` and live in `src/components/` (e.g.,
  `StartComponent.js`); functions and variables are `camelCase`.
- Keep modules focused and avoid deep nesting when adding new logic.
- Linting uses `react-scripts` (ESLint `react-app`); follow its defaults.

## Testing Guidelines
- UI tests live under `src/` as `*.test.js`/`*.test.jsx` and run with `npm test`.
- Node-side tests live in `test/` as `*.test.mjs` and run with `npm run test:node`.
- Add tests for parsing edge cases (attachments, tag expressions) and UI filters.

## Commit & Pull Request Guidelines
- Commit messages are short and descriptive (e.g., "fix json attachment formatting",
  "bump react-scripts version"); release bumps may be just a version number.
- PRs should include a summary, test commands run, and links to issues; add
  screenshots for UI changes.

## Security & Configuration Tips
- Avoid committing secrets or report data; use local fixtures for tests.
- For static builds, keep `PUBLIC_URL=.` (see scripts) so relative asset paths work
  in generated reports.
