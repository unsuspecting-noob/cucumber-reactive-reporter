import { createSelector } from "reselect";
import { createSlice } from "@reduxjs/toolkit";

export const FeaturesToggleValuesEnum = Object.freeze({
  "ALL": "All",
  "PASSED": "Passed",
  "FAILED": "Failed",
  "SKIPPED": "Skipped"
});

const asObject = (value) => {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value;
  }
  return {};
};

export const INITIAL_UI_STATE = {
  theme: "dark",
  external_settings: {},
  featuresList: {
    featuresButtonToggleValue: FeaturesToggleValuesEnum.ALL,
    lastEnteredSearchValue: "",
    loading: true,
    featureLoadProgress: 0,
    finishedLoadingData: false,
    searchHistory: [],
    showBoiler: true,
    liveActiveFeatureId: null,
    selectedFeatureId: null,
    selectedScenarioId: null,
    tagsDisplay: false,
    metadataDisplay: false,
    splitPaneRatio: 55
  },
  liveStatus: {
    lastUpdateAt: null
  },
  scenarioContainers: {},
  stepContainers: {},
  paginators: {}
};

export const buildUiState = (incomingState) => {
  const state = asObject(incomingState);
  return {
    ...INITIAL_UI_STATE,
    ...state,
    featuresList: {
      ...INITIAL_UI_STATE.featuresList,
      ...asObject(state.featuresList)
    },
    liveStatus: {
      ...INITIAL_UI_STATE.liveStatus,
      ...asObject(state.liveStatus)
    },
    scenarioContainers: {
      ...asObject(state.scenarioContainers)
    },
    stepContainers: {
      ...asObject(state.stepContainers)
    },
    paginators: {
      ...asObject(state.paginators)
    }
  };
};

//Reducers
let slice = createSlice({
  name: "states",
  initialState: INITIAL_UI_STATE,
  reducers: {
    loadFeaturesStarted: (states, action) => {
      states.featuresList.loading = true;
    },
    settingsLoaded: (states, action) => {
      const {
        payload
      } = action;
      states.external_settings = payload;
    },
    featuresToggleClicked: (states, action) => {
      switch (action.payload.value) {
        case FeaturesToggleValuesEnum.ALL:
          states.featuresList.featuresButtonToggleValue = FeaturesToggleValuesEnum.ALL;
          break;
        case FeaturesToggleValuesEnum.PASSED:
          states.featuresList.featuresButtonToggleValue = FeaturesToggleValuesEnum.PASSED;
          break;
        case FeaturesToggleValuesEnum.FAILED:
          states.featuresList.featuresButtonToggleValue = FeaturesToggleValuesEnum.FAILED;
          break;
        case FeaturesToggleValuesEnum.SKIPPED:
          states.featuresList.featuresButtonToggleValue = FeaturesToggleValuesEnum.SKIPPED;
          break;
        default:
          break
      }
    },
    filterByTags: (states, action) => {
      const {
        value, type
      } = action.payload;
      if (value && type !== "clear") {
        if (states.featuresList.searchHistory.map(item => item.value).includes(value) === false) {
          states.featuresList.searchHistory.push({ value: value, label: value, type: type });
        }
        states.featuresList.lastEnteredSearchValue = value;
      } else {
        states.featuresList.lastEnteredSearchValue = "";
      }
    },
    displayTagsHelpButtonClicked: (states, action) => {
      states.featuresList.tagsDisplay = !states.featuresList.tagsDisplay;
    },
    displayMetadataButtonClicked: (states, action) => {
      states.featuresList.metadataDisplay = !states.featuresList.metadataDisplay;
    },
    setSplitPaneRatio: (states, action) => {
      const raw = Number(action.payload?.value);
      if (Number.isNaN(raw)) {
        return;
      }
      const clamped = Math.min(75, Math.max(25, raw));
      states.featuresList.splitPaneRatio = clamped;
    },
    loadFeaturesFinished: (states, action) => {
      states.featuresList.loading = false;
    },
    loadDataFinished: (states, action) => {
      states.featuresList.finishedLoadingData = true;
    },
    featureLoadProgressChanged: (states, action) => {
      states.featuresList.featureLoadProgress = action.payload;
    },
    scenarioContainerClicked: (states, action) => {
      const {
        id
      } = action.payload;
      if (!states.scenarioContainers[id]) {
        states.scenarioContainers[id] = {};
        states.scenarioContainers[id].collapsed = true;
      }
      states.scenarioContainers[id].collapsed = !states.scenarioContainers[id].collapsed;
    },
    stepContainerOpenSet: (states, action) => {
      const scenarioId = action.payload?.scenarioId;
      const stepKey = action.payload?.stepKey;
      const open = action.payload?.open;
      if (!scenarioId || !stepKey || typeof open !== "boolean") {
        return;
      }
      if (!states.stepContainers[scenarioId]) {
        states.stepContainers[scenarioId] = {};
      }
      states.stepContainers[scenarioId][stepKey] = open;
    },
    featureSelected: (states, action) => {
      const id = action.payload?.id ?? null;
      if (states.featuresList.selectedFeatureId !== id) {
        states.featuresList.selectedFeatureId = id;
        states.featuresList.selectedScenarioId = null;
      }
    },
    scenarioSelected: (states, action) => {
      states.featuresList.selectedScenarioId = action.payload?.id ?? null;
    },
    selectionCleared: (states, action) => {
      states.featuresList.selectedFeatureId = null;
      states.featuresList.selectedScenarioId = null;
    },
    paginatorChange: (states, action) => {
      const {
        id,
        page,
        pStart,
        pEnd,
        pSize,
        searchVal
      } = action.payload;
      if (!states.paginators[id]) {
        states.paginators[id] = {};
        states.paginators[id].page = 1;
        states.paginators[id].pSize = 5;
        states.paginators[id].pStart = 0;
        states.paginators[id].pEnd = 5;
        states.paginators[id].searchVal = null;
      }
      states.paginators[id].pSize = pSize;
      states.paginators[id].pStart = pStart;
      states.paginators[id].pEnd = pEnd;
      states.paginators[id].page = page;
      states.paginators[id].searchVal = searchVal;
    },
    toggleTheme: (states, action) => {
      states.theme = states.theme === "dark" ? "light" : "dark";
    },
    toggleBoiler: (states, action) => {
      states.featuresList.showBoiler = !states.featuresList.showBoiler;
    },
    liveFeatureActivated: (states, action) => {
      states.featuresList.liveActiveFeatureId = action.payload?.id ?? null;
    },
    liveUpdateReceived: (states, action) => {
      states.liveStatus.lastUpdateAt = action.payload?.timestamp ?? Date.now();
    }
  },
});

