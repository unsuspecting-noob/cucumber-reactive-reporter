import "./index.css";
import "font-awesome/css/font-awesome.css";
import '@fontsource/roboto/300.css';
import '@fontsource/roboto/400.css';
import '@fontsource/roboto/500.css';
import '@fontsource/roboto/700.css';

import * as serviceWorker from "./serviceWorker";

import { getFeaturesToggleValue, getLastEnteredSearchValue } from "./store/uistates";

import App from "./App";
import { Provider } from "react-redux";
import React from "react";
import ReactDOM from "react-dom";
import ReduxQuerySync from "redux-query-sync";
import configureStore from "./store/configureStore";
import loadData from "./loader";

let store;

//Configure url params for "filter" to autosync to the store
const params = {
  filter: {
    action: value => ({
      type: "states/featuresToggleClicked",
      payload: {
        value: value,
        type: "queryChanged"
      }
    }),
    defaultValue: "",
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
    defaultValue: "",
    selector: getLastEnteredSearchValue,
    stringToValue: string => string,
    valueToString: string => string
  }
};

(async function renderWithInitialData() {
  store = await configureStore();

  ReduxQuerySync({
    initialTruth: "location",
    params: params,
    replaceState: true,
    store
  });

  await loadData(store);

  ReactDOM.render(
    <React.StrictMode>
      <Provider store={store}>
        <App />
      </Provider>
    </React.StrictMode>,
    document.getElementById("root"))
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
