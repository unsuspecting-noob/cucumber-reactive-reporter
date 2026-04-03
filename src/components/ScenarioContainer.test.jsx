import React from "react";
import { Provider } from "react-redux";
import { configureStore } from "@reduxjs/toolkit";
import { render, screen } from "@testing-library/react";

import ScenarioContainer from "./ScenarioContainer";
import { INITIAL_UI_STATE } from "../store/uistates";

jest.mock("./StepsList", () => () => <div>Steps</div>);

const buildPreloadedState = ({ showBoiler = false } = {}) => ({
  features: {
    featuresMap: {},
    list: []
  },
  scenarios: {
    scenariosMap: {
      "scenario-1": {
        id: "scenario-1",
        featureId: "feature-1",
        name: "Scenario with teardown artifact",
        keyword: "Scenario",
        line: 10,
        passedSteps: 1,
        skippedSteps: 0,
        failedSteps: 1,
        tags: [],
        type: "scenario",
        uri: "features/demo.feature"
      }
    },
    list: ["scenario-1"]
  },
  states: {
    ...INITIAL_UI_STATE,
    featuresList: {
      ...INITIAL_UI_STATE.featuresList,
      showBoiler
    }
  },
  steps: {
    stepsMap: {
      "scenario-1": {
        steps: [
          {
            keyword: "Given ",
            name: "the user opens the dashboard",
            status: "passed",
            duration: 1,
            args: [],
            embeddings: [],
            location: "features/demo.feature:10"
          },
          {
            keyword: "After",
            name: "",
            status: "skipped",
            duration: 1,
            args: [],
            embeddings: [
              {
                mime_type: "text/plain",
                data: "hook data"
              }
            ],
            location: ""
          },
          {
            keyword: "After",
            name: "",
            status: "failed",
            duration: 1,
            args: [],
            embeddings: [
              {
                mime_type: "image/png",
                data: "ZmFrZS1pbWFnZQ=="
              }
            ],
            error_message: "teardown failed",
            location: ""
          }
        ]
      }
    },
    totalDurationNanoSec: 3
  }
});

const buildStore = ({ showBoiler = false } = {}) => {
  const preloadedState = buildPreloadedState({ showBoiler });
  return configureStore({
    reducer: (state = preloadedState) => state
  });
};

describe("ScenarioContainer visible step counts", () => {
  it("hides skipped hook rows from the compact badges by default", () => {
    const store = buildStore({ showBoiler: false });

    render(
      <Provider store={store}>
        <ScenarioContainer id="scenario-1" featureTags={[]} />
      </Provider>
    );

    expect(screen.getAllByText("1")).toHaveLength(2);
  });

  it("includes skipped hook rows in the badges when hooks are shown", () => {
    const store = buildStore({ showBoiler: true });

    render(
      <Provider store={store}>
        <ScenarioContainer id="scenario-1" featureTags={[]} />
      </Provider>
    );

    expect(screen.getAllByText("1")).toHaveLength(3);
  });
});
