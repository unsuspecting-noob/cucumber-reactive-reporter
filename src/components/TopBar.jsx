import '../overwriteStyles.css'

import { Autocomplete, TextField } from "@mui/material";
import { Box, Chip, Container, Divider, FormControlLabel, IconButton, Paper, Stack, Switch, Toolbar, Tooltip, Typography } from "@mui/material";
import {
    FeaturesToggleValuesEnum,
    displayMetadataButtonClicked,
    displayTagsHelpButtonClicked,
    filterByTags,
    getBoiler,
    getFeaturesToggleValue,
    getFilterHistory,
    getLastEnteredSearchValue,
    getMetadataDisplayButtonState,
    getSettings,
    getTagsDisplayButtonState,
    getTheme,
    toggleBoiler,
    toggleTheme
} from "../store/uistates";
import {
    getAllFailedFeatures,
    getAllFeatures,
    getAllMatchingFeatureIds,
    getAllPassedFeatures,
    getAllSkippedFeatures,
    getFailedMatchingFeatureIds,
    getPassedMatchingFeatureIds,
    getSkippedMatchingFeatureIds,
    getTotalNumberOfFailedScenarios,
    getTotalNumberOfPassedScenarios,
    getTotalNumberOfSkippedScenarios
} from "../store/features";
import { useDispatch, useSelector } from "react-redux";

import AlternateEmailIcon from "@mui/icons-material/AlternateEmail";
import BackspaceIcon from "@mui/icons-material/Backspace";
import BookmarkBorderIcon from "@mui/icons-material/BookmarkBorder";
import DarkModeIcon from "@mui/icons-material/DarkMode";
import LightModeIcon from "@mui/icons-material/LightMode";
import DayJs from "dayjs";
import Duration from "dayjs/plugin/duration";
import { PieChart } from 'react-minimal-pie-chart';
import React from "react";
import TestSelectorButton
    from "./TestSelectorButton";
import ViewSidebarIcon from "@mui/icons-material/ViewSidebar";
import {
    getScenariosForAListOfFeatures
} from "../store/scenarios";
import { getTotalDurationNanoSec } from "../store/steps";
import { styled } from '@mui/material/styles';

