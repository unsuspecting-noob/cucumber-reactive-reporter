/**
 * Purpose: Display live run status and metadata alongside the report list.
 * Responsibilities:
 * - Show live connection timing and active feature info.
 * - Surface report metadata when present.
 * Inputs/Outputs: Reads Redux state; renders sidebar UI.
 * Invariants: Live mode relies on settings.live in the store.
 * See: /agents.md
 */

import { Box, Chip, Divider, Paper, Stack, Typography } from "@mui/material";
import { useSelector } from "react-redux";
import { getLiveActiveFeatureId, getLiveStatus, getSettings } from "../store/uistates";

const formatTimestamp = (timestamp) => {
  if (!timestamp) {
    return "n/a";
  }
  try {
    return new Date(timestamp).toLocaleTimeString();
  } catch (err) {
    return "n/a";
  }
};

const formatAgeSeconds = (timestamp) => {
  if (!timestamp) {
    return null;
  }
  const delta = Date.now() - timestamp;
  if (!Number.isFinite(delta) || delta < 0) {
    return null;
  }
  return Math.round(delta / 1000);
};

const LiveSidebar = () => {
  const settings = useSelector((state) => getSettings(state));
  const liveStatus = useSelector((state) => getLiveStatus(state));
  const activeFeatureId = useSelector((state) => getLiveActiveFeatureId(state));
  const activeFeature = useSelector((state) =>
    activeFeatureId ? state.features.featuresMap[activeFeatureId] : null
  );
  const liveOptions = settings?.live ?? {};
  const metadata = settings?.metadata ?? {};
  const lastUpdateAt = liveStatus?.lastUpdateAt;
  const lastUpdateAge = formatAgeSeconds(lastUpdateAt);
  const pollIntervalMs = Number(liveOptions.pollIntervalMs) || 2000;
  const staleThresholdMs = pollIntervalMs * 3;
  const isStale = lastUpdateAt
    ? Date.now() - lastUpdateAt > staleThresholdMs
    : false;

  return (
    <Paper elevation={3} sx={{ padding: 2 }}>
      <Stack direction="column" spacing={2}>
        <Box>
          <Typography variant="overline" color="text.secondary">
            Live Status
          </Typography>
          <Stack direction="row" spacing={1} alignItems="center">
            <Chip
              size="small"
              color={isStale ? "warning" : "success"}
              label={isStale ? "stale" : "connected"}
            />
            <Typography variant="body2" color="text.secondary">
              {liveOptions.source ?? "state"} @ {pollIntervalMs}ms
            </Typography>
          </Stack>
          <Typography variant="body2" sx={{ marginTop: 1 }}>
            Last update: {formatTimestamp(lastUpdateAt)}
            {lastUpdateAge !== null ? ` (${lastUpdateAge}s ago)` : ""}
          </Typography>
        </Box>

        <Divider />

        <Box>
          <Typography variant="overline" color="text.secondary">
            Active Feature
          </Typography>
          {activeFeature ? (
            <Stack direction="column" spacing={0.5}>
              <Typography variant="subtitle2">{activeFeature.name}</Typography>
              <Typography variant="caption" color="text.secondary">
                {activeFeature.uri}
              </Typography>
            </Stack>
          ) : (
            <Typography variant="body2" color="text.secondary">
              Waiting for execution...
            </Typography>
          )}
        </Box>

        <Divider />

        <Box>
          <Typography variant="overline" color="text.secondary">
            Metadata
          </Typography>
          {Object.keys(metadata).length ? (
            <Stack direction="column" spacing={0.5}>
              {Object.keys(metadata)
                .sort()
                .map((key) => (
                  <Stack key={key} direction="row" spacing={1} alignItems="baseline">
                    <Typography variant="caption" color="text.secondary">
                      {key}
                    </Typography>
                    <Typography variant="caption">{metadata[key]}</Typography>
                  </Stack>
                ))}
            </Stack>
          ) : (
            <Typography variant="body2" color="text.secondary">
              No metadata provided.
            </Typography>
          )}
        </Box>
      </Stack>
    </Paper>
  );
};

export default LiveSidebar;
