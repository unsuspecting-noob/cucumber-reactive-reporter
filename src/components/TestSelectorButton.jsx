import * as React from 'react';

import { FeaturesToggleValuesEnum, featuresToggleClicked, getFeaturesToggleValue } from "../store/uistates";
import { blue, green, red, yellow } from '@mui/material/colors';
import { useDispatch, useSelector } from "react-redux";

import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import Button from '@mui/material/Button';
import ButtonGroup from '@mui/material/ButtonGroup';
import ClickAwayListener from '@mui/material/ClickAwayListener';
import Grow from '@mui/material/Grow';
import MenuItem from '@mui/material/MenuItem';
import MenuList from '@mui/material/MenuList';
import Paper from '@mui/material/Paper';
import Popper from '@mui/material/Popper';

const selectColor = (index, hue) => {
    let color = null;
    let selection = Object.values(FeaturesToggleValuesEnum)[index];
    switch (selection) {
        case FeaturesToggleValuesEnum.ALL:
            color = blue[hue];
            break;
        case FeaturesToggleValuesEnum.FAILED:
            color = red[hue];
            break;
        case FeaturesToggleValuesEnum.PASSED:
            color = green[hue];
            break;
        case FeaturesToggleValuesEnum.SKIPPED:
            color = yellow[hue];
            break;
        default:
            break;
    }
    return color;
}

const TestSelectorButton = (props) => {
    const dispatch = useDispatch();
    const [open, setOpen] = React.useState(false);
    const anchorRef = React.useRef(null);

    const options = Object.values(FeaturesToggleValuesEnum);
    const displayFeaturesToggleState = useSelector((state) => getFeaturesToggleValue(state));
    let selectedIndex = Object.values(FeaturesToggleValuesEnum).indexOf(displayFeaturesToggleState);

    const handleClick = () => {
        console.info(`You clicked ${options[selectedIndex]}`);
    };

    const handleMenuItemClick = (event, index) => {
        setOpen(false);
        dispatch(featuresToggleClicked({ value: Object.values(FeaturesToggleValuesEnum)[index] }));
    };

    const handleToggle = () => {
        setOpen((prevOpen) => !prevOpen);
    };

    const handleClose = (event) => {
        if (anchorRef.current && anchorRef.current.contains(event.target)) {
            return;
        }
        setOpen(false);
    };

    return (
        <React.Fragment>
            <ButtonGroup variant="contained" ref={anchorRef} aria-label="split button">
                <Button onClick={handleClick} sx={{ backgroundColor: selectColor(selectedIndex, 700) }}>{options[selectedIndex] === 'All' ? 'Show All' : options[selectedIndex]}</Button>
                <Button
                    size="small"
                    aria-controls={open ? 'split-button-menu' : undefined}
                    aria-expanded={open ? 'true' : undefined}
                    aria-label="select merge strategy"
                    aria-haspopup="menu"
                    onClick={handleToggle}
                    sx={{ backgroundColor: selectColor(selectedIndex, 500) }}
                >
                    <ArrowDropDownIcon />
                </Button>
            </ButtonGroup>
            <Popper
                open={open}
                anchorEl={anchorRef.current}
                role={undefined}
                transition
                sx={{ zIndex: 1300 }}
            >
                {({ TransitionProps, placement }) => (
                    <Grow
                        {...TransitionProps}
                        style={{
                            transformOrigin:
                                placement === 'bottom' ? 'center top' : 'center bottom'
                        }}
                    >
                        <Paper >
                            <ClickAwayListener onClickAway={handleClose}>
                                <MenuList id="split-button-menu">
                                    {options.map((option, index) => (
                                        <MenuItem
                                            key={option}
                                            selected={index === selectedIndex}
                                            onClick={(event) => handleMenuItemClick(event, index)}
                                            sx={{ backgroundColor: selectColor(index, 700) }}
                                        >
                                            {'See ' + option}
                                        </MenuItem>
                                    ))}
                                </MenuList>
                            </ClickAwayListener>
                        </Paper>
                    </Grow>
                )}
            </Popper>
        </React.Fragment>
    );
}
export default TestSelectorButton;