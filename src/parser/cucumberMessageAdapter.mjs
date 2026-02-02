/**
 * Purpose: Normalize cucumber message envelopes into reporter store state.
 * Responsibilities:
 * - Convert message-stream envelopes into feature/scenario/step maps.
 * - Normalize attachments and step arguments for the UI.
 * Inputs/Outputs: Accepts message envelopes; returns store-shaped state.
 * Invariants: Envelopes are cucumber message JSON objects (NDJSON line items).
 * See: /agents.md
 */

const INPUT_FORMAT_HELP = [
  'inputFormat must be "legacy-json", "message", or "auto".',
  'Use "message" for --format message:<file> output.',
  'Use "legacy-json" for --format json:<file> output.'
].join(" ");

const ATTACHMENTS_ENCODING_HELP = [
  'attachmentsEncoding must be "auto", "base64", or "raw".',
  'Use "raw" to keep attachment bodies as-is.',
  'Use "base64" to decode text attachments when contentEncoding is BASE64.',
  'Use "auto" to respect contentEncoding for message streams.'
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
  let decoded = null;
  if (typeof Buffer !== "undefined") {
    decoded = Buffer.from(value, "base64").toString("utf8");
  } else if (typeof atob === "function") {
    const binary = atob(value);
    const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
    decoded = new TextDecoder("utf-8", { fatal: false }).decode(bytes);
  }
  if (!decoded || !isLikelyText(decoded)) {
    return null;
  }
  return decoded;
};

const formatJsonText = (value) => {
  if (typeof value !== "string") {
    return null;
  }
  try {
    const parsed = JSON.parse(value);
    return JSON.stringify(parsed, null, 2);
  } catch (err) {
    return null;
  }
};

