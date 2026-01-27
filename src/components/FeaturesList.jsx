import '../overwriteStyles.css'

import { Box, Grid, Stack } from "@mui/material";
import {
  FeaturesToggleValuesEnum,
  featureSelected,
  getFeaturesToggleValue,
  getLastEnteredSearchValue,
  getPaginatorInfo,
  getSelectedFeatureId,
  getSelectedScenarioId,
  getSplitPaneRatio,
  getTheme,
  scenarioSelected,
  setSplitPaneRatio,
  selectionCleared
} from "../store/uistates";
import {
  getAllFailedFeatures,
  getAllFeatures,
  getAllMatchingFeatureIds,
  getAllPassedFeatures,
  getAllSkippedFeatures,
  getFailedMatchingFeatureIds,
  getPassedMatchingFeatureIds,
  getSkippedMatchingFeatureIds
} from "../store/features";
import { useDispatch, useSelector } from "react-redux";

import FeatureContainer from "./FeatureContainer";
import React from "react";
import ScenarioStepsPanel from "./ScenarioStepsPanel";
import { getAllScenariosForFeatureWithState } from "../store/scenarios";
import useMediaQuery from '@mui/material/useMediaQuery';

const FEATURES_PER_PAGE = [50, 100, 30, 10];

const FeaturesList = () => {
  const dispatch = useDispatch();
  let features;
  let displayFeaturesToggleState = useSelector((state) => getFeaturesToggleValue(state));
  let filterVal = useSelector((state) => getLastEnteredSearchValue(state));
  let allFeatures = useSelector((state) => getAllFeatures(state));
  let failedFeatures = useSelector((state) => getAllFailedFeatures(state));
  let passedFeatures = useSelector((state) => getAllPassedFeatures(state));
  let skippedFeatures = useSelector((state) => getAllSkippedFeatures(state));
  let matchedFeatures_ALL = useSelector((state) => getAllMatchingFeatureIds(state));
  let matchedFeatures_PASSED = useSelector((state) => getPassedMatchingFeatureIds(state));
  let matchedFeatures_FAILED = useSelector((state) => getFailedMatchingFeatureIds(state));
  let matchedFeatures_SKIPPED = useSelector((state) => getSkippedMatchingFeatureIds(state));
  let themeName = useSelector((state) => getTheme(state));
  const selectedFeatureId = useSelector((state) => getSelectedFeatureId(state));
  const selectedScenarioId = useSelector((state) => getSelectedScenarioId(state));
  const splitPaneRatio = useSelector((state) => getSplitPaneRatio(state));
  const isDesktop = useMediaQuery("(min-width: 1200px)");
  const selectedScenarios = useSelector((state) =>
    getAllScenariosForFeatureWithState(state, { id: selectedFeatureId })
  );
  const splitMode = Boolean(selectedFeatureId);
  const splitContainerRef = React.useRef(null);
  const dragStateRef = React.useRef(null);
  const moveHandlerRef = React.useRef(null);
  const upHandlerRef = React.useRef(null);

  switch (displayFeaturesToggleState) {
    case FeaturesToggleValuesEnum.ALL:
      filterVal ? features = matchedFeatures_ALL : features = allFeatures
      break;
    case FeaturesToggleValuesEnum.FAILED:
      filterVal ? features = matchedFeatures_FAILED : features = failedFeatures
      break;
    case FeaturesToggleValuesEnum.PASSED:
      filterVal ? features = matchedFeatures_PASSED : features = passedFeatures
      break;
    case FeaturesToggleValuesEnum.SKIPPED:
      filterVal ? features = matchedFeatures_SKIPPED : features = skippedFeatures
      break;
    default:
      break;
  }

  const fakeprops = {
    id: "feature_paginator"
  }
  const pagenatorInfo = useSelector((state) => getPaginatorInfo(state, fakeprops));
  let { page = 1, pSize = FEATURES_PER_PAGE[0], pStart = 0, pEnd = FEATURES_PER_PAGE[0] } = pagenatorInfo ? pagenatorInfo : {};

  React.useEffect(() => {
    if (!selectedFeatureId) {
      return;
    }
    if (!selectedScenarios.length) {
      if (selectedScenarioId) {
        dispatch(scenarioSelected({ id: null }));
      }
      return;
    }
    const hasSelected = selectedScenarios.some((scenario) => scenario.id === selectedScenarioId);
    if (!hasSelected) {
      dispatch(scenarioSelected({ id: selectedScenarios[0].id }));
    }
  }, [dispatch, selectedFeatureId, selectedScenarioId, selectedScenarios]);

  const handleFeatureSelect = (id) => {
    if (selectedFeatureId === id) {
      dispatch(selectionCleared());
      return;
    }
    dispatch(featureSelected({ id }));
  };

  const handleScenarioSelect = (id) => {
    dispatch(scenarioSelected({ id }));
  };

  const handleSelectionClear = () => {
    dispatch(selectionCleared());
  };

  const handleDividerPointerDown = (event) => {
    if (!splitContainerRef.current) {
      return;
    }
    event.preventDefault();
    const rect = splitContainerRef.current.getBoundingClientRect();
    dragStateRef.current = {
      startX: event.clientX,
      width: rect.width,
      startRatio: splitPaneRatio
    };
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
    const handlePointerMove = (moveEvent) => {
      if (!dragStateRef.current) {
        return;
      }
      const { startX, width, startRatio } = dragStateRef.current;
      const delta = moveEvent.clientX - startX;
      const startPx = (startRatio / 100) * width;
      const nextRatio = ((startPx + delta) / width) * 100;
      dispatch(setSplitPaneRatio({ value: nextRatio }));
    };
    const handlePointerUp = () => {
      dragStateRef.current = null;
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
      if (moveHandlerRef.current) {
        window.removeEventListener("pointermove", moveHandlerRef.current);
        moveHandlerRef.current = null;
      }
      if (upHandlerRef.current) {
        window.removeEventListener("pointerup", upHandlerRef.current);
        window.removeEventListener("pointercancel", upHandlerRef.current);
        upHandlerRef.current = null;
      }
    };
    moveHandlerRef.current = handlePointerMove;
    upHandlerRef.current = handlePointerUp;
    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);
    window.addEventListener("pointercancel", handlePointerUp);
  };

  React.useEffect(() => {
    return () => {
      if (moveHandlerRef.current) {
        window.removeEventListener("pointermove", moveHandlerRef.current);
        moveHandlerRef.current = null;
      }
      if (upHandlerRef.current) {
        window.removeEventListener("pointerup", upHandlerRef.current);
        window.removeEventListener("pointercancel", upHandlerRef.current);
        upHandlerRef.current = null;
      }
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
  }, []);

  let totalPages = Math.ceil(features.length / pSize);
  /**
   * bug fix: if you filter to see all, and there is a failed scenario in some featureList on page2,
   * if you then change the filter to failed the paginator will remember that its on page2, but the filtered scenario list will have only a handful of failed
   * scenarios so nothing will be displayed. We need to check if recalculation is needed.
   */
  if (totalPages < page) {
    pStart = 0;
    pEnd = FEATURES_PER_PAGE[0];
    page = 1;
  }

  let displayedFeatures = features.slice(pStart, pEnd);
  const featureNodes = displayedFeatures.map((f) => (
    <Grid container key={f.id}>
      <FeatureContainer
        id={f.id}
        featureViewState={displayFeaturesToggleState}
        filter={filterVal}
        themeName={themeName}
        selectionMode={true}
        isSelected={selectedFeatureId === f.id}
        selectedScenarioId={selectedScenarioId}
        onSelectFeature={handleFeatureSelect}
        onScenarioSelected={handleScenarioSelect}
      />
    </Grid>
  ));
  return (
    <React.Fragment>
      <Box sx={{ px: 1, pb: 1, pt: 1 }}>
        <Stack direction="column">
          {splitMode ? (
            isDesktop ? (
              <Box
                ref={splitContainerRef}
                sx={{
                  display: "flex",
                  alignItems: "stretch",
                  gap: 0,
                  minWidth: 0
                }}
              >
                <Stack
                  direction="column"
                  spacing={1}
                  sx={{
                    minWidth: 0,
                    flexBasis: `${splitPaneRatio}%`,
                    flexGrow: 0,
                    flexShrink: 0,
                    pr: 1
                  }}
                >
                  {featureNodes}
                </Stack>
                <Box
                  role="separator"
                  aria-orientation="vertical"
                  aria-label="Resize panes"
                  onPointerDown={handleDividerPointerDown}
                  sx={{
                    width: 8,
                    mx: 0.5,
                    cursor: "col-resize",
                    borderRadius: 1,
                    backgroundColor: "divider",
                    "&:hover": {
                      backgroundColor: "text.secondary"
                    }
                  }}
                />
                <Box
                  sx={{
                    flex: 1,
                    minWidth: 0,
                    position: "sticky",
                    top: "var(--reporter-header-height, 96px)",
                    alignSelf: "start",
                    maxHeight: "calc(100vh - var(--reporter-header-height, 96px) - 16px)",
                    overflow: "auto",
                    overscrollBehavior: "contain",
                    pl: 1
                  }}
                >
                  <ScenarioStepsPanel
                    scenarioId={selectedScenarioId}
                    onClearSelection={handleSelectionClear}
                  />
                </Box>
              </Box>
            ) : (
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: "1fr",
                  gap: 1,
                  alignItems: "start"
                }}
              >
                <Stack direction="column" spacing={1} sx={{ minWidth: 0 }}>
                  {featureNodes}
                </Stack>
                <Box sx={{ minWidth: 0 }}>
                  <ScenarioStepsPanel
                    scenarioId={selectedScenarioId}
                    onClearSelection={handleSelectionClear}
                  />
                </Box>
              </Box>
            )
          ) : (
            <Stack direction="column" spacing={1}>
              {featureNodes}
            </Stack>
          )}
        </Stack>
      </Box>
    </React.Fragment >
  );
};

export default FeaturesList;
