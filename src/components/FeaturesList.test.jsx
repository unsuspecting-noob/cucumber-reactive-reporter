/**
 * Purpose: Validate split-pane resize handle placement in FeaturesList.
 * Responsibilities: Ensure the resize handle lives inside the scenario panel.
 * Inputs/Outputs: Renders FeaturesList with a minimal Redux store.
 * Invariants: The resize handle is nested within the scenario details region.
 * See: /agents.md
 */
import React from "react";
import { configureStore } from "@reduxjs/toolkit";
import { Provider } from "react-redux";
import { render, screen } from "@testing-library/react";
import FeaturesList from "./FeaturesList";
import featuresReducer from "../store/features";
import scenariosReducer from "../store/scenarios";
import stateReducer from "../store/uistates";
import stepsReducer from "../store/steps";

jest.mock("@mui/material/useMediaQuery", () => jest.fn(() => true));
jest.mock("./ScenarioStepsPanel", () => () => <div>Scenario panel</div>);

const buildStore = () => {
  const initialFeaturesState = {
    featuresMap: {
      "feature-1": {
        id: "feature-1",
        description: "Sample feature description",
        uri: "features/sample.feature",
        keyword: "Feature",
        line: 1,
        name: "Feature 1",
        tags: [],
        allTags: [],
        numFailedScenarios: 0,
        numSkippedScenarios: 0
      }
    },
    list: ["feature-1"]
  };
  const initialScenariosState = {
    scenariosMap: {
      "feature-1;scenario-1": {
        id: "feature-1;scenario-1",
        featureId: "feature-1",
        name: "Scenario 1",
        keyword: "Scenario",
        line: 10,
        passedSteps: 1,
        skippedSteps: 0,
        failedSteps: 0,
        tags: [],
        type: "scenario",
        uri: "features/sample.feature"
      }
    },
    list: ["feature-1;scenario-1"]
  };
  const initialStepsState = {
    stepsMap: {
      "feature-1;scenario-1": {
        steps: []
      }
    },
    totalDurationNanoSec: 0
  };
  const baseUiState = stateReducer(undefined, { type: "@@INIT" });
  const preloadedStates = {
    ...baseUiState,
    featuresList: {
      ...baseUiState.featuresList,
      selectedFeatureId: "feature-1",
      selectedScenarioId: "feature-1;scenario-1"
    }
  };

  return configureStore({
    reducer: {
      features: featuresReducer(initialFeaturesState),
      scenarios: scenariosReducer,
      states: stateReducer,
      steps: stepsReducer
    },
    preloadedState: {
      scenarios: initialScenariosState,
      states: preloadedStates,
      steps: initialStepsState
    }
  });
};

describe("FeaturesList split pane resizing", () => {
  it("renders the resize handle inside the scenario details panel", () => {
    const store = buildStore();
    render(
      <Provider store={store}>
        <FeaturesList />
      </Provider>
    );

    const scenarioPanel = screen.getByRole("region", {
      name: /scenario details panel/i
    });
    const resizeHandle = screen.getByRole("separator", {
      name: /resize panes/i
    });

    expect(scenarioPanel.contains(resizeHandle)).toBe(true);
  });
});
