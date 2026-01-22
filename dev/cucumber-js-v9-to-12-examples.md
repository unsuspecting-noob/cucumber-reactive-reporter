# Cucumber-js v9 -> v12.5 summary + examples (reporting-focused)

This file pairs a short summary of the key changes with commented examples
you can paste into your repo. Sources are from the cucumber-js repo at
/Users/npopov/projects/js/cucumber-js.

## Summary (what changed)

- Reporting: JSON formatter is legacy/maintenance mode; prefer `message` (NDJSON)
  for event-driven outputs. JSON attachments are now always base64-encoded.
- Message stream: cucumber-messages envelopes are the canonical event stream.
  New message types were added (test run hooks, suggestions), and more metadata
  fields were extended (hook type, testRunStarted ids).
- HTML reports: externalized attachments and attachment links were added, plus
  UI refreshes and a more test-case-centric layout.
- JUnit reports: suiteName option (v9.2) and timestamp attribute (v11.2), with
  a messages-based JUnit formatter under the hood.
- Runtime/infra: sharding, plugins, and named test-run hooks arrived later in
  the v12 series; config and custom formatters load via `await import()` from v10.

## Execution and runtime changes

### Sharding (v12.2.0)
```js
// cucumber.mjs
export default {
  // Split scenarios across multiple runs: this is shard 1 of 3.
  shard: '1/3',
  paths: ['features/**/*.feature'],
  import: ['features/**/*.js'],
  format: ['summary'],
}
```

```sh
# CLI
# Run only shard 1 of 3 for this test run.
cucumber-js --shard 1/3 --format summary
```

### Plugins (v12.5.0)
```js
// cucumber.mjs
export default {
  // Register a local plugin and pass plugin-specific options.
  plugin: ['./plugins/my-plugin.js'],
  pluginOptions: { myPlugin: { verbose: true } },
}
```

```js
// plugins/my-plugin.js
export default {
  type: 'plugin',
  // Map only the "myPlugin" subtree from pluginOptions into `options`.
  optionsKey: 'myPlugin',
  coordinator: ({ on, logger, options }) => {
    on('message', (envelope) => {
      if (envelope.testRunFinished && options.verbose) {
        // Structured logger writes to stderr.
        logger.info('Test run finished')
      }
    })
  },
}
```

### Named BeforeAll / AfterAll hooks (v12.3.0)
```js
import { BeforeAll, AfterAll } from '@cucumber/cucumber'

BeforeAll({ name: 'Bootstrap test data' }, async function () {
  // Run-level setup before any scenarios.
})

AfterAll({ name: 'Cleanup test data' }, async function () {
  // Run-level teardown after all scenarios.
})
```

## Node/ESM and loading changes

### Config files load with the correct module system (v10.0.0)
```js
// cucumber.mjs
export default {
  // ESM config file, loaded via `import()` under the hood.
  import: ['features/**/*.js'],
  paths: ['features/**/*.feature'],
  format: ['summary'],
}
```

### Custom formatter as ESM default export
```js
// formatters/my-formatter.js
export default class MyFormatter {
  constructor(options) {
    options.eventBroadcaster.on('envelope', (envelope) => {
      if (envelope.testCaseFinished) {
        // Use the provided log function to write to the configured stream.
        options.log('case done\n')
      }
    })
  }
}
```

```js
// cucumber.mjs
export default {
  // Reference a local formatter via relative path.
  format: ['./formatters/my-formatter.js'],
}
```

### Loader option for ESM (v10.6.0)
```js
// cucumber.mjs
export default {
  // Register an ESM loader (useful for TS) before imports.
  loader: ['ts-node/esm'],
  import: ['features/**/*.ts'],
}
```

```sh
# CLI
# Use a loader to compile TS support code at runtime.
cucumber-js --loader ts-node/esm --import 'features/**/*.ts'
```

## Developer ergonomics

### world and context proxies for arrow functions (v10.8.0)
```js
import { BeforeAll, Given, context, world } from '@cucumber/cucumber'

BeforeAll(async () => {
  // Use the run-level context proxy for arrow functions in BeforeAll/AfterAll.
  context.parameters.accessToken = await getAccessToken()
})

Given('I call the API', async () => {
  // Use the test-case world proxy for arrow functions in steps/hooks.
  const token = world.parameters.accessToken
  await callApiWithToken(token)
})
```

### Debug logging around code loading (v10.4.0)
```sh
# Enables extra debug output about configuration and loading.
DEBUG=cucumber cucumber-js --format summary
```

## Reporting and message stream changes

### JSON formatter still supported (legacy)
```sh
# Legacy JSON output; still supported but in maintenance mode.
cucumber-js --format json:reports/cucumber-results.json
```

### JSON attachments are always base64 (v10.0.0)
```js
import { After } from '@cucumber/cucumber'

After(function () {
  // These become base64 in JSON output (even strings).
  this.attach('plain text', 'text/plain')
  this.attach('{"k":"v"}', { mediaType: 'application/json' })
})
```

### Prefer message formatter (NDJSON event stream)
```sh
# NDJSON message stream (preferred for tooling).
cucumber-js --format message:reports/messages.ndjson
```

```js
// scripts/read-messages.mjs
import fs from 'node:fs'
import readline from 'node:readline'

const rl = readline.createInterface({
  input: fs.createReadStream('reports/messages.ndjson'),
})

rl.on('line', (line) => {
  const envelope = JSON.parse(line)
  if (envelope.testRunFinished) {
    // `testRunFinished` is emitted at the end of the run.
    console.log('run finished', envelope.testRunFinished)
  }
  if (envelope.testRunHookFinished) {
    // Hook events are now in the message stream.
    console.log('run hook finished', envelope.testRunHookFinished)
  }
  if (envelope.suggestion) {
    // Suggestion messages are emitted for undefined steps.
    console.log('undefined step suggestion', envelope.suggestion)
  }
})
```

### Message stream hook events (v11.2+ / v12.3)
```js
// plugins/test-run-hooks-logger.js
export default {
  type: 'plugin',
  coordinator: ({ on, logger }) => {
    on('message', (envelope) => {
      if (envelope.testRunHookStarted) {
        // Hook id lets you correlate started/finished events.
        logger.info(`hook started: ${envelope.testRunHookStarted.hookId}`)
      }
      if (envelope.testRunHookFinished) {
        logger.info(`hook finished: ${envelope.testRunHookFinished.testRunHookStartedId}`)
      }
    })
  },
}
```

### HTML formatter external attachments (v10.9.0)
```js
// cucumber.mjs
export default {
  // HTML report with external attachments saved next to the report.
  format: [['html', 'reports/cucumber.html']],
  formatOptions: {
    html: { externalAttachments: true },
  },
}
```

### Attachment links (v10.9.0)
```js
import { After } from '@cucumber/cucumber'

After(function () {
  // Adds a link attachment to message/HTML outputs.
  this.link('https://example.com/build/123')
})
```

### JUnit formatter options and timestamp (v9.2.0 / v11.2.0)
```js
// cucumber.mjs
export default {
  // JUnit output with a custom suite name.
  format: [['junit', 'reports/junit.xml']],
  formatOptions: {
    junit: { suiteName: 'notifications' },
  },
}
```

### Pretty formatter package
```sh
# Pretty formatter as a module name (no local path needed).
cucumber-js --format @cucumber/pretty-formatter
```
