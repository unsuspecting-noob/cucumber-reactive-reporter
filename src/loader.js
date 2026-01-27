import { liveUpdateReceived, loadDataFinished, settingsLoaded } from "./store/uistates";
import { createMessageStateBuilder } from "./parser/cucumberMessageAdapter.mjs";
import { createStreamingDecoder } from "./utils/ndjsonDecoder";
import { createNdjsonBuffer } from "./utils/ndjsonBuffer";

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
  let missingCount = 0;
  let builder = createMessageStateBuilder({
    attachmentsEncoding: liveOptions?.attachmentsEncoding
  });
  const decoder = createStreamingDecoder();
  const ndjsonBuffer = createNdjsonBuffer({
    onItem: (envelope) => builder.ingest(envelope),
    onError: (err) => {
      console.warn(JSON.stringify({
        level: "warn",
        code: "live-message-parse-failed",
        message: err.message
      }));
    }
  });

  const resetParser = () => {
    ndjsonBuffer.reset();
    builder = createMessageStateBuilder({
      attachmentsEncoding: liveOptions?.attachmentsEncoding
    });
    decoder.reset();
  };

  const dispatchLiveState = () => {
    store.dispatch({ type: "reporter/stateReplaced", payload: builder.buildState() });
    store.dispatch(liveUpdateReceived({ timestamp: Date.now() }));
  };

  const bootstrapMessageStream = async () => {
    const response = await fetch(messagePath, { cache: "no-store" });
    if (!response.ok) {
      if (response.status === 404) {
        return;
      }
      throw new Error(`message bootstrap failed: ${response.status}`);
    }
    const dispatchIntervalMs = Math.max(50, Number(liveOptions?.bootstrapDispatchMs) || 200);
    const chunkSize = Math.max(4096, Number(liveOptions?.bootstrapChunkBytes) || 262144);
    let lastDispatchAt = Date.now();
    let appliedSinceDispatch = 0;
    let bytesRead = 0;
    const reader = response.body && response.body.getReader ? response.body.getReader() : null;

    if (reader) {
      while (true) {
        const { value, done } = await reader.read();
        if (done) {
          break;
        }
        if (value) {
          bytesRead += value.byteLength;
          const decoded = decoder.decode(value);
          appliedSinceDispatch += ndjsonBuffer.push(decoded);
          const now = Date.now();
          if (appliedSinceDispatch > 0 && now - lastDispatchAt >= dispatchIntervalMs) {
            dispatchLiveState();
            appliedSinceDispatch = 0;
            lastDispatchAt = now;
          }
        }
      }
    } else {
      const bytes = await response.arrayBuffer();
      const total = bytes.byteLength;
      let start = 0;
      while (start < total) {
        const end = Math.min(start + chunkSize, total);
        const slice = bytes.slice(start, end);
        bytesRead += slice.byteLength;
        const decoded = decoder.decode(slice);
        appliedSinceDispatch += ndjsonBuffer.push(decoded);
        const now = Date.now();
        if (appliedSinceDispatch > 0 && now - lastDispatchAt >= dispatchIntervalMs) {
          dispatchLiveState();
          appliedSinceDispatch = 0;
          lastDispatchAt = now;
        }
        start = end;
      }
    }
    appliedSinceDispatch += ndjsonBuffer.push(decoder.flush());
    appliedSinceDispatch += ndjsonBuffer.flush();
    if (appliedSinceDispatch > 0) {
      dispatchLiveState();
    }
    offset = bytesRead;
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
      // Use byte lengths to keep Range offsets aligned with UTF-8 data.
      const bytes = await response.arrayBuffer();
      if (!bytes.byteLength) {
        return;
      }
      let applied = 0;
      if (response.status === 206) {
        const decoded = decoder.decode(bytes);
        applied = ndjsonBuffer.push(decoded);
        offset += bytes.byteLength;
      } else {
        if (offset > 0 && bytes.byteLength < offset) {
          offset = 0;
          resetParser();
        }
        const slice = offset > 0 ? bytes.slice(offset) : bytes;
        const decoded = decoder.decode(slice);
        applied = ndjsonBuffer.push(decoded);
        offset = bytes.byteLength;
      }
      if (applied > 0) {
        dispatchLiveState();
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

  (async () => {
    try {
      await bootstrapMessageStream();
    } catch (err) {
      console.warn(JSON.stringify({
        level: "warn",
        code: "live-message-bootstrap-failed",
        message: err.message
      }));
    }
    poll();
    setInterval(poll, pollIntervalMs);
  })();
};
