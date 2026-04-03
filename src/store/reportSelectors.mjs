import { createSelector } from "reselect";
import tagExpressions from "@cucumber/tag-expressions";

import {
  scenarioHasFailures,
  scenarioIsPassed,
  scenarioIsSkipped
} from "../utils/stepCounts.mjs";

const parseTags = (() => {
  if (typeof tagExpressions === "function") {
    return tagExpressions;
  }
  if (typeof tagExpressions.default === "function") {
    return tagExpressions.default;
  }
  throw new Error("Unable to resolve @cucumber/tag-expressions parser");
})();

const TOGGLE_VALUES = Object.freeze({
  ALL: "All",
  FAILED: "Failed",
  PASSED: "Passed",
  SKIPPED: "Skipped"
});

const getFeatureIds = (state) => state.features?.list ?? [];
const getFeaturesMap = (state) => state.features?.featuresMap ?? {};
const getScenarioIds = (state) => state.scenarios?.list ?? [];
const getScenariosMap = (state) => state.scenarios?.scenariosMap ?? {};
const getStepsMap = (state) => state.steps?.stepsMap ?? {};
const getSettings = (state) => state.states?.external_settings ?? {};
const getLiveActiveFeatureId = (state) => state.states?.featuresList?.liveActiveFeatureId ?? null;
const getSelectedFeatureView = (state) => state.states?.featuresList?.featuresButtonToggleValue ?? TOGGLE_VALUES.ALL;
const getSearchValue = (state) => state.states?.featuresList?.lastEnteredSearchValue ?? "";
const getFeatureId = (_state, { id }) => id;

const getScenariosForFeature = createSelector(
  [getScenarioIds, getScenariosMap, getFeatureId],
  (scenarioIds, scenariosMap, featureId) => {
    if (!featureId) {
      return [];
    }
    const scenarios = [];
    for (const scenarioId of scenarioIds) {
      const scenario = scenariosMap[scenarioId];
      if (scenario?.featureId === featureId) {
        scenarios.push(scenario);
      }
    }
    return scenarios;
  }
);

const getFirstErrorForSteps = (steps) => {
  const list = Array.isArray(steps) ? steps : [];
  for (const step of list) {
    if (step?.status === "failed" && step?.error_message) {
      return {
        error: step.error_message,
        step
      };
    }
  }
  return null;
};

const resolveScenarioExecutionState = (steps) => {
  const list = Array.isArray(steps) ? steps : [];
  const hasAnyStatus = list.some((step) => step?.status);
  if (!hasAnyStatus) {
    return "pending";
  }
  const hasMissingStatus = list.some((step) => !step?.status);
  return hasMissingStatus ? "running" : "complete";
};

const filterScenariosBySearch = (scenarios, searchString) => {
  if (!searchString) {
    return scenarios;
  }
  try {
    const expr = parseTags(searchString);
    return scenarios.filter((scenario) => {
      const tags = Array.isArray(scenario?.tags)
        ? scenario.tags.map((tag) => tag?.name).filter(Boolean)
        : [];
      return expr.evaluate(tags) === true;
    });
  } catch (_error) {
    return scenarios;
  }
};

export const makeGetFeatureExecutionState = () => createSelector(
  [getScenariosForFeature, getStepsMap, getSettings, getLiveActiveFeatureId, getFeatureId],
  (scenarios, stepsMap, settings, liveActiveFeatureId, featureId) => {
    const scenarioStates = scenarios.map((scenario) =>
      resolveScenarioExecutionState(stepsMap[scenario.id]?.steps)
    );
    const featureIsRunning = scenarioStates.some((state) => state === "running");
    const featureIsPending = scenarioStates.length > 0
      && scenarioStates.every((state) => state === "pending");
    const isLive = Boolean(settings?.live?.enabled);

    return {
      featureIsActive: isLive && (featureIsRunning || liveActiveFeatureId === featureId),
      featureIsPending,
      featureIsRunning
    };
  }
);

export const makeGetFeatureStatusCounts = () => createSelector(
  [getScenariosForFeature, getSearchValue, getSelectedFeatureView],
  (scenarios, searchValue, featureView) => {
    const filteredScenarios = filterScenariosBySearch(scenarios, searchValue);
    const counts = {
      failedScenarios: 0,
      passedScenarios: 0,
      skippedScenarios: 0
    };

    for (const scenario of filteredScenarios) {
      if (scenarioHasFailures(scenario)) {
        counts.failedScenarios += 1;
      } else if (scenarioIsSkipped(scenario)) {
        counts.skippedScenarios += 1;
      } else if (scenarioIsPassed(scenario)) {
        counts.passedScenarios += 1;
      }
    }

    switch (featureView) {
      case TOGGLE_VALUES.PASSED:
        return {
          failedScenarios: 0,
          passedScenarios: counts.passedScenarios,
          skippedScenarios: 0
        };
      case TOGGLE_VALUES.FAILED:
        return {
          failedScenarios: counts.failedScenarios,
          passedScenarios: 0,
          skippedScenarios: 0
        };
      case TOGGLE_VALUES.SKIPPED:
        return {
          failedScenarios: 0,
          passedScenarios: 0,
          skippedScenarios: counts.skippedScenarios
        };
      default:
        return counts;
    }
  }
);

export const makeGetFailureSummarySections = () => createSelector(
  [getFeatureIds, getFeaturesMap, getScenarioIds, getScenariosMap, getStepsMap],
  (featureIds, featuresMap, scenarioIds, scenariosMap, stepsMap) => {
    const failedScenariosByFeatureId = new Map();

    for (const scenarioId of scenarioIds) {
      const scenario = scenariosMap[scenarioId];
      if (!scenario || !scenarioHasFailures(scenario)) {
        continue;
      }
      const featureId = scenario.featureId;
      const summaryEntry = {
        errorInfo: getFirstErrorForSteps(stepsMap[scenarioId]?.steps),
        scenario
      };
      const existing = failedScenariosByFeatureId.get(featureId);
      if (existing) {
        existing.push(summaryEntry);
      } else {
        failedScenariosByFeatureId.set(featureId, [summaryEntry]);
      }
    }

    const sections = [];
    for (const featureId of featureIds) {
      const feature = featuresMap[featureId];
      const scenarios = failedScenariosByFeatureId.get(featureId);
      if (feature && scenarios?.length) {
        sections.push({ feature, scenarios });
      }
    }

    return sections;
  }
);
