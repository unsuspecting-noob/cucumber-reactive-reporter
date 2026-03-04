import { Box, Card, CardActionArea, CardContent, CardHeader, Collapse, Stack, Tooltip, Typography } from "@mui/material";
import { FeaturesToggleValuesEnum, getFeaturesToggleValue, getLiveActiveFeatureId, getSettings, liveFeatureActivated } from "../store/uistates";
import { cyan, green, orange, purple, red, yellow } from '@mui/material/colors';
import {
  getFeatureById,
  getNumberOfFailedScenariosByFeatureId,
  getNumberOfPassedScenariosByFeatureId,
  getNumberOfSkippedScenariosByFeatureId
} from "../store/features";
import { getAllScenariosForFeature } from "../store/scenarios";

import LinkIcon from "@mui/icons-material/Link";
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

const StatusPill = ({ count, color }) => {
  if (!count) return null;
  return (
    <Box sx={{
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      minWidth: 24,
      height: 22,
      px: 0.75,
      borderRadius: "11px",
      fontSize: "0.75rem",
      fontWeight: 600,
      color: "#fff",
      backgroundColor: color,
      lineHeight: 1
    }}>
      {count}
    </Box>
  );
};

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
    border: "1px solid",
    borderColor: theme.palette.divider,
    borderRadius: 8,
    overflow: "hidden",
    transition: "box-shadow 0.15s ease, border-color 0.15s ease"
  }));

  const selectedAccent = selectionMode && isSelected && !featureIsActive;
  const activeAccent = featureIsActive;
  const [linkCopied, setLinkCopied] = React.useState(false);

  const handleCopyDeepLink = (e) => {
    e.stopPropagation();
    try {
      const url = new URL(window.location.href);
      url.searchParams.set("feature", id);
      if (props.selectedScenarioId) {
        url.searchParams.set("scenario", props.selectedScenarioId);
      } else {
        url.searchParams.delete("scenario");
      }
      navigator.clipboard.writeText(url.toString());
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 1500);
    } catch (err) {
      console.log("Failed to copy deep link:", err);
    }
  };

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
      raised={false}
      elevation={selectedAccent ? 3 : 1}
      className={featureIsPending ? "live-pending" : ""}
      sx={{
        position: "relative",
        ...(isLive ? null : { contentVisibility: "auto", containIntrinsicSize: "900px 240px" }),
        ...(activeAccent ? {
          borderColor: orange[400],
          boxShadow: `0 0 0 1px ${orange[200]}`
        } : null),
        ...(selectedAccent ? {
          borderColor: "primary.main",
          bgcolor: themeName === "dark" ? "rgba(144,202,249,0.06)" : "rgba(25,118,210,0.04)"
        } : null),
        "&::before": (selectedAccent || activeAccent) ? {
          content: '""',
          position: "absolute",
          left: 0,
          top: 0,
          bottom: 0,
          width: 4,
          borderRadius: "8px 0 0 8px",
          backgroundColor: activeAccent ? orange[500] : "primary.main",
          zIndex: 1
        } : {}
      }}
    >
      <CardActionArea
        onClick={handleExpandClick}>
        <CardHeader
          disableTypography={false}
          sx={{
            py: 0.75,
            px: 2,
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
            <Stack direction="row" spacing={0.5} alignItems="center" sx={{ pr: 0.5 }}>
              <Tooltip title={linkCopied ? "Copied!" : "Copy link"} arrow>
                <Box
                  component="span"
                  role="button"
                  tabIndex={0}
                  onClick={handleCopyDeepLink}
                  onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") handleCopyDeepLink(e); }}
                  sx={{
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: 28,
                    height: 28,
                    borderRadius: "50%",
                    cursor: "pointer",
                    opacity: 0,
                    transition: "opacity 0.15s ease, background-color 0.15s ease",
                    ".MuiCardActionArea-root:hover &": { opacity: 0.5 },
                    "&:hover": { opacity: "1 !important", backgroundColor: "action.hover" }
                  }}
                >
                  <LinkIcon sx={{ fontSize: "1rem" }} />
                </Box>
              </Tooltip>
              <StatusPill count={passedScenarios} color={green[700]} />
              <StatusPill count={skippedScenarios} color={yellow[700]} />
              <StatusPill count={failedScenarios} color={red[700]} />
            </Stack>
          }
          title={
            <Stack direction="row" alignItems="center" spacing={1}>
              <span>{name}</span>
              {featureIsActive ? <span className="live-running-indicator">...</span> : null}
            </Stack>
          }
          titleTypographyProps={{
            variant: "subtitle1",
            fontWeight: 600,
            color: themeName === "dark" ? cyan[400] : cyan[800],
            align: "left",
            sx: { lineHeight: 1.3 }
          }}
          subheader={
            <Stack direction="column" sx={{ mt: 0.25 }}>
              {taglinks.length > 0 && (
                <Typography component="div" align="left" sx={{
                  fontStyle: "italic",
                  fontSize: "0.7rem",
                  fontWeight: 600,
                  color: purple[400]
                }}>
                  <Stack direction="row" spacing={0.75} flexWrap="wrap">
                    {taglinks.map((tag) => (
                      tag.link
                        ? <a href={tag.link} key={tagkey++} style={{ color: "inherit" }}>{tag.name}</a>
                        : <span key={tagkey++}>{tag.name}</span>
                    ))}
                  </Stack>
                </Typography>
              )}
              <Typography component="div" align="left" sx={{
                fontStyle: "italic",
                fontSize: "0.65rem",
                color: "text.disabled",
                mt: 0.25
              }}>
                {uri}
              </Typography>
            </Stack>
          }
        />
        {effectiveExpanded ? <CardContent sx={{ pt: 0, pb: 0.5, px: 2 }}>
          <Typography
            variant="body2"
            align="left"
            color="text.secondary"
            sx={{ whiteSpace: "normal", overflowWrap: "anywhere" }}
          >
            {description}
          </Typography>
        </CardContent> : null}

      </CardActionArea>
      <Collapse in={effectiveExpanded} timeout="auto" unmountOnExit>
        <CardContent sx={{ pt: 1, px: 2 }}>
          <Stack direction="column" spacing={1}>
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
    </Item>
  );
};

export default FeatureContainer;
