/**
 * Purpose: Merge live report snapshots without re-rendering unchanged entries.
 * Responsibilities:
 * - Reuse previous feature/scenario/step objects when data is identical.
 * - Preserve list references when ordering is unchanged.
 * Inputs/Outputs: Accepts previous and next store slices; returns merged slices.
 * Invariants: State shapes match reporter store schema.
 * See: /agents.md
 */

const normalizeTags = (tags) => (Array.isArray(tags) ? tags : []);

const tagsEqual = (left, right) => {
  const a = normalizeTags(left);
  const b = normalizeTags(right);
  if (a.length !== b.length) {
    return false;
  }
  for (let i = 0; i < a.length; i += 1) {
    if (a[i]?.name !== b[i]?.name) {
      return false;
    }
  }
  return true;
};

const featureEqual = (prev, next) => {
  if (!prev || !next) {
    return false;
  }
  return prev.id === next.id
    && prev.name === next.name
    && prev.description === next.description
    && prev.uri === next.uri
    && prev.keyword === next.keyword
    && prev.line === next.line
    && prev.numFailedScenarios === next.numFailedScenarios
    && prev.numSkippedScenarios === next.numSkippedScenarios
    && tagsEqual(prev.tags, next.tags)
    && tagsEqual(prev.allTags, next.allTags);
};

const scenarioEqual = (prev, next) => {
  if (!prev || !next) {
    return false;
  }
  return prev.id === next.id
    && prev.name === next.name
    && prev.keyword === next.keyword
    && prev.line === next.line
    && prev.type === next.type
    && prev.uri === next.uri
    && prev.passedSteps === next.passedSteps
    && prev.failedSteps === next.failedSteps
    && prev.skippedSteps === next.skippedSteps
    && tagsEqual(prev.tags, next.tags);
};

const buildStepsSignature = (entry) => {
  const steps = entry?.steps;
  if (!Array.isArray(steps)) {
    return "";
  }
  let signature = `${steps.length}|`;
  for (const step of steps) {
    const status = step?.status ?? "";
    const duration = step?.duration ?? "";
    const embeddings = Array.isArray(step?.embeddings) ? step.embeddings.length : 0;
    const errorFlag = step?.error_message ? 1 : 0;
    signature += `${status}:${duration}:${embeddings}:${errorFlag};`;
  }
  return signature;
};

const listsEqual = (left, right) => {
  if (!Array.isArray(left) || !Array.isArray(right)) {
    return false;
  }
  if (left.length !== right.length) {
    return false;
  }
  for (let i = 0; i < left.length; i += 1) {
    if (left[i] !== right[i]) {
      return false;
    }
  }
  return true;
};

const mergeList = (prevList, nextList) => {
  if (!Array.isArray(nextList)) {
    return prevList ?? [];
  }
  if (listsEqual(prevList, nextList)) {
    return prevList;
  }
  return nextList;
};

const mergeMap = (prevMap, nextMap, equals) => {
  const prevObj = prevMap ?? {};
  const nextObj = nextMap ?? {};
  const merged = {};
  let changed = false;

  for (const [key, nextVal] of Object.entries(nextObj)) {
    const prevVal = prevObj[key];
    if (prevVal && equals(prevVal, nextVal)) {
      merged[key] = prevVal;
    } else {
      merged[key] = nextVal;
      changed = true;
    }
  }

  if (!changed) {
    const prevKeys = Object.keys(prevObj);
    const nextKeys = Object.keys(nextObj);
    if (prevKeys.length === nextKeys.length) {
      return prevObj;
    }
  }

  return merged;
};

export const mergeReportState = (prevState, nextState) => {
  const prevFeatures = prevState?.features ?? {};
  const prevScenarios = prevState?.scenarios ?? {};
  const prevSteps = prevState?.steps ?? {};

  const nextFeatures = nextState?.features ?? prevFeatures;
  const nextScenarios = nextState?.scenarios ?? prevScenarios;
  const nextSteps = nextState?.steps ?? prevSteps;

  const mergedFeaturesMap = mergeMap(
    prevFeatures.featuresMap,
    nextFeatures.featuresMap,
    featureEqual
  );
  const mergedScenariosMap = mergeMap(
    prevScenarios.scenariosMap,
    nextScenarios.scenariosMap,
    scenarioEqual
  );

  const prevStepsMap = prevSteps.stepsMap ?? {};
  const nextStepsMap = nextSteps.stepsMap ?? {};
  const mergedStepsMap = {};
  let stepsChanged = false;

  for (const [scenarioId, nextEntry] of Object.entries(nextStepsMap)) {
    const prevEntry = prevStepsMap[scenarioId];
    if (prevEntry && buildStepsSignature(prevEntry) === buildStepsSignature(nextEntry)) {
      mergedStepsMap[scenarioId] = prevEntry;
    } else {
      mergedStepsMap[scenarioId] = nextEntry;
      stepsChanged = true;
    }
  }

  if (!stepsChanged) {
    const prevKeys = Object.keys(prevStepsMap);
    const nextKeys = Object.keys(nextStepsMap);
    if (prevKeys.length === nextKeys.length) {
      return {
        features: {
          list: mergeList(prevFeatures.list, nextFeatures.list),
          featuresMap: mergedFeaturesMap
        },
        scenarios: {
          list: mergeList(prevScenarios.list, nextScenarios.list),
          scenariosMap: mergedScenariosMap
        },
        steps: prevSteps
      };
    }
  }

  return {
    features: {
      list: mergeList(prevFeatures.list, nextFeatures.list),
      featuresMap: mergedFeaturesMap
    },
    scenarios: {
      list: mergeList(prevScenarios.list, nextScenarios.list),
      scenariosMap: mergedScenariosMap
    },
    steps: {
      stepsMap: mergedStepsMap,
      totalDurationNanoSec: nextSteps.totalDurationNanoSec ?? prevSteps.totalDurationNanoSec ?? 0
    }
  };
};
