import {
  combineReducers
} from 'redux';
import { configureStore } from "@reduxjs/toolkit";
import featuresReducer from "./features";
import scenariosReducer from "./scenarios";
import stateReducer, { buildUiState } from "./uistates";
import stepsReducer from "./steps";
import { mergeReportState } from "./liveMerge";
// import reducer from "./reducer.js";
import { thunk } from "redux-thunk";
import { loadUiStateFromSession, mergeUiState, saveUiStateToSession } from "./sessionState";

export default async function () {
  let preloadedState;
  let settings;

  const createEmptyReportState = () => ({
    features: {
      list: [],
      featuresMap: {}
    },
    scenarios: {
      list: [],
      scenariosMap: {}
    },
    steps: {
      stepsMap: {},
      totalDurationNanoSec: 0
    }
  });

  const resolveTransport = (metadata) => {
    const liveOptions = metadata?.live ?? {};
    return liveOptions.source ?? (metadata?.inputFormat === "message" ? "message" : "state");
  };
  const applyUrlSelection = (uiState) => {
    if (typeof window === "undefined" || !window.location) {
      return uiState;
    }
    try {
      const params = new URLSearchParams(window.location.search);
      const hasFeatureParam = params.has("feature");
      const hasScenarioParam = params.has("scenario");
      if (!hasFeatureParam && !hasScenarioParam) {
        return uiState;
      }
      const featureFromUrl = params.get("feature");
      const scenarioFromUrl = params.get("scenario");
      const selectedFeatureId = hasFeatureParam ? (featureFromUrl || null) : (uiState.featuresList?.selectedFeatureId ?? null);
      let selectedScenarioId = hasScenarioParam ? (scenarioFromUrl || null) : (uiState.featuresList?.selectedScenarioId ?? null);
      if (!selectedFeatureId) {
        selectedScenarioId = null;
      }
      return {
        ...uiState,
        featuresList: {
          ...(uiState.featuresList ?? {}),
          selectedFeatureId,
          selectedScenarioId
        }
      };
    } catch (error) {
      console.log("Unable to read selection from URL:", error);
      return uiState;
    }
  };

  try {
    let settingsResponse = await fetch("./_reporter_settings.json", { cache: "no-store" });
    settings = await settingsResponse.json();
  } catch (err) {
    console.log("ERROR: ", err);
  }
  const transport = resolveTransport(settings);
  const shouldSkipPreload = Boolean(settings?.live?.enabled) && transport === "message";

  if (!shouldSkipPreload) {
    try {
      console.time("loadJSON");
      let response = await fetch("./_cucumber-results.json", { cache: "no-store" });
      preloadedState = await response.json();
      console.timeEnd("loadJSON");
    } catch (err) {
      console.log("ERROR: ", err);
    }
  }

  if (!preloadedState) {
    preloadedState = createEmptyReportState();
  }
  const persistedUiState = loadUiStateFromSession();
  const hydratedUiState = mergeUiState(
    buildUiState(preloadedState.states),
    persistedUiState
  );
  const storePreloadedState = {
    ...preloadedState,
    states: applyUrlSelection(hydratedUiState)
  };

  let appReducer = combineReducers({
    features: featuresReducer(storePreloadedState.features),
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
  const store = configureStore({
    reducer,
    // middleware: [...getDefaultMiddleware(), logger(), loader], //getDefaultMiddleware comes with thunk
    middleware: [thunk], //turning off middleware because it completely cripples frontloading data
    devTools: process.env.NODE_ENV !== 'production',
    preloadedState: storePreloadedState
  });
  store.subscribe(() => {
    saveUiStateToSession(store.getState().states);
  });
  saveUiStateToSession(store.getState().states);
  return store;
}
