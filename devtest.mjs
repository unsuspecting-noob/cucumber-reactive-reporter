import Reporter from "./dist/cucumber-reactive-reporter.cjs.js";
import { SAMPLE_SOURCE, sampleReportOptions } from "./sampleReportOptions.mjs";

// smoke test of the packaged build: generate the sample report with dist/ into sample/
(async () => {
    await Reporter.generate(SAMPLE_SOURCE, "sample/", sampleReportOptions);
})();
