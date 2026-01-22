import { loadDataFinished, settingsLoaded } from "./store/uistates";

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
      startLivePolling(store, metadata.live);
    }
  }
  store.dispatch(loadDataFinished());
};

const startLivePolling = (store, liveOptions) => {
  const pollIntervalMs = Math.max(500, Number(liveOptions?.pollIntervalMs) || 2000);
  let inFlight = false;

  const poll = async () => {
    if (inFlight) {
      return;
    }
    inFlight = true;
    try {
      const response = await fetch("./_cucumber-results.json", { cache: "no-store" });
      const data = await response.json();
      store.dispatch({ type: "reporter/stateReplaced", payload: data });
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
