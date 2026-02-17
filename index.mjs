/**
 * Purpose: Generate HTML reports from cucumber JSON output.
 * Responsibilities:
 * - Normalize cucumber JSON into store state.
 * - Copy report assets and write report metadata.
 * Inputs/Outputs: Reads a cucumber JSON file and writes a report folder.
 * Invariants: Expects legacy cucumber JSON (features/elements/steps).
 * See: /agents.md
 */

import { createRequire } from "module";
import fs from "fs";
import ncp from "ncp";
import path from "path";
import readline from "node:readline";
import ut from "util";
import {
    createMessageStateBuilder,
    prepareStoreStateFromMessageStream
} from "./src/parser/cucumberMessageAdapter.mjs";
import { prepareStoreState } from "./src/parser/cucumberJsonAdapter.mjs";

const require = createRequire(import.meta.url);

ncp.limit = 16;

const modulePath = require.resolve("./package.json"); //trick to resolve path to the installed module

/**  
 options.filter - a RegExp instance, against which each file name is tested to determine whether to copy it or not, or a function taking single parameter: copied file name, returning true or false, determining whether to copy file or not.

 options.transform - a function: function (read, write) { read.pipe(write) } used to apply streaming transforms while copying.

 options.clobber - boolean=true. if set to false, ncp will not overwrite destination files that already exist.

 options.dereference - boolean=false. If set to true, ncp will follow symbolic links. For example, a symlink in the source tree pointing to a regular file will become a regular file in the destination tree. Broken symlinks will result in errors.

 options.stopOnErr - boolean=false. If set to true, ncp will behave like cp -r, and stop on the first error it encounters. By default, ncp continues copying, logging all errors and returning an array.

 options.errs - stream. If options.stopOnErr is false, a stream can be provided, and errors will be written to this stream.
*/

let cp = (source, destination, options) => {
    options = options || {};
    return new Promise((resolve, reject) => {
        ncp(source, destination, options, (err) => {
            if (err) {
                reject(new Error(err));
            }
            resolve();
        })
    });
}

const copyReportAssets = async (htmlPath, destination, cucumberJsonPath, settingsPath) => {
    await cp(htmlPath, destination, {
        filter: (filePath) => {
            const basename = path.basename(filePath);
            return basename !== cucumberJsonPath && basename !== settingsPath;
        }
    });
};

const _makeSafe = (input) => {
    input = input.replace(/&/g, '&amp;');
    input = input.replace(/</g, '&lt;');
    input = input.replace(/>/g, '&gt;');
    return input;
}

/**
 * Generate a report from cucumber JSON output.
 * @param {string} source path to the cucumber results JSON file
 * @param {string} dest folder path where the HTML report gets written
 * @param {Object} options report configuration overrides
 * @param {"legacy-json"|"auto"} [options.inputFormat] input JSON format selector
 * @param {"auto"|"base64"|"raw"} [options.attachmentsEncoding] attachment encoding
 * @param {string} [options.cucumberVersion] cucumber version (for encoding hints)
 * @returns {Promise<void>} resolves when report assets are written
 * @throws {Error} when input JSON is invalid or unsupported
 * @example
 * await generate("results/cucumber.json", "reports/out", { title: "Run #1" });
 */
