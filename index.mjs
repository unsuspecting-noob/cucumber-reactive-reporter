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
import { link } from "fs/promises";
import ncp from "ncp";
import path from "path";
import ut from "util";
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
    options ? options : {};
    return new Promise((resolve, reject) => {
        ncp(source, destination, (err) => {
            if (err) {
                reject(new Error(err));
            }
            resolve();
        })
    });
}

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
        cucumberVersion
    } = options;

    let __dirname = path.resolve();
    if (path.isAbsolute(source) === false) {
        source = path.join(__dirname, source);
    }
    fs.accessSync(source);

    if (!dest) {
        dest = path.dirname(source);
    } else {
        if (path.isAbsolute(dest) === false) {
            dest = path.resolve(dest);
        }
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

    //validate input json and make a copy
    let str = fs.readFileSync(source, "utf8");
    let obj = parseInputData(source, str);
    let out = prepareStoreState(obj, { inputFormat, attachmentsEncoding, cucumberVersion });
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
    fs.writeFileSync(path.join(dest, CUCUMBER_JSON_PATH), modifiedJSON);
    fs.writeFileSync(path.join(dest, SETTINGS_JSON_PATH), JSON.stringify(options));

    await cp(HTML_PATH, dest);
    //swap out some tokens in the html
    let indexPagePath = path.join(dest, "index.html");
    let htmlStr = fs.readFileSync(indexPagePath, "utf8").toString();
    let modified = htmlStr.replace(/-=title=-/g, _makeSafe(title));
    fs.writeFileSync(indexPagePath, modified, "utf8");
    console.log("done")

}

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
