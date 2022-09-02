import '../overwriteStyles.css'

import { Box, Grid } from "@mui/material";
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

import FeatureContainer from "./FeatureContainer";
import Masonry from 'react-masonry-css';
import React from "react";
import {
  getScenariosForAListOfFeatures
} from "../store/scenarios";
import { useSelector } from "react-redux";

const FeaturesList = () => {
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

  const breakpointColumnsObj = {
    default: features.length <= 10 ? 1 : 2,
    1280: 1
  };
  return (
    <React.Fragment>
      <Box sx={{ p: 1, border: '2px' }}>
        <Masonry breakpointCols={breakpointColumnsObj} className="my-masonry-grid" columnClassName="my-masonry-grid_column">
          {numCurrentScenarios ? features.map((f) => (
            <Grid container key={featureCount++}>
              <FeatureContainer id={f.id} featureViewState={displayFeaturesToggleState} filter={filterVal} themeName={themeName} />
            </Grid>
          )) : null}
        </Masonry>
      </Box>
    </React.Fragment >
  );
};

export default FeaturesList;