const generate = async (source, dest, options) => {
    options ? true : options = {};

    const CUCUMBER_JSON_PATH = "_cucumber-results.json";
    const SETTINGS_JSON_PATH = "_reporter_settings.json";
    const HTML_PATH = path.join(path.dirname(modulePath), "react");

    // "linkTags": [{
    //     "pattern": "[a-zA-Z]*-(\\d)*$",
    //     "link": "https://bydeluxe.atlassian.net/browse/"

    // }]
    //defaults
    const {
        title = "Cucumber Report", //report page title
        description = "Cucumber report", //description to be set at the page header
        metadata = {},
        linkTags = null,
        inputFormat = "legacy-json",
        attachmentsEncoding,
        cucumberVersion,
        live
    } = options;
    const liveOptions = normalizeLiveOptions(live);
    const settings = {
        ...options,
        live: liveOptions
    };
    if (liveOptions.enabled && inputFormat === "message") {
        const messageBasename = path.basename(source);
        settings.live = {
            ...liveOptions,
            source: liveOptions.source ?? "message",
            messagePath: liveOptions.messagePath ?? messageBasename ?? "cucumber-messages.ndjson"
        };
    }

    let __dirname = path.resolve();
    if (path.isAbsolute(source) === false) {
        source = path.join(__dirname, source);
    }

    if (!dest) {
        dest = path.dirname(source);
    } else {
        if (path.isAbsolute(dest) === false) {
            dest = path.resolve(dest);
        }
    }

    if (!liveOptions.enabled) {
        fs.accessSync(source);
    }

    console.log(
        `__dirname: ${__dirname}\n` +
        `html path: ${HTML_PATH}\n` +
        `source: ${source}\n` +
        `destination: ${dest}\n` +
        `title: ${title}\n` +
        `description: ${description}\n` +
        `metadata: ${ut.inspect(metadata, false, null)}\n` +
        `linkTags: ${ut.inspect(linkTags, false, null)}\n`);

    if (liveOptions.enabled) {
        if (inputFormat !== "message") {
            throw new Error("Live updates require inputFormat: \"message\".");
        }
        await generateLive({
            source,
            dest,
            htmlPath: HTML_PATH,
            cucumberJsonPath: CUCUMBER_JSON_PATH,
            settingsPath: SETTINGS_JSON_PATH,
            title,
            settings,
            attachmentsEncoding,
            liveOptions
        });
        return;
    }

    //validate input json and make a copy
    const out = await loadStoreState(source, {
        inputFormat,
        attachmentsEncoding,
        cucumberVersion
    });
    let modifiedJSON = JSON.stringify(out);
    let destExists = true;
    try {
        fs.accessSync(dest);
    } catch (err) {
        destExists = false;
    }
    if (!destExists) {
        fs.mkdirSync(dest, { recursive: true });
    }
    await copyReportAssets(HTML_PATH, dest, CUCUMBER_JSON_PATH, SETTINGS_JSON_PATH);
    fs.writeFileSync(path.join(dest, CUCUMBER_JSON_PATH), modifiedJSON);
    fs.writeFileSync(path.join(dest, SETTINGS_JSON_PATH), JSON.stringify(settings));
    patchIndexTitle(dest, title);
    console.log("done")

}

const generateLive = async ({
    source,
    dest,
    htmlPath,
    cucumberJsonPath,
    settingsPath,
    title,
    settings,
    attachmentsEncoding,
    liveOptions
}) => {
    ensureDestination(dest);
    await copyReportAssets(htmlPath, dest, cucumberJsonPath, settingsPath);
    writeJsonAtomic(path.join(dest, cucumberJsonPath), createEmptyState());
    fs.writeFileSync(path.join(dest, settingsPath), JSON.stringify(settings));
    patchIndexTitle(dest, title);

    const builder = createMessageStateBuilder({ attachmentsEncoding });
    let lastFlush = 0;
    const flushIntervalMs = Math.max(0, liveOptions.flushIntervalMs);

    for await (const envelope of followMessageEnvelopes(source, liveOptions)) {
        builder.ingest(envelope);
        const now = Date.now();
        if (!flushIntervalMs || now - lastFlush >= flushIntervalMs) {
            writeJsonAtomic(
                path.join(dest, cucumberJsonPath),
                builder.buildState()
            );
            lastFlush = now;
        }
    }

    writeJsonAtomic(path.join(dest, cucumberJsonPath), builder.buildState());
    console.log("done");
};

const loadStoreState = async (
    source,
    {
        inputFormat,
        attachmentsEncoding,
        cucumberVersion
    }
) => {
    if (inputFormat === "message") {
        const envelopes = readMessageEnvelopes(source);
        return prepareStoreStateFromMessageStream(envelopes, { attachmentsEncoding });
    }

    const rawText = fs.readFileSync(source, "utf8");
    const parsed = parseInputData(source, rawText);
    return prepareStoreState(parsed, { inputFormat, attachmentsEncoding, cucumberVersion });
};

