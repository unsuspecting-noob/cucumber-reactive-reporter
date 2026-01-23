import {
  combineReducers
} from 'redux';
import { configureStore } from "@reduxjs/toolkit";
import featuresReducer from "./features";
import scenariosReducer from "./scenarios";
import stateReducer from "./uistates";
import stepsReducer from "./steps";
import { mergeReportState } from "./liveMerge";
// import reducer from "./reducer.js";
import thunk from "redux-thunk";

export default async function () {
  let preloadedState;
  try {
    console.time("loadJSON")
    let response = await fetch("./_cucumber-results.json", { cache: "no-store" });
    preloadedState = await response.json();
    console.timeEnd("loadJSON")
  } catch (err) {
    console.log("ERROR: ", err);
    //not sure
  }

  let appReducer = combineReducers({
    features: featuresReducer(preloadedState.features),
    scenarios: scenariosReducer,
    states: stateReducer,
    steps: stepsReducer
  });
  let reducer = (state, action) => {
    if (action.type === "reporter/stateReplaced") {
      const nextState = action.payload ?? {};
      const merged = mergeReportState(state, nextState);
      return {
        ...state,
        features: merged.features ?? state.features,
        scenarios: merged.scenarios ?? state.scenarios,
        steps: merged.steps ?? state.steps
      };
    }
    return appReducer(state, action);
  };
  return configureStore({
    reducer,
    // middleware: [...getDefaultMiddleware(), logger(), loader], //getDefaultMiddleware comes with thunk
    middleware: [thunk], //turning off middleware because it completely cripples frontloading data
    devTools: process.env.NODE_ENV !== 'production',
    preloadedState
  });
}
