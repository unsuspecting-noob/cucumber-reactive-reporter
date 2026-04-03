import assert from "node:assert/strict";
import test from "node:test";

import { prepareStoreState } from "../src/parser/cucumberJsonAdapter.mjs";
import { prepareStoreStateFromMessages } from "../src/parser/cucumberMessageAdapter.mjs";

const encodeBase64 = (value) => Buffer.from(value, "utf8").toString("base64");

test("prepareStoreState decodes and formats vendor JSON attachments from legacy cucumber JSON", () => {
  const attachmentPayload = JSON.stringify({
    type: "metadata",
    data: {
      labels: [{ name: "feature", value: "Authentication" }]
    }
  });

  const state = prepareStoreState([
    {
      id: "demo-login-smoke",
      keyword: "Feature",
      line: 1,
      name: "Demo login smoke",
      uri: "features/demo-login.feature",
      tags: [],
      elements: [
        {
          id: "demo-login-smoke;signed-in-user-can-reach-the-dashboard",
          keyword: "Scenario",
          line: 4,
          name: "Signed-in user can reach the dashboard",
          type: "scenario",
          tags: [],
          steps: [
            {
              keyword: "After",
              hidden: true,
              result: {
                status: "passed",
                duration: 47000000
              },
              embeddings: [
                {
                  data: encodeBase64(attachmentPayload),
                  mime_type: "application/vnd.allure.message+json"
                }
              ]
            }
          ]
        }
      ]
    }
  ], {
    attachmentsEncoding: "base64",
    inputFormat: "legacy-json",
    suppressMetadataAttachments: false
  });

  const scenarioId = state.scenarios.list[0];
  const step = state.steps.stepsMap[scenarioId].steps[0];

  assert.equal(step.embeddings[0].mime_type, "application/vnd.allure.message+json");
  assert.equal(step.embeddings[0].data, JSON.stringify(JSON.parse(attachmentPayload), null, 2));
});

test("prepareStoreStateFromMessages decodes and formats vendor JSON attachments from message envelopes", () => {
  const attachmentPayload = JSON.stringify({
    type: "metadata",
    data: {
      labels: [{ name: "story", value: "Login" }]
    }
  });

  const messageInput = [
    {
      gherkinDocument: {
        uri: "features/demo-login.feature",
        feature: {
          id: "feature-1",
          keyword: "Feature",
          name: "Demo login smoke",
          location: { line: 1 },
          children: [
            {
              scenario: {
                id: "scenario-1",
                keyword: "Scenario",
                name: "Signed-in user can reach the dashboard",
                location: { line: 4 },
                steps: [
                  {
                    id: "gherkin-step-1",
                    keyword: "Then ",
                    text: "the dashboard should be available",
                    location: { line: 7 }
                  }
                ]
              }
            }
          ]
        }
      }
    },
    {
      pickle: {
        id: "pickle-1",
        name: "Signed-in user can reach the dashboard",
        uri: "features/demo-login.feature",
        astNodeIds: ["scenario-1"],
        steps: [
          {
            id: "pickle-step-1",
            text: "the dashboard should be available",
            astNodeIds: ["gherkin-step-1"]
          }
        ]
      }
    },
    {
      testCase: {
        id: "test-case-1",
        pickleId: "pickle-1",
        testSteps: [
          {
            id: "test-step-1",
            pickleStepId: "pickle-step-1"
          }
        ]
      }
    },
    {
      testCaseStarted: {
        id: "test-case-started-1",
        testCaseId: "test-case-1"
      }
    },
    {
      testStepFinished: {
        testStepId: "test-step-1",
        testStepResult: {
          status: "PASSED",
          duration: {
            seconds: 0,
            nanos: 42
          }
        }
      }
    },
    {
      attachment: {
        testStepId: "test-step-1",
        mediaType: "application/vnd.allure.message+json",
        contentEncoding: "BASE64",
        body: encodeBase64(attachmentPayload)
      }
    }
  ];

  const state = prepareStoreStateFromMessages(messageInput, {
    suppressMetadataAttachments: false
  });

  const scenarioId = state.scenarios.list[0];
  const step = state.steps.stepsMap[scenarioId].steps[0];

  assert.equal(step.embeddings[0].mime_type, "application/vnd.allure.message+json");
  assert.equal(step.embeddings[0].data, JSON.stringify(JSON.parse(attachmentPayload), null, 2));
});

