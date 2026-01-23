import { Paper, Table, TableBody, TableContainer } from "@mui/material";
import {
  getStepsByScenarioId,
  getStepsNoBoilerByScenarioId
} from "../store/steps";

import React from "react";
import StepContainer from "./StepContainer";
import { getBoiler } from "../store/uistates";
import { styled } from '@mui/material/styles';
import { useSelector } from "react-redux";

const StepsList = (props) => {
  const { id, themeName } = props;
  let stepNumber = 1;
  let allSteps = useSelector((state) => getStepsByScenarioId(state, { id }));
  let showExtra = useSelector((state) => getBoiler(state));
  let filteredSteps = useSelector((state) => getStepsNoBoilerByScenarioId(state, props));
  let steps = showExtra ? allSteps : filteredSteps;

  const Item = styled(Paper)(({ theme }) => ({
    ...theme.typography.body2,
    textAlign: 'center',
    color: theme.palette.text.secondary,
    minWidth: "100%",
    border: "2px solid",
    borderColor: theme.palette.divider,
    backgroundColor: themeName === "dark" ? null : '#e0e0e0'
  }));

  return (
    <React.Fragment>
      <TableContainer component={Item} size="small" sx={{ overflowX: "auto" }}>
        <Table aria-label="collapsible table">
          <TableBody>
            {steps.map((s, index) => (
              <StepContainer
                key={`${id}:${index}`}
                num={(s.keyword.toUpperCase().includes("BEFORE") || s.keyword.toUpperCase().includes("AFTER")) ? undefined : stepNumber++}
                step={s}
                themeName={themeName} />
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </React.Fragment>
  );
};

export default StepsList;
