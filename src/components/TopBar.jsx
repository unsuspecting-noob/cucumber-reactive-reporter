import '../overwriteStyles.css'

import { Autocomplete, TextField } from "@mui/material";
import { Box, Button, ButtonGroup, Chip, Container, Divider, FormControlLabel, FormGroup, Paper, Stack, Switch, Toolbar, Tooltip, Typography } from "@mui/material";
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
    onToggleLiveSidebar,
    liveSidebarOpen = false,
    showLiveSidebarToggle = false,
    paginationNode = null
}) => {
    const dispatch = useDispatch();
    let metaCount = 0;
    let features;
    let titleChipColor;
    const filterInputRef = React.useRef(null);
    const scrollFilterToEndRef = React.useRef(false);

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
            titleChipColor = "primary";
            break;
        case FeaturesToggleValuesEnum.FAILED:
            filterVal ? features = matchedFeatures_FAILED : features = failedFeatures
            titleChipColor = "error";
            break;
        case FeaturesToggleValuesEnum.PASSED:
            filterVal ? features = matchedFeatures_PASSED : features = passedFeatures
            titleChipColor = "success";
            break;
        case FeaturesToggleValuesEnum.SKIPPED:
            filterVal ? features = matchedFeatures_SKIPPED : features = skippedFeatures
            titleChipColor = "warning";
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

    //for the banner separating top bar and features
    const chip = `${numCurrentFeatures} ${numCurrentFeatures === 1 ? "Feature" : "Features"} and ${numCurrentScenarios} ${numCurrentScenarios === 1 ? "Scenario" : "Scenarios"}${displayFeaturesToggleState === FeaturesToggleValuesEnum.ALL ? ", " + numCurrentFailedFeatures + " failed features" : ""}`;
    return (
        <Toolbar disableGutters sx={{ pt: 0.2, pb: 0.2, minHeight: "unset", alignItems: "stretch" }}>
            <Container maxWidth="100%">
                {/* <Box mt={1}> */}

                <Stack direction="column" spacing={0.25}>
                    <Box
                        sx={{
                            display: "grid",
                            gridTemplateColumns: { xs: "1fr", lg: "minmax(0,1fr) auto minmax(0,1fr)" },
                            columnGap: 0.75,
                            rowGap: 0.4,
                            alignItems: "start"
                        }}
                    >
                        <Stack
                            direction="row"
                            spacing={1}
                            alignItems="flex-start"
                            justifyContent="flex-start"
                            sx={{
                                minWidth: 0,
                                mt: 0.6
                            }}
                        >
                            <Box sx={{ flex: "1 1 360px", minWidth: 180, maxWidth: 500 }}>
                                <Item elevation={3}>
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
                                                    backgroundColor: themeName === "light" ? "#e0dad0" : "background.paper"
                                                },
                                                "& .MuiInputBase-input": {
                                                    paddingTop: "9px",
                                                    paddingBottom: "9px"
                                                },
                                                "& .MuiFormLabel-root": {
                                                    fontSize: "0.82rem"
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
                            <ButtonGroup
                                orientation="vertical"
                                sx={{
                                    "& .MuiButton-root": {
                                        py: 0.35,
                                        minHeight: "30px"
                                    }
                                }}
                            >
                                <Button variant="outlined" color="secondary" onClick={onTagHelpClick} size="small" startIcon={<AlternateEmailIcon />}>tags</Button>
                                <Button variant="outlined" color="secondary" onClick={onMetadataClick} size="small" startIcon={<BookmarkBorderIcon />}>metadata</Button>
                                {showLiveSidebarToggle ? (
                                    <Button
                                        variant={liveSidebarOpen ? "contained" : "outlined"}
                                        color="secondary"
                                        onClick={onToggleLiveSidebar}
                                        size="small"
                                        startIcon={<ViewSidebarIcon />}
                                    >
                                        live
                                    </Button>
                                ) : null}
                            </ButtonGroup>
                        </Stack>

                        <Stack
                            direction="column"
                            spacing={0}
                            alignItems="center"
                            justifyContent="center"
                            sx={{
                                textAlign: "center",
                                mt: 0.1,
                                minWidth: { xs: 0, lg: 240 },
                                justifySelf: { xs: "start", lg: "center" }
                            }}
                        >
                            {settings.title ? (
                                <Chip label={`${settings.title}, ${duration_str}`} variant="outlined" size="small" color={titleChipColor} />
                            ) : null}
                            {settings.description ? (
                                <Box
                                    sx={{
                                        mt: 0.12,
                                        lineHeight: 1.1,
                                        display: "flex",
                                        justifyContent: "center",
                                        alignItems: "center"
                                    }}
                                >
                                    {settings.description}
                                </Box>
                            ) : null}
                        </Stack>

                        <Stack
                            direction="row"
                            spacing={0.75}
                            alignItems="center"
                            justifyContent="flex-end"
                            sx={{
                                minWidth: 0,
                                justifySelf: "end",
                                flexWrap: "wrap",
                                mt: 0.4
                            }}
                        >
                            <Box sx={{ flexShrink: 0 }}>
                                <TestSelectorButton />
                            </Box>
                            <FormGroup
                                sx={{
                                    "& .MuiFormControlLabel-root": {
                                        margin: 0,
                                        minHeight: "22px"
                                    },
                                    "& .MuiFormControlLabel-label": {
                                        fontSize: "0.95rem",
                                        lineHeight: 1
                                    }
                                }}
                            >
                                <FormControlLabel control={<Switch size="small" checked={themeName === "dark"} onChange={handleThemeChange} />} label="theme" />
                                <FormControlLabel control={<Tooltip title="Show or hide Before/After steps"><Switch size="small" checked={showExtraSteps === true} onChange={handleBoilerChange} /></Tooltip>} label="extra steps" />
                            </FormGroup>
                            <Box sx={{ width: "3.6rem", height: "3.6rem", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                                <PieChart
                                    data={[
                                        { title: "Passed", value: numPassedScenarios, color: '#28a745' },
                                        { title: "Skipped", value: numSkippedScenarios, color: '#ffc107' },
                                        { title: "Failed", value: numFailedScenarios, color: '#dc3545' },
                                    ]}
                                    style={{ height: '3.6rem', width: '3.6rem' }}
                                />
                            </Box>
                        </Stack>
                    </Box>

                    <Divider variant="middle" sx={{ mt: 0.05, mb: 0.1 }}>
                        <Chip label={chip} variant="filled" style={{ fontSize: "1em" }} />
                    </Divider>

                    {displayMetadataState ? (
                        <Stack direction="column">
                            <Divider variant="fullWidth" sx={{
                                minWidth: "55vw",
                                maxWidth: "95vw"
                            }}>Metadata</Divider>

                            <Stack direction="column"
                                spacing={0}
                                alignItems="flex-start"
                                justifyContent="center"
                                divider={<Divider orientation="horizontal" variant="fullWidth" flexItem />}
                                sx={{ display: 'flex', flexWrap: 'wrap' }}
                            >
                                {settings.metadata ? Object.keys(settings.metadata).sort().map((k) => (
                                    <div key={metaCount++}>
                                        {k}: {settings.metadata[k]}
                                    </div>
                                )) : <React.Fragment />}
                            </Stack>

                        </Stack>
                    ) : <React.Fragment />
                    }
                    {displayTagHelpState ? (
                        <Stack direction="column">
                            <Divider variant="fullWidth" sx={{
                                minWidth: "55vw",
                                maxWidth: "95vw"
                            }}>tags</Divider>
                            <Box
                                sx={{
                                    display: "flex",
                                    flexDirection: "row",
                                    alignItems: "stretch",
                                    gap: 2,
                                    mt: 1,
                                    px: 2,
                                    py: 1.5,
                                    borderRadius: 2,
                                    border: "1px solid",
                                    borderColor: "divider",
                                    backgroundColor: "background.paper",
                                    minWidth: "55vw",
                                    maxWidth: "95vw",
                                    width: "95vw",
                                    margin: "0 auto"
                                }}
                            >
                                <Stack
                                    direction="column"
                                    spacing={1}
                                    alignItems="center"
                                    justifyContent="center"
                                    sx={{ minWidth: 120 }}
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
                                    <Typography variant="caption" color="text.secondary">
                                        Operators
                                    </Typography>
                                    {operatorTokens.map((t) => (
                                        <Chip
                                            key={`op-token-${t}`}
                                            label={t}
                                            size="small"
                                            color="secondary"
                                            variant="filled"
                                            onClick={() => onTagTokenClick(t)}
                                        />
                                    ))}
                                </Stack>
                                <Divider orientation="vertical" flexItem />
                                <Stack
                                    direction="row"
                                    alignItems="center"
                                    justifyContent="center"
                                    sx={{ display: "flex", flexWrap: "wrap", gap: 1, flex: 1 }}
                                >
                                    {helpTagTokens.map((t) => (
                                        <Chip
                                            key={`tag-token-${t}`}
                                            label={t}
                                            size="small"
                                            color="default"
                                            variant="outlined"
                                            onClick={() => onTagTokenClick(t)}
                                        />
                                    ))}
                                </Stack>
                            </Box>
                        </Stack>
                    ) : <React.Fragment />
                    }
                </Stack>
                {paginationNode ? (
                    <React.Fragment>
                        <Box sx={{ pt: 0.2 }}>
                            {paginationNode}
                        </Box>
                        <Box sx={{ height: 8, backgroundColor: "transparent" }} />
                    </React.Fragment>
                ) : null}
            </Container >
        </Toolbar >
    );
};

export default TopBar;
