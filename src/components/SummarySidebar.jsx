import { Box, Chip, Divider, IconButton, Stack, Typography } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import React from "react";
import { useSelector } from "react-redux";
import { getSettings } from "../store/uistates";
import { getTotalNumberOfFailedScenarios } from "../store/features";
import LiveSidebar from "./LiveSidebar";
import FailureSummaryPanel from "./FailureSummaryPanel";

const SummarySidebar = ({ isLive, onScenarioClick, onClose }) => {
    const settings = useSelector((state) => getSettings(state));
    const metadata = settings?.metadata ?? {};
    const numFailed = useSelector((state) => getTotalNumberOfFailedScenarios(state));

    return (
        <Stack direction="column" spacing={0} sx={{ height: "100%" }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ px: 2, pt: 1.5, pb: 1 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 600, fontSize: "0.95rem" }}>
                    Summary
                </Typography>
                <IconButton size="small" onClick={onClose} sx={{ opacity: 0.6, "&:hover": { opacity: 1 } }}>
                    <CloseIcon fontSize="small" />
                </IconButton>
            </Stack>
            <Divider />

            <Box sx={{
                flex: 1, overflowY: "auto", overflowX: "hidden",
                scrollbarWidth: "thin",
                scrollbarColor: (theme) =>
                    theme.palette.mode === "dark"
                        ? "rgba(255,255,255,0.2) transparent"
                        : "rgba(0,0,0,0.2) transparent",
                "&::-webkit-scrollbar": { width: 6 },
                "&::-webkit-scrollbar-track": { background: "transparent" },
                "&::-webkit-scrollbar-thumb": {
                    background: (theme) =>
                        theme.palette.mode === "dark"
                            ? "rgba(255,255,255,0.2)"
                            : "rgba(0,0,0,0.2)",
                    borderRadius: 3,
                    "&:hover": {
                        background: (theme) =>
                            theme.palette.mode === "dark"
                                ? "rgba(255,255,255,0.35)"
                                : "rgba(0,0,0,0.35)",
                    }
                }
            }}>
                {isLive ? (
                    <React.Fragment>
                        <LiveSidebar />
                        <Divider />
                    </React.Fragment>
                ) : null}

                {numFailed > 0 ? (
                    <Box>
                        <Typography
                            variant="caption"
                            color="text.secondary"
                            sx={{ fontWeight: 600, px: 2, pt: 1.5, display: "block" }}
                        >
                            Failures ({numFailed})
                        </Typography>
                        <FailureSummaryPanel onScenarioClick={onScenarioClick} />
                        <Divider />
                    </Box>
                ) : null}

                <Box sx={{ px: 2, py: 1.5 }}>
                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, display: "block", mb: 0.5 }}>
                        Metadata
                    </Typography>
                    {Object.keys(metadata).length ? (
                        <Stack direction="column" spacing={0.5}>
                            {Object.keys(metadata).sort().map((key) => (
                                <Stack key={key} direction="row" spacing={1} alignItems="baseline">
                                    <Typography variant="caption" color="text.secondary" sx={{ flexShrink: 0 }}>
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
            </Box>
        </Stack>
    );
};

export default SummarySidebar;
