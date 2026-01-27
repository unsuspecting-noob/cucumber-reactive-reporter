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
import { purple } from "@mui/material/colors";
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
      <Paper elevation={2} sx={{ padding: 2, minHeight: "50vh", position: "relative" }}>
        {onClearSelection ? (
          <Button
            variant="outlined"
            size="small"
            onClick={onClearSelection}
            sx={{ position: "absolute", top: 8, right: 8 }}
          >
            Close
          </Button>
        ) : null}
        <Stack direction="column" spacing={2}>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Typography variant="h6">Scenario Details</Typography>
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
    <Paper elevation={2} sx={{ padding: 2, minHeight: "50vh", position: "relative" }}>
      {onClearSelection ? (
        <Button
          variant="outlined"
          size="small"
          onClick={onClearSelection}
          sx={{ position: "absolute", top: 8, right: 8 }}
        >
          Close
        </Button>
      ) : null}
      <Stack direction="column" spacing={2}>
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Box>
            <Typography variant="overline" color="text.secondary">
              Scenario
            </Typography>
            {scenario.tags?.length ? (
              <Typography
                variant="capture"
                align="left"
                style={{
                  minHeight: "1vh",
                  fontStyle: "italic",
                  fontSize: "1.3vmin",
                  fontWeight: "bold",
                  color: purple[400]
                }}
              >
                <Stack direction="row" spacing="10px">
                  {scenario.tags.map((tag) => (
                    <div key={tag.name}>{tag.name}</div>
                  ))}
                </Stack>
              </Typography>
            ) : null}
            <Typography variant="h6">
              {scenario.name}
            </Typography>
            {feature ? (
              <Typography variant="body2" color="text.secondary" sx={{ fontSize: "1rem" }}>
                {feature.name}
              </Typography>
            ) : null}
          </Box>
        </Stack>

        <Stack direction="row" spacing={1} flexWrap="wrap">
          {statusChips.map((chip) => (
            <Chip key={chip.label} size="small" color={chip.color} label={chip.label} />
          ))}
        </Stack>

        <Divider />

        <Box>
          <StepsList id={scenario.id} themeName={themeName} />
        </Box>
      </Stack>
    </Paper>
  );
};

export default ScenarioStepsPanel;
