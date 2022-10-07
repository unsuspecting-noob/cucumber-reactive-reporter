[![#StandWithUkraine](https://raw.githubusercontent.com/vshymanskyy/StandWithUkraine/main/badges/StandWithUkraine.svg)](https://vshymanskyy.github.io/StandWithUkraine)

<b>Cucumber report library based on react-redux and @mui
Parses output of cucumberjs
provides filtering via tags ans status and few other things.</b>
<br>
### Why another reporter? ###
<b>The main motivation behind this project was the need to control various data attachments and how they show up in reports.
Existing libraries gave very sandboxy and limited options for things like attaching a custom html line to the report.

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
## Example usage:

```js
import Reporter from "cucumber-reactive-reporter";
let options = {
    "title": "Cucumber reactive reporter sample",
    "description": "... test suite description"
};
let metadata = {
    "some key": "value",
    "additional key": "value",
    "more keys": "value"
};
options.metadata = metadata;
(async () => {
    await Reporter.generate("mytest/cucumber-output.json", "htmlOutputFolder/", options);
})();
```

### See sample in action:
[link](https://unsuspecting-noob.github.io/cucumber-reactive-reporter/index.html)

* @TAGS button displays a list of every tag found in the report
* METADATA button opens a section with any custom key value pairs passed in during creating of the report
* Search window allows for cucumber expressions to filter down to features with scenarios matching the expression, for example:
    * ```(@catfacts or @image) and not @1_tag```
## TODOs and ideas for improvement:

1. consider adding hooks for linking to jira the way allure does it: 
```
links: {
          issue: {
            pattern: [/@issue=(.*)/],
            urlTemplate: "http://localhost:8080/issue/%s"
          },
          tms: {
            pattern: [/@tms=(.*)/],
            urlTemplate: "http://localhost:8080/tms/%s"
          }
        }
```
2. patch more settings for intial render (before/after toggle, theme, filter etc.)
3. handle state "ambiguous" (probably lump em with errors), generate one when there are two test definitions with similar regex
4. Figure out a strategy for handling combined reports (from parallel runs)

### Release notes

| Version | Description |
| ----------- | ----------- |
| 1.0.2 | improvements to debugging and readme |
| 1.0.3 | fixed crashes when search threw syntax errors<br>fixed css for @tags and @metadata buttons |
| 1.0.4 | Added more pagination choices for scenariosList, 50 and 100 |
| 1.0.5 | Fixing publishing code and adding notes |
| 1.0.6 | Added pagination to the main feature screen, shows up if above 50 |
| 1.0.7 | Changed feature pagination to be always on if above 10 elements, the reason why is you can change to display 10 at a time to force single column|
