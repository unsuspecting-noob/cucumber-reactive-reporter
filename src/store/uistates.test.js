/**
 * Purpose: Validate UI state reducer behaviors.
 * Responsibilities: Ensure split pane ratio persists and clamps to bounds.
 * Inputs/Outputs: Dispatches reducer actions; asserts state updates.
 * Invariants: Split ratio stays within supported range.
 * See: /agents.md
 */
import reducer, { setSplitPaneRatio, stepContainerOpenSet } from "./uistates";

describe("uistates reducer", () => {
  it("clamps split pane ratio updates", () => {
    let state = reducer(undefined, { type: "@@INIT" });
    state = reducer(state, setSplitPaneRatio({ value: 10 }));
    expect(state.featuresList.splitPaneRatio).toBe(25);
    state = reducer(state, setSplitPaneRatio({ value: 90 }));
    expect(state.featuresList.splitPaneRatio).toBe(75);
    state = reducer(state, setSplitPaneRatio({ value: 60 }));
    expect(state.featuresList.splitPaneRatio).toBe(60);
  });

  it("persists step expansion by scenario and step key", () => {
    let state = reducer(undefined, { type: "@@INIT" });
    state = reducer(state, stepContainerOpenSet({
      scenarioId: "feature-1;scenario-1",
      stepKey: "0:Given:step-name:path:10",
      open: true
    }));
    expect(state.stepContainers["feature-1;scenario-1"]["0:Given:step-name:path:10"]).toBe(true);
  });
});
