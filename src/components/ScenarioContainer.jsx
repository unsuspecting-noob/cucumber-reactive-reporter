import { Box, Card, CardActionArea, CardContent, CardHeader, Collapse, Stack, Typography } from "@mui/material";
import { blue, cyan, green, purple, red, yellow } from '@mui/material/colors';
import { getBoiler, getScenarioContainerCollapsed, getTheme, scenarioContainerClicked } from "../store/uistates";
import {
  getFailedStepsByScenarioId,
  getPassedStepsByScenarioId,
  getPassedStepsNoBoilerByScenarioId,
  getSkippedStepsByScenarioId,
} from "../store/steps";
import { useDispatch, useSelector } from "react-redux";

import React from "react";
import StepsList from "./StepsList";
import { commonBoxStyles } from "./FeatureContainer";
import {
  getScenarioById
} from "../store/scenarios";
import { styled } from '@mui/material/styles';
import { useTheme } from '@mui/styles';

const ScenarioContainer = (props) => {
  const dispatch = useDispatch();
  const featureTags = props.featureTags;
  const {
    id,
    name,
    tags
  } = useSelector((state) => getScenarioById(state, props)); //{id}
  let failedSteps = useSelector((state) => getFailedStepsByScenarioId(state, props));
  let skippedSteps = useSelector((state) => getSkippedStepsByScenarioId(state, props));
  let passedSteps = useSelector((state) => getPassedStepsByScenarioId(state, props));
  let passedStepsNoExtra = useSelector((state) => getPassedStepsNoBoilerByScenarioId(state, props));
  let showExtra = useSelector((state) => getBoiler(state));

  let theme = useTheme();
  let themeName = useSelector((state) => getTheme(state));


  let collapse = useSelector((state) => getScenarioContainerCollapsed(state, props));
  if (collapse === undefined) collapse = true; //dealing with the fact that our default state is not filled in since we track scenario ui state only after someone clicks it

  const handleClick = () => {
    dispatch(scenarioContainerClicked({ id: id }));
  };
  let nameColor = themeName === "dark" ? blue[300] : cyan[900];
  if (themeName === "dark") {
    if (failedSteps.length) nameColor = theme.palette.error.dark;
  } else if (themeName === "light") {
    if (failedSteps.length) nameColor = theme.palette.error.light;
  }

  let scenarioTagArr = tags.map((t) => t.name);
  let displayedTagsArr = featureTags.length ? scenarioTagArr.filter(x => !featureTags.includes(x)).sort() : scenarioTagArr.sort();

  const Item = styled(Card)(({ theme }) => ({
    ...theme.typography.body2,
    textAlign: 'center',
    color: theme.palette.text.secondary,
    minWidth: "100%",
    border: "2px solid",
    borderColor: theme.palette.divider,
    backgroundColor: themeName === "dark" ? null : '#d4d4d4'
  }));

  return (
    <React.Fragment>
      <Item elevation={3} sx={{ width: "95%", minHeight: "8vh" }}>
        <CardActionArea
          onClick={handleClick}>
          <CardHeader
            disableTypography={false}
            action={
              <Stack direction="column">
                <br />
                <Stack direction="row-reverse" spacing={0.5} marginRight="1vw" xs={1.6} justifyContent="middle" alignItems="end">
                  {failedSteps.length > 0 ? (<Box sx={{ ...commonBoxStyles, backgroundColor: red[700] }}>{failedSteps.length}</Box>) : null}
                  {skippedSteps.length > 0 ? (<Box sx={{ ...commonBoxStyles, backgroundColor: yellow[700] }}>{skippedSteps.length}</Box>) : null}
                  {passedStepsNoExtra.length > 0 ? (<Box sx={{ ...commonBoxStyles, backgroundColor: green[700] }}>{showExtra ? passedSteps.length : passedStepsNoExtra.length}</Box>
                  ) : null}
                </Stack>
              </Stack>
            }
            title={
              <Stack direction="column">
                <br />
                {name}
              </Stack>
            }
            titleTypographyProps={{ color: nameColor, marginLeft: "1vw", fontSize: "1.7vmin", textAlign: "left" }}
            subheader={
              <Stack direction="column" justifyContent="flex-start">
                <Typography variant="capture" align="left" style={{ marginLeft: "1vw", minHeight: "1vh", fontStyle: "italic", fontSize: "1.3vmin", fontWeight: "bold", color: purple[400] }}>{displayedTagsArr.join(" ")}</Typography>
              </Stack>
            }
          />

        </CardActionArea>
        <Collapse in={!collapse} timeout="auto" unmountOnExit>
          <CardContent>
            <React.Fragment>
              <StepsList id={id} themeName={themeName} />
            </React.Fragment>
          </CardContent>
        </Collapse>
      </Item>
    </React.Fragment >
  );
};

export default ScenarioContainer;
