Cucumber report library based on react-redux and @mui
Parses output of cucumberjs
provides filtering via tags ans status and few other things.

*have not been tested with latest cucumberjs

npm run install
http serve the dist directory
expects _cucumber-results.json file in the root
expects _reporter_settings_.json file in the root
ex.:

{
    "title": "my report",
    "description": "Report description stuff",
    "metadata": {
        "key1": "val1",
        "key2": "val2"
    }
}


TODOs:

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