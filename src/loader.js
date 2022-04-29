import { loadFeaturesFinished, loadFeaturesStarted, settingsLoaded } from "./store/uistates";

import { batch } from "react-redux";
import {
  featureAdded
} from "./store/features";
import { scenarioAdded } from "./store/scenarios";
import { stepAdded } from "./store/steps";

export default async (store) => {
  let data;
  let metadata;
  store.dispatch(loadFeaturesStarted());
  try {
    let response = await fetch("_cucumber-results.json");
    let mresponse = await fetch("_reporter_settings.json");
    data = await response.json();
    metadata = await mresponse.json();
  } catch (err) {
    console.log("ERROR: ", err);
    //not sure
  }
  if (metadata) {
    store.dispatch(settingsLoaded(metadata))
  }
  //parse
  let featureIndex = 0;
  for (let f of data) {
    //FEATURE
    //cucumber id field is not guaranteed to be unique for feature/scenario/step
    f.id = `${featureIndex++}_${f.id}`;

    store.dispatch(featureAdded(f));
    //SCENARIO
    if (f.elements && f.elements.length) {
      let sc_index = 0;
      for (let sc of f.elements) {
        //need to make scenario id unique as well
        sc_index++;
        let sc_id_arr = sc.id.split(";");
        sc_id_arr[0] = f.id;
        if (sc_id_arr.length) {
          sc_id_arr[1] = `${sc_index - 1}_${sc_id_arr[1]}`;
        }
        sc.id = sc_id_arr.join(";");
        //fire the action
        let sc_payload = {
          scenario: sc,
          featureId: f.id,
        };
        //batching up these actions so renders happen per scenario and not each time we add a step
        //TODO: change this if we ever do a cucumber event listener
        batch(() => {
          store.dispatch(scenarioAdded(sc_payload));
          //STEPS
          for (let st of sc.steps) {
            let st_payload = { scenarioId: sc.id, step: st };
            store.dispatch(stepAdded(st_payload));
          }
        });
      }
    }
  }
  store.dispatch(loadFeaturesFinished());
};
