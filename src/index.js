import "./index.css";
import "font-awesome/css/font-awesome.css";
import '@fontsource/roboto/300.css';
import '@fontsource/roboto/400.css';
import '@fontsource/roboto/500.css';
import '@fontsource/roboto/700.css';

import * as serviceWorker from "./serviceWorker";

import {
  getFeaturesToggleValue,
  getLastEnteredSearchValue,
  getSelectedFeatureId,
  getSelectedScenarioId
} from "./store/uistates";

import App from "./App";
import { Provider } from "react-redux";
import React from "react";
import { createRoot } from "react-dom/client";
import ReduxQuerySync from "redux-query-sync";
import configureStore from "./store/configureStore";
import loadData from "./loader";

let store;

//Configure url params for "filter" to autosync to the store
const buildQuerySyncParams = (state) => {
  const selectedFeatureId = getSelectedFeatureId(state) ?? "";
  const selectedScenarioId = getSelectedScenarioId(state) ?? "";
  return {
    filter: {
      action: value => ({
        type: "states/featuresToggleClicked",
        payload: {
          value: value,
          type: "queryChanged"
        }
      }),
      defaultValue: getFeaturesToggleValue(state),
      selector: getFeaturesToggleValue,
      stringToValue: string => string,
      valueToString: string => string
    },
    tags: {
      action: value => ({
        type: "states/filterByTags",
        payload: {
          value: value,
          type: "queryChanged"
        }
      }),
      defaultValue: getLastEnteredSearchValue(state),
      selector: getLastEnteredSearchValue,
      stringToValue: string => string,
      valueToString: string => string
    },
    feature: {
      action: value => ({
        type: "states/featureSelected",
        payload: {
          id: value || null
        }
      }),
      defaultValue: selectedFeatureId,
      selector: getSelectedFeatureId,
      stringToValue: string => string || null,
      valueToString: value => value || ""
    },
    scenario: {
      action: value => ({
        type: "states/scenarioSelected",
        payload: {
          id: value || null
        }
      }),
      defaultValue: selectedScenarioId,
      selector: getSelectedScenarioId,
      stringToValue: string => string || null,
      valueToString: value => value || ""
    }
  };
};

(async function renderWithInitialData() {
  store = await configureStore();
  const params = buildQuerySyncParams(store.getState());

  ReduxQuerySync({
    initialTruth: "location",
    params: params,
    replaceState: true,
    store
  });

  await loadData(store);

  const rootElement = document.getElementById("root");
  const root = createRoot(rootElement);
  root.render(
    <React.StrictMode>
      <Provider store={store}>
        <App />
      </Provider>
    </React.StrictMode>,
  )
})()

// ReactDOM.render(
//   <React.StrictMode>
//     <App />
//   </React.StrictMode>,
//   document.getElementById("root")
// );

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister(); //disabling because i want relative links to local files work
