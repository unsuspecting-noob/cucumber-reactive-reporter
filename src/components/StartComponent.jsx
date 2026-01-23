import { AppBar, Box, CssBaseline, Drawer, Fab, Fade } from '@mui/material';
import { ThemeProvider, createTheme } from '@mui/material/styles';

import FeaturesList from "./FeaturesList";
import FeaturesPaginationBar from "./FeaturesPaginationBar";
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import LiveSidebar from "./LiveSidebar";
import PropTypes from 'prop-types';
import React from "react";
import TopBar from './TopBar';
import { getSettings, getTheme } from "../store/uistates";
import useScrollTrigger from '@mui/material/useScrollTrigger';
import { useSelector } from "react-redux";
import useMediaQuery from '@mui/material/useMediaQuery';

const LIGHT_BG = "#f3f1ec";
const LIGHT_SURFACE = "#ece7df";
const LIGHT_ACCENT = "#a9b7b1";
const LIGHT_PRIMARY = "#4f7b72";
const LIGHT_SECONDARY = "#c48f6a";
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
      default: LIGHT_BG,
      paper: LIGHT_SURFACE
    },
    primary: {
      main: LIGHT_PRIMARY,
      contrastText: "#ffffff"
    },
    secondary: {
      main: LIGHT_SECONDARY,
      contrastText: "#ffffff"
    },
    text: {
      primary: "#2c3a36",
      secondary: "#5a6a64"
    }
  },
  components: {
    MuiAppBar: {
      styleOverrides: {
        colorPrimary: {
          backgroundColor: LIGHT_ACCENT
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
  const settings = useSelector((state) => getSettings(state));
  const isLive = Boolean(settings?.live?.enabled);
  const isDesktop = useMediaQuery("(min-width: 1200px)");
  const [liveDrawerOpen, setLiveDrawerOpen] = React.useState(isLive && isDesktop);
  const drawerWidth = 320;

  React.useEffect(() => {
    if (!isLive && liveDrawerOpen) {
      setLiveDrawerOpen(false);
    }
  }, [isLive, liveDrawerOpen]);

  const handleToggleLiveDrawer = () => {
    setLiveDrawerOpen((prev) => !prev);
  };

  const handleCloseLiveDrawer = () => {
    setLiveDrawerOpen(false);
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
              onToggleLiveSidebar={handleToggleLiveDrawer}
              liveSidebarOpen={liveDrawerOpen}
              showLiveSidebarToggle={isLive}
              paginationNode={<FeaturesPaginationBar />}
            />
          </AppBar>
          <div id="back-to-top-anchor" />
          <FeaturesList />
          {isLive ? (
            <Drawer
              anchor="right"
              variant="temporary"
              open={liveDrawerOpen}
              onClose={handleCloseLiveDrawer}
              ModalProps={{ keepMounted: true }}
              sx={{
                "& .MuiDrawer-paper": {
                  width: drawerWidth,
                  boxSizing: "border-box",
                  padding: 2
                }
              }}
            >
              <LiveSidebar />
            </Drawer>
          ) : null}
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
