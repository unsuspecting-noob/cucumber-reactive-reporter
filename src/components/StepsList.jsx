import { Divider } from "@mui/material";
import React from "react";
import StepContainer from "./StepContainer";

const StepsList = (props) => {
  let count = 0;
  let stepNumber = 1;
  let steps = props.steps;


  return (
    <React.Fragment>
      <Divider orientation="horizontal" variant="middle" flexItem />
      {steps.map((s) => (
        <StepContainer
          key={count++}
          num={(s.keyword.toUpperCase().includes("BEFORE") || s.keyword.toUpperCase().includes("AFTER")) ? undefined : stepNumber++}
          step={s}
          themeName={props.themeName} />
      ))}
    </React.Fragment>
  );
};

export default StepsList;
