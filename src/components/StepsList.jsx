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

const buildArgsSignature = (args) => {
  if (!Array.isArray(args)) {
    return "";
  }
  return args.map((item) => {
    if (item?.content) {
      return `c:${String(item.content)}`;
    }
    if (Array.isArray(item?.rows)) {
      const rows = item.rows.length;
      const cells = item.rows.reduce((sum, row) => sum + (row?.cells?.length ?? 0), 0);
      return `t:${rows}:${cells}`;
    }
    return "u";
  }).join("|");
};

const buildEmbeddingsSignature = (embeddings) => {
  if (!Array.isArray(embeddings)) {
    return "";
  }
  return embeddings.map((item) => {
    const type = item?.mime_type ?? item?.media?.type ?? "";
    const data = item?.data ?? item?.media ?? "";
    return `${type}:${String(data)}`;
  }).join("|");
};

const buildStepSignature = (step) => {
  if (!step) {
    return "";
  }
  return [
    step.keyword ?? "",
    step.name ?? "",
    step.status ?? "",
    step.duration ?? "",
    step.error_message ? "err" : "",
    buildArgsSignature(step.args),
    buildEmbeddingsSignature(step.embeddings),
    step.location ?? ""
  ].join("|");
};

const stepsEqual = (prevSteps, nextSteps) => {
  if (prevSteps === nextSteps) {
    return true;
  }
  if (!Array.isArray(prevSteps) || !Array.isArray(nextSteps)) {
    return false;
  }
  if (prevSteps.length !== nextSteps.length) {
    return false;
  }
  for (let i = 0; i < prevSteps.length; i += 1) {
    if (buildStepSignature(prevSteps[i]) !== buildStepSignature(nextSteps[i])) {
      return false;
    }
  }
  return true;
};

const StepsList = (props) => {
  const { id, themeName } = props;
  let stepNumber = 1;
  const showExtra = useSelector((state) => getBoiler(state));
  const steps = useSelector(
    (state) => showExtra
      ? getStepsByScenarioId(state, { id })
      : getStepsNoBoilerByScenarioId(state, { id }),
    stepsEqual
  );
  const [openMap, setOpenMap] = React.useState({});

  React.useEffect(() => {
    setOpenMap({});
  }, [id]);

  const getInitialOpen = (step) => {
    const word = String(step?.keyword ?? "").replace(/\s/g, "");
    return Boolean(step?.error_message || (word.toLowerCase() === "after" && step?.embeddings?.length));
  };

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
            {steps.map((s, index) => {
              const key = `${id}:${index}`;
              const isOpen = openMap[key];
              const open = typeof isOpen === "boolean" ? isOpen : getInitialOpen(s);
              return (
                <StepContainer
                  key={key}
                  stepKey={key}
                  num={(s.keyword.toUpperCase().includes("BEFORE") || s.keyword.toUpperCase().includes("AFTER")) ? undefined : stepNumber++}
                  step={s}
                  themeName={themeName}
                  open={open}
                  onToggle={(nextOpen) => setOpenMap((prev) => ({ ...prev, [key]: nextOpen }))}
                />
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>
    </React.Fragment>
  );
};

export default StepsList;
