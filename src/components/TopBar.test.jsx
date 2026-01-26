/**
 * Purpose: Validate tag filter helper interactions in TopBar.
 * Responsibilities: Ensure tag helper focuses input and builds expressions.
 * Inputs/Outputs: Renders TopBar with a minimal Redux store and asserts UI updates.
 * Invariants: Tag token clicks update filter value with correct spacing.
 * See: /agents.md
 */
import React from "react";
import { configureStore } from "@reduxjs/toolkit";
import { Provider } from "react-redux";
import { fireEvent, render, screen } from "@testing-library/react";
import TopBar from "./TopBar";
import featuresReducer from "../store/features";
import scenariosReducer from "../store/scenarios";
import stateReducer from "../store/uistates";
import stepsReducer from "../store/steps";

const buildStore = (tags = []) => {
  const tagObjects = tags.map((name) => ({ name }));
  const initialFeaturesState = {
    featuresMap: {
      "feature-1": {
        id: "feature-1",
        name: "Feature 1",
        numFailedScenarios: 0,
        numSkippedScenarios: 0,
        tags: tagObjects,
        allTags: tagObjects
      }
    },
    list: ["feature-1"]
  };
  return configureStore({
    reducer: {
      features: featuresReducer(initialFeaturesState),
      scenarios: scenariosReducer,
      states: stateReducer,
      steps: stepsReducer
    }
  });
};

const renderTopBar = (tags) => {
  const store = buildStore(tags);
  return render(
    <Provider store={store}>
      <TopBar />
    </Provider>
  );
};

describe("TopBar tag helper", () => {
  it("focuses the filter input when the tags button is clicked", () => {
    renderTopBar(["@packaging"]);
    const filterInput = screen.getByLabelText(/filter by tags/i);
    fireEvent.click(screen.getByRole("button", { name: /tags/i }));
    expect(filterInput).toHaveFocus();
  });

  it("builds a cucumber tag expression from token clicks", () => {
    renderTopBar(["@packaging", "@sony", "@disney", "@charter"]);
    const filterInput = screen.getByLabelText(/filter by tags/i);
    fireEvent.click(screen.getByRole("button", { name: /tags/i }));
    [
      "@packaging",
      "and",
      "(",
      "@sony",
      "or",
      "@disney",
      ")",
      "and",
      "not",
      "@charter"
    ].forEach((token) => {
      fireEvent.click(screen.getByRole("button", { name: token }));
    });
    expect(filterInput.value).toBe("@packaging and (@sony or @disney) and not @charter");
  });

  it("deletes the last token from the filter input", () => {
    renderTopBar(["@packaging", "@foo"]);
    const filterInput = screen.getByLabelText(/filter by tags/i);
    fireEvent.click(screen.getByRole("button", { name: /tags/i }));
    ["@packaging", "and", "@foo"].forEach((token) => {
      fireEvent.click(screen.getByRole("button", { name: token }));
    });
    expect(filterInput.value).toBe("@packaging and @foo");
    const delButton = screen.getByRole("button", { name: /^del$/i });
    fireEvent.click(delButton);
    expect(filterInput.value).toBe("@packaging and");
    fireEvent.click(delButton);
    expect(filterInput.value).toBe("@packaging");
    fireEvent.click(delButton);
    expect(filterInput.value).toBe("");
    expect(screen.queryByRole("button", { name: /^del$/i })).toBeNull();
  });
});
