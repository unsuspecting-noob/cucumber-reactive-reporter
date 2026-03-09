import { execSync } from "child_process";
import { cpSync, rmSync, mkdirSync, readdirSync, copyFileSync, existsSync, statSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BUILD = path.join(__dirname, "build");
const REACT = path.join(__dirname, "react");
const DOCS = path.join(__dirname, "docs");
const PUBLIC = path.join(__dirname, "public");

function log(msg) {
  console.log(`[updatedocs] ${msg}`);
}

function cleanDir(dir) {
  if (existsSync(dir)) {
    rmSync(dir, { recursive: true, force: true });
  }
}

function syncDir(src, dest) {
  if (!existsSync(src)) return;
  if (existsSync(dest)) {
    rmSync(dest, { recursive: true, force: true });
  }
  mkdirSync(dest, { recursive: true });
  const files = readdirSync(src);
  for (const file of files) {
    copyFileSync(path.join(src, file), path.join(dest, file));
  }
}

try {
  // 1. Clean build and react directories
  log("Cleaning build/ and react/...");
  cleanDir(BUILD);
  cleanDir(REACT);

  // 2. Run CRA build
  log("Running react-scripts build...");
  execSync("PUBLIC_URL=. npx react-scripts build", {
    cwd: __dirname,
    stdio: "inherit",
    env: { ...process.env, PUBLIC_URL: "." }
  });

  // 3. Copy build → react
  log("Copying build/ → react/...");
  cpSync(BUILD, REACT, { recursive: true });

  // 4. Strip content hashes
  log("Stripping content hashes (prepDist.mjs)...");
  execSync("node prepDist.mjs", { cwd: __dirname, stdio: "inherit" });

  // 5. Sync to docs/
  log("Syncing react/ → docs/...");

  // Copy top-level files
  copyFileSync(path.join(REACT, "index.html"), path.join(DOCS, "index.html"));
  copyFileSync(path.join(REACT, "asset-manifest.json"), path.join(DOCS, "asset-manifest.json"));

  // Sync static/js and static/css (clear old, copy new)
  syncDir(path.join(REACT, "static", "js"), path.join(DOCS, "static", "js"));
  syncDir(path.join(REACT, "static", "css"), path.join(DOCS, "static", "css"));

  // 6. Copy sample data if source is newer
  const sampleSrc = path.join(PUBLIC, "_cucumber-results.json");
  const sampleDest = path.join(DOCS, "_cucumber-results.json");
  if (existsSync(sampleSrc)) {
    const srcMtime = statSync(sampleSrc).mtimeMs;
    const destMtime = existsSync(sampleDest) ? statSync(sampleDest).mtimeMs : 0;
    if (srcMtime > destMtime) {
      log("Copying updated _cucumber-results.json to docs/...");
      copyFileSync(sampleSrc, sampleDest);
    } else {
      log("_cucumber-results.json in docs/ is up to date.");
    }
  }

  log("Done! docs/ has been updated.");
} catch (err) {
  console.error("[updatedocs] Failed:", err.message);
  process.exit(1);
}
