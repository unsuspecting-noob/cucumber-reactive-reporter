[![#StandWithUkraine](https://raw.githubusercontent.com/vshymanskyy/StandWithUkraine/main/badges/StandWithUkraine.svg)](https://vshymanskyy.github.io/StandWithUkraine)

<b>Cucumber report library based on react-redux and @mui
Parses output of cucumberjs
provides filtering via tags ans status and few other things.</b>
<br>
*have not been tested with latest cucumberjs
</p>

## Install

```shell
$ npm install @unsuspecting-noob/cucumber-reactive-reporter
```
## Example usage:

```js
import reporter from '@unsuspecting-noob/cucumber-reactive-reporter';
...
let reportFilePath="full path to cucumber output json";
let reportFolderPath="path to folder where the html report will go";
let meta = { //there will be a metadata section in the report that will display your key value pairs for posterity
  "key1": "value1",
  "fizz: "buzz"
};
await reporter.generate(reportFilePath, reportFolderPath, { title: "my tests", description: "My test suite description", metadata: meta });
```

#Sample page
[link](https://unsuspecting-noob.github.io/cucumber-reactive-reporter/index.html)
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