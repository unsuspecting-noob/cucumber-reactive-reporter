import { execSync } from "child_process";
import { cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync } from "fs";
import os from "os";
import path from "path";
import { fileURLToPath } from "url";

import Reporter from "./index.mjs";
import { SAMPLE_SOURCE, sampleReportOptions } from "./sampleReportOptions.mjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BUILD = path.join(__dirname, "build");
const REACT = path.join(__dirname, "react");
const DOCS = path.join(__dirname, "docs");
const SAMPLE = path.join(__dirname, SAMPLE_SOURCE);

// docs/ entries GitHub Pages needs that the generated report does not produce
const DOCS_KEEP = new Set([".nojekyll", "CNAME"]);

function log(msg) {
  console.log(`[updatedocs] ${msg}`);
}

function cleanDir(dir) {
  if (existsSync(dir)) {
    rmSync(dir, { recursive: true, force: true });
  }
}

try {
  if (!existsSync(SAMPLE)) {
    throw new Error(
      `${SAMPLE_SOURCE} not found. It is the raw cucumber JSON the sample report is generated from (gitignored, so it only exists locally).`
    );
  }

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

  // 5. Generate the sample report with the current generator, so the report data and the
  //    reporterVersion stamped into _reporter_settings.json match this build
  log(`Generating the sample report from ${SAMPLE_SOURCE}...`);
  const generated = mkdtempSync(path.join(os.tmpdir(), "reporter-sample-"));
  await Reporter.generate(SAMPLE, generated, sampleReportOptions);

  // 6. Replace docs/ with the generated report, so files the build no longer produces
  //    (removed fonts, old chunks) do not linger
  log("Replacing docs/ with the generated report...");
  mkdirSync(DOCS, { recursive: true });
  for (const entry of readdirSync(DOCS)) {
    if (!DOCS_KEEP.has(entry)) {
      rmSync(path.join(DOCS, entry), { recursive: true, force: true });
    }
  }
  cpSync(generated, DOCS, {
    recursive: true,
    filter: (src) => path.basename(src) !== ".DS_Store"
  });
  rmSync(generated, { recursive: true, force: true });

  // 7. Check the result
  const { version } = JSON.parse(readFileSync(path.join(__dirname, "package.json"), "utf8"));
  const settings = JSON.parse(readFileSync(path.join(DOCS, "_reporter_settings.json"), "utf8"));
  if (settings.reporterVersion !== version) {
    throw new Error(`docs/_reporter_settings.json has reporterVersion ${settings.reporterVersion}, expected ${version}`);
  }
  if (readFileSync(path.join(DOCS, "index.html"), "utf8").includes("-=title=-")) {
    throw new Error("docs/index.html still has the -=title=- placeholder");
  }

  log(`Done! docs/ now holds the ${version} sample report.`);
} catch (err) {
  console.error("[updatedocs] Failed:", err.message);
  process.exit(1);
}
