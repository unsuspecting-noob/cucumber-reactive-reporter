import { fileURLToPath } from 'url';
import path from "path";
import recursiveRead from "recursive-readdir";
import { rename } from "fs";
import replace from "replace-in-file";

/**
 * This script solves the problem of react-scripts creating unique names for static files
 * This may make sense for a website getting deployed to a cdn but in our case this just makes it annoying when updating to a new version
 * (currently i build and transpile so it can run on older node, and those artifacts get "published")
 *
 * So, this removes all the random parts from file names and references.
 */

//hackaround mjs scope and missing __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let files = [];
let renamedFiles = [];
let filesWithReferences = [".js", ".css", ".html", ".txt", ".json"];

/**
 *  helper stuff
 */

const readSync = (p) => {
    return new Promise((resolve, reject) => {
        recursiveRead(p, function (err, files) {
            if (err) { reject(new Error(err)); }
            else resolve(files);
        });
    });
};


const renameFile = (p) => {
    let fname = path.basename(p);
    console.log(`fname ${fname}`)
    let temp = fname.split(".");
    let length = temp.length;
    //take first and last parts
    if (length > 2) {
        if (temp[length - 2] === "LICENSE") {
            temp = [...temp.slice(0, 1), ...temp.slice(length - 2, length)]
        } else temp = [...temp.slice(0, 1), ...temp.slice(length - 1, length)]
    }
    console.dir(temp)
    console.log(p)
    console.log(path.dirname(p))
    return path.join(path.dirname(p), temp.join("."))

}

const hasReferences = (p) => {
    let fname = path.basename(p);
    for (let extension of filesWithReferences) {
        if (fname?.endsWith(extension)) {
            return true;
        }
    }
}

// 1. rename files, since they are all unique, save old and new names as pairs so we can update references later
// Get path to image directory

async function run() {
    const buildPath = path.resolve(__dirname, 'build');

    // Get an array of the files inside the folder recursively
    files = await readSync(buildPath);
    // Get an array of renamed file paths
    files.forEach(element => {
        let renamed = renameFile(element);
        renamedFiles.push(renamed);
    });
    if (files.length !== renamedFiles.length) throw new Error("Something is wrong, number of renamed files not the same as dir listing")
    //do the renaming

    files.forEach((file, i) => {
        console.dir(`${file} => ${renamedFiles[i]}`);
        rename(
            file,
            renamedFiles[i],
            err => err ? console.log(err) : null
        );
    });

    // 2. update references
    renamedFiles.forEach((p, x) => {
        if (hasReferences(p)) {
            //replace any of the references with new names
            files.forEach((originalPath, y) => {
                let fname = path.basename(originalPath);
                let newName = path.basename(renamedFiles[y]);
                //escape dots for regex
                let str = fname.replace(/\./g, '\.');
                let options = {
                    files: p,
                    from: new RegExp(str, 'g'),
                    to: newName
                }
                let results = replace.sync(options);
            })
        }
    });
}

run();

