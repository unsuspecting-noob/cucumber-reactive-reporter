// import { createRequire } from 'module';
import fs from "fs";
import ncp from "ncp";
import path from "path";
import ut from "util";

// const require = createRequire(import.meta.url); //useful hackaround to get module path

ncp.limit = 16;

let modulePath = require.resolve("./package.json"); //trick to resolve path to the installed module

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
    const HTML_PATH = path.join(path.dirname(modulePath), "react");

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
    let out = _prepDataForStore(obj);
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

let _prepDataForStore = (data) => {
    let state = {};
    state.features = {};
    state.features.list = [];
    state.features.featuresMap = {};
    state.scenarios = {};
    state.scenarios.list = [];
    state.scenarios.scenariosMap = {};
    state.steps = {};
    state.steps.stepsMap = {};
    state.steps.totalDurationNanoSec = 0;
    //parse
    let featureIndex = 0;
    console.time("loadTotal")
    for (let f of data) {
        //FEATURE
        //cucumber id field is not guaranteed to be unique for feature/scenario/step
        f.id = `${featureIndex++}_${f.id}`;
        _processFeature(state, f);

        //SCENARIO
        let numScenarios = f.elements.length; //avoid multiple lookups;
        if (f.elements && numScenarios) {
            let sc_index = 0;
            for (let sc of f.elements) {
                //need to make scenario id unique as well
                sc_index++;
                let sc_id_arr = sc.id.split(";");
                sc_id_arr[0] = f.id;
                if (sc_id_arr.length) {
                    sc_id_arr[1] = `${sc_index - 1}_${sc_id_arr[1]}`;
                }
                sc.id = sc_id_arr.join(";");
                _processScenario(state, f.id, sc)
                //STEPS
                for (let st of sc.steps) {
                    _processStep(state, sc.id, st)
                }
            }
        }
    }
    console.timeEnd("loadTotal")
    return state;
}

let _processFeature = (state, f) => {
    const {
        description,
        elements,
        id,
        keyword,
        line,
        name,
        tags: [...tags],
        uri
    } = f;
    const allTags = [...tags];
    //figure out if it has failed stuff
    let numFailedScenarios = 0;
    let numSkippedScenarios = 0;
    if (elements && elements.length) {
        for (let el of elements) {
            //collect scenario tags
            if (el.tags && el.tags.length) {
                let temp = allTags.map(t => t.name);
                el.tags.forEach((tag) => {
                    if (temp.includes(tag.name) === false) {
                        allTags.push(tag);
                    }
                });
            }
            if (el.steps && el.steps.length) {
                for (let step of el.steps) {
                    if (step.result && step.result.status === "failed") {
                        numFailedScenarios++;
                        break;
                    }
                    if (step.result && step.result.status === "skipped") {
                        numSkippedScenarios++;
                        break;
                    }
                }
            }
        }
    }
    state.features.list.push(id);
    state.features.featuresMap[id] = {
        id,
        description,
        uri,
        keyword,
        name,
        line,
        tags,
        allTags,
        numFailedScenarios,
        numSkippedScenarios
    };
}

let _processScenario = (state, featureId, scenario) => {
    const {
        id,
        keyword,
        line,
        name,
        tags: [...tags],
        type,
        uri
    } = scenario;

    state.scenarios.list.push(id);
    state.scenarios.scenariosMap[id] = {
        failedSteps: 0,
        featureId,
        id,
        keyword,
        line,
        name,
        passedSteps: 0,
        skippedSteps: 0,
        tags,
        type,
        uri
    };
}

let _processStep = (state, scenarioId, st) => {
    const {
        arguments: args,
        embeddings,
        hidden,
        keyword,
        line,
        name,
        result: {
            duration,
            error_message,
            status
        }
    } = st;
    let location = "";
    if (st.match) location = st.match.location;
    let step = {
        args,
        duration,
        embeddings,
        error_message,
        keyword,
        line,
        location,
        name,
        status
    };
    if (!state.steps.stepsMap[scenarioId])
        state.steps.stepsMap[scenarioId] = { steps: [] };
    state.steps.stepsMap[scenarioId].steps.push(step);
    if (isNaN(duration) === false) {
        state.steps.totalDurationNanoSec = state.steps.totalDurationNanoSec + duration;
    }

    if (!hidden || (embeddings && embeddings.length)) {
        if (status === "passed") {
            state.scenarios.scenariosMap[scenarioId].passedSteps++;
        } else if (status === "skipped") {
            state.scenarios.scenariosMap[scenarioId].skippedSteps++;
        }
    }
    if (status === "failed") {
        state.scenarios.scenariosMap[scenarioId].failedSteps++;
    }
}

export default {
    generate: generate
};