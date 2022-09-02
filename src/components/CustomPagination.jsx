import { Box } from "@mui/material";
import FormControl from '@mui/material/FormControl';
import InputAdornment from '@mui/material/InputAdornment';
import MenuItem from '@mui/material/MenuItem';
import OutlinedInput from '@mui/material/OutlinedInput';
import Pagination from "@mui/material/Pagination";
import React from "react";
import Select from '@mui/material/Select';

let ITEMS_PER_PAGE = [3, 5, 10, 50];

const CustomPagination = (props) => {
    const { page, pageSize, onChange, boundaryCount, size, shape, numItems, searchVal } = props;
    props.pageSizeArray ? ITEMS_PER_PAGE = props.pageSizeArray.slice() : ITEMS_PER_PAGE = [5, 10, 20, 1];
    let jumpVal = 0;

    const handleJumpToPage = (event) => {
        let val = event.target.value;
        if (val) {
            if (isNaN(val) === false) {
                let num = Number(val);
                if (num && num <= totalPages) jumpVal = num;
            }
        }
    }
    const handleJumpToPageKeys = (event) => {
        if (event.key === 'Enter') {
            if (jumpVal) pageChanged(event, jumpVal, jumpVal);
        }
    }

    let totalPages = Math.ceil(numItems / pageSize);

    const pageSizeChanged = (event) => {
        let pSize = event.target.value;
        if (pageSize !== pSize) {
            //reset to first page when size changes
            let p = 1;

            let pageEndIndex = p * pSize >= numItems ? numItems : p * pSize;
            let pageStartIndex = (p - 1) * pSize;
            if (pageStartIndex >= numItems) pageStartIndex = pageEndIndex - pSize;
            onChange(pageStartIndex, pageEndIndex, p, pSize, searchVal);
        }
    };

    const pageChanged = (event, p, searchVal) => {
        if (!searchVal) searchVal = props.searchVal;
        if (page !== p) {
            let pageEndIndex = p * pageSize >= numItems ? numItems : p * pageSize;
            let pageStartIndex = (p - 1) * pageSize;
            onChange(pageStartIndex, pageEndIndex, p, pageSize, searchVal);
        }
    }

    return (
        <React.Fragment>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', m: 1 }}
                component="form"
                noValidate
                autoComplete="off">
                <FormControl sx={{ minWidth: 80 }} size="small">
                    <Select
                        labelId="customPagination-select-helper-label"
                        id="customPagination-select-helper"
                        value={pageSize}
                        // label="page size"
                        onChange={pageSizeChanged}
                    >
                        {ITEMS_PER_PAGE.map((item) => {
                            return <MenuItem key={"menu_" + item} value={item}>{item}</MenuItem>
                        })}

                    </Select>

                </FormControl>
                <Pagination page={page} count={totalPages} shape={shape ? shape : "rounded"} size={size ? size : "small"} boundaryCount={boundaryCount ? boundaryCount : 2} onChange={pageChanged} />
                <FormControl sx={{ width: '15ch' }} variant="outlined" size="small">
                    <OutlinedInput
                        id="outlined-adornment-page"
                        onChange={handleJumpToPage}
                        onKeyUp={handleJumpToPageKeys}
                        type="number"
                        startAdornment={<InputAdornment position="start">page</InputAdornment>}
                        aria-describedby="outlined-weight-helper-text"
                        inputProps={{
                            'aria-label': 'page',
                        }}
                        defaultValue={searchVal ? searchVal : ""}
                    />
                </FormControl>
            </Box>
        </React.Fragment>
    );
};

export default CustomPagination;