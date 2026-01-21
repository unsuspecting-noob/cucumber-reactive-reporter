/**
 * Purpose: Normalize cucumber JSON into reporter store state.
 * Responsibilities:
 * - Normalize legacy cucumber JSON to a stable feature/scenario/step shape.
 * - Build feature, scenario, and step maps for the UI store.
 * Inputs/Outputs: Accepts parsed cucumber JSON; returns store-shaped state.
 * Invariants: Input must be legacy JSON (features/elements/steps).
 * See: /agents.md
 */

const LEGACY_FORMAT_HELP = [
  "Unsupported cucumber output format.",
  "This reporter expects legacy JSON (features/elements/steps).",
  "If you are using the message formatter, rerun with --format json:<file> or",
  'use inputFormat: "auto" to detect message output.'
].join(" ");

const INPUT_FORMAT_HELP = [
  'inputFormat must be "legacy-json" or "auto".',
  'Use "legacy-json" for --format json:<file> output.',
  'Use "auto" to detect and reject message formatter output explicitly.'
].join(" ");

const ATTACHMENTS_ENCODING_HELP = [
  'attachmentsEncoding must be "auto", "base64", or "raw".',
  'Use "raw" if your cucumber JSON stores text attachments unencoded.',
  'Use "base64" if text attachments are base64-encoded.',
  'Use "auto" to decode base64-looking text attachments.'
].join(" ");

const normalizeMimeType = (value) => String(value ?? "").split(";")[0].trim().toLowerCase();

const shouldDecodeEmbedding = (mimeType) => {
  if (!mimeType) {
    return false;
  }
  if (mimeType.startsWith("text/")) {
    return true;
  }
  return mimeType === "application/json" || mimeType === "application/xml";
};

const looksLikeBase64 = (value) => {
  if (typeof value !== "string") {
    return false;
  }
  const trimmed = value.trim();
  if (!trimmed || trimmed.length % 4 !== 0) {
    return false;
  }
  if (/[^A-Za-z0-9+/=]/.test(trimmed)) {
    return false;
  }
  return true;
};

const isLikelyText = (value) => {
  if (typeof value !== "string") {
    return false;
  }
  if (value.includes("\uFFFD")) {
    return false;
  }
  const sample = value.slice(0, 2000);
  if (!sample.length) {
    return true;
  }
  let printable = 0;
  for (const char of sample) {
    const code = char.charCodeAt(0);
    if (code === 9 || code === 10 || code === 13) {
      printable += 1;
      continue;
    }
    if (code >= 32 && code !== 127) {
      printable += 1;
    }
  }
  return printable / sample.length > 0.85;
};

const decodeBase64Text = (value) => {
  if (!looksLikeBase64(value)) {
    return null;
  }
  const decoded = Buffer.from(value, "base64").toString("utf8");
  if (!isLikelyText(decoded)) {
    return null;
  }
  return decoded;
};

const normalizeEmbeddings = (embeddings, { attachmentsEncoding }) => {
  if (!Array.isArray(embeddings)) {
    return embeddings;
  }
  return embeddings.map((embedding) =>
    normalizeEmbedding(embedding, { attachmentsEncoding })
  );
};

const normalizeEmbedding = (embedding, { attachmentsEncoding }) => {
  if (!embedding || typeof embedding !== "object") {
    return embedding;
  }
  if (attachmentsEncoding === "raw") {
    return embedding;
  }
  const mimeType = normalizeMimeType(embedding.mime_type ?? embedding.media?.type);
  if (!shouldDecodeEmbedding(mimeType)) {
    return embedding;
  }
  if (typeof embedding.data !== "string") {
    return embedding;
  }
  // Legacy cucumber JSON embeds text payloads as base64; decode for readable output.
  const decoded = decodeBase64Text(embedding.data);
  if (!decoded) {
    return embedding;
  }
  if (mimeType === "application/json") {
    try {
      JSON.parse(decoded);
    } catch (err) {
      return embedding;
    }
  } else if (["application/xml", "text/xml", "text/html"].includes(mimeType)) {
    if (!decoded.includes("<")) {
      return embedding;
    }
  }
  return { ...embedding, data: decoded };
};

