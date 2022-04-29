import fs from "fs";
// import { createRequire } from 'module';
import ncp from "ncp";
import path from "path";
import ut from "util";

// const require = createRequire(import.meta.url); //useful hackaround to get module path

ncp.limit = 16;

let modulePath = require.resolve("cucumberjs-reporter/package.json"); //trick to resolve path to the installed module

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

let _makeSafe = (input) => {
    input = input.replace(/&/g, '&amp;');
    input = input.replace(/</g, '&lt;');
    input = input.replace(/>/g, '&gt;');
    return input;
}

/**
 * 
 * @param source path to the cucumber results json
 * @param dest folder path where html report gets written to
 * @param options 
 */
const generate = async (source, dest, options) => {
    options ? true : options = {};

    const CUCUMBER_JSON_PATH = "_cucumber-results.json";
    const SETTINGS_JSON_PATH = "_reporter_settings.json";
    const HTML_PATH = path.join(path.dirname(modulePath), "dist", "react");

    //defaults
    const {
        title = "Cucumber Report", //report page title
        description = "Cucumber report", //description to be set at the page header
        metadata = {}
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
        `metadata: ${ut.inspect(metadata, false, null)}\n`);

    //validate input json and make a copy
    let str = fs.readFileSync(source).toString();
    let obj = JSON.parse(str);
    let out = JSON.stringify(obj);
    let destExists = true;
    try {
        fs.accessSync(dest);
    } catch (err) {
        destExists = false;
    }
    if (!destExists) {
        fs.mkdirSync(dest, { recursive: true });
    }
    fs.writeFileSync(path.join(dest, CUCUMBER_JSON_PATH), out);
    fs.writeFileSync(path.join(dest, SETTINGS_JSON_PATH), JSON.stringify(options));

    await cp(HTML_PATH, dest);
    //swap out some tokens in the html
    let indexPagePath = path.join(dest, "index.html");
    let htmlStr = fs.readFileSync(indexPagePath, "utf8").toString();
    let modified = htmlStr.replace(/-=title=-/g, _makeSafe(title));
    fs.writeFileSync(indexPagePath, modified, "utf8");
    console.log("done")

}

export default {
    generate: generate
};