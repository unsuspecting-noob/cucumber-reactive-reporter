import assert from "node:assert/strict";
import test from "node:test";

import {
  makeGetFailureSummarySections,
  makeGetFeatureExecutionState,
  makeGetFeatureStatusCounts
} from "../src/store/reportSelectors.mjs";

const buildState = () => ({
  features: {
    list: ["feature-1", "feature-2"],
    featuresMap: {
      "feature-1": {
        id: "feature-1",
        name: "Feature 1"
      },
      "feature-2": {
        id: "feature-2",
        name: "Feature 2"
      }
    }
  },
  scenarios: {
    list: ["scenario-1", "scenario-2", "scenario-3", "scenario-4"],
    scenariosMap: {
      "scenario-1": {
        id: "scenario-1",
        featureId: "feature-1",
        name: "Passed scenario",
        passedSteps: 2,
        skippedSteps: 0,
        failedSteps: 0,
        tags: [{ name: "@smoke" }]
      },
      "scenario-2": {
        id: "scenario-2",
        featureId: "feature-1",
        name: "Skipped scenario",
        passedSteps: 0,
        skippedSteps: 1,
        failedSteps: 0,
        tags: [{ name: "@smoke" }]
      },
      "scenario-3": {
        id: "scenario-3",
        featureId: "feature-1",
        name: "Failed scenario",
        passedSteps: 0,
        skippedSteps: 0,
        failedSteps: 1,
        tags: [{ name: "@regression" }]
      },
      "scenario-4": {
        id: "scenario-4",
        featureId: "feature-2",
        name: "Running scenario",
        passedSteps: 0,
        skippedSteps: 0,
        failedSteps: 0,
        tags: [{ name: "@workflow" }]
      }
    }
  },
  steps: {
    stepsMap: {
      "scenario-1": {
        steps: [
          { status: "passed" }
        ]
      },
      "scenario-2": {
        steps: [
          { status: "skipped" }
        ]
      },
      "scenario-3": {
        steps: [
          { status: "failed" },
          { status: "failed", error_message: "first failure", keyword: "Then ", name: "it breaks" },
          { status: "failed", error_message: "second failure", keyword: "And ", name: "it breaks again" }
        ]
      },
      "scenario-4": {
        steps: [
          { status: "passed" },
          {}
        ]
      }
    }
  },
  states: {
    external_settings: {
      live: {
        enabled: true
      }
    },
    featuresList: {
      featuresButtonToggleValue: "All",
      lastEnteredSearchValue: "",
      liveActiveFeatureId: null
    }
  }
});

test("feature selectors derive visible counts and running state from scoped scenarios", () => {
  const state = buildState();
  const executionSelector = makeGetFeatureExecutionState();
  const countsSelector = makeGetFeatureStatusCounts();

  assert.deepEqual(executionSelector(state, { id: "feature-1" }), {
    featureIsActive: false,
    featureIsPending: false,
    featureIsRunning: false
  });
  assert.deepEqual(countsSelector(state, { id: "feature-1" }), {
    failedScenarios: 1,
    passedScenarios: 1,
    skippedScenarios: 1
  });

  state.states.featuresList.featuresButtonToggleValue = "Passed";
  assert.deepEqual(countsSelector(state, { id: "feature-1" }), {
    failedScenarios: 0,
    passedScenarios: 1,
    skippedScenarios: 0
  });

  state.states.featuresList.featuresButtonToggleValue = "All";
  state.states.featuresList.lastEnteredSearchValue = "@regression";
  assert.deepEqual(countsSelector(state, { id: "feature-1" }), {
    failedScenarios: 1,
    passedScenarios: 0,
    skippedScenarios: 0
  });

  state.states.featuresList.lastEnteredSearchValue = "";
  state.states.featuresList.liveActiveFeatureId = "feature-2";
  assert.deepEqual(executionSelector(state, { id: "feature-2" }), {
    featureIsActive: true,
    featureIsPending: false,
    featureIsRunning: true
  });
});

test("failure summary selector groups failed scenarios by feature order and captures first error details", () => {
  const state = buildState();
  const summarySelector = makeGetFailureSummarySections();

  const summary = summarySelector(state);

  assert.equal(summary.length, 1);
  assert.equal(summary[0].feature.id, "feature-1");
  assert.equal(summary[0].scenarios.length, 1);
  assert.equal(summary[0].scenarios[0].scenario.id, "scenario-3");
  assert.equal(summary[0].scenarios[0].errorInfo.error, "first failure");
  assert.equal(summary[0].scenarios[0].errorInfo.step.name, "it breaks");
});
