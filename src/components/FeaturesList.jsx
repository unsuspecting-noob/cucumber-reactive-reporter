import '../overwriteStyles.css'

import { Box, Grid, Stack } from "@mui/material";
import {
  FeaturesToggleValuesEnum,
  getFeaturesToggleValue,
  getLastEnteredSearchValue,
  getTheme
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
import { getPaginatorInfo, paginatorChange } from "../store/uistates";
import { useDispatch, useSelector } from "react-redux";

import CustomPagination from "./CustomPagination";
import FeatureContainer from "./FeatureContainer";
import Masonry from 'react-masonry-css';
import React from "react";
import {
  getScenariosForAListOfFeatures
} from "../store/scenarios";

const FEATURES_PER_PAGE = [50, 100, 30, 10];

const FeaturesList = () => {
  const dispatch = useDispatch();
  let featureCount = 0;
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

  let featureIdArr = features.map((f) => f.id);  //list of feature ids
  let tempScenarios = useSelector((state) => getScenariosForAListOfFeatures(state, { list: featureIdArr }));
  let numCurrentScenarios;

  switch (displayFeaturesToggleState) {
    case FeaturesToggleValuesEnum.ALL:
      numCurrentScenarios = tempScenarios.length;
      break;
    case FeaturesToggleValuesEnum.FAILED:
      numCurrentScenarios = tempScenarios.reduce((previous, current) => {
        return previous + current.failedSteps
      }, 0);
      break;
    case FeaturesToggleValuesEnum.PASSED:
      numCurrentScenarios = tempScenarios.filter((s) => s.failedSteps === 0 && s.skippedSteps === 0).length;
      break;
    case FeaturesToggleValuesEnum.SKIPPED:
      numCurrentScenarios = tempScenarios.filter((s) => s.failedSteps === 0 && s.skippedSteps !== 0).length;
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
  const breakpointColumnsObj = {
    default: displayedFeatures.length <= 10 ? 1 : 2,
    1280: 1
  };
  return (
    <React.Fragment>
      <Box sx={{ p: 1, border: '2px' }}>
        <Stack direction="column">
          {(displayedFeatures.length >= 10 || features.length >= 10) ? (<CustomPagination page={page} searchVal={searchVal} pageSize={pSize} pageSizeArray={FEATURES_PER_PAGE} numItems={features.length} shape="rounded" size="small" boundaryCount={2} onChange={onPaginatorChange} />) : null}
          <Masonry breakpointCols={breakpointColumnsObj} className="my-masonry-grid" columnClassName="my-masonry-grid_column">
            {numCurrentScenarios ? displayedFeatures.map((f) => (
              <Grid container key={featureCount++}>
                <FeatureContainer id={f.id} featureViewState={displayFeaturesToggleState} filter={filterVal} themeName={themeName} />
              </Grid>
            )) : null}
          </Masonry>
        </Stack>
      </Box>
    </React.Fragment >
  );
};

export default FeaturesList;