// Keep this in sync with cucumber-js envelope emitters and gherkin-stream output.
const MESSAGE_ENVELOPE_KEYS = [
    "meta",
    "source",
    "gherkinDocument",
    "pickle",
    "parseError",
    "stepDefinition",
    "hook",
    "parameterType",
    "undefinedParameterType",
    "suggestion",
    "testCase",
    "testCaseStarted",
    "testCaseFinished",
    "testStepStarted",
    "testStepFinished",
    "attachment",
    "testRunStarted",
    "testRunFinished",
    "testRunHookStarted",
    "testRunHookFinished"
];

const findRecoverableEnvelopes = (line) => {
    const trimmedLine = String(line || "").trim();
    if (!trimmedLine) {
        return [];
    }

    const envelopeStarts = [];
    const startPattern = new RegExp(
        String.raw`\{"(?:${MESSAGE_ENVELOPE_KEYS.join("|")})"\s*:`,
        "g"
    );
    let match = null;
    while ((match = startPattern.exec(trimmedLine)) !== null) {
        envelopeStarts.push(match.index);
    }
    if (envelopeStarts.length === 0) {
        return [];
    }

    const recovered = [];
    for (let i = 0; i < envelopeStarts.length; i += 1) {
        const start = envelopeStarts[i];
        const end = i + 1 < envelopeStarts.length ? envelopeStarts[i + 1] : trimmedLine.length;
        const candidate = trimmedLine.slice(start, end).trim();
        if (!candidate) {
            continue;
        }
        try {
            recovered.push(JSON.parse(candidate));
        } catch {
            // Ignore invalid fragments and continue scanning for a valid envelope.
        }
    }

    return recovered;
};

const readMessageEnvelopes = async function* (source) {
    const stream = fs.createReadStream(source, { encoding: "utf8" });
    const rl = readline.createInterface({ input: stream, crlfDelay: Infinity });
    let lineNumber = 0;

    try {
        for await (const line of rl) {
            lineNumber += 1;
            const trimmed = line.trim();
            if (!trimmed.length) {
                continue;
            }
            try {
                yield JSON.parse(trimmed);
            } catch (err) {
                const recovered = findRecoverableEnvelopes(trimmed);
                if (recovered.length > 0) {
                    console.warn(
                        JSON.stringify({
                            level: "warn",
                            code: "message-ndjson-recovered-line",
                            source,
                            lineNumber,
                            recoveredCount: recovered.length,
                            error: err.message
                        })
                    );
                    for (const envelope of recovered) {
                        yield envelope;
                    }
                    continue;
                }
                console.warn(
                    JSON.stringify({
                        level: "warn",
                        code: "message-ndjson-skipped-line",
                        source,
                        lineNumber,
                        error: err.message
                    })
                );
                continue;
            }
        }
    } finally {
        rl.close();
    }
};

const followMessageEnvelopes = async function* (
    source,
    {
        pollIntervalMs,
        idleTimeoutMs,
        stopOnTestRunFinished
    }
) {
    let offset = 0;
    let lineNumber = 0;
    let buffer = "";
    let lastActivity = Date.now();
    let seenData = false;
    const pollMs = Math.max(250, Number(pollIntervalMs) || 1000);
    const idleMsRaw = Number.isFinite(Number(idleTimeoutMs)) ? Number(idleTimeoutMs) : 15000;
    const idleMs = Math.max(0, idleMsRaw);
    const stopOnFinish = stopOnTestRunFinished !== false;

    while (true) {
        let fileHandle;
        try {
            fileHandle = await fs.promises.open(source, "r");
        } catch (err) {
            if (err.code === "ENOENT") {
                await sleep(pollMs);
                continue;
            }
            throw err;
        }

        try {
            const stats = await fileHandle.stat();
            if (stats.size > offset) {
                const length = stats.size - offset;
                const chunk = Buffer.alloc(length);
                await fileHandle.read(chunk, 0, length, offset);
                offset = stats.size;
                buffer += chunk.toString("utf8");
                const lines = buffer.split(/\r?\n/);
                buffer = lines.pop() ?? "";
                for (const line of lines) {
                    lineNumber += 1;
                    const trimmed = line.trim();
                    if (!trimmed.length) {
                        continue;
                    }
                    let envelope;
                    try {
                        envelope = JSON.parse(trimmed);
                    } catch (err) {
                        const recovered = findRecoverableEnvelopes(trimmed);
                        if (recovered.length > 0) {
                            console.warn(
                                JSON.stringify({
                                    level: "warn",
                                    code: "message-ndjson-recovered-line",
                                    source,
                                    lineNumber,
                                    recoveredCount: recovered.length,
                                    error: err.message
                                })
                            );
                            for (const recoveredEnvelope of recovered) {
                                yield recoveredEnvelope;
                                if (stopOnFinish && recoveredEnvelope.testRunFinished) {
                                    return;
                                }
                            }
                            continue;
                        }
                        console.warn(
                            JSON.stringify({
                                level: "warn",
                                code: "message-ndjson-skipped-line",
                                source,
                                lineNumber,
                                error: err.message
                            })
                        );
                        continue;
                    }
                    yield envelope;
                    if (stopOnFinish && envelope.testRunFinished) {
                        return;
                    }
                }
                lastActivity = Date.now();
                seenData = true;
            } else if (seenData && idleMs && Date.now() - lastActivity >= idleMs) {
                return;
            }
        } finally {
            await fileHandle.close();
        }

        await sleep(pollMs);
    }
};

