import '../overwriteStyles.css'

import { Autocomplete, TextField } from "@mui/material";
import { Button, ButtonGroup, Chip, Container, Divider, FormControlLabel, FormGroup, Grid, Paper, Stack, Switch, Toolbar, Tooltip } from "@mui/material";
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
import BookmarkBorderIcon from "@mui/icons-material/BookmarkBorder";
import DayJs from "dayjs";
import Duration from "dayjs/plugin/duration";
import { PieChart } from 'react-minimal-pie-chart';
import React from "react";
import TestSelectorButton
    from "./TestSelectorButton";
import {
    getScenariosForAListOfFeatures
} from "../store/scenarios";
import { getTotalDurationNanoSec } from "../store/steps";
import { styled } from '@mui/material/styles';

const TopBar = () => {
    const dispatch = useDispatch();
    let tagCount = 0;
    let metaCount = 0;
    let features;
    let helpTagList = [];
    let titleChipColor;

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

    const onTagHelpClick = () => {
        dispatch(displayTagsHelpButtonClicked());
    }

    const onMetadataClick = () => {
        dispatch(displayMetadataButtonClicked());
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

    //generate list of tags to use in the search help popup ("@" button)
    features.map(f => f.allTags).forEach(tagArr => tagArr.map(obj => obj.name).forEach(tag => helpTagList.includes(tag) ? true : helpTagList.push(tag)));

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
        <Toolbar disableGutters>
            <Container maxWidth="100%">
                {/* <Box mt={1}> */}

                <Grid container
                    direction="row"
                    justifyContent="center"
                    alignItems="center"
                    spacing={1}>
                    <Grid item xs={2.5}>
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
                                    label="filter by tags, ex.: @tag1 and not (@tag2 or @tag3)"
                                    InputProps={{
                                        ...params.InputProps,
                                        type: "search"
                                    }}
                                />} />
                        </Item>
                    </Grid>
                    <Grid item xs={1}>
                        <ButtonGroup
                            orientation="vertical">
                            <Button variant="outlined" color="secondary" onClick={onTagHelpClick} size="small" startIcon={<AlternateEmailIcon />}>tags</Button>
                            <Button variant="outlined" color="secondary" onClick={onMetadataClick} size="small" startIcon={<BookmarkBorderIcon />}>metadata</Button>
                        </ButtonGroup>
                    </Grid>
                    {/* Title, date and duration here */}
                    <Grid item xs={5} xl={5}>
                        <Stack direction="column">
                            {settings.title ? (
                                <Divider variant="fullWidth" color={titleChipColor}><Chip label={`${settings.title}, ${duration_str}`} variant="outlined" size="medium" color={titleChipColor} /></Divider>
                            ) : null}
                            {settings.description ? (
                                <div style={{
                                    margin: "10px",
                                    display: "flex",
                                    justifyContent: "center",
                                    alignItems: "center"
                                }}>{settings.description}</div>
                            ) : null}
                        </Stack>
                    </Grid>
                    <Grid item xs={1.5} xl={1.5} justifyContent="flex-end">
                        <TestSelectorButton />
                    </Grid>
                    <Grid item xs={1} justifyContent="flex-end">
                        <FormGroup>
                            <FormControlLabel control={<Switch size="small" checked={themeName === "dark"} onChange={handleThemeChange} />} label="theme" />
                            <FormControlLabel control={<Tooltip title="Show or hide Before/After steps"><Switch size="small" checked={showExtraSteps === true} onChange={handleBoilerChange} /></Tooltip>} label="extra steps" />
                        </FormGroup>
                    </Grid>
                    <Grid item xs={1}>
                        <PieChart
                            data={[
                                { title: "Passed", value: numPassedScenarios, color: '#28a745' },
                                { title: "Skipped", value: numSkippedScenarios, color: '#ffc107' },
                                { title: "Failed", value: numFailedScenarios, color: '#dc3545' },
                            ]}
                            style={{ height: '4rem' }}
                        />
                    </Grid>
                    {displayMetadataState ? (
                        <Stack direction="column">
                            <Divider variant="fullWidth" sx={{
                                minWidth: "55vw",
                                maxWidth: "95vw"
                            }}>Metadata</Divider>

                            <Stack direction="column"
                                spacing={0}
                                alignItems="start"
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
                            <Stack direction="row"
                                spacing={1}
                                alignItems="center"
                                justifyContent="center"
                                divider={<Divider orientation="vertical" variant="middle" flexItem />}
                                sx={{ display: 'flex', flexWrap: 'wrap' }}
                            >
                                {helpTagList.sort().map((t) => (
                                    <div key={tagCount++}>{t}</div>
                                ))}
                            </Stack>
                        </Stack>
                    ) : <React.Fragment />
                    }
                </Grid>
                <Divider variant="middle" style={{ marginBottom: "-15px" }} ><Chip label={chip} variant="filled" style={{ fontSize: "1.1em" }} /></Divider>
            </Container >
        </Toolbar >
    );
};

export default TopBar;