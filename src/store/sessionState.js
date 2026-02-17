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

const normalizePathname = (pathname) => {
  if (!pathname || typeof pathname !== "string") {
    return "/";
  }
  let normalized = pathname;
  try {
    normalized = decodeURIComponent(pathname);
  } catch (error) {
    normalized = pathname;
  }
  if (normalized.endsWith("/index.html")) {
    normalized = normalized.slice(0, -"/index.html".length);
  }
  normalized = normalized.replace(/\/+$/, "");
  return normalized || "/";
};

const getUiStateSessionKey = () => {
  if (typeof window === "undefined" || !window.location) {
    return UI_STATE_SESSION_KEY_PREFIX;
  }
  return `${UI_STATE_SESSION_KEY_PREFIX}:${normalizePathname(window.location.pathname)}`;
};

const getLegacyUiStateSessionKey = () => {
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
      selectedFeatureId: featureList.selectedFeatureId ?? null,
      selectedScenarioId: featureList.selectedScenarioId ?? null,
      splitPaneRatio: featureList.splitPaneRatio,
      tagsDisplay: featureList.tagsDisplay,
      metadataDisplay: featureList.metadataDisplay
    },
    scenarioContainers: asObject(state.scenarioContainers),
    stepContainers: asObject(state.stepContainers),
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
    stepContainers: {
      ...asObject(base.stepContainers),
      ...asObject(persisted.stepContainers)
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
    const keys = [getUiStateSessionKey(), getLegacyUiStateSessionKey()];
    for (const key of keys) {
      const storedState = window.sessionStorage.getItem(key);
      if (!storedState) {
        continue;
      }
      const parsed = JSON.parse(storedState);
      return asObject(parsed);
    }
    return null;
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
    const key = getUiStateSessionKey();
    window.sessionStorage.setItem(
      key,
      JSON.stringify(pickPersistedUiState(asObject(state)))
    );
    const legacyKey = getLegacyUiStateSessionKey();
    if (legacyKey !== key) {
      window.sessionStorage.removeItem(legacyKey);
    }
  } catch (error) {
    console.log("Unable to save report UI state to sessionStorage:", error);
  }
};
