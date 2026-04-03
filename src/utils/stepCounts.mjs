const normalizeCount = (value) => Number(value) || 0;

const getStepStatus = (step) => step?.status ?? step?.result?.status ?? "";

export const normalizeStepKeyword = (value) =>
  String(value ?? "").replace(/\s/g, "").toLowerCase();

export const isHookKeyword = (value) => {
  const keyword = normalizeStepKeyword(value);
  return keyword === "before" || keyword === "after";
};

export const shouldCountVisibleScenarioStep = (step) =>
  step?.hidden !== true && !isHookKeyword(step?.keyword);

export const createScenarioStepCounts = () => ({
  failedSteps: 0,
  passedSteps: 0,
  skippedSteps: 0
});

export const applyStepToScenarioCounts = (target, step) => {
  if (!target || !step) {
    return target;
  }

  const status = getStepStatus(step);
  if (shouldCountVisibleScenarioStep(step)) {
    if (status === "passed") {
      target.passedSteps += 1;
    } else if (status === "skipped") {
      target.skippedSteps += 1;
    }
  }

  if (status === "failed") {
    target.failedSteps += 1;
  }

  return target;
};

export const calculateScenarioStepCounts = (steps) => {
  const counts = createScenarioStepCounts();
  for (const step of Array.isArray(steps) ? steps : []) {
    applyStepToScenarioCounts(counts, step);
  }
  return counts;
};

export const scenarioHasFailures = (scenario) => normalizeCount(scenario?.failedSteps) > 0;

export const scenarioIsPassed = (scenario) =>
  !scenarioHasFailures(scenario)
  && normalizeCount(scenario?.passedSteps) > 0
  && normalizeCount(scenario?.skippedSteps) === 0;

export const scenarioIsSkipped = (scenario) =>
  !scenarioHasFailures(scenario)
  && normalizeCount(scenario?.skippedSteps) > 0;
