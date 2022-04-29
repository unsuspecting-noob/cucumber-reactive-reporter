import { combineReducers } from "redux";
import featuresReducer from "./features";
import scenariosReducer from "./scenarios";
import stateReducer from "./uistates";
import stepsReducer from "./steps";

export default combineReducers({
  features: featuresReducer,
  scenarios: scenariosReducer,
  states: stateReducer,
  steps: stepsReducer
});
