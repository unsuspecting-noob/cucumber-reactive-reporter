import { createSelector } from "reselect";
import { createSlice } from "@reduxjs/toolkit";

//Reducers
let slice = createSlice({
  name: "steps",
  loading: false,
  initialState: {
    stepsMap: {},
    totalDurationNanoSec: 0
  },
  reducers: {
    stepAdded: (steps, action) => {
      const {
        arguments: args,
        embeddings,
        keyword,
        line,
        match: {
          location
        },
        name,
        result: {
          duration,
          error_message,
          status
        }
      } = action.payload.step;

      let scenarioId = action.payload.scenarioId;
      let step = {
        args,
        duration,
        embeddings,
        error_message,
        keyword,
        line,
        location,
        name,
        status
      };
      if (!steps.stepsMap[scenarioId])
        steps.stepsMap[scenarioId] = { steps: [] };
      steps.stepsMap[scenarioId].steps.push(step);
      if (isNaN(duration) === false) {
        steps.totalDurationNanoSec = steps.totalDurationNanoSec + duration;
      }
    },
  },
});

//SELECTORS
export const getStepsByScenarioId = (state, { id }) => {
  return state.steps.stepsMap[id].steps;
};

export const getStepsNoBoilerByScenarioId = createSelector([
  (state) => state.steps.stepsMap,
  (state, { id }) => id
], (stepsMap, id) => {
  return stepsMap[id].steps.filter((s) => { if (s.keyword === "Before" || s.keyword === "After") { return false; } else return true; });
});

export const getPassedStepsNoBoilerByScenarioId = createSelector([
  getStepsNoBoilerByScenarioId
], (steps) => {
  return steps.filter((s) => s.status === "passed");
});

export const getTotalDurationNanoSec = (state) => {
  return state.steps.totalDurationNanoSec;
};


export const getFailedStepsByScenarioId = createSelector([
  (state) => state.steps.stepsMap,
  (state, { id }) => id
], (stepsMap, id) => {
  let l = stepsMap[id].steps;
  let f = l.filter((st) => st.status === "failed");
  return f;
});
export const getPassedStepsByScenarioId = createSelector([
  (state) => state.steps.stepsMap,
  (state, { id }) => id
], (stepsMap, id) => {
  let l = stepsMap[id].steps;
  let f = l.filter((st) => st.status === "passed");
  return f;
});

export const getSkippedStepsByScenarioId = createSelector([
  (state) => state.steps.stepsMap,
  (state, { id }) => id
], (stepsMap, id) => {
  let l = stepsMap[id].steps;
  let f = l.filter((st) => st.status === "skipped");
  return f;
});

export default slice.reducer;
export const { stepAdded } = slice.actions;
