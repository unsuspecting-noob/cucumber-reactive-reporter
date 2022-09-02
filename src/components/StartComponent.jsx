import { AppBar, Box, CssBaseline, Fab, Fade } from '@mui/material';
import { ThemeProvider, createTheme } from '@mui/material/styles';

import FeaturesList from "./FeaturesList";
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import PropTypes from 'prop-types';
import React from "react";
import TopBar from './TopBar';
import { getTheme } from "../store/uistates";
import useScrollTrigger from '@mui/material/useScrollTrigger';
import { useSelector } from "react-redux";

const LIGHT_GREY = "#e9e9e9";
const LIGHT_GREY2 = "#90a4ae";
const themeDark = createTheme({
  palette: { mode: 'dark' },
  components: {
    MuiAppBar: {
      styleOverrides: {
        colorPrimary: {
          backgroundColor: "black"
        }
      }
    }
  }
});
const themeLight = createTheme({
  palette: {
    mode: 'light',
    background: {
      default: LIGHT_GREY,
      paper: LIGHT_GREY
    },
    darker: {
      main: LIGHT_GREY2,
      contrastText: '#263238'
    }
  },
  components: {
    MuiAppBar: {
      styleOverrides: {
        colorPrimary: {
          backgroundColor: LIGHT_GREY2
        }
      }
    }
  }
});
function ScrollTop(props) {
  const { children, window } = props;
  // Note that you normally won't need to set the window ref as useScrollTrigger
  // will default to window.
  // This is only being set here because the demo is in an iframe.
  const trigger = useScrollTrigger({
    target: window ? window() : undefined,
    disableHysteresis: true,
    threshold: 100,
  });

  const handleClick = (event) => {
    const anchor = (event.target.ownerDocument || document).querySelector(
      '#back-to-top-anchor',
    );

    if (anchor) {
      anchor.scrollIntoView({
        block: 'center',
      });
    }
  };

  return (
    <Fade in={trigger}>
      <Box
        onClick={handleClick}
        role="presentation"
        sx={{ position: 'fixed', bottom: 16, right: 16 }}
      >
        {children}
      </Box>
    </Fade>
  );
}

ScrollTop.propTypes = {
  children: PropTypes.element.isRequired,
  /**
   * Injected by the documentation to work in an iframe.
   * You won't need it on your project.
   */
  window: PropTypes.func,
};

const StartComponent = (props) => {
  const themeSelector = useSelector((state) => getTheme(state));
  return (
    <main className="containerFluid">
      <ThemeProvider theme={themeSelector === "dark" ? themeDark : themeLight}>
        <CssBaseline>
          <AppBar position="sticky">
            <TopBar />
          </AppBar>
          <div id="back-to-top-anchor" />
          <Box>
            <FeaturesList />
          </Box>
          {/** Jump to top */}
          <ScrollTop {...props}>
            <Fab size="small" aria-label="scroll back to top">
              <KeyboardArrowUpIcon />
            </Fab>
          </ScrollTop>
        </CssBaseline>
      </ThemeProvider>
    </main >
  );
};

export default StartComponent;
