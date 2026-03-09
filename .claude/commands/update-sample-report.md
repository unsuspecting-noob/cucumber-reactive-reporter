Update the sample report served via GitHub Pages in the docs/ folder.

Run `node updateSampleReport.mjs` from the project root to rebuild the React app and sync built assets to docs/.

After the script completes, verify the update by checking:
1. `git diff --stat docs/` to confirm which files changed
2. That docs/index.html, docs/static/js/main.js, and docs/static/css/main.css exist and have been updated

Then stage the docs/ changes with `git add docs/`.