const patchIndexTitle = (dest, title) => {
    const indexPagePath = path.join(dest, "index.html");
    const htmlStr = fs.readFileSync(indexPagePath, "utf8").toString();
    const cacheBustToken = Date.now();
    const withTitle = htmlStr.replace(/-=title=-/g, _makeSafe(title));
    const withCssBust = withTitle.replace(
        /(static\/css\/main(?:\.[^"']+)?\.css)(\?[^"']*)?/g,
        `$1?v=${cacheBustToken}`
    );
    const modified = withCssBust.replace(
        /(static\/js\/main(?:\.[^"']+)?\.js)(\?[^"']*)?/g,
        `$1?v=${cacheBustToken}`
    );
    fs.writeFileSync(indexPagePath, modified, "utf8");
};

const ensureDestination = (dest) => {
    try {
        fs.accessSync(dest);
    } catch (err) {
        fs.mkdirSync(dest, { recursive: true });
    }
};

const writeJsonAtomic = (filePath, payload) => {
    const tempPath = `${filePath}.tmp`;
    fs.writeFileSync(tempPath, JSON.stringify(payload));
    fs.renameSync(tempPath, filePath);
};

const createEmptyState = () => ({
    features: {
        list: [],
        featuresMap: {}
    },
    scenarios: {
        list: [],
        scenariosMap: {}
    },
    steps: {
        stepsMap: {},
        totalDurationNanoSec: 0
    }
});

const normalizeLiveOptions = (live) => {
    if (!live) {
        return { enabled: false };
    }
    if (live === true) {
        return {
            enabled: true,
            flushIntervalMs: 1000,
            pollIntervalMs: 2000,
            idleTimeoutMs: 0,
            stopOnTestRunFinished: true,
            source: "message",
            bootstrapDispatchMs: 200,
            bootstrapChunkBytes: 262144
        };
    }
    return {
        enabled: live.enabled !== false,
        flushIntervalMs: live.flushIntervalMs ?? 1000,
        pollIntervalMs: live.pollIntervalMs ?? 2000,
        idleTimeoutMs: live.idleTimeoutMs ?? 0,
        stopOnTestRunFinished: live.stopOnTestRunFinished !== false,
        source: live.source,
        bootstrapDispatchMs: live.bootstrapDispatchMs,
        bootstrapChunkBytes: live.bootstrapChunkBytes
    };
};

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const parseInputData = (source, rawText) => {
    try {
        return JSON.parse(rawText);
    } catch (err) {
        const ndjson = parseNdjson(rawText);
        if (ndjson) {
            return ndjson;
        }
        throw new Error(`Invalid JSON in ${source}: ${err.message}`);
    }
};

const parseNdjson = (rawText) => {
    const lines = rawText.split(/\r?\n/).filter((line) => line.trim().length);
    if (!lines.length) {
        return null;
    }
    const items = [];
    for (const line of lines) {
        try {
            items.push(JSON.parse(line));
        } catch (err) {
            return null;
        }
    }
    return items;
};

export default {
    generate: generate
};
