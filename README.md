[![#StandWithUkraine](https://raw.githubusercontent.com/vshymanskyy/StandWithUkraine/main/badges/StandWithUkraine.svg)](https://vshymanskyy.github.io/StandWithUkraine)

<b>Cucumber report library based on react-redux and @mui
Parses output of cucumberjs
provides filtering via tags ans status and few other things.</b>
<br>
### Why another reporter? ###
<b>I have made a somewhat odd choice of using cucumberjs for microservice API testing, unlike the usual application of testing UIs.
Because validation was centered on various data, i quickly ran into limitations of existing reporters with data attachments. 
These are the things that were important to me that i tried to implement in this reporter:
</b>

* Control over how data is displayed, including the ability to pass html snippets as attachments and render them in the reporter: (can be useful when pointing to "local" files generated as part of the test run)
* Ability to filter and search the reports based on such things like status and tags
* Ability to work with large-ish amounts of tests, some existing reports become unwieldy or slow
* Control filter and search configuration with url params, allows sharing a preconfigured link in case you want to share a specific failure for example.

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
    await Reporter.generate("public/cucumber-results.json", "test/", options);
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