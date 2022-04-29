import { ThemeProvider, createTheme } from '@mui/material/styles';
import { getFeaturesLoading, getTheme } from "../store/uistates";

import { CssBaseline } from "@mui/material";
import FeaturesList from "./FeaturesList";
import React from "react";
import { useSelector } from "react-redux";

const themeDark = createTheme({ palette: { mode: 'dark' } });
const themeLight = createTheme({
  palette: {
    mode: 'light',
    background: {
      default: "#e9e9e9",
      paper: "#e9e9e9"
    }
  }
});

const StartComponent = () => {
  const loading = useSelector((state) => getFeaturesLoading(state));
  const themeSelector = useSelector((state) => getTheme(state));
  return (
    <main className="containerFluid">
      <ThemeProvider theme={themeSelector === "dark" ? themeDark : themeLight}>
        <CssBaseline>
          {loading ? <div >LOADING...</div> : <FeaturesList />}
        </CssBaseline>
      </ThemeProvider>
    </main >
  );
};

export default StartComponent;
