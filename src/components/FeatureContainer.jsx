import { Badge, Box, Card, CardActionArea, CardContent, CardHeader, Collapse, Divider, Stack, Typography } from "@mui/material";
import { FeaturesToggleValuesEnum, getFeaturesToggleValue, getLiveActiveFeatureId, getSettings, liveFeatureActivated } from "../store/uistates";
import { cyan, green, orange, purple, red, yellow } from '@mui/material/colors';
import {
  getFeatureById,
  getNumberOfFailedScenariosByFeatureId,
  getNumberOfPassedScenariosByFeatureId,
  getNumberOfSkippedScenariosByFeatureId
} from "../store/features";
import { getAllScenariosForFeature } from "../store/scenarios";

import React from "react";
import ScenariosList from "./ScenariosList";
import { styled } from '@mui/material/styles';
import { useDispatch, useSelector } from "react-redux";

export const commonBoxStyles = {
  borderRadius: "3px",
  color: "white",
  maxHeight: "1.5rem",
  maxWidth: "3rem",
  minHeight: "1.5rem",
  minWidth: "1.5rem",
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
}

const resolveScenarioExecutionState = (steps) => {
  const list = Array.isArray(steps) ? steps : [];
  const hasAnyStatus = list.some((step) => step && step.status);
  if (!hasAnyStatus) {
    return "pending";
  }
  const hasMissingStatus = list.some((step) => !step || !step.status);
  return hasMissingStatus ? "running" : "complete";
};

