import { getPaginatorInfo, paginatorChange } from "../store/uistates";
import { useDispatch, useSelector } from "react-redux";

import CustomPagination from "./CustomPagination";
import { Grid } from "@mui/material";
import React from "react";
import ScenarioContainer from "./ScenarioContainer";
import {
  getAllScenariosForFeatureWithState,
} from "../store/scenarios";

const SCENARIOS_PER_PAGE = [5, 10, 20, 50, 100, 1];

const ScenariosList = (props) => {
  const { id, selectionMode, selectedScenarioId, onScenarioSelected } = props;
  const dispatch = useDispatch();
  const scenarios = useSelector((state) => getAllScenariosForFeatureWithState(state, props));
  const compact = Boolean(selectionMode);

  const pagenatorInfo = useSelector((state) => getPaginatorInfo(state, props));
  let { page = 1, pSize = SCENARIOS_PER_PAGE[0], pStart = 0, pEnd = SCENARIOS_PER_PAGE[0], searchVal = null } = pagenatorInfo ? pagenatorInfo : {};

  const onPaginatorChange = (s, e, page, size, searchVal) => {
    dispatch(paginatorChange({
      id: id,
      page: page,
      pStart: s,
      pEnd: e,
      pSize: size,
      searchVal: searchVal
    }));
  }

  let totalPages = Math.ceil(scenarios.length / pSize);
  /**
   * bug fix: if you filter to see all, and there is a failed scenario in some featureList on page2,
   * if you then change the filter to failed the paginator will remember that its on page2, but the filtered scenario list will have only a handful of failed
   * scenarios so nothing will be displayed. We need to check if recalculation is needed.
   */
  if (totalPages < page) {
    pStart = 0;
    pEnd = SCENARIOS_PER_PAGE[0];
    page = 1;
  }
  let displayedScenarios = scenarios.slice(pStart, pEnd);


  return (
    <React.Fragment>
      <Grid container item direction="column" display="flex" alignItems="center" spacing={compact ? 0.5 : 1}>
        {totalPages > 1 ? (<CustomPagination page={page} searchVal={searchVal} pageSize={pSize} pageSizeArray={SCENARIOS_PER_PAGE} numItems={scenarios.length} shape="rounded" size="small" boundaryCount={2} onChange={onPaginatorChange} />) : null}
        {displayedScenarios.map((s) => (
          <div key={`key_${s.id}`} style={{ width: "100%", marginBottom: compact ? "4px" : "16px" }}>
            <Grid item container xs={12} justifyContent="center" alignItems="center">
              <ScenarioContainer
                id={s.id}
                featureTags={props.tags}
                selectionMode={selectionMode}
                isSelected={selectedScenarioId === s.id}
                onSelectScenario={onScenarioSelected}
              />
            </Grid>
          </div>
        ))}
      </Grid>
    </React.Fragment>
  );
};

export default ScenariosList;
