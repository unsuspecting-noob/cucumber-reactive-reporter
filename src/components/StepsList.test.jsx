import React from "react";
import { Provider } from "react-redux";
import { configureStore } from "@reduxjs/toolkit";
import { render, screen } from "@testing-library/react";

import StepsList from "./StepsList";
import stateReducer, { INITIAL_UI_STATE } from "../store/uistates";
import stepsReducer from "../store/steps";

jest.mock("./StepContainer", () => function MockStepContainer(props) {
  return (
    <tr data-testid="step-row">
      <td>{`${props.step.keyword}:${props.step.name}`}</td>
    </tr>
  );
});

jest.mock("./AttachmentString", () => function MockAttachmentString(props) {
  return <div data-testid="hook-attachment-string">{props.content}</div>;
});

jest.mock("./AttachmentTable", () => function MockAttachmentTable() {
  return <div data-testid="hook-attachment-table">table</div>;
});

jest.mock("./Embedding", () => function MockEmbedding(props) {
  return (
    <div data-testid="hook-embedding">
      {props.content.map((item) => item.mime_type).join(",")}
    </div>
  );
});

const buildStore = ({ showBoiler = false } = {}) => {
  return configureStore({
    reducer: {
      states: stateReducer,
      steps: stepsReducer
    },
    preloadedState: {
      states: {
        ...INITIAL_UI_STATE,
        featuresList: {
          ...INITIAL_UI_STATE.featuresList,
          showBoiler
        },
        stepContainers: {
          "scenario-1": {}
        }
      },
      steps: {
        stepsMap: {
          "scenario-1": {
            steps: [
              {
                keyword: "Given ",
                name: "the user signs in",
                status: "passed",
                duration: 1,
                args: [],
                embeddings: [],
                location: "features/demo.feature:5"
              },
              {
                keyword: "Before",
                name: "",
                status: "passed",
                duration: 1,
                args: [],
                embeddings: [],
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
                error_message: "failed during teardown",
                location: ""
              }
            ]
          }
        },
        totalDurationNanoSec: 3
      }
    }
  });
};

describe("StepsList hook artifact preservation", () => {
  it("shows hook artifacts when hooks are hidden", () => {
    const store = buildStore({ showBoiler: false });

    render(
      <Provider store={store}>
        <StepsList id="scenario-1" themeName="light" />
      </Provider>
    );

    expect(screen.getAllByTestId("step-row")).toHaveLength(1);
    expect(screen.getByText("Hook artifacts")).toBeInTheDocument();
    expect(screen.getByTestId("hook-attachment-string")).toHaveTextContent("failed during teardown");
    expect(screen.getByTestId("hook-embedding")).toHaveTextContent("image/png");
  });

  it("does not show the artifact panel when hooks are visible", () => {
    const store = buildStore({ showBoiler: true });

    render(
      <Provider store={store}>
        <StepsList id="scenario-1" themeName="light" />
      </Provider>
    );

    expect(screen.getAllByTestId("step-row")).toHaveLength(3);
    expect(screen.queryByText("Hook artifacts")).not.toBeInTheDocument();
  });
});
