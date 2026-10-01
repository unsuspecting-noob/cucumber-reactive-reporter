Update the sample report served via GitHub Pages in the docs/ folder.

Run `npm run updatedocs` from the project root. It rebuilds the React app, generates the sample report from `public/cucumber-results.json` (gitignored raw cucumber JSON; the script stops if it is missing) with the current generator, and replaces everything in docs/ except `.nojekyll`. It fails if `docs/_reporter_settings.json` is not stamped with the `package.json` version or the page title is still the `-=title=-` placeholder.

When releasing, run it after `npm version` so the sample carries the new version (see RELEASING.md).

After the script completes, verify the update:
1. `git status --short docs` to see what changed; files the build no longer produces show up as deleted
2. Serve it with `python3 -m http.server 8080 --directory docs` and check that the header shows the current version and the toggles and tag search work

Then stage the docs/ changes with `git add docs/`.
