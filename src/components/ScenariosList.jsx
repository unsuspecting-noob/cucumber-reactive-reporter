import { Grid } from "@mui/material";
import React from "react";
import ScenarioContainer from "./ScenarioContainer";
import {
  getAllScenariosForFeatureWithState,
} from "../store/scenarios";
import { useSelector } from "react-redux";

const ScenariosList = (props) => {
  const scenarios = useSelector((state) => getAllScenariosForFeatureWithState(state, props));
  let count = 0;

  return (
    <React.Fragment>
      <Grid container item direction="column" display="flex" spacing={1}>
        {scenarios.map((s) => (
          <div key={"sc_" + count++} style={{ width: "100%" }}>
            <Grid item container xs={12} justifyContent="center" alignItems="center">
              <ScenarioContainer id={s.id} featureTags={props.tags} />
            </Grid>
            <br />
          </div>
        ))}
      </Grid>
    </React.Fragment>
  );
};

export default ScenariosList;
