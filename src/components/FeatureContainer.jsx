import { Badge, Box, Card, CardActionArea, CardContent, CardHeader, Collapse, Divider, Stack, Typography } from "@mui/material";
import { FeaturesToggleValuesEnum, getFeaturesToggleValue } from "../store/uistates";
import { cyan, green, purple, red, yellow } from '@mui/material/colors';
import {
  getFeatureById,
  getNumberOfFailedScenariosByFeatureId,
  getNumberOfPassedScenariosByFeatureId,
  getNumberOfSkippedScenariosByFeatureId
} from "../store/features";

import React from "react";
import ScenariosList from "./ScenariosList";
import { styled } from '@mui/material/styles';
import { useSelector } from "react-redux";

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

const FeatureContainer = (props) => {
  const {
    description,
    id,
    name,
    tags,
    uri,
    themeName
  } = useSelector((state) => getFeatureById(state, props));
  const [expanded, setExpanded] = React.useState(false);

  const handleExpandClick = () => {
    setExpanded(!expanded);
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

  const Item = styled(Card)(({ theme }) => ({
    ...theme.typography.body2,
    textAlign: 'center',
    color: theme.palette.text.secondary,
    minWidth: "100%",
    border: "2px solid",
    borderColor: theme.palette.divider
  }));
  let tagArr = tags.map((t) => t.name);

  return (
    <Item raised={expanded ? true : false} >
      <CardActionArea
        onClick={handleExpandClick}>
        <CardHeader
          disableTypography={false}
          action={
            <Badge>
              <Stack direction="row-reverse" spacing={0.5} marginRight="1vw" xs={1.6} justifyContent="middle" alignItems="end">
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
              {name}
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
              <Typography variant="capture" align="left" style={{ marginLeft: "1vw", minHeight: "1vh", fontStyle: "italic", fontSize: "1.3vmin", fontWeight: "bold", color: purple[400] }}>{tagArr.join(" ")}</Typography>
              <Typography variant="capture" align="left" style={{ marginLeft: "1vw", minHeight: "1vh", fontStyle: "italic", fontSize: "1.3vmin", color: purple[200] }}>{uri}</Typography>
            </Stack>
          }
        />
        {expanded ? <CardContent>
          <Typography variant="h6" align="left" marginLeft="1vw">{description}</Typography> </CardContent> : null}

      </CardActionArea>
      <Collapse in={expanded} timeout="auto" unmountOnExit>
        <CardContent>
          <Stack direction="column" spacing={1} >
            {/* <Divider orientation="horizontal" variant="middle" flexItem /> */}
            <ScenariosList id={id} filter={props.filter} featureViewState={props.featureViewState} tags={tagArr} />
          </Stack>
        </CardContent>
      </Collapse>
    </Item >
  );
};

export default FeatureContainer;
