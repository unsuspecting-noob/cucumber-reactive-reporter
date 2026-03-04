import { Box, Chip, Collapse, Divider, IconButton, Stack, Typography } from "@mui/material";
import { red, orange, purple } from "@mui/material/colors";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import React from "react";
import { useSelector } from "react-redux";
import { getAllFeatures } from "../store/features";
import { getTheme } from "../store/uistates";

const FailureSummaryPanel = ({ onScenarioClick }) => {
    const themeName = useSelector((state) => getTheme(state));
    const features = useSelector((state) => getAllFeatures(state));
    const scenariosMap = useSelector((state) => state.scenarios.scenariosMap);
    const stepsMap = useSelector((state) => state.steps.stepsMap);
    const [expandedScenarios, setExpandedScenarios] = React.useState({});

    const failedFeatures = [];
    for (const feature of features) {
        const failedScenarios = Object.values(scenariosMap).filter(
            (sc) => sc.id.startsWith(feature.id) && sc.failedSteps > 0
        );
        if (failedScenarios.length > 0) {
            failedFeatures.push({ feature, scenarios: failedScenarios });
        }
    }

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

    const getFirstError = (scenarioId) => {
        const stepData = stepsMap[scenarioId];
        if (!stepData?.steps) return null;
        for (const step of stepData.steps) {
            if (step.status === "failed" && step.error_message) {
                return { step, error: step.error_message };
            }
        }
        return null;
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
                            {scenarios.map((sc) => {
                                const errorInfo = getFirstError(sc.id);
                                const isExpanded = Boolean(expandedScenarios[sc.id]);
                                return (
                                    <Box
                                        key={sc.id}
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
                                                    onScenarioClick(feature.id, sc.id);
                                                }
                                            }}
                                        >
                                            <Box sx={{ flex: 1, minWidth: 0 }}>
                                                {sc.tags?.length > 0 && (
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
                                                        {sc.tags.map((t) => t.name).join(" ")}
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
                                                    {sc.name}
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
                                                    label={`${sc.failedSteps} failed`}
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
                                                            toggleScenario(sc.id);
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
