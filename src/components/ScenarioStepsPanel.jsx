/**
 * Purpose: Display the selected scenario details and steps alongside the feature list.
 * Responsibilities:
 * - Render scenario metadata and status counts.
 * - Show steps for the active scenario.
 * Inputs/Outputs: Reads Redux state for scenario/feature; renders detail panel.
 * Invariants: Scenario id drives the right-side panel content.
 * See: /agents.md
 */

import { Box, Button, Chip, Dialog, DialogContent, Divider, IconButton, Paper, Slide, Stack, Typography } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import FullscreenIcon from "@mui/icons-material/Fullscreen";
import { purple } from "@mui/material/colors";
import React from "react";
import { useSelector } from "react-redux";
import { getFeatureById } from "../store/features";
import { getScenarioById } from "../store/scenarios";
import { getTheme } from "../store/uistates";
import StepsList from "./StepsList";

const SlideUp = React.forwardRef(function SlideUp(props, ref) {
  return <Slide direction="up" ref={ref} {...props} />;
});

const ScenarioStepsPanel = ({ scenarioId, onClearSelection }) => {
  const themeName = useSelector((state) => getTheme(state));
  const scenario = useSelector((state) =>
    scenarioId ? getScenarioById(state, { id: scenarioId }) : null
  );
  const feature = useSelector((state) =>
    scenario?.featureId ? getFeatureById(state, { id: scenario.featureId }) : null
  );
  const [fullscreen, setFullscreen] = React.useState(false);

  if (!scenario) {
    return (
      <Paper elevation={2} sx={{ padding: 2, minHeight: "50vh", height: "100%", position: "relative", boxSizing: "border-box" }}>
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

  const scenarioHeader = (
    <>
      <Typography variant="overline" color="text.secondary">
        Scenario
      </Typography>
      {scenario.tags?.length ? (
        <Typography
          component="div"
          align="left"
          sx={{
            fontStyle: "italic",
            fontSize: "0.75rem",
            fontWeight: 600,
            color: purple[400]
          }}
        >
          <Stack direction="row" spacing={0.75} flexWrap="wrap">
            {scenario.tags.map((tag) => (
              <span key={tag.name}>{tag.name}</span>
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
    </>
  );

  const statusChipRow = (
    <Stack direction="row" spacing={1} flexWrap="wrap">
      {statusChips.map((chip) => (
        <Chip key={chip.label} size="small" color={chip.color} label={chip.label} />
      ))}
    </Stack>
  );

  return (
    <Paper elevation={2} sx={{ padding: 2, minHeight: "50vh", height: "100%", position: "relative", boxSizing: "border-box" }}>
      <Stack direction="row" spacing={0.5} sx={{ position: "absolute", top: 8, right: 8 }}>
        <IconButton
          size="small"
          onClick={() => setFullscreen(true)}
          title="Fullscreen"
          sx={{ opacity: 0.6, "&:hover": { opacity: 1 } }}
        >
          <FullscreenIcon fontSize="small" />
        </IconButton>
        {onClearSelection ? (
          <Button variant="outlined" size="small" onClick={onClearSelection}>
            Close
          </Button>
        ) : null}
      </Stack>
      <Stack direction="column" spacing={2}>
        <Box>{scenarioHeader}</Box>
        {statusChipRow}
        <Divider />
        <Box>
          <StepsList id={scenario.id} themeName={themeName} />
        </Box>
      </Stack>

      <Dialog
        fullScreen
        open={fullscreen}
        onClose={() => setFullscreen(false)}
        TransitionComponent={SlideUp}
      >
        <DialogContent sx={{ p: 0 }}>
          <Paper
            square
            elevation={0}
            sx={{
              minHeight: "100vh",
              px: { xs: 2, md: 6 },
              py: 3
            }}
          >
            <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 2 }}>
              <Box sx={{ flex: 1 }}>
                {scenarioHeader}
                <Box sx={{ mt: 1 }}>{statusChipRow}</Box>
              </Box>
              <IconButton
                onClick={() => setFullscreen(false)}
                title="Close fullscreen"
                sx={{ ml: 2 }}
              >
                <CloseIcon />
              </IconButton>
            </Stack>
            <Divider sx={{ mb: 2 }} />
            <StepsList id={scenario.id} themeName={themeName} />
          </Paper>
        </DialogContent>
      </Dialog>
    </Paper>
  );
};

export default ScenarioStepsPanel;
