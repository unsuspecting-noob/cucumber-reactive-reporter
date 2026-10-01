# Releasing

How to publish a new version of `cucumber-reactive-reporter` to npm and refresh the sample report on GitHub Pages.

## Before you start

- Node 22 or newer.
- `main` is clean and up to date: `git status`, `git pull`.
- Your npm account can publish the package: `npm owner ls cucumber-reactive-reporter --registry=https://registry.npmjs.org/`.
- `public/cucumber-results.json` exists. It is the raw cucumber JSON the sample report is generated from. It is gitignored, so it only exists on a maintainer's machine.

## 1. Test

```bash
npm run test:node
CI=true npm test -- --watchAll=false
```

As of 1.10.1, five TopBar/StepsList tests fail on `main`: three because the jest-dom matchers are not registered, and the two TopBar token-click tests. Any other failure is new.

## 2. Add release notes

Add a row for the new version to the **Release notes** table in `README.md` and commit it.

## 3. Bump the version

```bash
npm version patch
```

Use `minor` or `major` as appropriate. This creates the version commit and the `vX.Y.Z` tag; it does not publish anything.

## 4. Refresh the GitHub Pages sample

Run this after the version bump, so the sample is stamped with the new version:

```bash
npm run updatedocs
```

It rebuilds the UI, generates the sample report from `public/cucumber-results.json` with the current generator, and replaces everything in `docs/` except `.nojekyll`. It fails if the stamped `reporterVersion` is not the new version or the page title is still the template placeholder.

Preview it, then commit:

```bash
python3 -m http.server 8080 --directory docs
```

Open http://localhost:8080: the header should show the new version, and the toggles and tag search should work.

```bash
git add docs && git commit -m "Update sample report for X.Y.Z"
```

## 5. Log in to npm

`npm login` signs in to whatever registry is configured. If your default registry is a corporate mirror, name the public registry explicitly; this applies to that one command and does not change your default:

```bash
npm login --registry=https://registry.npmjs.org/
```

npm opens the npmjs.com sign-in in your browser. Check it worked:

```bash
npm whoami --registry=https://registry.npmjs.org/
```

Login sessions are short-lived, so publish soon after logging in.

## 6. Publish

Optional, but worth it for UI changes: build the package and smoke-test it first.

```bash
npm run generatedist && npm run checkdist && npm run testinstall
```

`testinstall` generates the sample report with the built `dist/` into `sample/` (gitignored); serve it like `docs/` above. `npm pack --dry-run` lists exactly which files will ship.

Then publish:

```bash
npm publish
```

`publishConfig` in `package.json` sends this to registry.npmjs.org whatever your configured registry is. `prepublishOnly` runs first:

1. `checkDeps.mjs` blocks the publish if the package declares runtime dependencies.
2. `generatedist` rebuilds `dist/` from scratch: CRA build, rollup, content-hash stripping, and a copy into `dist/react` that leaves out the sample data in `public/`.
3. `checkDist.mjs` blocks the publish if `dist/` contains sample or report data (`_cucumber-results.json`, `_reporter_settings.json`, `cucumber-results.json`, `*.ndjson`), is missing an entry file, or has a different version than `package.json`.

Expect a browser prompt for two-factor authentication.

## 7. Verify and push

```bash
npm view cucumber-reactive-reporter version --registry=https://registry.npmjs.org/
```

```bash
git push --follow-tags
```

GitHub Pages redeploys `docs/` from `main` within a few minutes. Check that https://unsuspecting-noob.github.io/cucumber-reactive-reporter/index.html shows the new version.

## Consumers

Projects that install `cucumber-reactive-reporter@latest` when they run pick up a release on their next run, so a bad release reaches them quickly. Projects that pin a version need a bump. Every generated report records the version that produced it in `_reporter_settings.json` (`reporterVersion`) and shows it in the header.

## Rolling back

Point `latest` back at the last good version. This takes effect immediately for anyone resolving `@latest`. Then deprecate the bad version:

```bash
npm dist-tag add cucumber-reactive-reporter@<good-version> latest --registry=https://registry.npmjs.org/
```

```bash
npm deprecate cucumber-reactive-reporter@<bad-version> "<reason>" --registry=https://registry.npmjs.org/
```

Unlike `npm publish`, these commands do not read `publishConfig`, so they need `--registry`. Fix forward with a new patch release. Avoid `npm unpublish`: it is only allowed for a short time after publishing, and a version number can never be reused.
