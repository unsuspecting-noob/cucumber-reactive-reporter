import { loadDataFinished, settingsLoaded } from "./store/uistates";

export default async (store) => {
  let metadata;
  try {
    let mresponse = await fetch("_reporter_settings.json");
    metadata = await mresponse.json();
  } catch (err) {
    console.log("ERROR: ", err);
    //not sure
  }
  if (metadata) {
    store.dispatch(settingsLoaded(metadata))
  }
  store.dispatch(loadDataFinished());
};
