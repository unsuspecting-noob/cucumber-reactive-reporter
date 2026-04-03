import { Box, Chip, Collapse, IconButton, Stack, Typography } from "@mui/material";
import { red, purple } from "@mui/material/colors";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import React from "react";
import { useSelector } from "react-redux";
import { makeGetFailureSummarySections } from "../store/reportSelectors.mjs";
import { getTheme } from "../store/uistates";

const FailureSummaryPanel = ({ onScenarioClick }) => {
    const themeName = useSelector((state) => getTheme(state));
    const selectFailureSummary = React.useMemo(makeGetFailureSummarySections, []);
    const failedFeatures = useSelector((state) => selectFailureSummary(state));
    const [expandedScenarios, setExpandedScenarios] = React.useState({});

    if (failedFeatures.length === 0) {
        return (
            <Box sx={{ px: 2, py: 1.5 }}>
                <Typography variant="body2" color="text.secondary">
                    No failures found.
                </Typography>
            </Box>
        );
    }

    const toggleScenario = (scenarioId) => {
        setExpandedScenarios((prev) => ({ ...prev, [scenarioId]: !prev[scenarioId] }));
    };

    const truncate = (str, len) => {
        if (!str) return "";
        const firstLine = str.split("\n")[0];
        return firstLine.length > len ? firstLine.slice(0, len) + "..." : firstLine;
    };

    return (
        <Box sx={{ px: 2, py: 1.5, maxHeight: "60vh", overflowY: "auto" }}>
            <Stack direction="column" spacing={1.5}>
                {failedFeatures.map(({ feature, scenarios }) => (
                    <Box key={feature.id}>
                        <Typography
                            variant="caption"
                            sx={{
                                fontWeight: 600,
                                fontSize: "0.7rem",
                                color: "text.secondary",
                                textTransform: "uppercase",
                                letterSpacing: "0.05em"
                            }}
                        >
                            {feature.name}
                        </Typography>
                        <Stack direction="column" spacing={0.5} sx={{ mt: 0.5 }}>
                            {scenarios.map(({ scenario, errorInfo }) => {
                                const isExpanded = Boolean(expandedScenarios[scenario.id]);
                                return (
                                    <Box
                                        key={scenario.id}
                                        sx={{
                                            borderRadius: 1,
                                            border: "1px solid",
                                            borderColor: "divider",
                                            borderLeft: `3px solid ${red[500]}`,
                                            overflow: "hidden",
                                            "&:hover": {
                                                borderColor: red[300],
                                                backgroundColor: themeName === "dark"
                                                    ? "rgba(244,67,54,0.04)"
                                                    : "rgba(244,67,54,0.02)"
                                            }
                                        }}
                                    >
                                        <Box
                                            sx={{
                                                display: "flex",
                                                alignItems: "center",
                                                px: 1.5,
                                                py: 0.75,
                                                cursor: "pointer",
                                                gap: 1
                                            }}
                                            onClick={() => {
                                                if (typeof onScenarioClick === "function") {
                                                    onScenarioClick(feature.id, scenario.id);
                                                }
                                            }}
                                        >
                                            <Box sx={{ flex: 1, minWidth: 0 }}>
                                                {scenario.tags?.length > 0 && (
                                                    <Typography
                                                        component="div"
                                                        sx={{
                                                            fontSize: "0.65rem",
                                                            fontStyle: "italic",
                                                            fontWeight: 600,
                                                            color: purple[400],
                                                            mb: 0.25
                                                        }}
                                                    >
                                                        {scenario.tags.map((t) => t.name).join(" ")}
                                                    </Typography>
                                                )}
                                                <Typography
                                                    variant="body2"
                                                    sx={{
                                                        fontWeight: 500,
                                                        fontSize: "0.82rem",
                                                        lineHeight: 1.3
                                                    }}
                                                >
                                                    {scenario.name}
                                                </Typography>
                                                {errorInfo && !isExpanded ? (
                                                    <Typography
                                                        variant="caption"
                                                        sx={{
                                                            color: red[themeName === "dark" ? 300 : 700],
                                                            fontSize: "0.7rem",
                                                            fontFamily: "monospace",
                                                            display: "block",
                                                            mt: 0.25,
                                                            overflow: "hidden",
                                                            textOverflow: "ellipsis",
                                                            whiteSpace: "nowrap"
                                                        }}
                                                    >
                                                        {truncate(errorInfo.error, 120)}
                                                    </Typography>
                                                ) : null}
                                            </Box>
                                            <Stack direction="row" spacing={0.5} alignItems="center" sx={{ flexShrink: 0 }}>
                                                <Chip
                                                    label={`${scenario.failedSteps} failed`}
                                                    size="small"
                                                    sx={{
                                                        height: 20,
                                                        fontSize: "0.68rem",
                                                        backgroundColor: red[themeName === "dark" ? 900 : 50],
                                                        color: red[themeName === "dark" ? 200 : 700],
                                                        fontWeight: 600
                                                    }}
                                                />
                                                {errorInfo ? (
                                                    <IconButton
                                                        size="small"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            toggleScenario(scenario.id);
                                                        }}
                                                        sx={{ p: 0.25 }}
                                                    >
                                                        {isExpanded
                                                            ? <ExpandLessIcon sx={{ fontSize: "1rem" }} />
                                                            : <ExpandMoreIcon sx={{ fontSize: "1rem" }} />}
                                                    </IconButton>
                                                ) : null}
                                            </Stack>
                                        </Box>
                                        {errorInfo ? (
                                            <Collapse in={isExpanded}>
                                                <Box
                                                    sx={{
                                                        px: 1.5,
                                                        pb: 1,
                                                        pt: 0.5,
                                                        borderTop: "1px solid",
                                                        borderColor: "divider"
                                                    }}
                                                >
                                                    <Typography
                                                        variant="caption"
                                                        sx={{
                                                            color: "text.secondary",
                                                            fontSize: "0.68rem",
                                                            mb: 0.5,
                                                            display: "block"
                                                        }}
                                                    >
                                                        {errorInfo.step.keyword?.trim()} {errorInfo.step.name}
                                                    </Typography>
                                                    <Box
                                                        sx={{
                                                            fontFamily: "monospace",
                                                            fontSize: "0.72rem",
                                                            color: red[themeName === "dark" ? 300 : 700],
                                                            whiteSpace: "pre-wrap",
                                                            wordBreak: "break-all",
                                                            maxHeight: 200,
                                                            overflowY: "auto",
                                                            p: 1,
                                                            borderRadius: 0.5,
                                                            backgroundColor: themeName === "dark"
                                                                ? "rgba(244,67,54,0.06)"
                                                                : "rgba(244,67,54,0.04)"
                                                        }}
                                                    >
                                                        {errorInfo.error}
                                                    </Box>
                                                </Box>
                                            </Collapse>
                                        ) : null}
                                    </Box>
                                );
                            })}
                        </Stack>
                    </Box>
                ))}
            </Stack>
        </Box>
    );
};

export default FailureSummaryPanel;
