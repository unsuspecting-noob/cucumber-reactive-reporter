import { createSelector } from "reselect";
import { createSlice } from "@reduxjs/toolkit";
import { getLastEnteredSearchValue } from "./uistates";
import parseTags from '@cucumber/tag-expressions'

//Reducers
const defaultState = {
  featuresMap: {},
  list: []
};
let slice = initState => createSlice({
  name: "features",
  initialState: initState,
  reducers: {
    featureAdded: (features, action) => {
      const {
        description,
        elements,
        id,
        keyword,
        line,
        name,
        tags: [...tags],
        uri
      } = action.payload;
      const allTags = [...tags];
      //figure out if it has failed stuff
      let numFailedScenarios = 0;
      let numSkippedScenarios = 0;
      if (elements?.length) {
        for (let el of elements) {
          //collect scenario tags
          if (el.tags?.length) {
            let temp = allTags.map(t => t.name);
            el.tags.forEach((tag) => {
              if (temp.includes(tag.name) === false) {
                allTags.push(tag);
              }
            });
          }
          if (el.steps?.length) {
            for (let step of el.steps) {
              if (step.result?.status === "failed") {
                numFailedScenarios++;
                break;
              }
              if (step.result?.status === "skipped") {
                numSkippedScenarios++;
                break;
              }
            }
          }
        }
      }
      features.list.push(id);
      features.featuresMap[id] = {
        id,
        description,
        uri,
        keyword,
        name,
        line,
        tags,
        allTags,
        numFailedScenarios,
        numSkippedScenarios
      };
    }
  },
});

const generateSlice = initState => {
  return slice(initState).reducer;
}

//SELECTORS

export const getFeatureById = (state, { id }) => {
  return state.features.featuresMap[id];
};

export const getAllFeatures = createSelector(
  (state) => state.features.featuresMap,
  (features) => Object.values(features)
);


export const getAllFailedFeatures = createSelector(
  (state) => state.features.featuresMap,
  (features) => {
    return Object.values(features).filter((f) => {
      return f.numFailedScenarios > 0;
    });
  }
);

export const getAllPassedFeatures = createSelector(
  (state) => state.features.featuresMap,
  (features) => {
    //there is no numPassedScenarios, need to calc
    let sc = Object.values(features);
    return sc.filter((f) => {
      let p = sc.length - f.numFailedScenarios - f.numSkippedScenarios;
      return (p > 0);
    });
  }
);

export const getAllSkippedFeatures = createSelector(
  (state) => state.features.featuresMap,
  (features) => {
    return Object.values(features).filter((f) => {
      return f.numSkippedScenarios > 0;
    });
  }
);

export const getTotalNumberOfFailedScenarios = createSelector(
  (state) => state,
  (state) => {
    let featureList = Object.values(state.features.featuresMap);
    let failed = featureList.reduce((total, item) => {
      let featureId = item.id;
      let scenarios = Object.values(state.scenarios.scenariosMap).filter(
        (sc) => {
          return sc.id.startsWith(featureId) && sc.failedSteps;
        }
      );
      return (total += scenarios.length);
    }, 0);
    return failed;
  }
);

export const getTotalNumberOfPassedScenarios = createSelector(
  (state) => state,
  (state) => {
    let featureList = Object.values(state.features.featuresMap);
    let failed = featureList.reduce((total, item) => {
      let featureId = item.id;
      let scenarios = Object.values(state.scenarios.scenariosMap).filter(
        (sc) => {
          return (
            sc.id.startsWith(featureId) && !sc.failedSteps && sc.passedSteps && !sc.skippedSteps
          );
        }
      );
      return (total += scenarios.length);
    }, 0);
    return failed;
  }
);

export const getTotalNumberOfSkippedScenarios = createSelector(
  (state) => state,
  (state) => {
    let featureList = Object.values(state.features.featuresMap);
    let failed = featureList.reduce((total, item) => {
      let featureId = item.id;
      let scenarios = Object.values(state.scenarios.scenariosMap).filter(
        (sc) => {
          return (
            sc.id.startsWith(featureId) &&
            !sc.failedSteps &&
            !sc.passedSteps &&
            sc.skippedSteps
          );
        }
      );
      return (total += scenarios.length);
    }, 0);
    return failed;
  }
);

export const getFailedScenariosByFeatureId = (
  state,
  { id: featureId }
) => {
  let scens = Object.values(
    state.scenarios.scenariosMap
  ).filter((sc) => {
    return sc.id.startsWith(featureId) && sc.failedSteps;
  });

  return scens;
};


export const getPassedScenariosByFeatureId = (
  state,
  { id: featureId }
) => {
  let scens = Object.values(
    state.scenarios.scenariosMap
  ).filter((sc) => {
    return sc.id.startsWith(featureId) && !sc.failedSteps && sc.passedSteps;
  });

  return scens;
};

export const getSkippedScenariosByFeatureId = (
  state,
  { id: featureId }
) => {
  let scens = Object.values(
    state.scenarios.scenariosMap
  ).filter((sc) => {
    return sc.id.startsWith(featureId) && sc.skippedSteps && !sc.failedSteps;
  });

  return scens;
};

const _filterScenarios = (searchString, scenarios) => {
  let retVal;
  if (searchString) {
    const expr = parseTags(searchString);
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

const _filterFeatures = (searchString, allFeatures) => {
  let retVal;
  if (searchString) {
    const expr = parseTags(searchString);
    retVal = allFeatures.filter(
      (f) => {
        let tags = f.allTags.map((t) => t.name);
        if (expr.evaluate(tags) === true) {
          return true;
        }
        return false;
      }
    );
  } else retVal = allFeatures;
  return retVal;
}
export const getAllMatchingFeatureIds = createSelector([getLastEnteredSearchValue, getAllFeatures], _filterFeatures);
export const getFailedMatchingFeatureIds = createSelector([getLastEnteredSearchValue, getAllFailedFeatures], _filterFeatures);
export const getPassedMatchingFeatureIds = createSelector([getLastEnteredSearchValue, getAllPassedFeatures], _filterFeatures);
export const getSkippedMatchingFeatureIds = createSelector([getLastEnteredSearchValue, getAllSkippedFeatures], _filterFeatures);
export const getNumberOfFailedScenariosByFeatureId = createSelector([getLastEnteredSearchValue, getFailedScenariosByFeatureId], _filterScenarios);
export const getNumberOfPassedScenariosByFeatureId = createSelector([getLastEnteredSearchValue, getPassedScenariosByFeatureId], _filterScenarios);
export const getNumberOfSkippedScenariosByFeatureId = createSelector([getLastEnteredSearchValue, getSkippedScenariosByFeatureId], _filterScenarios);

export default generateSlice;
export const features = slice(defaultState);
export const {
  featureAdded
} = features.actions;
