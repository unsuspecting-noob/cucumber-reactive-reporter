import { FeaturesToggleValuesEnum, getFeaturesToggleValue } from "./uistates";

import { createSelector } from "reselect";
import { createSlice } from "@reduxjs/toolkit";
import { getLastEnteredSearchValue } from "./uistates";
import parseTags from '@cucumber/tag-expressions';
import {
  applyStepToScenarioCounts,
  createScenarioStepCounts,
  scenarioHasFailures,
  scenarioIsPassed,
  scenarioIsSkipped
} from "../utils/stepCounts.mjs";

//Reducers
let slice = createSlice({
  name: "scenarios",
  loading: false,
  initialState: {
    scenariosMap: {},
    list: [],
  },
  reducers: {
    scenarioAdded: (scenarios, action) => {
      const {
        id,
        keyword,
        line,
        name,
        tags: [...tags],
        type,
        uri
      } = action.payload.scenario;
      const { featureId } = action.payload.featureId;
      scenarios.list.push(id);
      scenarios.scenariosMap[id] = {
        ...createScenarioStepCounts(),
        featureId,
        id,
        keyword,
        line,
        name,
        tags,
        type,
        uri
      };
    },
  },
  extraReducers: {
    "steps/stepAdded": (scenarios, action) => {
      let scenarioId = action.payload.scenarioId;
      const scenario = scenarios.scenariosMap[scenarioId];
      if (scenario) {
        applyStepToScenarioCounts(scenario, action.payload.step);
      }
    },
  },
});

const _filterScenarios = (searchString, scenarios) => {
  let retVal;
  let expr;
  try {
    expr = parseTags(searchString);
  } catch (e) {
    console.log(e);
  }
  if (expr) {
    retVal = scenarios.filter(
      (f) => {
        let tags = f.tags.map((t) => t.name);
        if (expr.evaluate(tags) === true) {
          return true;
        }
        return false;
      }
    );
  } else retVal = scenarios;
  return retVal;
}

//SELECTORS
export const getScenarioById = (state, { id }) => {
  return state.scenarios.scenariosMap[id];
};

export const getAllScenariosForFeature = createSelector(
  [
    (state) => state.scenarios.list,
    (state) => state.scenarios.scenariosMap,
    (state, { id }) => id
  ],
  (scenarioIds, scenariosMap, featureId) => {
    if (!featureId) {
      return [];
    }
    return scenarioIds
      .map((id) => scenariosMap[id])
      .filter((scenario) => scenario?.id?.startsWith(featureId));
  }
);

const _getAllScenariosForFeatureWithState = createSelector(
  [
    (state) => state.scenarios.list,
    (state) => state.scenarios.scenariosMap,
    (state, { id }) => id,
    (state) => getFeaturesToggleValue(state)
  ],
  (scenarioIds, scenariosMap, featureId, st) => {
    if (!featureId) {
      return [];
    }
    return scenarioIds
      .map((id) => scenariosMap[id])
      .filter((scenario) => {
        if (!scenario?.id?.startsWith(featureId)) {
          return false;
        }
        switch (st) {
          case FeaturesToggleValuesEnum.ALL:
            return true;
          case FeaturesToggleValuesEnum.PASSED:
            return scenarioIsPassed(scenario);
          case FeaturesToggleValuesEnum.FAILED:
            return scenarioHasFailures(scenario);
          case FeaturesToggleValuesEnum.SKIPPED:
            return scenarioIsSkipped(scenario);
          default:
            return false;
        }
      });
  }
);
export const getAllScenariosForFeatureWithState = createSelector([getLastEnteredSearchValue, _getAllScenariosForFeatureWithState], _filterScenarios);

const _getScenariosForAListOfFeaturesUnfiltered = createSelector(
  [
    (state) => state.scenarios.list,
    (state) => state.scenarios.scenariosMap,
    (state, { list }) => list
  ],
  (scenarioIds, scenariosMap, featureIds) => {
    if (!Array.isArray(featureIds)) {
      return [];
    }
    const featureSet = new Set(featureIds);
    return scenarioIds
      .map((id) => scenariosMap[id])
      .filter((scenario) => featureSet.has(scenario?.featureId));
  }
);
export const getScenariosForAListOfFeatures = createSelector([getLastEnteredSearchValue, _getScenariosForAListOfFeaturesUnfiltered], _filterScenarios);

export const getAllScenarios = (state) => {
  return state.scenarios.list;
}

export default slice.reducer;
export const { scenarioAdded } = slice.actions;
