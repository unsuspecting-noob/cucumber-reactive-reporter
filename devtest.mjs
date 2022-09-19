import Reporter from "./dist/cucumber-reactive-reporter.cjs.js";
let options = {
    "title": "Cucumber reactive reporter sample",
    "description": "Sample cucumber tests to show off reporter features:\n Click on @tags to see all tags used in your report, use these to filter results using cucumber tag expressions, ex: (@tag1 or @tag2) and not @tag5"
};
let metadata = {
    "some key": "value",
    "additional key": "value",
    "more keys": "value"
};
options.metadata = metadata;
Reporter.generate("public/cucumber-results.json", "test/", options)