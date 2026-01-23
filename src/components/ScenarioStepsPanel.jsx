/**
 * Purpose: Display the selected scenario details and steps alongside the feature list.
 * Responsibilities:
 * - Render scenario metadata and status counts.
 * - Show steps for the active scenario.
 * Inputs/Outputs: Reads Redux state for scenario/feature; renders detail panel.
 * Invariants: Scenario id drives the right-side panel content.
 * See: /agents.md
 */

import { Box, Button, Chip, Divider, Paper, Stack, Typography } from "@mui/material";
import { useSelector } from "react-redux";
import { getFeatureById } from "../store/features";
import { getScenarioById } from "../store/scenarios";
import { getTheme } from "../store/uistates";
import StepsList from "./StepsList";

const ScenarioStepsPanel = ({ scenarioId, onClearSelection }) => {
  const themeName = useSelector((state) => getTheme(state));
  const scenario = useSelector((state) =>
    scenarioId ? getScenarioById(state, { id: scenarioId }) : null
  );
  const feature = useSelector((state) =>
    scenario?.featureId ? getFeatureById(state, { id: scenario.featureId }) : null
  );

  if (!scenario) {
    return (
      <Paper elevation={2} sx={{ padding: 2, minHeight: "50vh" }}>
        <Stack direction="column" spacing={2}>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Typography variant="h6">Scenario Details</Typography>
            {onClearSelection ? (
              <Button variant="outlined" size="small" onClick={onClearSelection}>
                Back to list
              </Button>
            ) : null}
          </Stack>
          <Typography variant="body2" color="text.secondary">
            Select a scenario to view step details.
          </Typography>
        </Stack>
      </Paper>
    );
  }

  const statusChips = [
    { label: `Passed ${scenario.passedSteps}`, color: "success" },
    { label: `Skipped ${scenario.skippedSteps}`, color: "warning" },
    { label: `Failed ${scenario.failedSteps}`, color: "error" }
  ];

  return (
    <Paper elevation={2} sx={{ padding: 2, minHeight: "50vh" }}>
      <Stack direction="column" spacing={2}>
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Box>
            <Typography variant="overline" color="text.secondary">
              Scenario
            </Typography>
            <Typography variant="h6">{scenario.name}</Typography>
            {feature ? (
              <Typography variant="caption" color="text.secondary">
                {feature.name} • {feature.uri}
              </Typography>
            ) : null}
          </Box>
          {onClearSelection ? (
            <Button variant="outlined" size="small" onClick={onClearSelection}>
              Back to list
            </Button>
          ) : null}
        </Stack>

        <Stack direction="row" spacing={1} flexWrap="wrap">
          {statusChips.map((chip) => (
            <Chip key={chip.label} size="small" color={chip.color} label={chip.label} />
          ))}
        </Stack>

        {scenario.tags?.length ? (
          <Stack direction="row" spacing={1} flexWrap="wrap">
            {scenario.tags.map((tag) => (
              <Chip key={tag.name} size="small" label={tag.name} />
            ))}
          </Stack>
        ) : null}

        <Divider />

        <Box>
          <StepsList id={scenario.id} themeName={themeName} />
        </Box>
      </Stack>
    </Paper>
  );
};

export default ScenarioStepsPanel;