//SELECTORS
export const getFeaturesLoading = (state) => {
  return state.states.featuresList.loading;
};

export const getFeatureLoadProgress = (state) => {
  return state.states.featuresList.featureLoadProgress;
};

export const getDataLoadingFinished = (state) => {
  return state.states.featuresList.finishedLoadingData;
};

export const getScenarioContainerCollapsed = (state, props) => {
  const { id } = props;
  return state.states.scenarioContainers[id]?.collapsed;
};

export const getStepContainerOpen = (state, props) => {
  const { scenarioId, stepKey } = props;
  return state.states.stepContainers[scenarioId]?.[stepKey];
};

export const getPaginatorInfo = (state, props) => {
  const { id } = props;
  return state.states.paginators[id];
};

export const getSettings = (state) => {
  return state.states.external_settings;
};

export const getTheme = (state) => {
  return state.states.theme;
};

export const getBoiler = (state) => {
  return state.states.featuresList.showBoiler;
};

export const getFeaturesToggleValue = (state) => {
  return state.states.featuresList.featuresButtonToggleValue;
};

export const getLiveActiveFeatureId = (state) => {
  return state.states.featuresList.liveActiveFeatureId;
};

export const getSelectedFeatureId = (state) => {
  return state.states.featuresList.selectedFeatureId;
};

export const getSelectedScenarioId = (state) => {
  return state.states.featuresList.selectedScenarioId;
};

export const getTagsDisplayButtonState = (state) => {
  return state.states.featuresList.tagsDisplay;
};

export const getLiveStatus = (state) => {
  return state.states.liveStatus;
};

export const getMetadataDisplayButtonState = (state) => {
  return state.states.featuresList.metadataDisplay;
};

export const getSplitPaneRatio = (state) => {
  return state.states.featuresList.splitPaneRatio;
};

export const getFilterHistory = createSelector((state) => state.states.featuresList,
  (states) => [...states.searchHistory]);

export const getLastEnteredSearchValue = (state) => {
  return state.states.featuresList.lastEnteredSearchValue;
}

export default slice.reducer;
export const {
  displayTagsHelpButtonClicked,
  displayMetadataButtonClicked,
  featuresToggleClicked,
  featureLoadProgressChanged,
  featureSelected,
  filterByTags,
  loadFeaturesStarted,
  loadFeaturesFinished,
  loadDataFinished,
  paginatorChange,
  scenarioSelected,
  scenarioContainerClicked,
  stepContainerOpenSet,
  selectionCleared,
  settingsLoaded,
  liveFeatureActivated,
  liveUpdateReceived,
  toggleBoiler,
  toggleTheme,
  setSplitPaneRatio
} = slice.actions;
