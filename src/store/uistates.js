import { createSelector } from "reselect";
import { createSlice } from "@reduxjs/toolkit";

export const FeaturesToggleValuesEnum = Object.freeze({
  "ALL": "All",
  "PASSED": "Passed",
  "FAILED": "Failed",
  "SKIPPED": "Skipped"
});

//Reducers
let slice = createSlice({
  name: "states",
  initialState: {
    theme: "dark",
    external_settings: {},
    featuresList: {
      featuresButtonToggleValue: FeaturesToggleValuesEnum.ALL,
      lastEnteredSearchValue: "",
      loading: true,
      searchHistory: [],
      showBoiler: true,
      tagsDisplay: false,
      metadataDisplay: false
    },
  },
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
    loadFeaturesFinished: (states, action) => {
      states.featuresList.loading = false;
    },
    toggleTheme: (states, action) => {
      states.theme = states.theme === "dark" ? "light" : "dark";
    },
    toggleBoiler: (states, action) => {
      states.featuresList.showBoiler = !states.featuresList.showBoiler;
    }
  },
});

//SELECTORS
export const getFeaturesLoading = (state) => {
  return state.entities.states.featuresList.loading;
};

export const getSettings = (state) => {
  return state.entities.states.external_settings;
};

export const getTheme = (state) => {
  return state.entities.states.theme;
};

export const getBoiler = (state) => {
  return state.entities.states.featuresList.showBoiler;
};

export const getFeaturesToggleValue = (state) => {
  return state.entities.states.featuresList.featuresButtonToggleValue;
};

export const getTagsDisplayButtonState = (state) => {
  return state.entities.states.featuresList.tagsDisplay;
};

export const getMetadataDisplayButtonState = (state) => {
  return state.entities.states.featuresList.metadataDisplay;
};

export const getFilterHistory = createSelector((state) => state.entities.states.featuresList,
  (states) => [...states.searchHistory]);

export const getLastEnteredSearchValue = (state) => {
  return state.entities.states.featuresList.lastEnteredSearchValue;
}

export default slice.reducer;
export const {
  displayTagsHelpButtonClicked,
  displayMetadataButtonClicked,
  featuresToggleClicked,
  filterByTags,
  loadFeaturesStarted,
  loadFeaturesFinished,
  toggleBoiler,
  toggleTheme,
  settingsLoaded
} = slice.actions;
