import { Box, Card, CardActionArea, CardContent, CardHeader, Collapse, Stack, Typography } from "@mui/material";
import { blue, cyan, green, orange, purple, red, yellow } from '@mui/material/colors';
import { getBoiler, getScenarioContainerCollapsed, getSettings, getTheme, scenarioContainerClicked } from "../store/uistates";
import {
  getFailedStepsByScenarioId,
  getPassedStepsByScenarioId,
  getPassedStepsNoBoilerByScenarioId,
  getStepsByScenarioId,
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
  const selectionMode = Boolean(props.selectionMode);
  const isSelected = Boolean(props.isSelected);
  const onSelectScenario = props.onSelectScenario;
  const compact = selectionMode;
  const {
    id,
    name,
    tags
  } = useSelector((state) => getScenarioById(state, props)); //{id}
  let failedSteps = useSelector((state) => getFailedStepsByScenarioId(state, props));
  let skippedSteps = useSelector((state) => getSkippedStepsByScenarioId(state, props));
  let passedSteps = useSelector((state) => getPassedStepsByScenarioId(state, props));
  let passedStepsNoExtra = useSelector((state) => getPassedStepsNoBoilerByScenarioId(state, props));
  let allSteps = useSelector((state) => getStepsByScenarioId(state, props));
  let showExtra = useSelector((state) => getBoiler(state));

  let theme = useTheme();
  let themeName = useSelector((state) => getTheme(state));


  let collapse = useSelector((state) => getScenarioContainerCollapsed(state, props));
  if (collapse === undefined) collapse = true; //dealing with the fact that our default state is not filled in since we track scenario ui state only after someone clicks it
  const settings = useSelector((state) => getSettings(state, props));
  const isLive = Boolean(settings?.live?.enabled);
  const handleClick = () => {
    if (selectionMode) {
      if (typeof onSelectScenario === "function") {
        onSelectScenario(id);
      }
      return;
    }
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
    backgroundColor: themeName === "dark" ? null : (compact ? "#e6e2da" : "#d4d4d4")
  }));

  let taglinks = [];
  displayedTagsArr.forEach(element => {
    let e = {};
    e.name = element;
    taglinks.push(e);
  });
  if (settings.linkTags && settings.linkTags.length) {
    for (let rule of settings.linkTags) {
      let re = new RegExp(rule.pattern);
      //apply link to each matching tag
      if (taglinks.length) {
        for (let i in taglinks) {
          let matchedIndex = taglinks[i].name.search(re);
          if (matchedIndex !== -1) {
            taglinks[i].link = `${rule.link}${taglinks[i].name.substring(matchedIndex)}`;
          }
        }
      }
    }
    console.dir(taglinks, { depth: null });
  }
  let tagkey = 0;
  const hasAnyStatus = allSteps.some((step) => step && step.status);
  const hasMissingStatus = allSteps.some((step) => !step || !step.status);
  const scenarioIsPending = !hasAnyStatus;
  const scenarioIsRunning = hasAnyStatus && hasMissingStatus;

  return (
    <React.Fragment>
      <Item
        elevation={3}
        className={scenarioIsPending ? "live-pending" : ""}
        sx={{
          width: compact ? "100%" : "95%",
          minHeight: compact ? "56px" : "8vh",
          ...(isLive ? null : { contentVisibility: "auto", containIntrinsicSize: "900px 180px" }),
          ...(scenarioIsRunning ? { borderColor: orange[500], boxShadow: `0 0 0 2px ${orange[200]}` } : null),
          ...(selectionMode && isSelected && !scenarioIsRunning ? {
            borderColor: theme.palette.primary.main,
            boxShadow: `0 0 0 2px ${theme.palette.primary.light}`
          } : null)
        }}
      >
        <CardActionArea
          onClick={handleClick}
          sx={{
            minHeight: "inherit",
            display: "flex",
            alignItems: "stretch"
          }}>
          <CardHeader
            disableTypography={false}
            sx={{
              py: compact ? 0.5 : 1,
              alignItems: "center",
              width: "100%",
              flex: "1 1 auto",
              "& .MuiCardHeader-action": {
                alignSelf: "center",
                marginTop: 0,
                marginRight: 0
              },
              "& .MuiCardHeader-content": {
                overflow: "hidden",
                flex: "1 1 auto"
              }
            }}
            action={
              <Box sx={{ display: "flex", alignItems: "center", height: "100%", justifyContent: "flex-end", pr: compact ? 0.5 : 1 }}>
                <Stack direction="row-reverse" spacing={0.5} xs={1.6} justifyContent="middle" alignItems="center">
                  {failedSteps.length > 0 ? (<Box sx={{ ...commonBoxStyles, backgroundColor: red[700] }}>{failedSteps.length}</Box>) : null}
                  {skippedSteps.length > 0 ? (<Box sx={{ ...commonBoxStyles, backgroundColor: yellow[700] }}>{skippedSteps.length}</Box>) : null}
                  {passedStepsNoExtra.length > 0 ? (<Box sx={{ ...commonBoxStyles, backgroundColor: green[700] }}>{showExtra ? passedSteps.length : passedStepsNoExtra.length}</Box>
                  ) : null}
                </Stack>
              </Box>
            }
            title={
              <Stack direction="column">
                <Typography
                  variant="capture"
                  align="left"
                  style={{
                    minHeight: "1vh",
                    fontStyle: "italic",
                    fontSize: compact ? "0.65rem" : "1.3vmin",
                    fontWeight: "bold",
                    color: purple[400]
                  }}
                >
                  <Stack direction="row" spacing="10px">
                    {taglinks.map((tag) => (
                      tag.link ? <a href={tag.link} key={tagkey++}>{tag.name}</a> : <div key={tagkey++}>{tag.name}</div>)
                    )}
                  </Stack>
                </Typography>
                <Stack direction="row" alignItems="center" spacing={1}>
                  <span>{name}</span>
                  {scenarioIsRunning ? <span className="live-running-indicator">...</span> : null}
                </Stack>
              </Stack>
            }
            titleTypographyProps={{
              color: nameColor,
              marginLeft: "1vw",
              fontSize: compact ? "0.95rem" : "1.7vmin",
              textAlign: "left"
            }}
          />

        </CardActionArea>
        {selectionMode ? null : (
          <Collapse in={!collapse} timeout="auto" unmountOnExit>
            <CardContent>
              <React.Fragment>
                <StepsList id={id} themeName={themeName} />
              </React.Fragment>
            </CardContent>
          </Collapse>
        )}
      </Item>
    </React.Fragment >
  );
};

export default ScenarioContainer;
