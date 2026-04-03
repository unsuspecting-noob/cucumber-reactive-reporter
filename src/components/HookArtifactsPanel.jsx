import { Box, Chip, Paper, Stack, Typography } from "@mui/material";

import AttachmentString from "./AttachmentString";
import AttachmentTable from "./AttachmentTable";
import Embedding from "./Embedding";
import React from "react";
import { green, orange, red, yellow } from "@mui/material/colors";

const normalizeKeyword = (value) => String(value ?? "").replace(/\s/g, "");

const getStatusAccent = (status) => {
  switch (status) {
    case "passed":
      return green[700];
    case "failed":
      return red[700];
    case "skipped":
      return yellow[700];
    default:
      return orange[700];
  }
};

const getChipColor = (status) => {
  switch (status) {
    case "passed":
      return "success";
    case "failed":
      return "error";
    case "skipped":
      return "warning";
    default:
      return "default";
  }
};

const HookArtifactsPanel = ({ steps, themeName, scenarioId }) => {
  if (!Array.isArray(steps) || !steps.length) {
    return null;
  }

  return (
    <Paper
      variant="outlined"
      sx={{
        mt: 1.5,
        px: 1.5,
        py: 1.25,
        backgroundColor: themeName === "dark" ? "rgba(255,255,255,0.02)" : "#fafafa"
      }}
    >
      <Stack spacing={1.5}>
        <Box sx={{ textAlign: "left" }}>
          <Typography variant="subtitle2">
            Hook artifacts
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Useful attachments and errors from hidden Before/After hooks.
          </Typography>
        </Box>
        {steps.map((step, stepIndex) => {
          const keyword = normalizeKeyword(step?.keyword);
          const displayName = String(step?.name ?? "").trim();
          const showName = displayName && displayName !== keyword && displayName !== `${keyword} hook`;
          const accentColor = getStatusAccent(step?.status);
          const sourceKeyBase = `${scenarioId}:hook-artifact:${stepIndex}:${keyword || "hook"}`;

          return (
            <Box
              key={sourceKeyBase}
              sx={{
                pt: stepIndex ? 1.5 : 0,
                borderTop: stepIndex ? 1 : 0,
                borderColor: "divider"
              }}
            >
              <Stack
                direction="row"
                justifyContent="space-between"
                alignItems="center"
                spacing={1}
                sx={{ mb: (step?.error_message || step?.args?.length || step?.embeddings?.length) ? 1 : 0 }}
              >
                <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
                  <Typography variant="body2" sx={{ fontWeight: 700, color: accentColor }}>
                    {keyword || "Hook"}
                  </Typography>
                  {showName ? (
                    <Typography variant="body2" color="text.secondary">
                      {displayName}
                    </Typography>
                  ) : null}
                </Stack>
                {step?.status ? (
                  <Chip
                    size="small"
                    variant="outlined"
                    color={getChipColor(step.status)}
                    label={step.status}
                  />
                ) : null}
              </Stack>

              {step?.args?.length ? (
                step.args.map((item, argIndex) => {
                  const argKey = `${sourceKeyBase}:arg:${argIndex}`;
                  if (item?.content) {
                    return (
                      <AttachmentString
                        key={argKey}
                        content={item.content}
                        themeName={themeName}
                        sourceKey={argKey}
                      />
                    );
                  }
                  if (item?.rows?.length) {
                    return (
                      <AttachmentTable
                        key={argKey}
                        content={item}
                        themeName={themeName}
                      />
                    );
                  }
                  return null;
                })
              ) : null}

              {step?.error_message ? (
                <AttachmentString
                  content={step.error_message}
                  bColor={accentColor}
                  themeName={themeName}
                  sourceKey={`${sourceKeyBase}:error`}
                />
              ) : null}

              {step?.embeddings?.length ? (
                <Embedding
                  content={step.embeddings}
                  themeName={themeName}
                  sourceKey={`${sourceKeyBase}:embeddings`}
                />
              ) : null}
            </Box>
          );
        })}
      </Stack>
    </Paper>
  );
};

export default React.memo(HookArtifactsPanel);
