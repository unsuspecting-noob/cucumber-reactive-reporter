Some notes about development and maintainance:

npm run start - runs local dev version for react development, this relies on Public folder to have _cucumber-results.json and _reporter_settings.json files to load the page.

to generate _cucumber-results.json, place cucumber-results.json with cucumberjs output into public folder, then run "npm run testinstall" that will put the output into /test folder.

to check in new sample to have it show up in github, check everything in /test folder into /docs. There is a magic file called ".nojekyll", its purpose is to tell github not to flatten docs structure.

publish notes:

#npm run generatedist 
clean up any dev files from dist:
careful when publishing dist, it can have debug json files left from /public folder that can be used during development

