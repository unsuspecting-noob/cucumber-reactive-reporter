Cucumber report library based on react-redux and @mui
Parses output of cucumberjs
provides filtering via tags ans status and few other things.

*have not been tested with latest cucumberjs

Example usage:

```
import reporter from '@unsuspecting-noob/cucumber-reactive-reporter';

...
let reportFilePath="full path to cucumber output json";
let reportFolderPath="path to folder where the html report will go";
let meta = { //there will be a metadata section in the report that will display your key value pairs for posterity
  "key1": "value1",
  "fizz: "buzz"
};
await reporter.generate(reportFilePath, reportFolderPath, { title: "my tests", description: "2 + 2, is it still 4?", metadata: meta });
```


TODOs and ideas for improvement:

1. consider adding hooks for linking to jira the way allure does it: 
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
2. patch more settings for intial render (before/after toggle, theme, filter etc.)
3. handle state "ambiguous" (probably lump em with errors), generate one when there are two test definitions with similar regex
4. Figure out a strategy for handling combined reports (from parallel runs)