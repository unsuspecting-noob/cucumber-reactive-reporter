import { Box, Divider, Grid, Paper, Stack, Typography } from "@mui/material";
import { FeaturesToggleValuesEnum, getFeaturesToggleValue } from "../store/uistates";
import React, { useState } from "react";
import { cyan, green, purple, red, yellow } from '@mui/material/colors';
import {
  getFeatureById,
  getNumberOfFailedScenariosByFeatureId,
  getNumberOfPassedScenariosByFeatureId,
  getNumberOfSkippedScenariosByFeatureId
} from "../store/features";

import ScenariosList from "./ScenariosList";
import { styled } from '@mui/material/styles';
import { useSelector } from "react-redux";

export const commonBoxStyles = {
  borderRadius: "3px",
  color: "white",
  maxHeight: "1.5rem",
  maxWidth: "1.5rem",
  minHeight: "1.5rem",
  minWidth: "1.5rem"
}
const FeatureContainer = (props) => {
  const {
    description,
    id,
    name,
    tags,
    uri,
    themeName
  } = useSelector((state) => getFeatureById(state, props));
  const [collapse, setCollapse] = useState(false); //store state locally, should think about moving it into redux store
  const handleFeatureClick = () => {
    collapse ? setCollapse(false) : setCollapse(true);
  };
  const st = useSelector((state) => getFeaturesToggleValue(state, props));
  let failedScenariosArr = useSelector((state) =>
    getNumberOfFailedScenariosByFeatureId(state, props));
  let passedScenariosArr = useSelector((state) =>
    getNumberOfPassedScenariosByFeatureId(state, props));
  let skippedScenariosArr = useSelector((state) =>
    getNumberOfSkippedScenariosByFeatureId(state, props));
  let passedScenarios = passedScenariosArr.length;
  let failedScenarios = failedScenariosArr.length;
  let skippedScenarios = skippedScenariosArr.length;
  switch (st) {
    case FeaturesToggleValuesEnum.ALL:
      break;
    case FeaturesToggleValuesEnum.PASSED:
      failedScenarios = 0;
      skippedScenarios = 0;
      break;
    case FeaturesToggleValuesEnum.FAILED:
      passedScenarios = 0;
      skippedScenarios = 0;
      break;
    case FeaturesToggleValuesEnum.SKIPPED:
      failedScenarios = 0;
      passedScenarios = 0;
      break;
    default:
      break
  }
  const Item = styled(Paper)(({ theme }) => ({
    ...theme.typography.body2,
    textAlign: 'center',
    color: theme.palette.text.secondary,
    minWidth: "100%"
  }));
  let tagArr = tags.map((t) => t.name);

  return (
    <Item elevation={collapse ? 10 : 2}>
      <Box sx={{ minHeight: "8vh", maxHeight: "12vh", minWidth: "100%" }} borderRadius="50%">
        <Grid container item direction="row" alignItems="center" onClick={handleFeatureClick} wrap="nowrap">
          <Grid item xs={10.4}>
            <Stack direction="column" justifyContent="flex-start">
              <Typography variant="capture" align="left" style={{ marginLeft: "1vw", minHeight: "1vh", fontStyle: "italic", fontSize: "1.5vmin", fontWeight: "bold", color: purple[400] }}>{tagArr.join(" ")}</Typography>
              <Typography variant="capture" align="left" style={{ marginLeft: "1vw", minHeight: "1vh", fontStyle: "italic", fontSize: "1.5vmin", color: purple[200] }}>{uri}</Typography>
              <Divider orientation="horizontal" variant="middle" flexItem />
              <Typography variant="h6" color={themeName === "dark" ? cyan[600] : cyan[800]} align="left" style={{ marginLeft: "1vw", marginRight: "1vh" }}>{name}</Typography>
            </Stack>
          </Grid>
          <Grid item xs={1.6} justifyContent="middle">
            <Stack direction="row" spacing={0.5}>
              <Box justifyContent="center" alignItems="center"
                sx={{ ...commonBoxStyles, backgroundColor: green[700] }}>{passedScenarios}</Box>
              <Box justifyContent="center" alignItems="center"
                sx={{ ...commonBoxStyles, backgroundColor: red[700] }}>{failedScenarios}</Box>
              <Box justifyContent="center" alignItems="center"
                sx={{ ...commonBoxStyles, backgroundColor: yellow[700] }}>{skippedScenarios}</Box>
            </Stack>
          </Grid>
        </Grid>
      </Box>
      {collapse ? (
        <Stack direction="column" spacing={1} >
          <Typography variant="body1" align="left" marginLeft="1vw">{description}</Typography>
          <Divider orientation="horizontal" variant="middle" flexItem />
          <ScenariosList id={id} filter={props.filter} featureViewState={props.featureViewState} tags={tagArr} />
          <br />
        </Stack>
      ) : null}
    </Item >
  );
};

export default FeatureContainer;
