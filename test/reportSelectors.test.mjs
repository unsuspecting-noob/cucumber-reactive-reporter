import assert from "node:assert/strict";
import test from "node:test";

import {
  getVisibleFeatures,
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

const buildScenario = (id, featureId, counts, tags) => ({
  id,
  featureId,
  name: id,
  passedSteps: 0,
  skippedSteps: 0,
  failedSteps: 0,
  ...counts,
  tags: tags.map((name) => ({ name }))
});

// feature-mixed has 1 passed, 3 skipped and 1 failed scenario: with 4 features in the report the old
// count-based Passed filter (features.length - failed - skipped) hid it, while listing the
// skipped-only and failed-only features instead.
const buildFilterState = () => {
  const scenarios = [
    buildScenario("mixed-passed", "feature-mixed", { passedSteps: 2 }, ["@smoke"]),
    buildScenario("mixed-skipped-1", "feature-mixed", { skippedSteps: 2 }, ["@skipped"]),
    buildScenario("mixed-skipped-2", "feature-mixed", { skippedSteps: 2 }, ["@skipped"]),
    buildScenario("mixed-skipped-3", "feature-mixed", { skippedSteps: 2 }, ["@skipped"]),
    buildScenario("mixed-failed", "feature-mixed", { passedSteps: 1, failedSteps: 1 }, ["@regression"]),
    buildScenario("skipped-only", "feature-skipped", { skippedSteps: 3 }, ["@skipped"]),
    buildScenario("failed-only", "feature-failed", { failedSteps: 1 }, ["@regression"])
  ];
  const featureIds = ["feature-mixed", "feature-skipped", "feature-failed", "feature-empty"];
  return {
    features: {
      list: featureIds,
      featuresMap: Object.fromEntries(featureIds.map((id) => [id, { id, name: id }]))
    },
    scenarios: {
      list: scenarios.map((scenario) => scenario.id),
      scenariosMap: Object.fromEntries(scenarios.map((scenario) => [scenario.id, scenario]))
    },
    steps: {
      stepsMap: {}
    },
    states: {
      featuresList: {
        featuresButtonToggleValue: "All",
        lastEnteredSearchValue: ""
      }
    }
  };
};

// selectors memoize on the state reference, so every view gets a new state object like a reducer would
const withFeatureView = (state, featureView, searchValue = "") => ({
  ...state,
  states: {
    ...state.states,
    featuresList: {
      ...state.states.featuresList,
      featuresButtonToggleValue: featureView,
      lastEnteredSearchValue: searchValue
    }
  }
});

const getVisibleFeatureIds = (state, featureView, searchValue) =>
  getVisibleFeatures(withFeatureView(state, featureView, searchValue)).map((feature) => feature.id);

test("visible features keep only features with at least one scenario in the selected status", () => {
  const state = buildFilterState();

  assert.deepEqual(getVisibleFeatureIds(state, "Passed"), ["feature-mixed"]);
  assert.deepEqual(getVisibleFeatureIds(state, "Failed"), ["feature-mixed", "feature-failed"]);
  assert.deepEqual(getVisibleFeatureIds(state, "Skipped"), ["feature-mixed", "feature-skipped"]);
  assert.deepEqual(
    getVisibleFeatureIds(state, "All"),
    ["feature-mixed", "feature-skipped", "feature-failed", "feature-empty"]
  );
  // unrelated state changes keep the same list instance, so the feature list does not re-render
  assert.equal(
    getVisibleFeatures(withFeatureView(state, "Passed")),
    getVisibleFeatures(withFeatureView(state, "Passed"))
  );
});

test("visible features apply the tag search per scenario together with the status filter", () => {
  const state = buildFilterState();

  // one @skipped scenario no longer hides the rest of its feature
  assert.deepEqual(getVisibleFeatureIds(state, "All", "not @skipped"), ["feature-mixed", "feature-failed"]);
  assert.deepEqual(getVisibleFeatureIds(state, "Passed", "not @skipped"), ["feature-mixed"]);
  assert.deepEqual(getVisibleFeatureIds(state, "Passed", "@regression"), []);
  // tags spread across different scenarios do not add up to a feature-level match
  assert.deepEqual(getVisibleFeatureIds(state, "All", "@smoke and @regression"), []);
  // an unparsable search is ignored, same as in the scenario list
  assert.deepEqual(
    getVisibleFeatureIds(state, "All", "@smoke and ("),
    ["feature-mixed", "feature-skipped", "feature-failed", "feature-empty"]
  );
});

test("every listed feature shows a non-zero count for the selected status", () => {
  const state = buildFilterState();
  const countsSelector = makeGetFeatureStatusCounts();
  const countKeyByView = {
    Passed: "passedScenarios",
    Failed: "failedScenarios",
    Skipped: "skippedScenarios"
  };

  for (const [featureView, countKey] of Object.entries(countKeyByView)) {
    for (const searchValue of ["", "not @skipped", "@smoke", "@regression"]) {
      const viewState = withFeatureView(state, featureView, searchValue);
      const visibleIds = getVisibleFeatures(viewState).map((feature) => feature.id);
      for (const featureId of state.features.list) {
        const count = countsSelector(viewState, { id: featureId })[countKey];
        assert.equal(
          visibleIds.includes(featureId),
          count > 0,
          `${featureView} + "${searchValue}": ${featureId} has ${countKey}=${count}`
        );
      }
    }
  }
});