const TopBar = ({
    onToggleSummary,
    summaryOpen = false,
    paginationNode = null
}) => {
    const dispatch = useDispatch();
    let metaCount = 0;
    let features;
    const filterInputRef = React.useRef(null);
    const scrollFilterToEndRef = React.useRef(false);
    const [hoveredPieIndex, setHoveredPieIndex] = React.useState(null);

    let displayFeaturesToggleState = useSelector((state) => getFeaturesToggleValue(state));
    let totalTimeMsec = useSelector((state) => getTotalDurationNanoSec(state)) / 1000000;
    let displayTagHelpState = useSelector((state) => getTagsDisplayButtonState(state));
    let displayMetadataState = useSelector((state) => getMetadataDisplayButtonState(state));
    let filterVal = useSelector((state) => getLastEnteredSearchValue(state));
    let allFeatures = useSelector((state) => getAllFeatures(state));
    let failedFeatures = useSelector((state) => getAllFailedFeatures(state));
    let passedFeatures = useSelector((state) => getAllPassedFeatures(state));
    let skippedFeatures = useSelector((state) => getAllSkippedFeatures(state));
    let matchedFeatures_ALL = useSelector((state) => getAllMatchingFeatureIds(state));
    let matchedFeatures_PASSED = useSelector((state) => getPassedMatchingFeatureIds(state));
    let matchedFeatures_FAILED = useSelector((state) => getFailedMatchingFeatureIds(state));
    let matchedFeatures_SKIPPED = useSelector((state) => getSkippedMatchingFeatureIds(state));
    let showExtraSteps = useSelector((state) => getBoiler(state));
    let themeName = useSelector((state) => getTheme(state));
    let settings = useSelector((state) => getSettings(state));
    let numFailedScenarios = useSelector((state) =>
        getTotalNumberOfFailedScenarios(state)
    );
    let numPassedScenarios = useSelector((state) =>
        getTotalNumberOfPassedScenarios(state)
    );
    let numSkippedScenarios = useSelector((state) =>
        getTotalNumberOfSkippedScenarios(state)
    );

    switch (displayFeaturesToggleState) {
        case FeaturesToggleValuesEnum.ALL:
            filterVal ? features = matchedFeatures_ALL : features = allFeatures
            break;
        case FeaturesToggleValuesEnum.FAILED:
            filterVal ? features = matchedFeatures_FAILED : features = failedFeatures
            break;
        case FeaturesToggleValuesEnum.PASSED:
            filterVal ? features = matchedFeatures_PASSED : features = passedFeatures
            break;
        case FeaturesToggleValuesEnum.SKIPPED:
            filterVal ? features = matchedFeatures_SKIPPED : features = skippedFeatures
            break;
        default:
            break;
    }

    let numCurrentFeatures = features.length;
    let featureIdArr = features.map((f) => f.id);  //list of feature ids
    let numCurrentFailedFeatures = features.filter((f) => f.numFailedScenarios !== 0).length;
    let tempScenarios = useSelector((state) => getScenariosForAListOfFeatures(state, { list: featureIdArr }));
    let numCurrentScenarios;

    switch (displayFeaturesToggleState) {
        case FeaturesToggleValuesEnum.ALL:
            numCurrentScenarios = tempScenarios.length;
            break;
        case FeaturesToggleValuesEnum.FAILED:
            numCurrentScenarios = tempScenarios.reduce((previous, current) => {
                return previous + current.failedSteps
            }, 0);
            break;
        case FeaturesToggleValuesEnum.PASSED:
            numCurrentScenarios = tempScenarios.filter((s) => s.failedSteps === 0 && s.skippedSteps === 0).length;
            break;
        case FeaturesToggleValuesEnum.SKIPPED:
            numCurrentScenarios = tempScenarios.filter((s) => s.failedSteps === 0 && s.skippedSteps !== 0).length;
            break;
        default:
            break;
    }
    const options = useSelector((state) => getFilterHistory(state))

    const focusFilterInput = () => {
        if (filterInputRef.current) {
            filterInputRef.current.focus();
        }
    }

    const scrollFilterToEnd = () => {
        const input = filterInputRef.current;
        if (!input) {
            return;
        }
        const length = input.value.length;
        input.focus();
        if (typeof input.setSelectionRange === "function") {
            input.setSelectionRange(length, length);
        }
        input.scrollLeft = input.scrollWidth;
    }

    const onTagHelpClick = () => {
        dispatch(displayTagsHelpButtonClicked());
        focusFilterInput();
    }

    const onMetadataClick = () => {
        dispatch(displayMetadataButtonClicked());
    }

    const appendTagToken = (currentValue, token) => {
        const trimmed = (currentValue ?? "").replace(/\s+$/, "");
        const lastChar = trimmed.slice(-1);
        const isOperator = token === "and" || token === "or" || token === "not";
        if (trimmed === "") {
            return token;
        }
        if (token === ")") {
            return `${trimmed})`;
        }
        if (token === "(") {
            return lastChar === "(" ? `${trimmed}(` : `${trimmed} (`;
        }
        if (isOperator) {
            return lastChar === "(" ? `${trimmed}${token}` : `${trimmed} ${token}`;
        }
        return lastChar === "(" ? `${trimmed}${token}` : `${trimmed} ${token}`;
    }

    const onTagTokenClick = (token) => {
        const nextValue = appendTagToken(filterVal, token);
        scrollFilterToEndRef.current = true;
        dispatch(filterByTags({ value: nextValue, label: nextValue, type: "clickTag" }))
        focusFilterInput();
    }

    const removeLastToken = (currentValue) => {
        const trimmed = (currentValue ?? "").replace(/\s+$/, "");
        if (trimmed === "") {
            return "";
        }
        const lastChar = trimmed.slice(-1);
        if (lastChar === "(" || lastChar === ")") {
            return trimmed.slice(0, -1).replace(/\s+$/, "");
        }
        const tokenMatch = trimmed.match(/(@[^\s()]+|and|or|not)$/);
        if (tokenMatch) {
            const token = tokenMatch[1];
            const tokenStart = trimmed.lastIndexOf(token);
            return trimmed.slice(0, tokenStart).replace(/\s+$/, "");
        }
        return trimmed.replace(/\S+$/, "").replace(/\s+$/, "");
    }

    const onDeleteLastTokenClick = () => {
        const nextValue = removeLastToken(filterVal);
        scrollFilterToEndRef.current = true;
        dispatch(filterByTags({ value: nextValue, label: nextValue, type: "deleteTagToken" }))
        focusFilterInput();
    }

    const onChange = (e, val, reason) => {
        if (reason === 'clear') {
            console.log("onchange clear")
        }
        dispatch(filterByTags({ value: val, label: val, type: reason }))
    }

    const onInputChange = (e, val, reason) => {
        if (val === "") {
            dispatch(filterByTags({ value: val, label: val, type: reason }))
        }
    }

    const handleThemeChange = () => {
        dispatch(toggleTheme());
    }

    const handleBoilerChange = () => {
        dispatch(toggleBoiler());
    }

    React.useEffect(() => {
        if (!scrollFilterToEndRef.current) {
            return;
        }
        scrollFilterToEndRef.current = false;
        requestAnimationFrame(() => scrollFilterToEnd());
    }, [filterVal]);

    //generate list of tags to use in the search help popup ("@" button)
    const helpTagSet = new Set();
    features.forEach((feature) => {
        (feature.allTags ?? []).forEach((tag) => {
            if (tag?.name) {
                helpTagSet.add(tag.name);
            }
        });
    });
    const helpTagList = Array.from(helpTagSet).sort();
    const operatorTokens = ["(", ")", "and", "or", "not"];
    const helpTagTokens = helpTagList;

    //styles

    const Item = styled(Paper)(({ theme }) => (
        {
            ...theme.typography.body2,
            textAlign: 'center',
            color: theme.palette.text.secondary,
            minWidth: "100%"
        }));

    //figure out total run time
    DayJs.extend(Duration);
    let d = DayJs.duration(totalTimeMsec);
    let duration_str = "";
    let ds = d.days();
    let h = d.hours();
    let m = d.minutes();
    let s = d.seconds();
    if (ds > 0) duration_str = `${ds === 1 ? ds + " day" : ds + " days"}`;
    if (h > 0) duration_str = duration_str + `${h === 1 ? " " + h + " hour " : h + " hours "}`;
    if (m > 0) duration_str = duration_str + `${m === 1 ? (s === 0 ? " and " : " ") + m + " minute" : m + " minutes"}`;
    if (s > 0) duration_str = duration_str + `${s === 1 ? ((duration_str ? " and " : "") + s + " second") : ((duration_str ? " and " : "") + s + " seconds")}`;

    return (
        <Toolbar disableGutters sx={{ pt: 0, pb: 0, minHeight: "unset", alignItems: "stretch" }}>
            <Container maxWidth="100%" sx={{ px: { xs: 1.5, md: 2 } }}>
                <Stack direction="column" spacing={0}>
                    {/* === ROW 1: Title/description left | Stats + pie right === */}
                    <Box
                        sx={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            py: 0.5,
                            gap: 2,
                            minHeight: 40
                        }}
                    >
                        {/* Left: Title & description */}
                        <Stack direction="column" spacing={0} sx={{ minWidth: 0, flex: 1 }}>
                            {settings.title ? (
                                <Stack direction="row" alignItems="baseline" spacing={0.75} sx={{ minWidth: 0 }}>
                                    <Typography
                                        variant="subtitle1"
                                        sx={{
                                            fontWeight: 600,
                                            fontSize: "0.95rem",
                                            lineHeight: 1.3,
                                            whiteSpace: "nowrap",
                                            overflow: "hidden",
                                            textOverflow: "ellipsis"
                                        }}
                                    >
                                        {settings.title}
                                    </Typography>
                                    {settings.reporterVersion ? (
                                        <Typography
                                            variant="caption"
                                            sx={{
                                                fontSize: "0.6rem",
                                                opacity: 0.4,
                                                whiteSpace: "nowrap",
                                                flexShrink: 0,
                                                userSelect: "none"
                                            }}
                                        >
                                            v{settings.reporterVersion}
                                        </Typography>
                                    ) : null}
                                </Stack>
                            ) : null}
                            <Stack direction="row" spacing={1} alignItems="center" sx={{ minWidth: 0 }}>
                                {settings.description ? (
                                    <Typography
                                        variant="caption"
                                        sx={{
                                            opacity: 0.7,
                                            lineHeight: 1.2,
                                            whiteSpace: "nowrap",
                                            overflow: "hidden",
                                            textOverflow: "ellipsis"
                                        }}
                                    >
                                        {settings.description}
                                    </Typography>
                                ) : null}
                                {duration_str ? (
                                    <Chip
                                        label={duration_str}
                                        size="small"
                                        variant="outlined"
                                        sx={{
                                            height: 20,
                                            fontSize: "0.7rem",
                                            opacity: 0.8,
                                            flexShrink: 0,
                                            "& .MuiChip-label": { px: 1 }
                                        }}
                                    />
                                ) : null}
                            </Stack>
                        </Stack>

                        {/* Right: Stats summary + pie chart */}
                        <Stack direction="row" spacing={1.5} alignItems="center" sx={{ flexShrink: 0 }}>
                            {/* Summary counts */}
                            <Stack direction="column" spacing={0} alignItems="flex-end" sx={{ display: { xs: "none", md: "flex" } }}>
                                <Typography variant="caption" sx={{ lineHeight: 1.3, opacity: 0.7 }}>
                                    {numCurrentFeatures} {numCurrentFeatures === 1 ? "feature" : "features"} / {numCurrentScenarios} {numCurrentScenarios === 1 ? "scenario" : "scenarios"}
                                    {displayFeaturesToggleState === FeaturesToggleValuesEnum.ALL && numCurrentFailedFeatures > 0
                                        ? ` (${numCurrentFailedFeatures} failed)`
                                        : ""}
                                </Typography>
                                <Stack direction="row" spacing={0.75} alignItems="center">
                                    <StatDot color="#28a745" label={numPassedScenarios} />
                                    {numFailedScenarios > 0 ? (
                                        <Tooltip title="Show failure summary">
                                            <Box
                                                component="span"
                                                onClick={() => { if (typeof onToggleSummary === "function") onToggleSummary(); }}
                                                sx={{ cursor: "pointer", "&:hover": { opacity: 0.8 } }}
                                            >
                                                <StatDot color="#dc3545" label={numFailedScenarios} />
                                            </Box>
                                        </Tooltip>
                                    ) : null}
                                    {numSkippedScenarios > 0 ? <StatDot color="#ffc107" label={numSkippedScenarios} /> : null}
                                </Stack>
                            </Stack>
                            <Tooltip
                                placement="bottom"
                                arrow
                                title={
                                    hoveredPieIndex !== null
                                        ? (() => {
                                            const items = [
                                                { label: "Passed", value: numPassedScenarios, color: "#28a745" },
                                                { label: "Skipped", value: numSkippedScenarios, color: "#ffc107" },
                                                { label: "Failed", value: numFailedScenarios, color: "#dc3545" }
                                            ];
                                            const total = numPassedScenarios + numSkippedScenarios + numFailedScenarios;
                                            const item = items[hoveredPieIndex];
                                            const pct = total > 0 ? Math.round((item.value / total) * 100) : 0;
                                            return `${item.label}: ${item.value} (${pct}%)`;
                                        })()
                                        : ""
                                }
                                open={hoveredPieIndex !== null}
                                disableHoverListener
                                disableFocusListener
                                disableTouchListener
                                slotProps={{
                                    tooltip: {
                                        sx: {
                                            fontSize: "0.75rem",
                                            fontWeight: 600,
                                            py: 0.25,
                                            px: 1
                                        }
                                    }
                                }}
                            >
                                <Box
                                    sx={{
                                        width: 48,
                                        height: 48,
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        flexShrink: 0,
                                        position: "relative",
                                        cursor: "default"
                                    }}
                                    onMouseLeave={() => setHoveredPieIndex(null)}
                                >
                                    <PieChart
                                        data={[
                                            { title: "Passed", value: numPassedScenarios, color: '#28a745' },
                                            { title: "Skipped", value: numSkippedScenarios, color: '#ffc107' },
                                            { title: "Failed", value: numFailedScenarios, color: '#dc3545' },
                                        ]}
                                        style={{ height: 48, width: 48 }}
                                        lineWidth={28}
                                        startAngle={-90}
                                        animate
                                        segmentsShift={(index) => (index === hoveredPieIndex ? 2 : 0)}
                                        onMouseOver={(_, index) => setHoveredPieIndex(index)}
                                        onMouseOut={() => setHoveredPieIndex(null)}
                                    />
                                    <Box
                                        sx={{
                                            position: "absolute",
                                            inset: 0,
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            pointerEvents: "none"
                                        }}
                                    >
                                        <Typography
                                            sx={{
                                                fontSize: "0.55rem",
                                                fontWeight: 700,
                                                lineHeight: 1,
                                                color: "text.primary",
                                                opacity: hoveredPieIndex !== null ? 1 : 0.5,
                                                transition: "opacity 0.15s ease"
                                            }}
                                        >
                                            {hoveredPieIndex !== null
                                                ? [numPassedScenarios, numSkippedScenarios, numFailedScenarios][hoveredPieIndex]
                                                : (numPassedScenarios + numSkippedScenarios + numFailedScenarios)
                                            }
                                        </Typography>
                                    </Box>
                                </Box>
                            </Tooltip>
                        </Stack>
                    </Box>

                    {/* === ROW 2: Filter bar + controls | pagination (centered) | right controls === */}
                    <Box
                        sx={{
                            display: "grid",
                            gridTemplateColumns: "1fr auto 1fr",
                            alignItems: "center",
                            gap: 0.75,
                            pb: 0.5
                        }}
                    >
                        {/* Left: Filter input + icon buttons */}
                        <Stack direction="row" spacing={0.75} alignItems="center" sx={{ minWidth: 0 }}>
                            <Box sx={{ flex: "1 1 200px", minWidth: 140, maxWidth: 480 }}>
                                <Item elevation={2}>
                                    <Autocomplete
                                        freeSolo
                                        clearOnEscape
                                        autoComplete={false}
                                        autoSelect={true}
                                        fullWidth
                                        onChange={onChange}
                                        onInputChange={onInputChange}
                                        disableClearable
                                        placeholder="filter by tags"
                                        value={filterVal}
                                        options={options.map((opt) => opt.label)}
                                        renderInput={(params) => <TextField {...params}
                                            size="small"
                                            inputRef={filterInputRef}
                                            sx={{
                                                "& .MuiInputBase-root": {
                                                    backgroundColor: "background.paper",
                                                    height: 34
                                                },
                                                "& .MuiInputBase-input": {
                                                    paddingTop: "6px",
                                                    paddingBottom: "6px",
                                                    fontSize: "0.85rem"
                                                },
                                                "& .MuiFormLabel-root": {
                                                    fontSize: "0.78rem"
                                                }
                                            }}
                                            label="filter by tags, ex.: @tag1 and not (@tag2 or @tag3)"
                                            InputLabelProps={{
                                                ...params.InputLabelProps,
                                                shrink: true
                                            }}
                                            InputProps={{
                                                ...params.InputProps,
                                                type: "search"
                                            }}
                                        />} />
                                </Item>
                            </Box>
                            <Stack direction="row" spacing={0.25} sx={{ flexShrink: 0 }}>
                                <Tooltip title="Tags helper">
                                    <IconButton
                                        size="small"
                                        onClick={onTagHelpClick}
                                        color={displayTagHelpState ? "primary" : "inherit"}
                                        sx={{ opacity: displayTagHelpState ? 1 : 0.7 }}
                                    >
                                        <AlternateEmailIcon fontSize="small" />
                                    </IconButton>
                                </Tooltip>
                                <Tooltip title="Metadata">
                                    <IconButton
                                        size="small"
                                        onClick={onMetadataClick}
                                        color={displayMetadataState ? "primary" : "inherit"}
                                        sx={{ opacity: displayMetadataState ? 1 : 0.7 }}
                                    >
                                        <BookmarkBorderIcon fontSize="small" />
                                    </IconButton>
                                </Tooltip>
                                <Tooltip title="Summary">
                                    <IconButton
                                        size="small"
                                        onClick={onToggleSummary}
                                        color={summaryOpen ? "primary" : "inherit"}
                                        sx={{ opacity: summaryOpen ? 1 : 0.7 }}
                                    >
                                        <ViewSidebarIcon fontSize="small" />
                                    </IconButton>
                                </Tooltip>
                            </Stack>
                        </Stack>

                        {/* Center: Pagination */}
                        <Box sx={{ display: "flex", justifyContent: "center" }}>
                            {paginationNode ?? null}
                        </Box>

                        {/* Right: Show All, theme, hooks */}
                        <Stack direction="row" spacing={0.75} alignItems="center" justifyContent="flex-end" sx={{ flexShrink: 0 }}>
                            <Box sx={{ flexShrink: 0 }}>
                                <TestSelectorButton />
                            </Box>
                            <Divider orientation="vertical" flexItem sx={{ opacity: 0.3 }} />
                            <Tooltip title={`Switch to ${themeName === "dark" ? "light" : "dark"} theme`}>
                                <IconButton size="small" onClick={handleThemeChange} sx={{ opacity: 0.7 }}>
                                    {themeName === "dark" ? <LightModeIcon fontSize="small" /> : <DarkModeIcon fontSize="small" />}
                                </IconButton>
                            </Tooltip>
                            <Tooltip title="Show or hide Before/After steps">
                                <FormControlLabel
                                    control={<Switch size="small" checked={showExtraSteps === true} onChange={handleBoilerChange} />}
                                    label={<Typography variant="caption" sx={{ fontSize: "0.75rem", opacity: 0.8 }}>hooks</Typography>}
                                    sx={{ ml: 0, mr: 0 }}
                                />
                            </Tooltip>
                        </Stack>
                    </Box>

                    {/* === EXPANDABLE: Metadata panel === */}
                    {displayMetadataState ? (
                        <Box
                            sx={{
                                py: 1,
                                px: 2,
                                mb: 0.5,
                                borderRadius: 1,
                                border: "1px solid",
                                borderColor: "divider",
                                backgroundColor: "background.paper"
                            }}
                        >
                            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, mb: 0.5, display: "block" }}>
                                Metadata
                            </Typography>
                            <Stack
                                direction="row"
                                spacing={2}
                                sx={{ flexWrap: "wrap", gap: 0.5 }}
                            >
                                {settings.metadata ? Object.keys(settings.metadata).sort().map((k) => (
                                    <Chip
                                        key={metaCount++}
                                        label={`${k}: ${settings.metadata[k]}`}
                                        size="small"
                                        variant="outlined"
                                        sx={{ fontSize: "0.75rem" }}
                                    />
                                )) : null}
                            </Stack>
                        </Box>
                    ) : null}

                    {/* === EXPANDABLE: Tags help panel === */}
                    {displayTagHelpState ? (
                        <Box
                            sx={{
                                display: "flex",
                                flexDirection: "row",
                                alignItems: "stretch",
                                gap: 2,
                                px: 2,
                                py: 1,
                                mb: 0.5,
                                borderRadius: 1,
                                border: "1px solid",
                                borderColor: "divider",
                                backgroundColor: "background.paper"
                            }}
                        >
                            <Stack
                                direction="column"
                                spacing={0.5}
                                alignItems="center"
                                justifyContent="center"
                                sx={{ minWidth: 90 }}
                            >
                                <Chip
                                    icon={<BackspaceIcon />}
                                    label="Del"
                                    size="small"
                                    color="secondary"
                                    variant="outlined"
                                    onClick={onDeleteLastTokenClick}
                                    sx={{
                                        visibility: filterVal ? "visible" : "hidden",
                                        pointerEvents: filterVal ? "auto" : "none"
                                    }}
                                />
                                <Typography variant="caption" color="text.secondary" sx={{ fontSize: "0.7rem" }}>
                                    Operators
                                </Typography>
                                <Stack direction="row" spacing={0.5} sx={{ flexWrap: "wrap", justifyContent: "center" }}>
                                    {operatorTokens.map((t) => (
                                        <Chip
                                            key={`op-token-${t}`}
                                            label={t}
                                            size="small"
                                            color="secondary"
                                            variant="filled"
                                            onClick={() => onTagTokenClick(t)}
                                            sx={{ fontSize: "0.75rem" }}
                                        />
                                    ))}
                                </Stack>
                            </Stack>
                            <Divider orientation="vertical" flexItem />
                            <Stack
                                direction="row"
                                alignItems="center"
                                justifyContent="flex-start"
                                sx={{ display: "flex", flexWrap: "wrap", gap: 0.5, flex: 1 }}
                            >
                                {helpTagTokens.map((t) => (
                                    <Chip
                                        key={`tag-token-${t}`}
                                        label={t}
                                        size="small"
                                        color="default"
                                        variant="outlined"
                                        onClick={() => onTagTokenClick(t)}
                                        sx={{ fontSize: "0.75rem" }}
                                    />
                                ))}
                            </Stack>
                        </Box>
                    ) : null}
                </Stack>
            </Container >
        </Toolbar >
    );
};

/** Small colored dot + number for the stats legend */
const StatDot = ({ color, label }) => (
    <Stack direction="row" spacing={0.4} alignItems="center">
        <Box
            sx={{
                width: 8,
                height: 8,
                borderRadius: "50%",
                backgroundColor: color,
                flexShrink: 0
            }}
        />
        <Typography variant="caption" sx={{ fontSize: "0.78rem", fontWeight: 600, lineHeight: 1 }}>
            {label}
        </Typography>
    </Stack>
);

export default TopBar;
