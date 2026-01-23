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
  getSettings,
  getTheme,
  paginatorChange,
  scenarioSelected,
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

import CustomPagination from "./CustomPagination";
import FeatureContainer from "./FeatureContainer";
import Masonry from 'react-masonry-css';
import React from "react";
import ScenarioStepsPanel from "./ScenarioStepsPanel";
import { getAllScenariosForFeatureWithState } from "../store/scenarios";

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
  let settings = useSelector((state) => getSettings(state));
  const isLive = Boolean(settings?.live?.enabled);
  const selectedFeatureId = useSelector((state) => getSelectedFeatureId(state));
  const selectedScenarioId = useSelector((state) => getSelectedScenarioId(state));
  const selectedScenarios = useSelector((state) =>
    getAllScenariosForFeatureWithState(state, { id: selectedFeatureId })
  );
  const splitMode = Boolean(selectedFeatureId);

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
  let { page = 1, pSize = FEATURES_PER_PAGE[0], pStart = 0, pEnd = FEATURES_PER_PAGE[0], searchVal = null } = pagenatorInfo ? pagenatorInfo : {};

  const onPaginatorChange = (s, e, page, size, searchVal) => {
    dispatch(paginatorChange({
      id: fakeprops.id,
      page: page,
      pStart: s,
      pEnd: e,
      pSize: size,
      searchVal: searchVal
    }));
  }

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
  const breakpointColumnsObj = React.useMemo(() => ({
    default: displayedFeatures.length <= 10 ? 1 : 2,
    1280: 1
  }), [displayedFeatures.length]);
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
      <Box sx={{ p: 1, border: '2px' }}>
        <Stack direction="column">
          {(displayedFeatures.length >= 10 || features.length >= 10) ? (<CustomPagination page={page} searchVal={searchVal} pageSize={pSize} pageSizeArray={FEATURES_PER_PAGE} numItems={features.length} shape="rounded" size="small" boundaryCount={2} onChange={onPaginatorChange} />) : null}
          {splitMode ? (
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "1fr", lg: "minmax(0, 1fr) minmax(0, 1fr)" },
                gap: 2,
                alignItems: "start"
              }}
            >
              <Stack direction="column" spacing={1}>
                {featureNodes}
              </Stack>
              <ScenarioStepsPanel
                scenarioId={selectedScenarioId}
                onClearSelection={handleSelectionClear}
              />
            </Box>
          ) : isLive ? (
            <Stack direction="column" spacing={1}>
              {featureNodes}
            </Stack>
          ) : (
            <Masonry breakpointCols={breakpointColumnsObj} className="my-masonry-grid" columnClassName="my-masonry-grid_column">
              {featureNodes}
            </Masonry>
          )}
        </Stack>
      </Box>
    </React.Fragment >
  );
};

export default FeaturesList;
