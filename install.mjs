import Fs from "fs/promises";
import path from "path";

const BUILD_D = "./react";
const OUT_D = "./dist";

// files that should not be published - these are sample/test data used during development
const EXCLUDE_FILES = ["cucumber-results.json", "_cucumber-results.json", "_reporter_settings.json"];

const cp = async (source, destination, options = {}) => {
    await Fs.cp(source, destination, {
        recursive: true,
        force: true,
        ...options
    });
};

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
    await cp(BUILD_D, dest, {
        filter: (filePath) => !EXCLUDE_FILES.includes(path.basename(filePath))
    });
}

const createDistPackageJson = async () => {
    const source = JSON.parse(await Fs.readFile("./package.json", "utf8"));
    const distPackage = {
        name: source.name,
        version: source.version,
        description: source.description,
        private: source.private,
        homepage: source.homepage,
        main: "./cucumber-reactive-reporter.cjs.js",
        module: "./cucumber-reactive-reporter.esm.js",
        license: source.license,
        repository: source.repository,
        engines: source.engines
    };
    await Fs.writeFile(
        path.join(OUT_D, "package.json"),
        `${JSON.stringify(distPackage, null, 2)}\n`
    );
};

let main = async function () {
    await copyBuild();
    await createDistPackageJson();
}();
