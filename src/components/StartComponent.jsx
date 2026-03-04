import { AppBar, Box, CssBaseline, Drawer, Fab, Fade } from '@mui/material';
import { ThemeProvider, createTheme } from '@mui/material/styles';

import FeaturesList from "./FeaturesList";
import FeaturesPaginationBar from "./FeaturesPaginationBar";
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import SummarySidebar from "./SummarySidebar";
import PropTypes from 'prop-types';
import React from "react";
import TopBar from './TopBar';
import { featureSelected, getSettings, getTheme, scenarioSelected } from "../store/uistates";
import useScrollTrigger from '@mui/material/useScrollTrigger';
import { useDispatch, useSelector } from "react-redux";
import useMediaQuery from '@mui/material/useMediaQuery';

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
      default: "#f8f9fa",
      paper: "#ffffff"
    },
    primary: {
      main: "#1976d2"
    },
    secondary: {
      main: "#7c4dff"
    },
    text: {
      primary: "#1a1a2e",
      secondary: "#5f6368"
    },
    divider: "#e0e0e0"
  },
  components: {
    MuiAppBar: {
      styleOverrides: {
        colorPrimary: {
          backgroundColor: "#ffffff",
          color: "#1a1a2e",
          borderBottom: "1px solid #e0e0e0",
          boxShadow: "0 1px 3px rgba(0,0,0,0.08)"
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
  const dispatch = useDispatch();
  const themeSelector = useSelector((state) => getTheme(state));
  const settings = useSelector((state) => getSettings(state));
  const isLive = Boolean(settings?.live?.enabled);
  const isDesktop = useMediaQuery("(min-width: 1200px)");
  const [drawerOpen, setDrawerOpen] = React.useState(isLive && isDesktop);
  const drawerWidth = 320;

  const handleToggleDrawer = () => {
    setDrawerOpen((prev) => !prev);
  };

  const handleCloseDrawer = () => {
    setDrawerOpen(false);
  };

  const handleSummaryScenarioClick = (featureId, scenarioId) => {
    dispatch(featureSelected({ id: featureId }));
    dispatch(scenarioSelected({ id: scenarioId }));
  };

  const containerRef = React.useRef(null);
  const appBarRef = React.useRef(null);

  React.useEffect(() => {
    const container = containerRef.current;
    const appBar = appBarRef.current;
    if (!container || !appBar || typeof ResizeObserver === "undefined") {
      return;
    }
    let lastHeight = 0;
    const updateHeight = () => {
      const height = appBar.offsetHeight || 0;
      const rounded = Math.round(height);
      if (rounded === lastHeight) {
        return;
      }
      lastHeight = rounded;
      container.style.setProperty("--reporter-header-height", `${rounded}px`);
    };
    updateHeight();
    const observer = new ResizeObserver(updateHeight);
    observer.observe(appBar);
    window.addEventListener("resize", updateHeight);
    return () => {
      window.removeEventListener("resize", updateHeight);
      observer.disconnect();
    };
  }, []);

  return (
    <main ref={containerRef} className={`containerFluid${isLive ? " live-mode" : ""}`}>
      <ThemeProvider theme={themeSelector === "dark" ? themeDark : themeLight}>
        <CssBaseline>
          <AppBar position="sticky" ref={appBarRef}>
            <TopBar
              onToggleSummary={handleToggleDrawer}
              summaryOpen={drawerOpen}
              paginationNode={<FeaturesPaginationBar />}
            />
          </AppBar>
          <div id="back-to-top-anchor" />
          <FeaturesList />
          <Drawer
            anchor="right"
            variant="temporary"
            open={drawerOpen}
            onClose={handleCloseDrawer}
            ModalProps={{ keepMounted: true }}
            sx={{
              "& .MuiDrawer-paper": {
                width: drawerWidth,
                boxSizing: "border-box"
              }
            }}
          >
            <SummarySidebar
              isLive={isLive}
              onScenarioClick={handleSummaryScenarioClick}
              onClose={handleCloseDrawer}
            />
          </Drawer>
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
