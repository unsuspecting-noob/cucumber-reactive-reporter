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


TODO:

1. handle other mime types for attachments: img
2. fix long names spilling over the fixed feature panes
3. ~~fix scenarios expanding past half screen column width, which messes up other feature layout~~
4. consider adding hooks for linking to jira the way allure does it: 
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
5. fix spacing for step numbers (when it has 2 digits 2nd digit overlaps with step text)
6. collapse scenario on doubleclick of the steps body
7. collapse feature on click of the background paper
8. consider having header sticky or think of some jump to top mechanism
9. ~~add metadata section~~
10. ~~hook up all/passed/failed/skipped to query sync to work in tandem with the filter~~
11. ~~Patch through report description to the page header~~
12. ~~build generates randomly named static files, it would be nice to make those names non-random, also see considerations.~~
13. ~~don't count before and after steps~~
14. ~~make the presense of failed scenarios clearer in the header~~
15. ~~consider FAILED to also filter only failed scenarios.~~
16. ~~add to the info chip the number of failed features/scenarios (might cover 10.)~~
17. ~~fix filter by tags to exclude scenarios in the feature that dont have specific tag, try @blacklist in vadi regression for an ex.~~
18. fix collapse for xmls to work individually when multiple xml attachments
19. patch more settings for intial render (before/after toggle, theme, filter etc.)

CONSIDERATIONS
currently deployments happen via building this project and commiting artifacts to https://github.com/d3sw/cucumberjs-reporter.
This is done so that we can build this with latest node, transpile and then use in an older project as a dependency.
There is probably a better way that will let us avoid splitting this into two repos.