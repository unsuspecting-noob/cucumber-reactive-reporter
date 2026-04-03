import { Box, Card, CardActionArea, CardContent, CardHeader, Collapse, Stack, Tooltip, Typography } from "@mui/material";
import { getLiveActiveFeatureId, getSettings, liveFeatureActivated } from "../store/uistates";
import { cyan, green, orange, purple, red, yellow } from '@mui/material/colors';
import {
  getFeatureById
} from "../store/features";

import LinkIcon from "@mui/icons-material/Link";
import React from "react";
import FeatureDescription from "./FeatureDescription";
import ScenariosList from "./ScenariosList";
import {
  makeGetFeatureExecutionState,
  makeGetFeatureStatusCounts
} from "../store/reportSelectors.mjs";
import { styled } from '@mui/material/styles';
import { shallowEqual, useDispatch, useSelector } from "react-redux";

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

const FeatureCard = styled(Card)(({ theme }) => ({
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

const FeatureContainer = (props) => {
  const dispatch = useDispatch();
  const {
    description,
    id,
    name,
    tags,
    uri
  } = useSelector((state) => getFeatureById(state, props));
  const themeName = props.themeName;
  const [expanded, setExpanded] = React.useState(false);
  const selectionMode = Boolean(props.selectionMode);
  const isSelected = Boolean(props.isSelected);
  const effectiveExpanded = selectionMode ? isSelected : expanded;
  const onSelectFeature = props.onSelectFeature;
  const selectExecutionState = React.useMemo(makeGetFeatureExecutionState, []);
  const selectStatusCounts = React.useMemo(makeGetFeatureStatusCounts, []);

  const handleExpandClick = () => {
    if (selectionMode) {
      if (typeof onSelectFeature === "function") {
        onSelectFeature(id);
      }
      return;
    }
    setExpanded(!expanded);
  };

  const settings = useSelector((state) => getSettings(state, props));
  const isLive = Boolean(settings?.live?.enabled);
  const liveActiveFeatureId = useSelector((state) => getLiveActiveFeatureId(state));
  const {
    featureIsActive,
    featureIsPending,
    featureIsRunning
  } = useSelector((state) => selectExecutionState(state, { id }), shallowEqual);
  let {
    failedScenarios,
    passedScenarios,
    skippedScenarios
  } = useSelector((state) => selectStatusCounts(state, { id }), shallowEqual);

  React.useEffect(() => {
    if (!isLive || !featureIsRunning) {
      return;
    }
    if (liveActiveFeatureId === id) {
      return;
    }
    dispatch(liveFeatureActivated({ id }));
  }, [dispatch, featureIsRunning, id, isLive, liveActiveFeatureId]);

  const selectedAccent = selectionMode && isSelected && !featureIsActive;
  const activeAccent = featureIsActive;
  const [linkCopied, setLinkCopied] = React.useState(false);

  const handleCopyDeepLink = async (e) => {
    e.stopPropagation();
    try {
      const url = new URL(window.location.href);
      url.searchParams.set("feature", id);
      if (props.selectedScenarioId) {
        url.searchParams.set("scenario", props.selectedScenarioId);
      } else {
        url.searchParams.delete("scenario");
      }
      const text = url.toString();
      let copied = false;
      if (navigator.clipboard?.writeText) {
        try {
          await navigator.clipboard.writeText(text);
          copied = true;
        } catch (_) { /* permission denied, fall through */ }
      }
      if (!copied) {
        const ta = document.createElement("textarea");
        ta.value = text;
        ta.style.position = "fixed";
        ta.style.opacity = "0";
        document.body.appendChild(ta);
        ta.select();
        document.execCommand("copy");
        document.body.removeChild(ta);
      }
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 1500);
    } catch (err) {
      console.log("Failed to copy deep link:", err);
    }
  };

  const tagArr = React.useMemo(() => tags.map((tag) => tag.name), [tags]);
  const taglinks = React.useMemo(() => {
    const links = tags.map((tag) => ({
      line: tag.line,
      name: tag.name
    }));
    const rules = Array.isArray(settings.linkTags) ? settings.linkTags : [];
    if (!rules.length) {
      return links;
    }
    const compiledRules = rules.map((rule) => ({
      link: rule.link,
      re: new RegExp(rule.pattern)
    }));
    return links.map((tag) => {
      for (const rule of compiledRules) {
        const matchedIndex = tag.name.search(rule.re);
        if (matchedIndex !== -1) {
          return {
            ...tag,
            link: `${rule.link}${tag.name.substring(matchedIndex)}`
          };
        }
      }
      return tag;
    });
  }, [settings.linkTags, tags]);
  return (
    <FeatureCard
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
                        ? <a href={tag.link} key={tag.name} style={{ color: "inherit" }}>{tag.name}</a>
                        : <span key={tag.name}>{tag.name}</span>
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
        {effectiveExpanded && description ? <CardContent sx={{ pt: 0, pb: 0.5, px: 2 }}>
          <FeatureDescription description={description} themeName={themeName} />
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
    </FeatureCard>
  );
};

export default FeatureContainer;
