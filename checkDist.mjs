import { readdir, readFile } from "fs/promises";
import { existsSync } from "fs";
import path from "path";

/**
 * Publish-time guard for the contents of dist/, the only build output that ships.
 *
 * public/ holds sample report data for `npm start` (_cucumber-results.json,
 * _reporter_settings.json, cucumber-results.json). react-scripts copies everything
 * in public/ into the build, so that data travels build/ -> react/ -> dist/react
 * unless install.mjs filters it out. It has leaked into a published package before.
 *
 * Wired into "prepublishOnly" after "generatedist", so it inspects the freshly
 * built dist/ right before npm packs it. Also runnable via `npm run checkdist`.
 */
const DIST = "dist";

// sample/report data that must never ship
const FORBIDDEN_FILES = new Set(["cucumber-results.json", "_cucumber-results.json", "_reporter_settings.json"]);
const FORBIDDEN_EXTENSIONS = [".ndjson"];

// entry points consumers load; a missing one means a broken or partial build
const REQUIRED_FILES = [
  "cucumber-reactive-reporter.cjs.js",
  "cucumber-reactive-reporter.esm.js",
  "package.json",
  "react/index.html",
  "react/static/js/main.js",
  "react/static/css/main.css"
];

const listFiles = async (dir) => {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...await listFiles(fullPath));
    } else {
      files.push(fullPath);
    }
  }
  return files;
};

const block = (problems) => {
  console.error(
    `\n✗ Publish blocked by checkDist.mjs.\n\n` +
    `${problems.map((problem) => `  - ${problem}`).join("\n")}\n\n` +
    `Rebuild with \`npm run generatedist\`. If sample data leaked in, check the\n` +
    `EXCLUDE_FILES list in install.mjs.\n`
  );
  process.exit(1);
};

if (!existsSync(DIST)) {
  block([`${DIST}/ does not exist`]);
}

const problems = [];
const files = await listFiles(DIST);

for (const file of files) {
  const basename = path.basename(file);
  if (FORBIDDEN_FILES.has(basename) || FORBIDDEN_EXTENSIONS.includes(path.extname(basename))) {
    problems.push(`sample/report data in the package: ${file}`);
  }
}

for (const required of REQUIRED_FILES) {
  if (!existsSync(path.join(DIST, required))) {
    problems.push(`missing ${path.join(DIST, required)}`);
  }
}

const rootVersion = JSON.parse(await readFile("./package.json", "utf8")).version;
const distPackagePath = path.join(DIST, "package.json");
if (existsSync(distPackagePath)) {
  const distVersion = JSON.parse(await readFile(distPackagePath, "utf8")).version;
  if (distVersion !== rootVersion) {
    problems.push(`${distPackagePath} is version ${distVersion}, package.json is ${rootVersion} (stale build)`);
  }
}

if (problems.length > 0) {
  block(problems);
}

console.log(`✓ checkDist: ${files.length} files in ${DIST}/, no sample data, version ${rootVersion}.`);
