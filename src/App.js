import "./App.css";

import { getFeaturesToggleValue, getLastEnteredSearchValue } from "./store/uistates";

import { Provider } from "react-redux";
import React from "react";
import ReduxQuerySync from "redux-query-sync";
import StartComponent from "./components/StartComponent";
import configureStore from "./store/configureStore";
import loadData from "./loader";

const store = configureStore();

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

ReduxQuerySync({
  initialTruth: "location",
  params: params,
  replaceState: true,
  store
});

(async () => {
  try {
    await loadData(store);
  } catch (err) {
    console.log(err);
  }
})();
function App() {
  return (
    <Provider store={store}>
      <StartComponent />
    </Provider>
  );
}

export default App;
