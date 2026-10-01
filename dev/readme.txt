Some notes about development and maintainance:

Node baseline is 22+.

npm run start - runs local dev version for react development, this relies on Public folder to have _cucumber-results.json and _reporter_settings.json files to load the page.

public/cucumber-results.json (raw cucumberjs output, gitignored) is the source of the sample report:
- "npm run updatedocs" regenerates the GitHub Pages sample in /docs from it. /docs keeps a magic file called ".nojekyll", its purpose is to tell github not to flatten docs structure.
- "npm run testinstall" generates it with the built dist/ into /sample, as a smoke test of the package.

releasing (npm publish, sample report, rollback): see RELEASING.md.
npm publish checks that no sample json from /public made it into dist/ (checkDist.mjs).
