import { compose, configureStore, getDefaultMiddleware } from "@reduxjs/toolkit";

import logger from "./middleware/logger";
import reducer from "./reducer.js";
import thunk from "redux-thunk";

export default function () {

  return configureStore({
    reducer,
    // middleware: [...getDefaultMiddleware(), logger(), loader], //getDefaultMiddleware comes with thunk
    middleware: [thunk], //turning off middleware because it completely cripples frontloading data
    devTools: true
  });
}
