import { Box, Grid, Paper, Stack } from "@mui/material";
import React, { useState } from "react";
import { blue, cyan, green, purple, red, yellow } from '@mui/material/colors';
import { getBoiler, getTheme } from "../store/uistates";
import {
  getFailedStepsByScenarioId,
  getPassedStepsByScenarioId,
  getPassedStepsNoBoilerByScenarioId,
  getSkippedStepsByScenarioId,
  getStepsByScenarioId,
  getStepsNoBoilerByScenarioId
} from "../store/steps";
import { makeStyles, useTheme } from '@mui/styles';

import StepsList from "./StepsList";
import { Typography } from "@mui/material";
import { commonBoxStyles } from "./FeatureContainer";
import {
  getScenarioById
} from "../store/scenarios";
import { useSelector } from "react-redux";

const ScenarioContainer = (props) => {
  const featureTags = props.featureTags;
  const {
    id,
    name,
    tags
  } = useSelector((state) => getScenarioById(state, props));
  let failedSteps = useSelector((state) => getFailedStepsByScenarioId(state, props));
  let skippedSteps = useSelector((state) => getSkippedStepsByScenarioId(state, props));
  let passedSteps = useSelector((state) => getPassedStepsByScenarioId(state, props));
  let passedStepsNoExtra = useSelector((state) => getPassedStepsNoBoilerByScenarioId(state, props));

  let allSteps = useSelector((state) => getStepsByScenarioId(state, props));
  let showExtra = useSelector((state) => getBoiler(state));
  let filteredSteps = useSelector((state) => getStepsNoBoilerByScenarioId(state, props));
  let steps = showExtra ? allSteps : filteredSteps;

  let theme = useTheme();
  let themeName = useSelector((state) => getTheme(state));


  const [collapse, setCollapse] = useState(false); //store state locally, should think about moving it into redux store
  const handleClick = () => {
    collapse ? setCollapse(false) : setCollapse(true);
  };
  let nameColor = themeName === "dark" ? blue[300] : cyan[900];
  if (themeName === "dark") {
    if (failedSteps.length) nameColor = theme.palette.error.dark;
  } else if (themeName === "light") {
    if (failedSteps.length) nameColor = theme.palette.error.light;
  }

  let scenarioTagArr = tags.map((t) => t.name);
  let displayedTagsArr = featureTags.length ? scenarioTagArr.filter(x => !featureTags.includes(x)) : scenarioTagArr;

  const useStyles = makeStyles({
    foo: {
      "color": "red"
    },


  });
  const classes = useStyles();

  return (
    <React.Fragment>
      <Paper elevation={3} sx={{ width: "95%", minHeight: "8vh" }}>
        <Stack direction="column" justifyContent="center" alignItems="center" spacing={0}>
          <Grid className={classes.foo} spacing={0} container item direction="row" onClick={handleClick} justifyContent="center" alignItems="center" sx={{ minHeight: "8vh", maxHeight: "8vh" }}>
            <Grid item xs={10.5} justifyContent="middle" alignItems="center" sx={{ padding: 0, minHeight: "8vh", maxHeight: "8vh" }}>
              <Stack direction="column" justifyContent="left" spacing={1}>
                <Typography variant="capture" align="left" style={{ marginLeft: "1vw", fontStyle: "italic", fontSize: "1.3vmin", fontWeight: "lighter", color: purple[300] }}>{displayedTagsArr.join(" ")}</Typography>
                <Typography variant="body1" color={nameColor} align="left" alignItems="flex-start" style={{ textIndent: "1vw", marginLeft: "1vw", fontSize: "1.7vmin", textAlign: "left", wordWrap: "break-word", wordBreak: "break-all" }}>{name}</Typography>
              </Stack>
            </Grid>
            <Grid item xs={1.5}>
              <Stack direction="row" spacing={0.5} justifyContent="middle">
                <Box justifyContent="center" alignItems="center"
                  sx={{ ...commonBoxStyles, backgroundColor: green[700] }}>{showExtra ? passedSteps.length : passedStepsNoExtra.length}</Box>
                <Box justifyContent="center" alignItems="center"
                  sx={{ ...commonBoxStyles, backgroundColor: red[700] }}>{failedSteps.length}</Box>
                <Box justifyContent="center" alignItems="center"
                  sx={{ ...commonBoxStyles, backgroundColor: yellow[700] }}>{skippedSteps.length}</Box>
              </Stack>
            </Grid>
          </Grid>
          {collapse ? (<React.Fragment><br /><StepsList id={id} steps={steps} themeName={themeName} /><br /></React.Fragment>) : null}
        </Stack>
      </Paper>
    </React.Fragment >
  );
};

export default ScenarioContainer;
