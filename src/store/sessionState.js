const UI_STATE_SESSION_KEY_PREFIX = "cucumber-reactive-reporter.ui-state.v1";

const canUseSessionStorage = () => {
  return (
    typeof window !== "undefined" &&
    typeof window.sessionStorage !== "undefined"
  );
};

const asObject = (value) => {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value;
  }
  return {};
};

const getUiStateSessionKey = () => {
  if (typeof window === "undefined" || !window.location) {
    return UI_STATE_SESSION_KEY_PREFIX;
  }
  return `${UI_STATE_SESSION_KEY_PREFIX}:${window.location.pathname}`;
};

const pickPersistedUiState = (state) => {
  const featureList = asObject(state.featuresList);
  return {
    theme: state.theme,
    featuresList: {
      featuresButtonToggleValue: featureList.featuresButtonToggleValue,
      lastEnteredSearchValue: featureList.lastEnteredSearchValue,
      searchHistory: Array.isArray(featureList.searchHistory) ? featureList.searchHistory : [],
      showBoiler: featureList.showBoiler,
      tagsDisplay: featureList.tagsDisplay,
      metadataDisplay: featureList.metadataDisplay
    },
    scenarioContainers: asObject(state.scenarioContainers),
    featureContainers: asObject(state.featureContainers),
    paginators: asObject(state.paginators)
  };
};

export const mergeUiState = (baseState, persistedState) => {
  const base = asObject(baseState);
  const persisted = asObject(persistedState);

  return {
    ...base,
    ...persisted,
    featuresList: {
      ...asObject(base.featuresList),
      ...asObject(persisted.featuresList)
    },
    scenarioContainers: {
      ...asObject(base.scenarioContainers),
      ...asObject(persisted.scenarioContainers)
    },
    featureContainers: {
      ...asObject(base.featureContainers),
      ...asObject(persisted.featureContainers)
    },
    paginators: {
      ...asObject(base.paginators),
      ...asObject(persisted.paginators)
    }
  };
};

export const loadUiStateFromSession = () => {
  if (!canUseSessionStorage()) {
    return null;
  }
  try {
    const storedState = window.sessionStorage.getItem(getUiStateSessionKey());
    if (!storedState) {
      return null;
    }
    const parsed = JSON.parse(storedState);
    return asObject(parsed);
  } catch (error) {
    console.log("Unable to load report UI state from sessionStorage:", error);
    return null;
  }
};

export const saveUiStateToSession = (state) => {
  if (!canUseSessionStorage() || !state) {
    return;
  }
  try {
    window.sessionStorage.setItem(
      getUiStateSessionKey(),
      JSON.stringify(pickPersistedUiState(asObject(state)))
    );
  } catch (error) {
    console.log("Unable to save report UI state to sessionStorage:", error);
  }
};
