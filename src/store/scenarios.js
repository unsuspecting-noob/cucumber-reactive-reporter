import { FeaturesToggleValuesEnum, getFeaturesToggleValue } from "./uistates";

import { createSelector } from "reselect";
import { createSlice } from "@reduxjs/toolkit";
import { getLastEnteredSearchValue } from "./uistates";
import parseTags from '@cucumber/tag-expressions';

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
        failedSteps: 0,
        featureId,
        id,
        keyword,
        line,
        name,
        passedSteps: 0,
        skippedSteps: 0,
        tags,
        type,
        uri
      };
    },
  },
  extraReducers: {
    "steps/stepAdded": (scenarios, action) => {
      const {
        hidden,
        result: { status },
        embeddings,
      } = action.payload.step;
      let scenarioId = action.payload.scenarioId;
      if (!hidden || (embeddings && embeddings.length)) {
        if (status === "passed") {
          scenarios.scenariosMap[scenarioId].passedSteps++;
        } else if (status === "skipped") {
          scenarios.scenariosMap[scenarioId].skippedSteps++;
        }
      }
      if (status === "failed") {
        scenarios.scenariosMap[scenarioId].failedSteps++;
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
    state => Object.values(state.scenarios.scenariosMap),
    (state, { id }) => id
  ],
  (scenarios, featureId) => {
    let ret = scenarios.filter(
      (sc) => {
        return sc.id.startsWith(featureId);
      }
    );
    return ret;
  });

const _getAllScenariosForFeatureWithState = createSelector(
  [
    state => Object.values(state.scenarios.scenariosMap),
    (state, { id }) => id,
    state => getFeaturesToggleValue(state)
  ],
  (scenarios, featureId, st) => {
    let ret = scenarios.filter(
      (sc) => {
        let result;
        let match = sc.id.startsWith(featureId);
        if (match) {
          switch (st) {
            case FeaturesToggleValuesEnum.ALL:
              result = true;
              break;
            case FeaturesToggleValuesEnum.PASSED:
              result = sc.passedSteps > 0 && sc.failedSteps === 0 && sc.skippedSteps === 0;
              break;
            case FeaturesToggleValuesEnum.FAILED:
              result = sc.failedSteps !== 0;
              break;
            case FeaturesToggleValuesEnum.SKIPPED:
              result = sc.skippedSteps !== 0 && sc.failedSteps === 0;
              break;
            default:
              break
          }
          return result;
        } else return false;
      }
    );
    return ret;
  });
export const getAllScenariosForFeatureWithState = createSelector([getLastEnteredSearchValue, _getAllScenariosForFeatureWithState], _filterScenarios);

const _getScenariosForAListOfFeaturesUnfiltered = createSelector(
  [
    state => Object.values(state.scenarios.scenariosMap),
    (state, { list }) => list
  ], (scenarios, featureIds) => {
    let ret = [];
    for (let fid of featureIds) {
      let r = scenarios.filter((sc) => sc.id.startsWith(fid));
      if (r.length) ret = ret.concat(r);
    }
    return ret;
  }
);
export const getScenariosForAListOfFeatures = createSelector([getLastEnteredSearchValue, _getScenariosForAListOfFeaturesUnfiltered], _filterScenarios);

export const getAllScenarios = (state) => {
  return state.scenarios.list;
}

export default slice.reducer;
export const { scenarioAdded } = slice.actions;