const FeatureContainer = (props) => {
  const dispatch = useDispatch();
  const {
    description,
    id,
    name,
    tags,
    uri,
    themeName
  } = useSelector((state) => getFeatureById(state, props));
  const [expanded, setExpanded] = React.useState(false);
  const selectionMode = Boolean(props.selectionMode);
  const isSelected = Boolean(props.isSelected);
  const effectiveExpanded = selectionMode ? isSelected : expanded;
  const onSelectFeature = props.onSelectFeature;

  const handleExpandClick = () => {
    if (selectionMode) {
      if (typeof onSelectFeature === "function") {
        onSelectFeature(id);
      }
      return;
    }
    setExpanded(!expanded);
  };

  const st = useSelector((state) => getFeaturesToggleValue(state, props));
  const settings = useSelector((state) => getSettings(state, props));
  const scenarios = useSelector((state) => getAllScenariosForFeature(state, props));
  const stepsMap = useSelector((state) => state.steps.stepsMap);
  const isLive = Boolean(settings?.live?.enabled);
  const liveActiveFeatureId = useSelector((state) => getLiveActiveFeatureId(state));

  let failedScenariosArr = useSelector((state) =>
    getNumberOfFailedScenariosByFeatureId(state, props));
  let passedScenariosArr = useSelector((state) =>
    getNumberOfPassedScenariosByFeatureId(state, props));
  let skippedScenariosArr = useSelector((state) =>
    getNumberOfSkippedScenariosByFeatureId(state, props));
  let passedScenarios = passedScenariosArr.length;
  let failedScenarios = failedScenariosArr.length;
  let skippedScenarios = skippedScenariosArr.length;
  const scenarioStates = scenarios.map((scenario) =>
    resolveScenarioExecutionState(stepsMap[scenario.id]?.steps)
  );
  const featureIsRunning = scenarioStates.some((state) => state === "running");
  const featureIsPending = scenarioStates.length > 0 && scenarioStates.every((state) => state === "pending");
  const featureIsActive = isLive && (featureIsRunning || liveActiveFeatureId === id);

  React.useEffect(() => {
    if (!isLive || !featureIsRunning) {
      return;
    }
    if (liveActiveFeatureId === id) {
      return;
    }
    dispatch(liveFeatureActivated({ id }));
  }, [dispatch, featureIsRunning, id, isLive, liveActiveFeatureId]);

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

  const Item = styled(Card)(({ theme }) => ({
    ...theme.typography.body2,
    textAlign: 'center',
    color: theme.palette.text.secondary,
    minWidth: "100%",
    border: "2px solid",
    borderColor: theme.palette.divider
  }));
  //deal with purple tags in subheader, convert jira like ones to links
  let tagArr = tags.map((t) => t.name);
  let taglinks = [];
  tags.forEach(element => {
    let e = {};
    e.name = element.name;
    e.line = element.line;
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
  }
  let tagkey = 0;
  return (
    <Item
      raised={effectiveExpanded ? true : false}
      className={featureIsPending ? "live-pending" : ""}
      sx={{
        ...(isLive ? null : { contentVisibility: "auto", containIntrinsicSize: "900px 240px" }),
        ...(featureIsActive ? { borderColor: orange[500], boxShadow: `0 0 0 2px ${orange[200]}` } : null),
        ...(selectionMode && isSelected && !featureIsActive ? {
          borderColor: orange[300],
          boxShadow: `0 0 0 2px ${orange[100]}`
        } : null)
      }}
    >
      <CardActionArea
        onClick={handleExpandClick}>
        <CardHeader
          disableTypography={false}
          sx={{
            py: 0.5,
            alignItems: "center",
            "& .MuiCardHeader-action": {
              alignSelf: "center",
              marginTop: 0
            },
            "& .MuiCardHeader-content": {
              minWidth: 0
            }
          }}
          action={
            <Badge>
              <Stack direction="row-reverse" spacing={0.5} marginRight="1vw" xs={1.6} justifyContent="middle" alignItems="center">
                {failedScenarios > 0 ? (<Box justifyContent="center" alignItems="center"
                  sx={{ ...commonBoxStyles, backgroundColor: red[700] }}>{failedScenarios}</Box>) : null}
                {skippedScenarios > 0 ? (<Box justifyContent="center" alignItems="center"
                  sx={{ ...commonBoxStyles, backgroundColor: yellow[700] }}>{skippedScenarios}</Box>) : null}
                {passedScenarios > 0 ? (<Box justifyContent="center" alignItems="center"
                  sx={{ ...commonBoxStyles, backgroundColor: green[700] }}>{passedScenarios}</Box>) : null}
              </Stack>
            </Badge>}
          title={
            <Stack direction="column">
              <Stack direction="row" alignItems="center" spacing={1}>
                <span>{name}</span>
                {featureIsActive ? <span className="live-running-indicator">...</span> : null}
              </Stack>
              <Divider />
            </Stack>
          }
          titleTypographyProps={{
            marginLeft: "1vw",
            marginRight: "1vh",
            variant: "h5",
            color: themeName === "dark" ? cyan[600] : cyan[800],
            align: "left"
          }}
          subheader={
            <Stack direction="column" justifyContent="flex-start">
              <Typography variant="capture" align="left" style={{ marginLeft: "1vw", minHeight: "1vh", fontStyle: "italic", fontSize: "1.3vmin", fontWeight: "bold", color: purple[400] }}>
                <Stack direction="row" spacing="10px">
                  {taglinks.map((tag) => (
                    tag.link ? <a href={tag.link} key={tagkey++}>{tag.name}</a> : <div key={tagkey++}>{tag.name}</div>)
                  )}
                </Stack>
              </Typography>
              <Typography variant="capture" align="left" style={{ marginLeft: "1vw", minHeight: "1vh", fontStyle: "italic", fontSize: "1.3vmin", color: purple[200] }}>{uri}</Typography>
            </Stack>
          }
        />
        {effectiveExpanded ? <CardContent sx={{ pt: 1, pb: 0.5 }}>
          <Typography
            variant="h6"
            align="left"
            marginLeft="1vw"
            sx={{ whiteSpace: "normal", overflowWrap: "anywhere" }}
          >
            {description}
          </Typography>
        </CardContent> : null}

      </CardActionArea>
      <Collapse in={effectiveExpanded} timeout="auto" unmountOnExit>
        <CardContent sx={{ pt: 1 }}>
          <Stack direction="column" spacing={1} >
            {/* <Divider orientation="horizontal" variant="middle" flexItem /> */}
            <ScenariosList
              id={id}
              filter={props.filter}
              featureViewState={props.featureViewState}
              tags={tagArr}
              selectionMode={selectionMode}
              selectedScenarioId={props.selectedScenarioId}
              onScenarioSelected={props.onScenarioSelected}
            />
          </Stack>
        </CardContent>
      </Collapse>
    </Item >
  );
};

export default FeatureContainer;