const resolveAttachmentsEncoding = ({ attachmentsEncoding, cucumberVersion }) => {
  if (!attachmentsEncoding) {
    const parsed = parseCucumberMajor(cucumberVersion);
    if (Number.isFinite(parsed)) {
      return parsed < 7 ? "raw" : "base64";
    }
    return "auto";
  }
  if (!["auto", "base64", "raw"].includes(attachmentsEncoding)) {
    throw new Error(ATTACHMENTS_ENCODING_HELP);
  }
  return attachmentsEncoding;
};

const parseCucumberMajor = (cucumberVersion) => {
  if (!cucumberVersion) {
    return null;
  }
  const value = String(cucumberVersion).trim();
  if (!value) {
    return null;
  }
  const match = value.match(/(\d+)(?:\.\d+)?/);
  if (!match) {
    return null;
  }
  const major = Number.parseInt(match[1], 10);
  return Number.isFinite(major) ? major : null;
};

/**
 * Convert cucumber JSON into the reporter store shape.
 * @param {unknown} input parsed cucumber JSON
 * @returns {Object} normalized state for the UI store
 * @throws {Error} when input is not legacy cucumber JSON
 * @example
 * const state = prepareStoreState(legacyJsonArray);
 */
export const prepareStoreState = (
  input,
  {
    inputFormat = "legacy-json",
    attachmentsEncoding,
    cucumberVersion
  } = {}
) => {
  if (!["legacy-json", "auto"].includes(inputFormat)) {
    throw new Error(INPUT_FORMAT_HELP);
  }

  if (inputFormat === "auto" && looksLikeMessageStream(input)) {
    throw new Error(LEGACY_FORMAT_HELP);
  }

  const resolvedEncoding = resolveAttachmentsEncoding({
    attachmentsEncoding,
    cucumberVersion
  });

  const features = resolveFeatures(input);
  if (!features) {
    throw new Error(LEGACY_FORMAT_HELP);
  }

  const state = createEmptyState();
  let featureIndex = 0;

  for (const rawFeature of features) {
    if (!rawFeature) {
      continue;
    }

    const feature = normalizeFeature(rawFeature, featureIndex);
    featureIndex += 1;
    processFeature(state, feature);
    processFeatureElements(state, feature, { attachmentsEncoding: resolvedEncoding });
  }

  return state;
};

const createEmptyState = () => ({
  features: {
    list: [],
    featuresMap: {}
  },
  scenarios: {
    list: [],
    scenariosMap: {}
  },
  steps: {
    stepsMap: {},
    totalDurationNanoSec: 0
  }
});

const looksLikeMessageStream = (input) => {
  if (!Array.isArray(input)) {
    return false;
  }

  return input.some((item) => {
    if (!item || typeof item !== "object") {
      return false;
    }
    return (
      "gherkinDocument" in item ||
      "pickle" in item ||
      "testCaseStarted" in item ||
      "testCaseFinished" in item ||
      "envelope" in item
    );
  });
};

const resolveFeatures = (input) => {
  if (Array.isArray(input)) {
    return input;
  }
  if (input && Array.isArray(input.features)) {
    return input.features;
  }
  return null;
};

const normalizeFeature = (feature, index) => {
  const baseId = feature?.id ?? feature?.name ?? "feature";
  const elements = normalizeElements(feature);
  return {
    ...feature,
    id: `${index}_${baseId}`,
    elements,
    tags: Array.isArray(feature?.tags) ? feature.tags : []
  };
};

const normalizeElements = (feature) => {
  if (!feature) {
    return [];
  }
  if (Array.isArray(feature.elements)) {
    return feature.elements;
  }
  if (Array.isArray(feature.scenarios)) {
    return feature.scenarios;
  }
  if (Array.isArray(feature.children)) {
    return flattenChildren(feature.children);
  }
  return [];
};

const flattenChildren = (children) => {
  const flattened = [];

  for (const child of children) {
    if (!child) {
      continue;
    }
    if (child.scenario) {
      flattened.push(child.scenario);
      continue;
    }
    if (child.background) {
      flattened.push(child.background);
      continue;
    }
    if (child.rule && Array.isArray(child.rule.children)) {
      flattened.push(...flattenChildren(child.rule.children));
      continue;
    }
    if (Array.isArray(child.children)) {
      flattened.push(...flattenChildren(child.children));
      continue;
    }
    flattened.push(child);
  }

  return flattened;
};