test("prepareStoreState suppresses Allure metadata attachments by default", () => {
  const state = prepareStoreState([
    {
      id: "demo-login-smoke",
      keyword: "Feature",
      line: 1,
      name: "Demo login smoke",
      uri: "features/demo-login.feature",
      tags: [],
      elements: [
        {
          id: "demo-login-smoke;signed-in-user-can-reach-the-dashboard",
          keyword: "Scenario",
          line: 4,
          name: "Signed-in user can reach the dashboard",
          type: "scenario",
          tags: [],
          steps: [
            {
              keyword: "Before",
              hidden: true,
              result: {
                status: "passed",
                duration: 24000000
              },
              embeddings: [
                {
                  data: encodeBase64(JSON.stringify({
                    type: "metadata",
                    data: {
                      labels: [{ name: "feature", value: "Authentication" }]
                    }
                  })),
                  mime_type: "application/vnd.allure.message+json"
                }
              ]
            }
          ]
        }
      ]
    }
  ], {
    attachmentsEncoding: "base64",
    inputFormat: "legacy-json"
  });

  const scenarioId = state.scenarios.list[0];
  const step = state.steps.stepsMap[scenarioId].steps[0];

  assert.deepEqual(step.embeddings, []);
  assert.equal(state.scenarios.scenariosMap[scenarioId].passedSteps, 0);
});

test("prepareStoreState keeps hook artifacts but excludes hidden hook pass and skip rows from visible totals", () => {
  const state = prepareStoreState([
    {
      id: "demo-login-smoke",
      keyword: "Feature",
      line: 1,
      name: "Demo login smoke",
      uri: "features/demo-login.feature",
      tags: [],
      elements: [
        {
          id: "demo-login-smoke;signed-in-user-can-reach-the-dashboard",
          keyword: "Scenario",
          line: 4,
          name: "Signed-in user can reach the dashboard",
          type: "scenario",
          tags: [],
          steps: [
            {
              keyword: "Given ",
              line: 5,
              name: "the user signs in",
              result: {
                status: "passed",
                duration: 12000000
              }
            },
            {
              keyword: "After",
              hidden: true,
              result: {
                status: "passed",
                duration: 24000000
              },
              embeddings: [
                {
                  data: encodeBase64("artifact"),
                  mime_type: "text/plain"
                }
              ]
            },
            {
              keyword: "After",
              hidden: true,
              result: {
                status: "skipped",
                duration: 12000000
              },
              embeddings: [
                {
                  data: encodeBase64("artifact"),
                  mime_type: "text/plain"
                }
              ]
            }
          ]
        }
      ]
    }
  ], {
    attachmentsEncoding: "base64",
    inputFormat: "legacy-json"
  });

  const scenarioId = state.scenarios.list[0];
  const scenario = state.scenarios.scenariosMap[scenarioId];

  assert.equal(scenario.passedSteps, 1);
  assert.equal(scenario.skippedSteps, 0);
});

