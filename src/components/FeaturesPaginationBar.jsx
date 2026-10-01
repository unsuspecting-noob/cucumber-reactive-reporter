/**
 * Purpose: Render the feature list paginator inside the sticky header.
 * Responsibilities:
 * - Read feature filters and paginator state from the store.
 * - Dispatch paginator changes for the feature list.
 * Inputs/Outputs: Consumes Redux state; renders CustomPagination.
 * Invariants: Uses the "feature_paginator" id for shared paging state.
 * See: /agents.md
 */

import React from "react";
import { useDispatch, useSelector } from "react-redux";

import {
    getPaginatorInfo,
    paginatorChange
} from "../store/uistates";
import { getVisibleFeatures } from "../store/reportSelectors.mjs";
import CustomPagination from "./CustomPagination";

const FEATURES_PER_PAGE = [50, 100, 30, 10];

const FeaturesPaginationBar = () => {
    const dispatch = useDispatch();
    const features = useSelector(getVisibleFeatures);

    const fakeprops = {
        id: "feature_paginator"
    };
    const pagenatorInfo = useSelector((state) => getPaginatorInfo(state, fakeprops));
    let {
        page = 1,
        pSize = FEATURES_PER_PAGE[0],
        pStart = 0,
        pEnd = FEATURES_PER_PAGE[0],
        searchVal = null
    } = pagenatorInfo ? pagenatorInfo : {};

    let totalPages = Math.ceil(features.length / pSize);
    if (totalPages < page) {
        pStart = 0;
        pEnd = FEATURES_PER_PAGE[0];
        page = 1;
    }

    const onPaginatorChange = (s, e, nextPage, size, nextSearchVal) => {
        dispatch(paginatorChange({
            id: fakeprops.id,
            page: nextPage,
            pStart: s,
            pEnd: e,
            pSize: size,
            searchVal: nextSearchVal
        }));
    };

    const displayedFeatures = features.slice(pStart, pEnd);
    const showPagination = displayedFeatures.length >= 10 || features.length >= 10;
    if (!showPagination) {
        return null;
    }

    return (
        <CustomPagination
            page={page}
            searchVal={searchVal}
            pageSize={pSize}
            pageSizeArray={FEATURES_PER_PAGE}
            numItems={features.length}
            shape="rounded"
            size="small"
            boundaryCount={2}
            onChange={onPaginatorChange}
            fullWidth={true}
        />
    );
};

export default FeaturesPaginationBar;
