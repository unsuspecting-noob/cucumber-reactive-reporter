import Fs from "fs/promises";
import ncp from "ncp";
import path from "path";

ncp.limit = 16;
const BUILD_D = "./build";
const OUT_D = "./dist";
const CURRENT_D = "./";
const INCLUDE = []



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

let copyBuild = async () => {
    let dest = path.join(OUT_D, "react");
    let destExists = true;
    try {
        await Fs.access(dest);
    } catch (err) {
        destExists = false;
    }
    if (!destExists) {
        await Fs.mkdir(dest, { recursive: true });
    }
    await cp(BUILD_D, dest);
}

let copyIncluded = async () => {
    for (let f of INCLUDE) {
        await cp(path.join(CURRENT_D, f), path.join(OUT_D, f));
    }
}

let main = async function () {
    await copyBuild(); //TODO: filter test files like _cucumber-results.json
    await copyIncluded();
}();