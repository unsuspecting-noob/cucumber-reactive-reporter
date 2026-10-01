// Sample report shared by `npm run updatedocs` (GitHub Pages demo in docs/) and
// `npm run testinstall` (smoke test of the packaged build, written to sample/).
// The source is raw cucumber JSON; it is gitignored, so keep a local copy.
export const SAMPLE_SOURCE = "public/cucumber-results.json";

export const sampleReportOptions = {
  title: "Cucumber reactive reporter sample",
  description: "Sample cucumber tests to show off reporter features:\n Click on @tags to see all tags used in your report, use these to filter results using cucumber tag expressions, ex: (@tag1 or @tag2) and not @tag5",
  metadata: {
    "some key": "value",
    "additional key": "value",
    "more keys": "value"
  },
  suppressMetadataAttachments: true
};
