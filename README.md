[![#StandWithUkraine](https://raw.githubusercontent.com/vshymanskyy/StandWithUkraine/main/badges/StandWithUkraine.svg)](https://vshymanskyy.github.io/StandWithUkraine)

<b>Cucumber report library based on react-redux and @mui
Parses output of cucumberjs
provides filtering via tags and status and few other things.</b>
<br>
### Why another reporter? ###
<b>The main motivation behind this project was the desire for a more dynamic experience as well as the need to get more control over various data attachments and how they are displayed.

Here are some of the things that were deemed important to implement in this reporter:
</b>

* Control over how data is displayed, including the ability to pass html snippets as attachments and render them in the reporter: (can be useful when pointing to "local" files generated as part of the test run)
* Ability to filter and search the reports based on such things like status and tags
* Ability to work with large-ish amounts of tests, some existing reports become unwieldy or slow
* Control filter and search configuration with url params, allows sharing a preconfigured link in case you want to share a specific failure for example.
* Better use available space on the report page (needs tweaking)

</p>

## Install

```shell
$ npm install cucumber-reactive-reporter
```

## Development Baseline

- Node.js: `>=22`
- Recommended local baseline: Node.js `22` LTS

## Example usage:

```js
import Reporter from "cucumber-reactive-reporter";
let options = {
    "title": "Cucumber reactive reporter sample",
    "description": "... test suite description",
    "inputFormat": "legacy-json",
    "attachmentsEncoding": "auto",
    "cucumberVersion": "12.5.0",
    "suppressMetadataAttachments": true
};
let metadata = {
    "some key": "value",
    "additional key": "value",
    "more keys": "value"
};
let linkTags = [{
         "pattern": "[a-zA-Z]*-(\\d)*$",
         "link": "https://my.jira.server/browse/"
    }];
options.metadata = metadata;
options.linkTags = linkTags;
(async () => {
    await Reporter.generate("mytest/cucumber-output.json", "htmlOutputFolder/", options);
})();
```

### Options

- `inputFormat`: `legacy-json` (default), `message`, or `auto`.
  - Use `message` for `--format message:<file>` NDJSON output.
- `attachmentsEncoding`: `auto` (default), `base64`, or `raw`.
  - Use `raw` if your cucumber JSON stores text attachments unencoded.
  - Use `base64` if text attachments are base64 encoded.
  - `auto` decodes base64-looking text attachments.
- `cucumberVersion`: optional version hint to pick attachment decoding behavior.
- `suppressMetadataAttachments`: `true` by default.
  - Hides runner-generated metadata blobs such as `application/vnd.allure.message+json`.
  - Set to `false` if you explicitly want to inspect those attachments in the report.
- `live`: enable incremental updates for message streams; requires `inputFormat: "message"`.
  - Example: `live: { enabled: true, pollIntervalMs: 2000, flushIntervalMs: 1000 }`.
  - `bootstrapDispatchMs`: throttle UI updates while bootstrapping NDJSON (default 200).
  - `bootstrapChunkBytes`: chunk size used when bootstrapping NDJSON (default 262144).

### See sample in action:
[link](https://unsuspecting-noob.github.io/cucumber-reactive-reporter/index.html)

* @TAGS button displays a list of every tag found in the report
* METADATA button opens a section with any custom key value pairs passed in during creating of the report
* Search window allows for cucumber expressions to filter down to features with scenarios matching the expression, for example:
    * ```(@catfacts or @image) and not @1_tag```
## TODOs and ideas for improvement:

1. patch more settings for intial render (before/after toggle, theme, filter etc.)
2. handle state "ambiguous" (probably lump em with errors), generate one when there are two test definitions with similar regex
3. Figure out a strategy for handling combined reports (from parallel runs)

### Release notes

| Version | Description |
| ----------- | ----------- |
| 1.0.2 | improvements to debugging and readme |
| 1.0.3 | fixed crashes when search threw syntax errors<br>fixed css for @tags and @metadata buttons |
| 1.0.4 | Added more pagination choices for scenariosList, 50 and 100 |
| 1.0.5 | Fixing publishing code and adding notes |
| 1.0.6 | Added pagination to the main feature screen, shows up if above 50 |
| 1.0.7 | Changed feature pagination to be always on if above 10 elements, the reason why is you can change to display 10 at a time to force single column|
| 1.0.8 | Fixed json parsing error for newer cucumber version, where Before and After steps do not provide code line info|
| 1.0.9 | Fixed displayed step duration in newer versions of cucumber|
| 1.0.10 | New reporter option to convert some tags to custom links|
| 1.9.0 | UI redesign: refreshed light theme, redesigned feature/scenario cards, centered pagination with page size selector, interactive pie chart with hover tooltips, fullscreen step detail dialog, deep link button for scenarios, failure summary sidebar with scenario navigation, summary drawer always available (not just live mode), React 18 upgrade |
| 1.9.1 | Improved feature description formatting: multi-line rendering with left border accent, automatic bullet detection, clickable URLs, and collapsible truncation for long descriptions. Fixed deep link copy button not working in non-HTTPS contexts. Added `npm run updatedocs` script to rebuild the sample report. |
| 1.9.2 | Reporter version displayed in header next to title. Version is stamped into report settings at generation time. |
| 1.9.3 | Fixed `npm publish` shipping stale React build. Added `prepublishOnly` hook to auto-rebuild `dist/` before publishing. Updated rollup to v4 and fixed config path. |
| 1.9.4 | Improved Playwright-BDD compatibility: better decoding/rendering for vendor JSON and image attachments, metadata attachments hidden by default, useful hidden hook artifacts preserved, visible step counts no longer skewed by hidden hook noise, and feature/failure summary rendering now uses memoized selectors with cleaner URL sync. |
| 1.10.0 | Added native `video/*` attachment rendering so Playwright-BDD and similar Cucumber outputs can show embedded failure videos directly in the HTML report. |
