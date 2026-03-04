import { Box, InputBase } from "@mui/material";
import MenuItem from '@mui/material/MenuItem';
import Pagination from "@mui/material/Pagination";
import React from "react";
import Select from '@mui/material/Select';

let ITEMS_PER_PAGE = [3, 5, 10, 50];

const CustomPagination = (props) => {
    const {
        page,
        pageSize,
        onChange,
        boundaryCount,
        numItems,
        searchVal,
        fullWidth = false
    } = props;
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
        <Box
            sx={{
                display: 'flex',
                flexWrap: 'nowrap',
                m: 0,
                width: fullWidth ? "100%" : "auto",
                justifyContent: fullWidth ? "space-between" : "flex-start",
                alignItems: "center",
                gap: 0.5
            }}
            component="form"
            noValidate
            autoComplete="off"
        >
            <Select
                size="small"
                value={pageSize}
                onChange={pageSizeChanged}
                variant="standard"
                disableUnderline
                sx={{
                    fontSize: "0.8rem",
                    fontWeight: 500,
                    minWidth: 44,
                    height: 28,
                    "& .MuiSelect-select": {
                        py: 0,
                        pr: "20px !important",
                        pl: 0.75,
                        display: "flex",
                        alignItems: "center"
                    },
                    "& .MuiSvgIcon-root": {
                        fontSize: "1rem",
                        right: 0
                    }
                }}
                MenuProps={{
                    PaperProps: {
                        sx: { "& .MuiMenuItem-root": { fontSize: "0.8rem", minHeight: 32 } }
                    }
                }}
            >
                {ITEMS_PER_PAGE.map((item) => (
                    <MenuItem key={"menu_" + item} value={item}>{item}</MenuItem>
                ))}
            </Select>
            <Pagination
                page={page}
                count={totalPages}
                shape="rounded"
                size="small"
                boundaryCount={boundaryCount ? boundaryCount : 2}
                onChange={pageChanged}
                sx={{
                    "& .MuiPaginationItem-root": {
                        minWidth: 26,
                        height: 26,
                        fontSize: "0.75rem",
                        margin: "0 1px"
                    },
                    "& .MuiPaginationItem-root.Mui-selected": {
                        fontWeight: 700
                    }
                }}
            />
            <InputBase
                onChange={handleJumpToPage}
                onKeyUp={handleJumpToPageKeys}
                type="number"
                placeholder="pg#"
                defaultValue={searchVal ? searchVal : ""}
                inputProps={{ 'aria-label': 'jump to page' }}
                sx={{
                    width: 48,
                    height: 26,
                    fontSize: "0.75rem",
                    border: "1px solid",
                    borderColor: "divider",
                    borderRadius: "6px",
                    px: 0.75,
                    "& input": {
                        p: 0,
                        textAlign: "center",
                        "&::placeholder": {
                            opacity: 0.5,
                            fontSize: "0.7rem"
                        },
                        /* hide number spinners */
                        "&::-webkit-outer-spin-button, &::-webkit-inner-spin-button": {
                            WebkitAppearance: "none",
                            margin: 0
                        },
                        MozAppearance: "textfield"
                    }
                }}
            />
        </Box>
    );
};

export default CustomPagination;