const normalizeScenario = (featureId, scenario, index) => {
  const baseId = scenario?.id ?? scenario?.name ?? "scenario";
  const scenarioId = buildScenarioId(featureId, baseId, index);
  return {
    ...scenario,
    id: scenarioId,
    tags: Array.isArray(scenario?.tags) ? scenario.tags : []
  };
};

const buildScenarioId = (featureId, scenarioId, index) => {
  const parts = String(scenarioId).split(";");
  const suffix = parts.length > 1 ? parts[1] : parts[0];
  return `${featureId};${index}_${suffix}`;
};

const processFeature = (state, feature) => {
  const {
    description,
    elements,
    id,
    keyword,
    line,
    name,
    tags,
    uri
  } = feature;

  const allTags = Array.isArray(tags) ? [...tags] : [];
  let numFailedScenarios = 0;
  let numSkippedScenarios = 0;
  const elementList = Array.isArray(elements) ? elements : [];

  for (const element of elementList) {
    const elementTags = Array.isArray(element?.tags) ? element.tags : [];
    const seen = allTags.map((tag) => tag.name);
    for (const tag of elementTags) {
      if (tag?.name && !seen.includes(tag.name)) {
        allTags.push(tag);
      }
    }

    const steps = Array.isArray(element?.steps) ? element.steps : [];
    for (const step of steps) {
      const status = step?.result?.status;
      if (status === "failed") {
        numFailedScenarios += 1;
        break;
      }
      if (status === "skipped") {
        numSkippedScenarios += 1;
        break;
      }
    }
  }

  state.features.list.push(id);
  state.features.featuresMap[id] = {
    id,
    description,
    uri,
    keyword,
    name,
    line,
    tags: Array.isArray(tags) ? tags : [],
    allTags,
    numFailedScenarios,
    numSkippedScenarios
  };
};

const processScenario = (state, featureId, scenario) => {
  const {
    id,
    keyword,
    line,
    name,
    tags,
    type,
    uri
  } = scenario;

  state.scenarios.list.push(id);
  state.scenarios.scenariosMap[id] = {
    failedSteps: 0,
    featureId,
    id,
    keyword,
    line,
    name,
    passedSteps: 0,
    skippedSteps: 0,
    tags: Array.isArray(tags) ? tags : [],
    type,
    uri
  };
};

const processFeatureElements = (state, feature, { attachmentsEncoding }) => {
  const elements = feature.elements;
  if (!elements.length) {
    return;
  }

  let scenarioIndex = 0;
  for (const rawScenario of elements) {
    if (!rawScenario) {
      continue;
    }
    const scenario = normalizeScenario(feature.id, rawScenario, scenarioIndex);
    scenarioIndex += 1;
    processScenario(state, feature.id, scenario);
    processScenarioSteps(state, scenario, { attachmentsEncoding });
  }
};

const processScenarioSteps = (state, scenario, { attachmentsEncoding }) => {
  const steps = Array.isArray(scenario.steps) ? scenario.steps : [];
  for (const step of steps) {
    processStep(state, scenario.id, step, { attachmentsEncoding });
  }
};

const processStep = (state, scenarioId, step, { attachmentsEncoding }) => {
  const {
    arguments: args,
    embeddings,
    hidden,
    keyword,
    line,
    name,
    result
  } = step ?? {};
  const {
    duration,
    error_message,
    status
  } = result ?? {};

  const durationValue = typeof duration === "string" ? Number(duration) : duration;
  const location = step?.match?.location ?? "";
  const normalizedEmbeddings = normalizeEmbeddings(embeddings, { attachmentsEncoding });
  const stepData = {
    args,
    duration: durationValue,
    embeddings: normalizedEmbeddings,
    error_message,
    keyword,
    line,
    location,
    name,
    status
  };

  if (!state.steps.stepsMap[scenarioId]) {
    state.steps.stepsMap[scenarioId] = { steps: [] };
  }
  state.steps.stepsMap[scenarioId].steps.push(stepData);

  if (Number.isFinite(durationValue)) {
    state.steps.totalDurationNanoSec += durationValue;
  }

  if (!hidden || (normalizedEmbeddings && normalizedEmbeddings.length)) {
    if (status === "passed") {
      state.scenarios.scenariosMap[scenarioId].passedSteps += 1;
    } else if (status === "skipped") {
      state.scenarios.scenariosMap[scenarioId].skippedSteps += 1;
    }
  }
  if (status === "failed") {
    state.scenarios.scenariosMap[scenarioId].failedSteps += 1;
  }
};
