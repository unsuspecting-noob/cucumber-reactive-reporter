import { liveUpdateReceived, loadDataFinished, settingsLoaded } from "./store/uistates";
import { createMessageStateBuilder } from "./parser/cucumberMessageAdapter.mjs";

export default async (store) => {
  let metadata;
  try {
    let mresponse = await fetch("_reporter_settings.json", { cache: "no-store" });
    metadata = await mresponse.json();
  } catch (err) {
    console.log("ERROR: ", err);
    //not sure
  }
  if (metadata) {
    store.dispatch(settingsLoaded(metadata))
    if (metadata.live?.enabled) {
      startLivePolling(store, metadata);
    }
  }
  store.dispatch(loadDataFinished());
};

const createLiveGuard = () => {
  let suspendUntil = 0;

  const suspendLiveUpdates = () => {
    suspendUntil = Date.now() + 1500;
  };

  const shouldSuspendForFocus = () => {
    if (typeof document === "undefined") {
      return false;
    }
    const active = document.activeElement;
    if (!active) {
      return false;
    }
    if (active.isContentEditable) {
      return true;
    }
    const tag = active.tagName ? active.tagName.toLowerCase() : "";
    return tag === "input" || tag === "textarea" || tag === "select";
  };

  if (typeof window !== "undefined") {
    ["pointerdown", "keydown", "wheel", "touchstart"].forEach((eventName) => {
      window.addEventListener(eventName, suspendLiveUpdates, { passive: true });
    });
  }

  return {
    shouldSuspend: () => {
      if (suspendUntil && Date.now() < suspendUntil) {
        return true;
      }
      if (shouldSuspendForFocus()) {
        suspendLiveUpdates();
        return true;
      }
      return false;
    }
  };
};

const startLivePolling = (store, metadata) => {
  const liveOptions = metadata.live ?? {};
  const transport = liveOptions.source ?? (metadata.inputFormat === "message" ? "message" : "state");
  if (transport === "message") {
    startMessagePolling(store, liveOptions, () => startStatePolling(store, liveOptions));
    return;
  }
  startStatePolling(store, liveOptions);
};

const startStatePolling = (store, liveOptions) => {
  const pollIntervalMs = Math.max(500, Number(liveOptions?.pollIntervalMs) || 2000);
  let inFlight = false;
  let lastPayloadText = null;
  const guard = createLiveGuard();

  const poll = async () => {
    if (inFlight) {
      return;
    }
    if (guard.shouldSuspend()) {
      return;
    }
    inFlight = true;
    try {
      const response = await fetch("./_cucumber-results.json", { cache: "no-store" });
      const payloadText = await response.text();
      if (!payloadText || payloadText === lastPayloadText) {
        return;
      }
      lastPayloadText = payloadText;
      const data = JSON.parse(payloadText);
      store.dispatch({ type: "reporter/stateReplaced", payload: data });
      store.dispatch(liveUpdateReceived({ timestamp: Date.now() }));
    } catch (err) {
      console.warn(JSON.stringify({
        level: "warn",
        code: "live-poll-failed",
        message: err.message
      }));
    } finally {
      inFlight = false;
    }
  };

  poll();
  setInterval(poll, pollIntervalMs);
};

const startMessagePolling = (store, liveOptions, fallbackToState) => {
  const pollIntervalMs = Math.max(500, Number(liveOptions?.pollIntervalMs) || 2000);
  const messagePath = liveOptions?.messagePath ?? "cucumber-messages.ndjson";
  const guard = createLiveGuard();
  let inFlight = false;
  let offset = 0;
  let buffer = "";
  let missingCount = 0;
  let builder = createMessageStateBuilder({
    attachmentsEncoding: liveOptions?.attachmentsEncoding
  });

  const applyChunk = (chunk) => {
    let applied = 0;
    buffer += chunk;
    const lines = buffer.split(/\r?\n/);
    buffer = lines.pop() ?? "";
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) {
        continue;
      }
      try {
        builder.ingest(JSON.parse(trimmed));
        applied += 1;
      } catch (err) {
        console.warn(JSON.stringify({
          level: "warn",
          code: "live-message-parse-failed",
          message: err.message
        }));
      }
    }
    return applied;
  };

  const poll = async () => {
    if (inFlight) {
      return;
    }
    if (guard.shouldSuspend()) {
      return;
    }
    inFlight = true;
    try {
      const headers = {};
      if (offset > 0) {
        headers.Range = `bytes=${offset}-`;
      }
      const response = await fetch(messagePath, { cache: "no-store", headers });
      if (!response.ok) {
        if (response.status === 404) {
          missingCount += 1;
          if (missingCount >= 3 && typeof fallbackToState === "function") {
            fallbackToState();
          }
          return;
        }
        throw new Error(`message poll failed: ${response.status}`);
      }
      missingCount = 0;
      const text = await response.text();
      if (!text) {
        return;
      }
      let applied = 0;
      if (response.status === 206) {
        applied = applyChunk(text);
        offset += text.length;
      } else {
        if (offset > 0 && text.length < offset) {
          offset = 0;
          buffer = "";
          builder = createMessageStateBuilder({
            attachmentsEncoding: liveOptions?.attachmentsEncoding
          });
        }
        const slice = offset > 0 ? text.slice(offset) : text;
        applied = applyChunk(slice);
        offset = text.length;
      }
      if (applied > 0) {
        store.dispatch({ type: "reporter/stateReplaced", payload: builder.buildState() });
        store.dispatch(liveUpdateReceived({ timestamp: Date.now() }));
      }
    } catch (err) {
      console.warn(JSON.stringify({
        level: "warn",
        code: "live-message-poll-failed",
        message: err.message
      }));
    } finally {
      inFlight = false;
    }
  };

  poll();
  setInterval(poll, pollIntervalMs);
};
