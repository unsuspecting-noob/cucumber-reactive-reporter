import { readFile } from "fs/promises";

/**
 * Publish-time guard against shipping a runtime dependency tree.
 *
 * This package publishes a prebuilt, self-contained bundle (the React report UI
 * lives under dist/react, the library is rolled up into dist/*.js). Consumers
 * must not be forced to install anything transitively — historically a few build
 * tools leaked into "dependencies" and dragged the full @babel toolchain
 * (~200+ packages) into every install.
 *
 * Wired into "prepublishOnly", so it runs on every `npm publish`. It checks the
 * manifest's current state at publish time, which is why a dependency added in
 * the future is still caught: the field is re-read on the next publish.
 *
 * Every field below causes npm to install packages into a consumer's node_modules.
 * Build-only tooling belongs in "devDependencies". If a runtime dependency ever
 * becomes genuinely necessary, add it to ALLOWED intentionally.
 */
const GUARDED_FIELDS = [
  "dependencies",
  "optionalDependencies",
  "peerDependencies",
  "bundleDependencies",
  "bundledDependencies"
];

// Intentional, reviewed runtime dependencies. Keep empty unless a real one is needed.
const ALLOWED = new Set([]);

const pkg = JSON.parse(await readFile("./package.json", "utf8"));

const offenders = [];
for (const field of GUARDED_FIELDS) {
  const value = pkg[field];
  const names = (Array.isArray(value) ? value : Object.keys(value ?? {}))
    .filter((name) => !ALLOWED.has(name));
  if (names.length > 0) {
    offenders.push({ field, names });
  }
}

if (offenders.length > 0) {
  const detail = offenders
    .map(({ field, names }) => `  "${field}":\n${names.map((n) => `    - ${n}`).join("\n")}`)
    .join("\n");
  console.error(
    `\n✗ Publish blocked by checkDeps.mjs.\n\n` +
    `This package ships a prebuilt, self-contained bundle and must not force any\n` +
    `installs onto consumers. The following manifest field(s) are non-empty:\n\n` +
    `${detail}\n\n` +
    `Move build-only tooling to "devDependencies". If a runtime dependency is\n` +
    `truly required, add it to ALLOWED in checkDeps.mjs intentionally.\n`
  );
  process.exit(1);
}

console.log("✓ checkDeps: no consumer-facing dependencies — safe to publish.");