const resolveAttachmentsEncoding = (attachmentsEncoding) => {
  if (!attachmentsEncoding) {
    return "auto";
  }
  if (!["auto", "base64", "raw"].includes(attachmentsEncoding)) {
    throw new Error(ATTACHMENTS_ENCODING_HELP);
  }
  return attachmentsEncoding;
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

const createAccumulator = () => ({
  gherkinByUri: new Map(),
  gherkinScenarioById: new Map(),
  gherkinStepById: new Map(),
  gherkinTagById: new Map(),
  picklesById: new Map(),
  pickleStepById: new Map(),
  testCasesById: new Map(),
  testCaseOrder: [],
  testCaseStartedById: new Map(),
  testCaseStartedIdByTestCaseId: new Map(),
  testStepResultsById: new Map(),
  attachmentsByTestStepId: new Map(),
  hooksById: new Map()
});

const warn = (code, details) => {
  const payload = {
    level: "warn",
    code,
    ...details
  };
  console.warn(JSON.stringify(payload));
};

const normalizeEnvelope = (envelope) => {
  if (!envelope || typeof envelope !== "object") {
    return null;
  }
  if (envelope.envelope && typeof envelope.envelope === "object") {
    return envelope.envelope;
  }
  return envelope;
};

const normalizeTag = (tag) => {
  if (!tag) {
    return null;
  }
  return {
    name: tag.name,
    line: tag.location?.line ?? tag.line
  };
};

const normalizeTags = (tags) => {
  if (!Array.isArray(tags)) {
    return [];
  }
  return tags.map(normalizeTag).filter(Boolean);
};

const recordTag = (acc, tag) => {
  if (!tag) {
    return;
  }
  const id = tag.id ?? tag.astNodeId;
  if (!id) {
    return;
  }
  acc.gherkinTagById.set(id, normalizeTag(tag));
};

const recordStep = (acc, step) => {
  if (!step?.id) {
    return;
  }
  acc.gherkinStepById.set(step.id, {
    keyword: step.keyword ?? "",
    text: step.text ?? "",
    line: step.location?.line
  });
};

const resolveScenarioType = (keyword) => {
  const value = String(keyword ?? "").toLowerCase();
  if (value.includes("outline")) {
    return "scenario_outline";
  }
  if (value.includes("background")) {
    return "background";
  }
  return "scenario";
};

const recordScenario = (acc, scenario, uri) => {
  if (!scenario?.id) {
    return;
  }
  acc.gherkinScenarioById.set(scenario.id, {
    keyword: scenario.keyword ?? "Scenario",
    name: scenario.name ?? "Scenario",
    line: scenario.location?.line,
    tags: normalizeTags(scenario.tags),
    type: resolveScenarioType(scenario.keyword),
    uri
  });

  if (Array.isArray(scenario.tags)) {
    scenario.tags.forEach((tag) => recordTag(acc, tag));
  }
  if (Array.isArray(scenario.steps)) {
    scenario.steps.forEach((step) => recordStep(acc, step));
  }
};

const recordBackground = (acc, background) => {
  if (!background) {
    return;
  }
  if (Array.isArray(background.steps)) {
    background.steps.forEach((step) => recordStep(acc, step));
  }
  if (Array.isArray(background.tags)) {
    background.tags.forEach((tag) => recordTag(acc, tag));
  }
};

const walkGherkinChildren = (acc, children, uri) => {
  if (!Array.isArray(children)) {
    return;
  }
  for (const child of children) {
    if (!child) {
      continue;
    }
    if (child.scenario) {
      recordScenario(acc, child.scenario, uri);
      continue;
    }
    if (child.background) {
      recordBackground(acc, child.background);
      continue;
    }
    if (child.rule && Array.isArray(child.rule.children)) {
      walkGherkinChildren(acc, child.rule.children, uri);
    }
  }
};

const recordGherkinDocument = (acc, doc) => {
  if (!doc?.uri || !doc.feature) {
    return;
  }
  acc.gherkinByUri.set(doc.uri, doc.feature);

  if (Array.isArray(doc.feature.tags)) {
    doc.feature.tags.forEach((tag) => recordTag(acc, tag));
  }
  walkGherkinChildren(acc, doc.feature.children, doc.uri);
};

const recordPickle = (acc, pickle) => {
  if (!pickle?.id) {
    return;
  }
  acc.picklesById.set(pickle.id, pickle);
  if (Array.isArray(pickle.steps)) {
    for (const step of pickle.steps) {
      if (step?.id) {
        acc.pickleStepById.set(step.id, step);
      }
    }
  }
};

const recordTestCase = (acc, testCase) => {
  if (!testCase?.id) {
    return;
  }
  acc.testCasesById.set(testCase.id, testCase);
};

const recordTestCaseStarted = (acc, testCaseStarted) => {
  if (!testCaseStarted?.id || !testCaseStarted?.testCaseId) {
    return;
  }
  acc.testCaseStartedById.set(testCaseStarted.id, testCaseStarted);
  acc.testCaseStartedIdByTestCaseId.set(testCaseStarted.testCaseId, testCaseStarted.id);
  if (!acc.testCaseOrder.includes(testCaseStarted.testCaseId)) {
    acc.testCaseOrder.push(testCaseStarted.testCaseId);
  }
};

const recordTestStepFinished = (acc, testStepFinished) => {
  if (!testStepFinished?.testStepId) {
    return;
  }
  acc.testStepResultsById.set(testStepFinished.testStepId, testStepFinished.testStepResult ?? {});
};

const recordAttachment = (acc, attachment) => {
  if (!attachment?.testStepId) {
    return;
  }
  if (!acc.attachmentsByTestStepId.has(attachment.testStepId)) {
    acc.attachmentsByTestStepId.set(attachment.testStepId, []);
  }
  acc.attachmentsByTestStepId.get(attachment.testStepId).push(attachment);
};

const recordHook = (acc, hook) => {
  if (!hook?.id) {
    return;
  }
  acc.hooksById.set(hook.id, hook);
};

const applyEnvelope = (acc, envelope) => {
  if (envelope.gherkinDocument) {
    recordGherkinDocument(acc, envelope.gherkinDocument);
  } else if (envelope.pickle) {
    recordPickle(acc, envelope.pickle);
  } else if (envelope.testCase) {
    recordTestCase(acc, envelope.testCase);
  } else if (envelope.testCaseStarted) {
    recordTestCaseStarted(acc, envelope.testCaseStarted);
  } else if (envelope.testStepFinished) {
    recordTestStepFinished(acc, envelope.testStepFinished);
  } else if (envelope.attachment) {
    recordAttachment(acc, envelope.attachment);
  } else if (envelope.hook) {
    recordHook(acc, envelope.hook);
  }
};

const normalizeStatus = (status) => {
  const value = String(status ?? "").toUpperCase();
  if (!value) {
    return null;
  }
  if (value === "PASSED") {
    return "passed";
  }
  if (value === "SKIPPED") {
    return "skipped";
  }
  return "failed";
};

const durationToNanos = (duration) => {
  if (duration == null) {
    return null;
  }
  if (typeof duration === "number") {
    return duration;
  }
  if (typeof duration === "string") {
    const parsed = Number(duration);
    return Number.isFinite(parsed) ? parsed : null;
  }
  if (typeof duration === "object") {
    const seconds = Number(duration.seconds ?? 0);
    const nanos = Number(duration.nanos ?? duration.nanoseconds ?? 0);
    const total = seconds * 1e9 + nanos;
    return Number.isFinite(total) ? total : null;
  }
  return null;
};

const resolveLocation = (uri, line) => {
  if (!uri) {
    return "";
  }
  if (Number.isFinite(line)) {
    return `${uri}:${line}`;
  }
  return uri;
};

const resolvePickleTags = (pickleTags, tagById) => {
  if (!Array.isArray(pickleTags)) {
    return [];
  }
  return pickleTags.map((tag) => {
    const match = tagById.get(tag.astNodeId);
    return match ?? { name: tag.name, line: undefined };
  });
};

const normalizeStepArguments = (pickleStep) => {
  if (!pickleStep?.argument) {
    return [];
  }
  const args = [];
  if (pickleStep.argument.docString) {
    args.push({
      content: pickleStep.argument.docString.content ?? ""
    });
  }
  if (pickleStep.argument.dataTable) {
    const rows = (pickleStep.argument.dataTable.rows ?? []).map((row) => ({
      cells: (row.cells ?? []).map((cell) => cell.value ?? "")
    }));
    args.push({ rows });
  }
  return args;
};

const normalizeAttachment = (attachment, { attachmentsEncoding }) => {
  const mimeType = normalizeMimeType(attachment.mediaType);
  let data = attachment.body ?? "";
  if (attachmentsEncoding === "raw") {
    if (mimeType === "application/json") {
      const formatted = formatJsonText(data);
      if (formatted) {
        data = formatted;
      }
    }
    return { data, mime_type: mimeType };
  }

  const encoding = String(attachment.contentEncoding ?? "").toUpperCase();
  if (encoding === "BASE64" && typeof data === "string") {
    if (shouldDecodeEmbedding(mimeType)) {
      const decoded = decodeBase64Text(data);
      if (decoded) {
        if (mimeType === "application/json") {
          const formatted = formatJsonText(decoded);
          if (formatted) {
            data = formatted;
          } else {
            data = decoded;
          }
        } else {
          data = decoded;
        }
      }
    }
  } else if (mimeType === "application/json" && typeof data === "string") {
    const formatted = formatJsonText(data);
    if (formatted) {
      data = formatted;
    }
  }

  return { data, mime_type: mimeType };
};

const mapHookKeyword = (hook) => {
  const hookType = String(hook?.type ?? "").toUpperCase();
  if (hookType.startsWith("AFTER")) {
    return "After";
  }
  if (hookType.startsWith("BEFORE")) {
    return "Before";
  }
  return "Hook";
};

const resolveScenarioMeta = (acc, pickle) => {
  if (!pickle?.astNodeIds?.length) {
    return null;
  }
  for (const astNodeId of pickle.astNodeIds) {
    const match = acc.gherkinScenarioById.get(astNodeId);
    if (match) {
      return match;
    }
  }
  return null;
};

const buildScenarioId = (featureId, scenarioId, index) => {
  const parts = String(scenarioId).split(";");
  const suffix = parts.length > 1 ? parts[1] : parts[0];
  return `${featureId};${index}_${suffix}`;
};

const buildFeatureId = (feature, index) => {
  const baseId = feature?.id ?? feature?.name ?? feature?.uri ?? "feature";
  return `${index}_${baseId}`;
};

const appendUniqueTags = (existing, tags) => {
  const names = new Set(existing.map((tag) => tag.name));
  for (const tag of tags) {
    if (tag?.name && !names.has(tag.name)) {
      existing.push(tag);
      names.add(tag.name);
    }
  }
};

const createFeatureEntry = (featureId, feature, uri) => ({
  id: featureId,
  description: feature?.description ?? "",
  uri,
  keyword: feature?.keyword ?? "Feature",
  name: feature?.name ?? uri ?? "Feature",
  line: feature?.location?.line,
  tags: normalizeTags(feature?.tags),
  allTags: normalizeTags(feature?.tags),
  numFailedScenarios: 0,
  numSkippedScenarios: 0
});

const buildScenarioSteps = (acc, testCase, pickle, uri, options) => {
  const steps = [];
  const testSteps = Array.isArray(testCase?.testSteps) ? testCase.testSteps : [];

  for (const testStep of testSteps) {
    if (!testStep) {
      continue;
    }
    if (testStep.pickleStepId) {
      const pickleStep = acc.pickleStepById.get(testStep.pickleStepId);
      const gherkinStep = pickleStep?.astNodeIds?.length
        ? acc.gherkinStepById.get(pickleStep.astNodeIds[0])
        : null;
      const result = acc.testStepResultsById.get(testStep.id) ?? {};
      const duration = durationToNanos(result.duration);
      const status = normalizeStatus(result.status);
      const error_message = result.message ?? result.exception?.message;
      const attachments = acc.attachmentsByTestStepId.get(testStep.id) ?? [];
      const embeddings = attachments.map((item) => normalizeAttachment(item, options));
      const args = normalizeStepArguments(pickleStep);
      const line = gherkinStep?.line;
      steps.push({
        args,
        duration,
        embeddings,
        error_message,
        hidden: false,
        keyword: gherkinStep?.keyword ?? "",
        line,
        location: resolveLocation(uri, line),
        name: pickleStep?.text ?? gherkinStep?.text ?? "",
        status
      });
    } else if (testStep.hookId) {
      const hook = acc.hooksById.get(testStep.hookId);
      const result = acc.testStepResultsById.get(testStep.id) ?? {};
      const duration = durationToNanos(result.duration);
      const status = normalizeStatus(result.status);
      const error_message = result.message ?? result.exception?.message;
      const attachments = acc.attachmentsByTestStepId.get(testStep.id) ?? [];
      const embeddings = attachments.map((item) => normalizeAttachment(item, options));
      const keyword = mapHookKeyword(hook);
      const line = hook?.sourceReference?.location?.line;
      steps.push({
        args: [],
        duration,
        embeddings,
        error_message,
        hidden: true,
        keyword,
        line,
        location: resolveLocation(hook?.sourceReference?.uri, line),
        name: hook?.name ?? keyword,
        status
      });
    }
  }

  return steps;
};

const finalizeState = (acc, options) => {
  const state = createEmptyState();
  const featureIdByUri = new Map();
  const scenarioIndexByFeatureId = new Map();
  let featureIndex = 0;

  const orderedTestCaseIds = [...acc.testCaseOrder];
  for (const testCaseId of acc.testCasesById.keys()) {
    if (!orderedTestCaseIds.includes(testCaseId)) {
      orderedTestCaseIds.push(testCaseId);
    }
  }

  for (const testCaseId of orderedTestCaseIds) {
    const testCase = acc.testCasesById.get(testCaseId);
    if (!testCase) {
      warn("missing-test-case", { testCaseId });
      continue;
    }
    const pickle = acc.picklesById.get(testCase.pickleId);
    if (!pickle) {
      warn("missing-pickle", { testCaseId, pickleId: testCase.pickleId });
      continue;
    }

    const uri = pickle.uri;
    const feature = acc.gherkinByUri.get(uri);
    let featureId = featureIdByUri.get(uri);
    if (!featureId) {
      featureId = buildFeatureId(feature, featureIndex);
      featureIndex += 1;
      featureIdByUri.set(uri, featureId);
      state.features.list.push(featureId);
      state.features.featuresMap[featureId] = createFeatureEntry(featureId, feature, uri);
    }

    const scenarioMeta = resolveScenarioMeta(acc, pickle);
    const scenarioIndex = scenarioIndexByFeatureId.get(featureId) ?? 0;
    const baseScenarioId = pickle.id ?? pickle.name ?? "scenario";
    const scenarioId = buildScenarioId(featureId, baseScenarioId, scenarioIndex);
    scenarioIndexByFeatureId.set(featureId, scenarioIndex + 1);

    const scenarioTags = resolvePickleTags(pickle.tags, acc.gherkinTagById);
    const scenario = {
      failedSteps: 0,
      featureId,
      id: scenarioId,
      keyword: scenarioMeta?.keyword ?? "Scenario",
      line: scenarioMeta?.line,
      name: pickle.name ?? scenarioMeta?.name ?? "Scenario",
      passedSteps: 0,
      skippedSteps: 0,
      tags: scenarioTags,
      type: scenarioMeta?.type ?? "scenario",
      uri
    };

    state.scenarios.list.push(scenarioId);
    state.scenarios.scenariosMap[scenarioId] = scenario;

    const steps = buildScenarioSteps(acc, testCase, pickle, uri, options);
    state.steps.stepsMap[scenarioId] = { steps: [] };

    for (const step of steps) {
      state.steps.stepsMap[scenarioId].steps.push(step);
      if (Number.isFinite(step.duration)) {
        state.steps.totalDurationNanoSec += step.duration;
      }
      if (!step.hidden || (step.embeddings && step.embeddings.length)) {
        if (step.status === "passed") {
          scenario.passedSteps += 1;
        } else if (step.status === "skipped") {
          scenario.skippedSteps += 1;
        }
      }
      if (step.status === "failed") {
        scenario.failedSteps += 1;
      }
    }

    const featureEntry = state.features.featuresMap[featureId];
    appendUniqueTags(featureEntry.allTags, scenarioTags);
    if (scenario.failedSteps > 0) {
      featureEntry.numFailedScenarios += 1;
    } else if (scenario.skippedSteps > 0) {
      featureEntry.numSkippedScenarios += 1;
    }
  }

  return state;
};

const normalizeInput = (input) => {
  if (!Array.isArray(input)) {
    return null;
  }
  return input.map(normalizeEnvelope).filter(Boolean);
};

/**
 * Create a reusable message-state builder for incremental updates.
 * @param {Object} [options] adapter options
 * @param {"auto"|"base64"|"raw"} [options.attachmentsEncoding] attachment encoding
 * @returns {{ingest: Function, buildState: Function}} builder utilities
 * @throws {Error} when attachmentsEncoding is invalid
 * @example
 * const builder = createMessageStateBuilder();
 * builder.ingest(envelope);
 * const state = builder.buildState();
 */
export const createMessageStateBuilder = ({ attachmentsEncoding } = {}) => {
  const resolvedEncoding = resolveAttachmentsEncoding(attachmentsEncoding);
  const acc = createAccumulator();

  return {
    ingest: (envelope) => {
      const normalized = normalizeEnvelope(envelope);
      if (!normalized) {
        return;
      }
      applyEnvelope(acc, normalized);
    },
    buildState: () => finalizeState(acc, { attachmentsEncoding: resolvedEncoding })
  };
};

/**
 * Convert a message envelope stream into the reporter store shape.
 * @param {AsyncIterable<unknown>} input async iterable of message envelopes
 * @param {Object} [options] adapter options
 * @param {"auto"|"base64"|"raw"} [options.attachmentsEncoding] attachment encoding
 * @returns {Promise<Object>} normalized state for the UI store
 * @throws {Error} when input is not iterable
 * @example
 * const state = await prepareStoreStateFromMessageStream(envelopesAsync);
 */
export const prepareStoreStateFromMessageStream = async (
  input,
  { attachmentsEncoding } = {}
) => {
  if (!input || typeof input[Symbol.asyncIterator] !== "function") {
    throw new Error(INPUT_FORMAT_HELP);
  }

  const resolvedEncoding = resolveAttachmentsEncoding(attachmentsEncoding);
  const acc = createAccumulator();

  for await (const envelope of input) {
    const normalized = normalizeEnvelope(envelope);
    if (!normalized) {
      continue;
    }
    applyEnvelope(acc, normalized);
  }

  return finalizeState(acc, { attachmentsEncoding: resolvedEncoding });
};

/**
 * Convert cucumber message envelopes into the reporter store shape.
 * @param {unknown} input parsed cucumber message NDJSON (array of envelopes)
 * @param {Object} [options] adapter options
 * @param {"auto"|"base64"|"raw"} [options.attachmentsEncoding] attachment encoding
 * @returns {Object} normalized state for the UI store
 * @throws {Error} when input is not message envelopes
 * @example
 * const state = prepareStoreStateFromMessages(envelopes);
 */
export const prepareStoreStateFromMessages = (
  input,
  { attachmentsEncoding } = {}
) => {
  const envelopes = normalizeInput(input);
  if (!envelopes) {
    throw new Error(INPUT_FORMAT_HELP);
  }

  const resolvedEncoding = resolveAttachmentsEncoding(attachmentsEncoding);
  const acc = createAccumulator();

  for (const envelope of envelopes) {
    applyEnvelope(acc, envelope);
  }

  return finalizeState(acc, { attachmentsEncoding: resolvedEncoding });
};