test("prepareStoreStateFromMessages suppresses Allure metadata attachments by default", () => {
  const attachmentPayload = JSON.stringify({
    type: "metadata",
    data: {
      labels: [{ name: "story", value: "Login" }]
    }
  });

  const state = prepareStoreStateFromMessages([
    {
      gherkinDocument: {
        uri: "features/demo-login.feature",
        feature: {
          id: "feature-1",
          keyword: "Feature",
          name: "Demo login smoke",
          location: { line: 1 },
          children: [
            {
              scenario: {
                id: "scenario-1",
                keyword: "Scenario",
                name: "Signed-in user can reach the dashboard",
                location: { line: 4 },
                steps: [
                  {
                    id: "gherkin-step-1",
                    keyword: "Then ",
                    text: "the dashboard should be available",
                    location: { line: 7 }
                  }
                ]
              }
            }
          ]
        }
      }
    },
    {
      pickle: {
        id: "pickle-1",
        name: "Signed-in user can reach the dashboard",
        uri: "features/demo-login.feature",
        astNodeIds: ["scenario-1"],
        steps: [
          {
            id: "pickle-step-1",
            text: "the dashboard should be available",
            astNodeIds: ["gherkin-step-1"]
          }
        ]
      }
    },
    {
      testCase: {
        id: "test-case-1",
        pickleId: "pickle-1",
        testSteps: [
          {
            id: "test-step-1",
            pickleStepId: "pickle-step-1"
          }
        ]
      }
    },
    {
      testCaseStarted: {
        id: "test-case-started-1",
        testCaseId: "test-case-1"
      }
    },
    {
      testStepFinished: {
        testStepId: "test-step-1",
        testStepResult: {
          status: "PASSED",
          duration: {
            seconds: 0,
            nanos: 42
          }
        }
      }
    },
    {
      attachment: {
        testStepId: "test-step-1",
        mediaType: "application/vnd.allure.message+json",
        contentEncoding: "BASE64",
        body: encodeBase64(attachmentPayload)
      }
    }
  ]);

  const scenarioId = state.scenarios.list[0];
  const step = state.steps.stepsMap[scenarioId].steps[0];

  assert.deepEqual(step.embeddings, []);
});

test("prepareStoreStateFromMessages keeps hook artifacts but excludes hidden hook pass and skip rows from visible totals", () => {
  const state = prepareStoreStateFromMessages([
    {
      gherkinDocument: {
        uri: "features/demo-login.feature",
        feature: {
          id: "feature-1",
          keyword: "Feature",
          name: "Demo login smoke",
          location: { line: 1 },
          children: [
            {
              scenario: {
                id: "scenario-1",
                keyword: "Scenario",
                name: "Signed-in user can reach the dashboard",
                location: { line: 4 },
                steps: [
                  {
                    id: "gherkin-step-1",
                    keyword: "Given ",
                    text: "the user signs in",
                    location: { line: 5 }
                  }
                ]
              }
            }
          ]
        }
      }
    },
    {
      pickle: {
        id: "pickle-1",
        name: "Signed-in user can reach the dashboard",
        uri: "features/demo-login.feature",
        astNodeIds: ["scenario-1"],
        steps: [
          {
            id: "pickle-step-1",
            text: "the user signs in",
            astNodeIds: ["gherkin-step-1"]
          }
        ]
      }
    },
    {
      testCase: {
        id: "test-case-1",
        pickleId: "pickle-1",
        testSteps: [
          {
            id: "test-step-before",
            hookId: "before-hook"
          },
          {
            id: "test-step-1",
            pickleStepId: "pickle-step-1"
          },
          {
            id: "test-step-after",
            hookId: "after-hook"
          }
        ]
      }
    },
    {
      testCaseStarted: {
        id: "test-case-started-1",
        testCaseId: "test-case-1"
      }
    },
    {
      testStepFinished: {
        testStepId: "test-step-before",
        testStepResult: {
          status: "SKIPPED",
          duration: {
            seconds: 0,
            nanos: 10
          }
        }
      }
    },
    {
      attachment: {
        testStepId: "test-step-before",
        mediaType: "text/plain",
        contentEncoding: "BASE64",
        body: encodeBase64("before hook artifact")
      }
    },
    {
      testStepFinished: {
        testStepId: "test-step-1",
        testStepResult: {
          status: "PASSED",
          duration: {
            seconds: 0,
            nanos: 42
          }
        }
      }
    },
    {
      testStepFinished: {
        testStepId: "test-step-after",
        testStepResult: {
          status: "PASSED",
          duration: {
            seconds: 0,
            nanos: 9
          }
        }
      }
    },
    {
      attachment: {
        testStepId: "test-step-after",
        mediaType: "text/plain",
        contentEncoding: "BASE64",
        body: encodeBase64("after hook artifact")
      }
    }
  ]);

  const scenarioId = state.scenarios.list[0];
  const scenario = state.scenarios.scenariosMap[scenarioId];

  assert.equal(scenario.passedSteps, 1);
  assert.equal(scenario.skippedSteps, 0);
});
